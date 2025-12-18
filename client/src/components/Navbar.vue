<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const logout = () => {
  localStorage.removeItem('token');
  router.push('/');
};
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
    <div class="container">
      <a class="navbar-brand fw-bold" href="#" @click.prevent="router.push('/dashboard')">
        VersionStack
      </a>
      
      <div class="d-flex">
        <span class="navbar-text me-3">
          Admin Console
        </span>
        <button @click="logout" class="btn btn-outline-light btn-sm">Logout</button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.bg-pink { background-color: #e83e8c; }
</style>
