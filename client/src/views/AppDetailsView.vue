<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref} from 'vue';
import {onBeforeRouteLeave, useRoute, useRouter} from 'vue-router';
import {type App, appsApi, getErrorMessage, type Version, versionsApi} from '../api';
import UploadForm from '../components/UploadForm.vue';
import LoadingOverlay from '../components/LoadingOverlay.vue';

const route = useRoute();
const router = useRouter();
const appKey = route.params.appKey as string;
const app = ref<App | null>(null);
const versions = ref<Version[]>([]);
const copied = ref(false);
const apiResponse = ref<string | null>(null);
const testApiKey = ref('');

// Loading State
const isLocked = ref(false);
const loadingMessage = ref('Processing...');
const uploadFormRef = ref<any>(null);

// Edit mode state
const isEditing = ref(false);
const editDisplayName = ref('');

// Prevent accidental navigation
const confirmLeave = (e: BeforeUnloadEvent) => {
  if (isLocked.value) {
    e.preventDefault();
    e.returnValue = ''; // Standard for Chrome
    return ''; // Standard for others
  }
};

const handleCancel = () => {
  if (confirm('Are you sure you want to cancel the upload?')) {
    uploadFormRef.value?.cancel();
  }
};

onMounted(() => {
  loadData();
  window.addEventListener('beforeunload', confirmLeave);
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', confirmLeave);
});

onBeforeRouteLeave((_to, _from, next) => {
  if (isLocked.value) {
    const answer = window.confirm('Upload in progress. Are you sure you want to leave? The upload will be cancelled.');
    if (answer) {
      next();
    } else {
      next(false);
    }
  } else {
    next();
  }
});

const onUploadStart = () => {
  isLocked.value = true;
  loadingMessage.value = 'Uploading files...';
};

const onUploadProgress = (percent: number) => {
  if (percent < 100) {
    loadingMessage.value = `Uploading: ${percent}%`;
  } else {
    loadingMessage.value = 'Processing on server (Calculating Hashes)...';
  }
};

const onUploadEnd = (success: boolean) => {
  isLocked.value = false;
  if (success) loadData(); // Refresh list on success
};

const endpointUrl = computed(() => {
  return `${window.location.origin}/api/v1/apps/${appKey}/latest`;
});

const testEndpoint = async () => {
  try {
    // Build request options - add auth header if API key provided (for private apps)
    const options: RequestInit = {};
    if (testApiKey.value.trim()) {
      // First get a JWT token using the API key
      const loginRes = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: testApiKey.value.trim() })
      });
      if (!loginRes.ok) {
        const err = await loginRes.json();
        apiResponse.value = JSON.stringify({ error: 'Login failed', details: err }, null, 2);
        return;
      }
      const { token } = await loginRes.json();
      options.headers = { 'Authorization': `Bearer ${token}` };
    }

    const res = await fetch(endpointUrl.value, options);
    const data = await res.json();
    apiResponse.value = JSON.stringify(data, null, 2);
  } catch (err) {
    apiResponse.value = `Error: ${err}`;
  }
};

const copyEndpoint = () => {
  navigator.clipboard.writeText(endpointUrl.value);
  copied.value = true;
  setTimeout(() => copied.value = false, 2000);
};

const copyHash = (hash: string) => {
  navigator.clipboard.writeText(hash);
  alert('Hash copied to clipboard!'); // Simple feedback
};

const loadData = async () => {
  try {
    // Get app details directly by appKey
    const appRes = await appsApi().appsAppKeyGet(appKey);
    app.value = appRes.data;

    const versionsRes = await versionsApi().appsAppKeyVersionsGet(appKey);
    versions.value = versionsRes.data;
  } catch (err) {
    console.error('Failed to load details', err);
    alert('App not found');
    router.push('/dashboard');
  }
};

const setActiveVersion = async (versionId: number) => {
  try {
    await versionsApi().appsAppKeyActiveVersionPut(appKey, {versionId});
    loadData(); // Reload to refresh active status
  } catch (err: unknown) {
    alert(getErrorMessage(err));
  }
};

