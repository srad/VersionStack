<script setup lang="ts">
import { useRouter } from 'vue-router';

defineProps<{
  apps: any[]
}>();

const router = useRouter();
</script>

<template>
  <div class="table-responsive">
    <table class="table table-hover align-middle">
      <thead class="table-light">
        <tr>
          <th>Application Name</th>
          <th>App Key (ID)</th>
          <th class="text-end">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="app in apps" :key="app.id" @click="router.push(`/apps/${app.app_key}`)" style="cursor: pointer;">
          <td class="fw-bold">{{ app.display_name }}</td>
          <td><span class="font-monospace text-muted">{{ app.app_key }}</span></td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary">View Details &rarr;</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* No specific styles needed as we use Bootstrap classes */
</style>