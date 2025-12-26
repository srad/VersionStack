<script setup lang="ts">
import { useRouter } from 'vue-router';
import type { App } from '../api';

defineProps<{
  apps: App[]
}>();

const router = useRouter();
</script>

<template>
  <div class="card border-0 shadow-sm p-0 overflow-hidden">
    <div class="card-header bg-white py-3 ps-4 border-bottom">
      <h5 class="mb-0 fw-bold text-secondary">Applications</h5>
    </div>
    <div class="table-responsive rounded shadow-sm border bg-white">
      <table class="table table-hover align-middle mb-0 custom-table">
        <thead class="bg-light text-secondary">
          <tr>
            <th class="ps-4 py-3 text-uppercase small fw-bold border-bottom-0">Application Name</th>
            <th class="py-3 text-uppercase small fw-bold border-bottom-0">App Key (ID)</th>
            <th class="pe-4 py-3 text-uppercase small fw-bold border-bottom-0 text-end">Actions</th>
          </tr>
        </thead>
        <tbody class="border-top-0">
          <tr v-for="app in apps" :key="app.id" @click="router.push(`/apps/${app.appKey}`)" style="cursor: pointer;">
            <td class="ps-4 py-3 fw-bold text-dark">
              {{ app.displayName }}
              <span v-if="app.isPublic" class="badge bg-success-subtle text-success ms-2 small">Public</span>
            </td>
            <td class="py-3"><span class="badge bg-light text-secondary font-monospace border">{{ app.appKey }}</span>
            </td>
            <td class="pe-4 py-3 text-end">
              <button class="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold">View Details</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.custom-table thead th {
  letter-spacing: 0.05em;
}

.custom-table tbody tr:last-child td {
  border-bottom: 0;
}
</style>