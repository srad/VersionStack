<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { appsApi, type App } from '../api';
import CreateAppForm from '../components/CreateAppForm.vue';
import AppList from '../components/AppList.vue';
import { Modal } from 'bootstrap';

const router = useRouter();
const apps = ref<App[]>([]);

const loadApps = async () => {
  try {
    const response = await appsApi().appsGet();
    apps.value = response.data;
  } catch (err) {
    console.error('Failed to load apps');
  }
};

const handleAppCreated = () => {
  loadApps();
  // Close modal logic (using data-bs-dismiss in the child or standard bootstrap behavior)
  const modalEl = document.getElementById('createAppModal');
  const modal = Modal.getInstance(modalEl!) || new Modal(modalEl!);
  modal.hide();
};

const totalApps = computed(() => apps.value.length);

onMounted(() => {
  if (!localStorage.getItem('token')) {
    router.push('/');
    return;
  }
  loadApps();
});
</script>

<template>
  <div>
    <!-- Header / Stats -->
    <div class="row mb-4">
        <div class="col-md-8">
          <h2 class="fw-light">Dashboard</h2>
          <p class="text-muted">Manage your application registry and versions.</p>
        </div>
        <div class="col-md-4 text-end">
             <button class="btn btn-primary shadow-sm" data-bs-toggle="modal" data-bs-target="#createAppModal">
                + New Application
             </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="row mb-5">
        <div class="col-md-4">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h6 class="text-uppercase text-muted small">Total Applications</h6>
              <h2 class="fw-bold mb-0">{{ totalApps }}</h2>
            </div>
          </div>
        </div>
        <div class="col-md-4">
           <!-- Placeholder for future stats -->
           <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h6 class="text-uppercase text-muted small">System Status</h6>
              <div class="d-flex align-items-center">
                <span class="badge bg-success me-2">Online</span>
                <span class="text-muted small">v1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Apps List -->
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="fw-bold text-secondary mb-0">Applications</h5>
        <div class="text-muted small">Showing {{ apps.length }} apps</div>
      </div>

      <div class="bg-white rounded shadow-sm border">
        <div v-if="apps.length === 0" class="text-center py-5">
            <p class="text-muted mb-3">No applications found in the registry.</p>
            <button class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#createAppModal">Create your first App</button>
        </div>
        <AppList v-else :apps="apps" />
      </div>

      <!-- Admin Navigation -->
      <div class="row mt-5">
        <div class="col-md-6 mb-3">
          <div
            class="card border-0 shadow-sm h-100 admin-nav-card"
            @click="router.push('/api-keys')"
            style="cursor: pointer;"
          >
            <div class="card-body d-flex align-items-center p-4">
              <div class="admin-nav-icon bg-primary bg-opacity-10 text-primary rounded-3 p-3 me-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M3.5 11.5a3.5 3.5 0 1 1 3.163-5H14L15.5 8 14 9.5l-1-1-1 1-1-1-1 1-1-1-1 1H6.663a3.5 3.5 0 0 1-3.163 2zM2.5 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                </svg>
              </div>
              <div>
                <h5 class="fw-bold mb-1">API Keys</h5>
                <p class="text-muted mb-0 small">Manage API keys and permissions</p>
              </div>
              <div class="ms-auto text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-6 mb-3">
          <div
            class="card border-0 shadow-sm h-100 admin-nav-card"
            @click="router.push('/audit-log')"
            style="cursor: pointer;"
          >
            <div class="card-body d-flex align-items-center p-4">
              <div class="admin-nav-icon bg-warning bg-opacity-10 text-warning rounded-3 p-3 me-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zM5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1H5z"/>
                  <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"/>
                </svg>
              </div>
              <div>
                <h5 class="fw-bold mb-1">Audit Log</h5>
                <p class="text-muted mb-0 small">View security and activity logs</p>
              </div>
              <div class="ms-auto text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

    <!-- Create App Modal -->
    <div class="modal fade" id="createAppModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Create New Application</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <CreateAppForm @app-created="handleAppCreated" />
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.admin-nav-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.admin-nav-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
}
</style>