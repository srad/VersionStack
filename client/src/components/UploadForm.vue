<script setup lang="ts">
import { ref } from 'vue';
import api from '../services/api';

const props = defineProps<{ appKey: string }>();
const emit = defineEmits(['upload-start', 'upload-end', 'upload-progress']);

const versionName = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const progress = ref(0);
const statusMsg = ref('');
const isUploading = ref(false);
let abortController: AbortController | null = null;

const cancel = () => {
    if (abortController) {
        abortController.abort();
        abortController = null;
        statusMsg.value = 'Upload cancelled.';
        isUploading.value = false;
        emit('upload-end', false);
    }
};

defineExpose({ cancel });

const upload = async () => {
  const file = fileInput.value?.files?.[0];
  if (!file) return alert('Please select a file');

  const formData = new FormData();
  formData.append('file', file);
  if (versionName.value) {
    formData.append('version_name', versionName.value);
  }

  isUploading.value = true;
  progress.value = 0;
  statusMsg.value = 'Starting upload...';
  emit('upload-start');

  abortController = new AbortController();

  try {
    const res = await api.post(`/apps/${props.appKey}/versions`, formData, {
      signal: abortController.signal,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          progress.value = percent;
          emit('upload-progress', percent);
          
          if (percent < 100) {
            statusMsg.value = `Uploading: ${percent}%`;
          } else {
            statusMsg.value = 'Processing on server... (Calculating Hash)';
          }
        }
      }
    });

    statusMsg.value = `Success! Version: ${res.data.version}`;
    if (fileInput.value) fileInput.value.value = '';
    versionName.value = '';
    
    // Slight delay to show success before unlocking
    setTimeout(() => {
        isUploading.value = false;
        statusMsg.value = '';
        emit('upload-end', true); // true = success
    }, 1000);

  } catch (err: any) {
    if (api.isCancel(err) || err.name === 'CanceledError') {
        // Handled in cancel function mostly, but ensure cleanup
        return;
    }
    statusMsg.value = `Error: ${err.response?.data?.message || err.message}`;
    isUploading.value = false;
    emit('upload-end', false); // false = failure
  } finally {
    abortController = null;
  }
};
</script>

<template>
  <div>
    <div class="d-flex gap-2">
      <input v-model="versionName" type="text" class="form-control w-25" placeholder="1.0.0 (Optional)" />
      <input ref="fileInput" type="file" class="form-control" />
      <button @click="upload" class="btn btn-primary" :disabled="isUploading">
        Upload
      </button>
    </div>

    <div v-if="statusMsg" class="mt-2 text-primary fw-bold">
      {{ statusMsg }}
    </div>
  </div>
</template>
