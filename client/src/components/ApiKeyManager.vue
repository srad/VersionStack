<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { axiosInstance, appsApi, getErrorMessage, type App } from '../api';

interface ApiKey {
  id: number;
  name: string;
  permission: 'read' | 'write' | 'admin';
  appScope: string[] | null;
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

interface CreateApiKeyResponse extends ApiKey {
  apiKey: string;
}

const keys = ref<ApiKey[]>([]);
const apps = ref<App[]>([]);
const loading = ref(false);
const errorMsg = ref('');

// Create form state
const showCreateForm = ref(false);
const newKeyName = ref('');
const newKeyPermission = ref<'read' | 'write' | 'admin'>('read');
const selectedApps = ref<string[]>([]);
const creating = ref(false);

// App selector dropdown state
const showAppDropdown = ref(false);

// Newly created key (shown once)
const createdKey = ref<string | null>(null);

// Filter available apps (not already selected)
const availableApps = computed(() => {
  return apps.value.filter((app) => !selectedApps.value.includes(app.appKey));
});

const loadKeys = async () => {
  loading.value = true;
  errorMsg.value = '';
  try {
    const response = await axiosInstance.get<ApiKey[]>('/api/v1/auth/api-keys');
    keys.value = response.data;
  } catch (err) {
    errorMsg.value = getErrorMessage(err);
  } finally {
    loading.value = false;
  }
};

const loadApps = async () => {
  try {
    const response = await appsApi().appsGet();
    apps.value = response.data;
  } catch (err) {
    console.error('Failed to load apps for scope selector');
  }
};

const addAppToScope = (appKey: string) => {
  if (!selectedApps.value.includes(appKey)) {
    selectedApps.value.push(appKey);
  }
  showAppDropdown.value = false;
};

const removeAppFromScope = (appKey: string) => {
  selectedApps.value = selectedApps.value.filter((k) => k !== appKey);
};

const createKey = async () => {
  creating.value = true;
  errorMsg.value = '';
  createdKey.value = null;

  try {
    const appScope = selectedApps.value.length > 0 ? selectedApps.value : undefined;

    const response = await axiosInstance.post<CreateApiKeyResponse>('/api/v1/auth/api-keys', {
      name: newKeyName.value,
      permission: newKeyPermission.value,
      appScope,
    });

    createdKey.value = response.data.apiKey;
    await loadKeys();

    // Reset form
    newKeyName.value = '';
    newKeyPermission.value = 'read';
    selectedApps.value = [];
    showCreateForm.value = false;
  } catch (err) {
    errorMsg.value = getErrorMessage(err);
  } finally {
    creating.value = false;
  }
};

const revokeKey = async (keyId: number) => {
  if (!confirm('Are you sure you want to revoke this API key? The key will be deactivated but kept for audit purposes.')) {
    return;
  }

  try {
    await axiosInstance.delete(`/api/v1/auth/api-keys/${keyId}`);
    await loadKeys();
  } catch (err) {
    errorMsg.value = getErrorMessage(err);
  }
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    alert('API key copied to clipboard!');
  } catch {
    prompt('Copy this API key:', text);
  }
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleString();
};

const getPermissionBadgeClass = (permission: string): string => {
  switch (permission) {
    case 'admin':
      return 'bg-danger';
    case 'write':
      return 'bg-warning text-dark';
    case 'read':
      return 'bg-info';
    default:
      return 'bg-secondary';
  }
};

onMounted(() => {
  loadKeys();
  loadApps();
});
</script>

