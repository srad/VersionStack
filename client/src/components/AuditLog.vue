<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { axiosInstance, getErrorMessage } from '../api';

interface AuditLogEntry {
  id: number;
  action: string;
  entityType: string;
  entityId: string | null;
  actorKeyId: number | null;
  actorKeyName: string | null;
  actorIp: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

interface AuditResponse {
  data: AuditLogEntry[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

const logs = ref<AuditLogEntry[]>([]);
const loading = ref(false);
const errorMsg = ref('');
const expandedRows = ref<Set<number>>(new Set());

// Pagination
const currentPage = ref(1);
const pageSize = ref(25);
const totalItems = ref(0);

// Filters
const searchQuery = ref('');
const filterAction = ref('');
const filterEntityType = ref('');
const filterActorKeyId = ref('');

// Debounced search
const debouncedSearch = ref('');
let searchTimeout: ReturnType<typeof setTimeout>;

watch(searchQuery, (val) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = val;
    currentPage.value = 1;
  }, 300);
});

// Action types for filter dropdown
const actionTypes = [
  { value: '', label: 'All Actions' },
  { value: 'auth.login', label: 'Login Success' },
  { value: 'auth.login_failed', label: 'Login Failed' },
  { value: 'api_key.create', label: 'API Key Created' },
  { value: 'api_key.revoke', label: 'API Key Revoked' },
  { value: 'app.create', label: 'App Created' },
  { value: 'app.update', label: 'App Updated' },
  { value: 'app.delete', label: 'App Deleted' },
  { value: 'version.upload', label: 'Version Uploaded' },
  { value: 'version.delete', label: 'Version Deleted' },
  { value: 'version.set_active', label: 'Version Activated' },
];

const entityTypes = [
  { value: '', label: 'All Entities' },
  { value: 'auth', label: 'Authentication' },
  { value: 'api_key', label: 'API Key' },
  { value: 'app', label: 'App' },
  { value: 'version', label: 'Version' },
];

const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value));

const loadLogs = async () => {
  loading.value = true;
  errorMsg.value = '';

  try {
    const params = new URLSearchParams();
    params.set('limit', pageSize.value.toString());
    params.set('offset', ((currentPage.value - 1) * pageSize.value).toString());

    if (filterAction.value) params.set('action', filterAction.value);
    if (filterEntityType.value) params.set('entityType', filterEntityType.value);
    if (filterActorKeyId.value) params.set('actorKeyId', filterActorKeyId.value);

    const response = await axiosInstance.get<AuditResponse>(`/api/v1/audit?${params.toString()}`);

    // Client-side search filter (for flexibility)
    let filteredData = response.data.data;
    if (debouncedSearch.value) {
      const search = debouncedSearch.value.toLowerCase();
      filteredData = filteredData.filter(log =>
        log.action.toLowerCase().includes(search) ||
        log.entityType.toLowerCase().includes(search) ||
        (log.entityId && log.entityId.toLowerCase().includes(search)) ||
        (log.actorKeyName && log.actorKeyName.toLowerCase().includes(search)) ||
        (log.actorIp && log.actorIp.includes(search)) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(search))
      );
    }

    logs.value = filteredData;
    totalItems.value = response.data.pagination.total;
  } catch (err) {
    errorMsg.value = getErrorMessage(err);
  } finally {
    loading.value = false;
  }
};

// Watch for filter/page changes
watch([filterAction, filterEntityType, filterActorKeyId, currentPage, debouncedSearch], () => {
  loadLogs();
});

const toggleExpand = (id: number) => {
  if (expandedRows.value.has(id)) {
    expandedRows.value.delete(id);
  } else {
    expandedRows.value.add(id);
  }
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString();
};

const getRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const getActionBadgeClass = (action: string): string => {
  if (action.includes('failed')) return 'bg-danger';
  if (action.includes('delete') || action.includes('revoke')) return 'bg-warning text-dark';
  if (action.includes('create') || action.includes('upload')) return 'bg-success';
  if (action.includes('login')) return 'bg-info';
  if (action.includes('update') || action.includes('set_active')) return 'bg-primary';
  return 'bg-secondary';
};

