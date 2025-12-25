<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import ApiKeyManager from '../components/ApiKeyManager.vue';

const router = useRouter();

onMounted(() => {
  if (!localStorage.getItem('token')) {
    router.push('/');
  }
});
</script>

<template>
  <div>
    <div class="d-flex align-items-center mb-4">
      <button @click="router.push('/dashboard')" class="btn btn-outline-secondary btn-sm me-3">
        &larr; Back
      </button>
      <div>
        <h2 class="fw-light mb-0">API Keys</h2>
        <p class="text-muted mb-0">Manage API keys for programmatic access</p>
      </div>
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <ApiKeyManager />
      </div>
    </div>
  </div>
</template>