const deleteVersion = async (versionId: number) => {
  if (!confirm('Are you sure you want to delete this version? This cannot be undone.')) return;

  try {
    await versionsApi().appsAppKeyVersionsVersionIdDelete(appKey, String(versionId));
    loadData();
  } catch (err: unknown) {
    alert(getErrorMessage(err));
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString();
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Edit app display name
const startEditing = () => {
  editDisplayName.value = app.value?.displayName || '';
  isEditing.value = true;
};

const cancelEditing = () => {
  isEditing.value = false;
  editDisplayName.value = '';
};

const saveDisplayName = async () => {
  if (!editDisplayName.value.trim()) {
    alert('Display name cannot be empty');
    return;
  }

  try {
    await appsApi().appsAppKeyPut(appKey, {displayName: editDisplayName.value.trim()});
    if (app.value) {
      app.value.displayName = editDisplayName.value.trim();
    }
    isEditing.value = false;
  } catch (err: unknown) {
    alert(getErrorMessage(err));
  }
};

// Toggle public status
const togglePublic = async () => {
  if (!app.value) return;

  const newStatus = !app.value.isPublic;
  const confirmMsg = newStatus
    ? 'Make this app public? The /latest endpoint will be accessible without authentication.'
    : 'Make this app private? The /latest endpoint will require authentication.';

  if (!confirm(confirmMsg)) return;

  try {
    await appsApi().appsAppKeyPut(appKey, { isPublic: newStatus });
    app.value.isPublic = newStatus;
  } catch (err: unknown) {
    alert(getErrorMessage(err));
  }
};

// Delete app
const deleteApp = async () => {
  const confirmText = `Are you sure you want to delete "${app.value?.displayName}"?\n\nThis will permanently delete:\n- The app and all its versions\n- All uploaded files\n\nThis action cannot be undone.\n\nType the app key "${appKey}" to confirm:`;

  const input = prompt(confirmText);
  if (input !== appKey) {
    if (input !== null) {
      alert('App key did not match. Deletion cancelled.');
    }
    return;
  }

  try {
    await appsApi().appsAppKeyDelete(appKey);
    alert('App deleted successfully');
    router.push('/dashboard');
  } catch (err: unknown) {
    alert(getErrorMessage(err));
  }
};

onMounted(loadData);
</script>

<template>
  <div>
    <LoadingOverlay :visible="isLocked" :message="loadingMessage" @cancel="handleCancel"/>

    <button @click="router.push('/dashboard')" class="btn btn-outline-secondary mb-3">&larr; Back to Dashboard</button>

    <div v-if="app" class="card border-0 shadow-sm mb-4">
      <div class="card-body p-4">
        <div class="d-flex justify-content-between align-items-center">
          <div class="flex-grow-1">
            <!-- Display mode -->
            <div v-if="!isEditing" class="d-flex align-items-center gap-2">
              <h2 class="mb-0">{{ app.displayName }}</h2>
              <button @click="startEditing" class="btn btn-sm btn-outline-secondary" title="Edit display name">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path
                      d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                </svg>
              </button>
            </div>
            <!-- Edit mode -->
            <div v-else class="d-flex align-items-center gap-2">
              <input
                  v-model="editDisplayName"
                  type="text"
                  class="form-control form-control-lg"
                  style="max-width: 400px;"
                  placeholder="Display name"
                  @keyup.enter="saveDisplayName"
                  @keyup.escape="cancelEditing"
              />
              <button @click="saveDisplayName" class="btn btn-success btn-sm">Save</button>
              <button @click="cancelEditing" class="btn btn-outline-secondary btn-sm">Cancel</button>
            </div>
            <div class="d-flex align-items-center gap-2 mt-1">
              <p class="text-muted mb-0">ID: {{ app.appKey }}</p>
              <button
                @click="togglePublic"
                class="btn btn-sm"
                :class="app.isPublic ? 'btn-outline-success' : 'btn-outline-secondary'"
                :title="app.isPublic ? 'Public - click to make private' : 'Private - click to make public'"
              >
                <span v-if="app.isPublic">Public</span>
                <span v-else>Private</span>
              </button>
            </div>
          </div>
          <div>
            <button @click="deleteApp" class="btn btn-outline-danger btn-sm" title="Delete app">
              Delete App
            </button>
          </div>
        </div>

        <hr>

        <div class="mb-4">
          <h5>Integration Endpoint (Latest Version)</h5>
          <p class="text-muted small">
            Returns JSON with <code>downloadUrl</code>, <code>hash</code>, and <code>hashAlgorithm</code> ("sha256").
          </p>
          <div class="input-group">
            <span class="input-group-text bg-pink text-pink border-pink">GET</span>
            <input type="text" class="form-control bg-light-pink border-pink text-dark" :value="endpointUrl" readonly>
            <button class="btn btn-outline-pink" type="button" @click="copyEndpoint">
              <span v-if="copied">Copied!</span>
              <span v-else>Copy URL</span>
            </button>
            <button class="btn btn-outline-secondary" type="button" @click="testEndpoint">
              Test Request
            </button>
          </div>

          <!-- API Key for testing private endpoints -->
          <div v-if="app && !app.isPublic" class="mt-2">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M3.5 11.5a3.5 3.5 0 1 1 3.163-5H14L15.5 8 14 9.5l-1-1-1 1-1-1-1 1-1-1-1 1H6.663a3.5 3.5 0 0 1-3.163 2zM2.5 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                </svg>
              </span>
              <input
                v-model="testApiKey"
                type="password"
                class="form-control"
                placeholder="API Key for test request (required for private apps)"
              >
            </div>
            <small class="text-muted">This app is private. Provide an API key to test the endpoint.</small>
          </div>

          <!-- API Response Preview -->
          <div v-if="apiResponse" class="mt-3">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <small class="text-muted fw-bold">Response Preview:</small>
              <button class="btn btn-sm btn-link text-muted p-0" @click="apiResponse = null">Clear</button>
            </div>
            <pre class="bg-dark text-light p-3 rounded small mb-0"><code>{{ apiResponse }}</code></pre>
          </div>
        </div>

        <hr>

        <h4>Upload New Version</h4>
        <UploadForm
            ref="uploadFormRef"
            :appKey="appKey"
            @upload-start="onUploadStart"
            @upload-progress="onUploadProgress"
            @upload-end="onUploadEnd"
        />
      </div> <!-- Close card-body -->
    </div> <!-- Close card -->

    <div class="card border-0 shadow-sm p-0 overflow-hidden">
      <div class="card-header bg-white py-3 ps-4 border-bottom">
        <h5 class="mb-0 fw-bold text-secondary">Version History</h5>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0 custom-table">
          <thead class="bg-light text-secondary">
          <tr>
            <th class="ps-4 py-3 text-uppercase small fw-bold border-bottom-0">Status</th>
            <th class="py-3 text-uppercase small fw-bold border-bottom-0">Version</th>
            <th class="py-3 text-uppercase small fw-bold border-bottom-0">Created At</th>
            <th class="py-3 text-uppercase small fw-bold border-bottom-0">Files</th>
            <th class="pe-4 py-3 text-uppercase small fw-bold border-bottom-0 text-end">Action</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="v in versions" :key="v.id" :class="{'bg-success-subtle': v.isActive}">
            <td class="ps-4 py-3">
              <span v-if="v.isActive" class="badge bg-success shadow-sm">Active</span>
              <span v-else class="badge bg-secondary opacity-50">Inactive</span>
            </td>
            <td class="py-3"><span class="badge bg-light text-dark border">{{ v.versionName }}</span></td>
            <td class="py-3 text-muted small">{{ formatDate(v.createdAt) }}</td>
            <td class="py-3">
              <div class="files-list">
                <div v-for="file in v.files" :key="file.id" class="file-item d-flex align-items-center gap-2 mb-1">
                  <a :href="file.downloadUrl" class="text-decoration-none fw-bold text-dark" target="_blank"
                     :title="'Download ' + file.fileName">
                    {{ file.fileName }}
                  </a>
                  <span class="badge bg-light text-muted border small">{{ formatSize(file.fileSize) }}</span>
                  <div class="d-flex align-items-center">
                    <small class="text-monospace text-muted me-1"
                           :title="file.fileHash">{{ file.fileHash.substring(0, 8) }}...</small>
                    <button class="btn btn-sm btn-link p-0 text-muted" @click="copyHash(file.fileHash)"
                            title="Copy full hash">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor"
                           class="bi bi-clipboard" viewBox="0 0 16 16">
                        <path
                            d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                        <path
                            d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div v-if="!v.files || v.files.length === 0" class="text-muted small fst-italic">No files</div>
              </div>
            </td>
            <td class="pe-4 py-3 text-end">
              <div class="d-flex gap-1">
                <button v-if="!v.isActive" @click="setActiveVersion(v.id)"
                        class="btn btn-sm btn-light border text-success" title="Set Active">
                  ✓
                </button>
                <button v-if="!v.isActive" @click="deleteVersion(v.id)" class="btn btn-sm btn-light border text-danger"
                        title="Delete">
                  ✕
                </button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-monospace {
  font-family: monospace;
}

.bg-pink {
  background-color: #e83e8c;
}

.bg-light-pink {
  background-color: #fff0f6;
}

.text-pink {
  color: #fff;
}

.border-pink {
  border-color: #e83e8c;
}

.btn-outline-pink {
  color: #e83e8c;
  border-color: #e83e8c;
}

.btn-outline-pink:hover {
  background-color: #e83e8c;
  color: #fff;
}

.files-list {
  max-width: 500px;
}

.file-item {
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #f8f9fa;
}

.file-item:last-child {
  margin-bottom: 0 !important;
}
</style>