<template>
  <div>
    <!-- Newly Created Key Alert -->
    <div v-if="createdKey" class="alert alert-success alert-dismissible fade show">
      <strong>API Key Created!</strong> Copy this key now - it won't be shown again.
      <div class="mt-2">
        <code class="d-block p-2 bg-light rounded user-select-all">{{ createdKey }}</code>
      </div>
      <div class="mt-2">
        <button class="btn btn-sm btn-outline-success" @click="copyToClipboard(createdKey!)">
          Copy to Clipboard
        </button>
      </div>
      <button type="button" class="btn-close" @click="createdKey = null"></button>
    </div>

    <!-- Error Alert -->
    <div v-if="errorMsg" class="alert alert-danger alert-dismissible fade show">
      {{ errorMsg }}
      <button type="button" class="btn-close" @click="errorMsg = ''"></button>
    </div>

    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h5 class="fw-bold text-secondary mb-0">API Keys</h5>
        <small class="text-muted">Manage API keys for programmatic access</small>
      </div>
      <button
        v-if="!showCreateForm"
        class="btn btn-primary btn-sm"
        @click="showCreateForm = true"
      >
        + New API Key
      </button>
    </div>

    <!-- Create Form -->
    <div v-if="showCreateForm" class="card mb-4">
      <div class="card-body">
        <h6 class="card-title">Create New API Key</h6>
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Name</label>
            <input
              v-model="newKeyName"
              type="text"
              class="form-control"
              placeholder="e.g., CI/CD Pipeline"
            />
          </div>
          <div class="col-md-6">
            <label class="form-label">Permission</label>
            <select v-model="newKeyPermission" class="form-select">
              <option value="read">Read (GET only)</option>
              <option value="write">Write (Full app/version access)</option>
              <option value="admin">Admin (Full access + manage keys)</option>
            </select>
          </div>
          <div class="col-12">
            <label class="form-label">App Scope</label>
            <div class="form-text mb-2">
              Leave empty for access to all apps, or select specific apps to restrict access.
            </div>

            <!-- Selected Apps Tags -->
            <div class="d-flex flex-wrap gap-2 mb-2">
              <span
                v-for="appKey in selectedApps"
                :key="appKey"
                class="badge bg-primary d-flex align-items-center gap-1"
                style="font-size: 0.9em;"
              >
                {{ appKey }}
                <button
                  type="button"
                  class="btn-close btn-close-white ms-1"
                  style="font-size: 0.6em;"
                  @click="removeAppFromScope(appKey)"
                ></button>
              </span>
              <span v-if="selectedApps.length === 0" class="text-muted small">
                All apps (no restrictions)
              </span>
            </div>

            <!-- App Selector Dropdown -->
            <div class="dropdown" v-if="availableApps.length > 0">
              <button
                class="btn btn-outline-secondary btn-sm dropdown-toggle"
                type="button"
                @click="showAppDropdown = !showAppDropdown"
              >
                + Add App
              </button>
              <ul
                class="dropdown-menu"
                :class="{ show: showAppDropdown }"
                style="max-height: 200px; overflow-y: auto;"
              >
                <li v-for="app in availableApps" :key="app.appKey">
                  <button
                    class="dropdown-item d-flex justify-content-between align-items-center"
                    type="button"
                    @click="addAppToScope(app.appKey)"
                  >
                    <span>{{ app.displayName || app.appKey }}</span>
                    <code class="ms-2 text-muted small">{{ app.appKey }}</code>
                  </button>
                </li>
              </ul>
            </div>
            <div v-else-if="apps.length === 0" class="text-muted small">
              No apps available. Create an app first.
            </div>
            <div v-else class="text-muted small">
              All apps selected.
            </div>
          </div>
        </div>
        <div class="mt-3">
          <button
            class="btn btn-success me-2"
            :disabled="!newKeyName || creating"
            @click="createKey"
          >
            {{ creating ? 'Creating...' : 'Create Key' }}
          </button>
          <button
            class="btn btn-secondary"
            @click="showCreateForm = false; selectedApps = []"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Keys List -->
    <div v-else-if="keys.length > 0" class="bg-white rounded shadow-sm border">
      <table class="table table-hover mb-0">
        <thead class="table-light">
          <tr>
            <th>Name</th>
            <th>Permission</th>
            <th>App Scope</th>
            <th>Last Used</th>
            <th>Created</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="key in keys" :key="key.id" :class="{ 'table-secondary': !key.isActive }">
            <td class="fw-medium">{{ key.name }}</td>
            <td>
              <span class="badge" :class="getPermissionBadgeClass(key.permission)">
                {{ key.permission }}
              </span>
            </td>
            <td>
              <div v-if="key.appScope" class="d-flex flex-wrap gap-1">
                <span
                  v-for="appKey in key.appScope"
                  :key="appKey"
                  class="badge bg-light text-dark border"
                >
                  {{ appKey }}
                </span>
              </div>
              <span v-else class="text-muted small">All apps</span>
            </td>
            <td class="text-muted small">{{ formatDate(key.lastUsedAt) }}</td>
            <td class="text-muted small">{{ formatDate(key.createdAt) }}</td>
            <td>
              <span v-if="key.isActive" class="badge bg-success">Active</span>
              <span v-else class="badge bg-secondary">Revoked</span>
            </td>
            <td class="text-end">
              <button
                v-if="key.isActive"
                class="btn btn-outline-danger btn-sm"
                @click="revokeKey(key.id)"
              >
                Revoke
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-4 text-muted">
      <p>No API keys found. Create one to get started.</p>
    </div>
  </div>
</template>

<style scoped>
.dropdown-menu.show {
  display: block;
}
</style>