const getActionIcon = (action: string): string => {
  if (action.includes('login_failed')) return '⚠️';
  if (action.includes('login')) return '🔑';
  if (action.includes('api_key')) return '🔐';
  if (action.includes('delete')) return '🗑️';
  if (action.includes('create')) return '➕';
  if (action.includes('upload')) return '📤';
  if (action.includes('update')) return '✏️';
  if (action.includes('revoke')) return '🚫';
  return '📋';
};

const isSuspicious = (log: AuditLogEntry): boolean => {
  // Flag potentially suspicious activities
  return log.action === 'auth.login_failed' ||
    log.action === 'api_key.revoke' ||
    log.action === 'app.delete';
};

const clearFilters = () => {
  searchQuery.value = '';
  filterAction.value = '';
  filterEntityType.value = '';
  filterActorKeyId.value = '';
  currentPage.value = 1;
};

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const refresh = () => {
  loadLogs();
};

onMounted(loadLogs);
</script>

<template>
  <div>
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h5 class="fw-bold text-secondary mb-0">Audit Log</h5>
        <small class="text-muted">Track all system activities for security monitoring</small>
      </div>
      <button class="btn btn-outline-secondary btn-sm" @click="refresh" :disabled="loading">
        <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
        Refresh
      </button>
    </div>

    <!-- Error Alert -->
    <div v-if="errorMsg" class="alert alert-danger alert-dismissible fade show">
      {{ errorMsg }}
      <button type="button" class="btn-close" @click="errorMsg = ''"></button>
    </div>

    <!-- Filters -->
    <div class="card mb-3">
      <div class="card-body py-2">
        <div class="row g-2 align-items-center">
          <!-- Search -->
          <div class="col-md-4">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                </svg>
              </span>
              <input
                v-model="searchQuery"
                type="text"
                class="form-control"
                placeholder="Search logs (IP, entity, actor...)"
              >
            </div>
          </div>

          <!-- Action Filter -->
          <div class="col-md-2">
            <select v-model="filterAction" class="form-select form-select-sm">
              <option v-for="opt in actionTypes" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- Entity Type Filter -->
          <div class="col-md-2">
            <select v-model="filterEntityType" class="form-select form-select-sm">
              <option v-for="opt in entityTypes" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- Page Size -->
          <div class="col-md-2">
            <select v-model="pageSize" class="form-select form-select-sm" @change="currentPage = 1">
              <option :value="10">10 per page</option>
              <option :value="25">25 per page</option>
              <option :value="50">50 per page</option>
              <option :value="100">100 per page</option>
            </select>
          </div>

          <!-- Clear Filters -->
          <div class="col-md-2 text-end">
            <button class="btn btn-sm btn-outline-secondary" @click="clearFilters">
              Clear Filters
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Bar -->
    <div class="d-flex justify-content-between align-items-center mb-2">
      <small class="text-muted">
        Showing {{ logs.length }} of {{ totalItems }} entries
        <span v-if="filterAction || filterEntityType || debouncedSearch" class="text-primary">
          (filtered)
        </span>
      </small>
      <small class="text-muted">
        Page {{ currentPage }} of {{ totalPages || 1 }}
      </small>
    </div>

    <!-- Loading State -->
    <div v-if="loading && logs.length === 0" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Logs Table -->
    <div v-else-if="logs.length > 0" class="bg-white rounded shadow-sm border">
      <table class="table table-hover mb-0 audit-table">
        <thead class="table-light">
          <tr>
            <th style="width: 40px;"></th>
            <th style="width: 140px;">Time</th>
            <th style="width: 160px;">Action</th>
            <th>Entity</th>
            <th style="width: 160px;">Actor</th>
            <th style="width: 120px;">IP Address</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="log in logs" :key="log.id">
            <tr
              :class="{
                'table-danger': log.action === 'auth.login_failed',
                'table-warning': isSuspicious(log) && log.action !== 'auth.login_failed',
                'expandable': log.details
              }"
              @click="log.details && toggleExpand(log.id)"
              style="cursor: pointer;"
            >
              <td class="text-center">
                <span v-if="log.details" class="text-muted">
                  {{ expandedRows.has(log.id) ? '▼' : '▶' }}
                </span>
              </td>
              <td>
                <div class="fw-medium small">{{ getRelativeTime(log.createdAt) }}</div>
                <div class="text-muted" style="font-size: 0.7rem;">{{ formatDate(log.createdAt) }}</div>
              </td>
              <td>
                <span class="me-1">{{ getActionIcon(log.action) }}</span>
                <span class="badge" :class="getActionBadgeClass(log.action)">
                  {{ log.action.replace('.', ' › ') }}
                </span>
              </td>
              <td>
                <span class="badge bg-light text-dark border me-1">{{ log.entityType }}</span>
                <code v-if="log.entityId" class="small">{{ log.entityId }}</code>
              </td>
              <td>
                <div v-if="log.actorKeyName" class="small fw-medium">{{ log.actorKeyName }}</div>
                <div v-else-if="log.actorKeyId === null" class="small text-muted fst-italic">Bootstrap Admin</div>
                <div v-else class="small text-muted">Key #{{ log.actorKeyId }}</div>
              </td>
              <td>
                <code v-if="log.actorIp" class="small text-muted">{{ log.actorIp }}</code>
                <span v-else class="text-muted">-</span>
              </td>
            </tr>
            <!-- Expanded Details Row -->
            <tr v-if="expandedRows.has(log.id) && log.details" class="details-row">
              <td colspan="6" class="bg-light">
                <div class="p-2">
                  <strong class="small text-muted">Details:</strong>
                  <pre class="mb-0 mt-1 p-2 bg-white rounded border small"><code>{{ JSON.stringify(log.details, null, 2) }}</code></pre>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-5 text-muted bg-white rounded border">
      <div class="mb-2" style="font-size: 2rem;">📋</div>
      <p class="mb-0">No audit log entries found</p>
      <small v-if="filterAction || filterEntityType || debouncedSearch">
        Try adjusting your filters
      </small>
    </div>

    <!-- Pagination -->
    <nav v-if="totalPages > 1" class="mt-3">
      <ul class="pagination pagination-sm justify-content-center mb-0">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button class="page-link" @click="goToPage(1)">&laquo;</button>
        </li>
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button class="page-link" @click="goToPage(currentPage - 1)">&lsaquo;</button>
        </li>

        <template v-for="page in totalPages" :key="page">
          <li
            v-if="page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)"
            class="page-item"
            :class="{ active: page === currentPage }"
          >
            <button class="page-link" @click="goToPage(page)">{{ page }}</button>
          </li>
          <li
            v-else-if="page === currentPage - 3 || page === currentPage + 3"
            class="page-item disabled"
          >
            <span class="page-link">...</span>
          </li>
        </template>

        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <button class="page-link" @click="goToPage(currentPage + 1)">&rsaquo;</button>
        </li>
        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <button class="page-link" @click="goToPage(totalPages)">&raquo;</button>
        </li>
      </ul>
    </nav>

    <!-- Security Tips -->
    <div class="mt-4 p-3 bg-light rounded border">
      <h6 class="fw-bold mb-2">
        <span class="me-1">🔍</span> Security Monitoring Tips
      </h6>
      <ul class="mb-0 small text-muted">
        <li><span class="badge bg-danger me-1">auth.login_failed</span> Multiple failed logins may indicate brute force attempts</li>
        <li><span class="badge bg-warning text-dark me-1">api_key.revoke</span> Track who is revoking keys and why</li>
        <li><span class="badge bg-warning text-dark me-1">app.delete</span> Monitor for unauthorized deletions</li>
        <li>Check for unusual IP addresses or activity patterns</li>
        <li>Review actions from newly created API keys</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.audit-table {
  font-size: 0.875rem;
}

.audit-table tbody tr.expandable:hover {
  background-color: rgba(0,0,0,0.02);
}

.details-row td {
  padding: 0 !important;
}

.details-row pre {
  max-height: 200px;
  overflow: auto;
  font-size: 0.75rem;
}

code {
  background-color: #f8f9fa;
  padding: 0.1em 0.3em;
  border-radius: 3px;
}
</style>
