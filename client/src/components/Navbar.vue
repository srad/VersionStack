<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const logout = () => {
  localStorage.removeItem('token');
  router.push('/');
};
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-slate shadow-sm mb-4">
    <div class="container-xxl">
      <a class="navbar-brand fw-bold d-flex align-items-center" href="#" @click.prevent="router.push('/dashboard')">
        <img src="/app_icon.png" alt="Logo" width="32" height="32" class="d-inline-block align-text-top me-2 rounded bg-white p-1">
        VersionStack
      </a>
      
      <div class="d-flex align-items-center">
        <span class="navbar-text me-3 text-white-50 d-none d-sm-inline">
          Admin Console
        </span>
        <button @click="logout" class="btn btn-outline-light rounded-pill px-4">Logout</button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.bg-slate {
  background-color: #37474f; /* Elegant Slate Blue-Grey */
}
</style>

<style scoped>
.bg-pink { background-color: #e83e8c; }
</style>
