<script setup lang="ts">
defineProps<{
  visible: boolean,
  message?: string
}>();
const emit = defineEmits(['cancel']);
</script>

<template>
  <div v-if="visible" class="loading-overlay">
    <div class="text-center text-white">
      <div class="spinner-border mb-3" role="status" style="width: 3rem; height: 3rem;">
        <span class="visually-hidden">Loading...</span>
      </div>
      <h5>{{ message || 'Processing...' }}</h5>
      <button class="btn btn-outline-light mt-3" @click="emit('cancel')">Cancel Upload</button>
    </div>
  </div>
</template>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(2px);
}
</style>
