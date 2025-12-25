<script setup lang="ts">
import { ref, computed } from 'vue';
import { appsApi, getErrorMessage } from '../api';

const emit = defineEmits(['app-created']);
const appKey = ref('');
const displayName = ref('');
const isPublic = ref(false);

// Validate app key: alphanumeric characters separated by dashes
const appKeyPattern = /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/;

const isValidAppKey = computed(() => {
  if (!appKey.value) return true; // Empty is not invalid, just incomplete
  return appKeyPattern.test(appKey.value);
});

const canSubmit = computed(() => {
  return appKey.value.length > 0 && isValidAppKey.value;
});

const createApp = async () => {
  if (!appKey.value) return alert('App Key is required');
  if (!isValidAppKey.value) return alert('Invalid App Key format');

  try {
    await appsApi().appsPost({
      appKey: appKey.value,
      displayName: displayName.value || undefined,
      isPublic: isPublic.value
    });
    appKey.value = '';
    displayName.value = '';
    isPublic.value = false;
    emit('app-created');
  } catch (err: unknown) {
    alert(getErrorMessage(err));
  }
};
</script>

<template>
  <div>
    <div class="mb-3">
        <label class="form-label">App Key (Unique ID)</label>
        <input
          v-model="appKey"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': appKey && !isValidAppKey }"
          placeholder="e.g. face-model-v1"
        />
        <div v-if="appKey && !isValidAppKey" class="invalid-feedback">
          Only alphanumeric characters and dashes allowed (e.g., "my-app", "app123")
        </div>
        <div v-else class="form-text">Alphanumeric characters and dashes only. Cannot be changed.</div>
    </div>
    <div class="mb-3">
        <label class="form-label">Display Name</label>
        <input v-model="displayName" type="text" class="form-control" placeholder="e.g. Face Model" />
    </div>
    <div class="mb-3 form-check">
        <input v-model="isPublic" type="checkbox" class="form-check-input" id="isPublicCheck" />
        <label class="form-check-label" for="isPublicCheck">Public App</label>
        <div class="form-text">Public apps allow unauthenticated access to the /latest endpoint</div>
    </div>
    <div class="d-flex justify-content-end">
        <button @click="createApp" class="btn btn-success" :disabled="!canSubmit">Create App</button>
    </div>
  </div>
</template>
