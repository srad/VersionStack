<script setup lang="ts">
import { ref } from 'vue';
import api from '../services/api';

const emit = defineEmits(['app-created']);
const appKey = ref('');
const displayName = ref('');

const createApp = async () => {
  if (!appKey.value) return alert('App Key is required');
  
  try {
    await api.post('/apps', {
      app_key: appKey.value,
      display_name: displayName.value
    });
    appKey.value = '';
    displayName.value = '';
    emit('app-created');
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to create app');
  }
};
</script>

<template>
  <div>
    <div class="mb-3">
        <label class="form-label">App Key (Unique ID)</label>
        <input v-model="appKey" type="text" class="form-control" placeholder="e.g. face-model-v1" />
        <div class="form-text">Used in API requests. Cannot be changed.</div>
    </div>
    <div class="mb-3">
        <label class="form-label">Display Name</label>
        <input v-model="displayName" type="text" class="form-control" placeholder="e.g. Face Model" />
    </div>
    <div class="d-flex justify-content-end">
        <button @click="createApp" class="btn btn-success">Create App</button>
    </div>
  </div>
</template>
