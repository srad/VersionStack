<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';
import CreateAppForm from '../components/CreateAppForm.vue';
import AppList from '../components/AppList.vue';
import { Modal } from 'bootstrap'; // We need this to control the modal programmatically if needed

const router = useRouter();
const apps = ref<any[]>([]);

const loadApps = async () => {
  try {
    const res = await api.get('/apps');
    apps.value = res.data;
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