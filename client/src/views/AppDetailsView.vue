<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import api from '../services/api';
import UploadForm from '../components/UploadForm.vue';
import LoadingOverlay from '../components/LoadingOverlay.vue';

const route = useRoute();
const router = useRouter();
const appKey = route.params.appKey as string;
const app = ref<any>(null);
const versions = ref<any[]>([]);
const copied = ref(false);
const apiResponse = ref<string | null>(null);

// Loading State
const isLocked = ref(false);
const loadingMessage = ref('Processing...');
const uploadFormRef = ref<any>(null);

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
    loadingMessage.value = 'Uploading file...';
};

const onUploadProgress = (percent: number) => {
    if (percent < 100) {
        loadingMessage.value = `Uploading: ${percent}%`;
    } else {
        loadingMessage.value = 'Processing on server (Calculating Hash)...';
    }
};

const onUploadEnd = (success: boolean) => {
    isLocked.value = false;
    if (success) loadData(); // Refresh list on success
};

const endpointUrl = computed(() => {
  return `${window.location.origin}/api/apps/${appKey}/latest`;
});

const testEndpoint = async () => {
  try {
    // Fetch directly using native fetch to simulate external client (no auth headers if public, or explicit auth)
    // Since the API might require auth (depending on your setup), we might use our 'api' helper if auth is enforced,
    // OR native fetch if this endpoint is meant to be public for devices.
    // The current backend implementation does NOT require auth for /latest (check routes/versions.ts).
    // Let's use native fetch to be true to a "device" perspective.
    const res = await fetch(endpointUrl.value);
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
    // We need to find the app details first. Ideally the backend would have a specific endpoint
    // for getting one app, but we can filter from the list or just use the key for display.
    // For now, let's just get the versions which confirms existence.
    // Actually, let's fetch the list to find the display name.
    const appsRes = await api.get('/apps');
    app.value = appsRes.data.find((a: any) => a.app_key === appKey);

    if (!app.value) {
        alert('App not found');
        router.push('/dashboard');
        return;
    }

    const versionsRes = await api.get(`/apps/${appKey}/versions`);
    versions.value = versionsRes.data;
  } catch (err) {
    console.error('Failed to load details', err);
  }
};

const setActiveVersion = async (versionId: number) => {
    try {
        await api.put(`/apps/${appKey}/active-version`, { version_id: versionId });
        loadData(); // Reload to refresh active status
    } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to update active version');
    }
};

const deleteVersion = async (versionId: number) => {
    if (!confirm('Are you sure you want to delete this version? This cannot be undone.')) return;
    
    try {
        await api.delete(`/apps/${appKey}/versions/${versionId}`);
        loadData();
    } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete version');
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

onMounted(loadData);
</script>

<template>
  <div>
  <LoadingOverlay :visible="isLocked" :message="loadingMessage" @cancel="handleCancel" />
  
    <button @click="router.push('/dashboard')" class="btn btn-outline-secondary mb-3">&larr; Back to Dashboard</button>
    
    <div v-if="app" class="card border-0 shadow-sm mb-4">
      <div class="card-body p-4">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h2 class="mb-0">{{ app.display_name }}</h2>
          <p class="text-muted mb-0">ID: {{ app.app_key }}</p>
        </div>
      </div>
      
      <hr>

      <div class="mb-4">
        <h5>Integration Endpoint (Latest Version)</h5>
        <p class="text-muted small">
            Returns JSON with <code>download_url</code>, <code>hash</code>, and <code>hash_algorithm</code> ("sha256").
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
              <th class="py-3 text-uppercase small fw-bold border-bottom-0">File Name</th>
              <th class="py-3 text-uppercase small fw-bold border-bottom-0">Size</th>
              <th class="py-3 text-uppercase small fw-bold border-bottom-0">Hash (SHA256)</th>
              <th class="pe-4 py-3 text-uppercase small fw-bold border-bottom-0 text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in versions" :key="v.id" :class="{'bg-success-subtle': v.is_active}">
              <td class="ps-4 py-3">
                <span v-if="v.is_active" class="badge bg-success shadow-sm">Active</span>
                <span v-else class="badge bg-secondary opacity-50">Inactive</span>
              </td>
              <td><span class="badge bg-light text-dark border">{{ v.version_name }}</span></td>
              <td class="text-muted small">{{ formatDate(v.created_at) }}</td>
              <td class="fw-bold text-dark">{{ v.file_name }}</td>
              <td class="text-muted small">{{ formatSize(v.file_size) }}</td>
              <td>
                <div class="d-flex align-items-center">
                    <small class="text-monospace text-muted me-2" :title="v.file_hash">{{ v.file_hash.substring(0, 8) }}...</small>
                    <button class="btn btn-sm btn-link p-0 text-muted" @click="copyHash(v.file_hash)" title="Copy full hash">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16">
                          <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                          <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                        </svg>
                    </button>
                </div>
              </td>
              <td class="pe-4 text-end">
                <div class="btn-group">
                    <a :href="v.download_url" class="btn btn-sm btn-light border" target="_blank" title="Download">
                        ⬇
                    </a>
                    <button v-if="!v.is_active" @click="setActiveVersion(v.id)" class="btn btn-sm btn-light border text-success" title="Set Active">
                        ✓
                    </button>
                    <button v-if="!v.is_active" @click="deleteVersion(v.id)" class="btn btn-sm btn-light border text-danger" title="Delete">
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
</style>
