<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const isActive = (path: string) => {
  return route.path === path || route.path.startsWith(path + '/');
};

const logout = () => {
  localStorage.removeItem('token');
  router.push('/');
};
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-slate shadow-sm mb-4">
    <div class="container-xxl">
      <a class="navbar-brand fw-bold d-flex gap-2 align-items-center" href="#" @click.prevent="router.push('/dashboard')">
        <img src="/app_icon.png" alt="Logo" width="32" height="32" class="d-inline-block align-text-top rounded bg-white">
        <span>VersionStack</span>
      </a>

      <!-- Navigation Links -->
      <ul class="navbar-nav me-auto">
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{ active: isActive('/dashboard') || isActive('/apps') }"
            href="#"
            @click.prevent="router.push('/dashboard')"
          >
            Apps
          </a>
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{ active: isActive('/api-keys') }"
            href="#"
            @click.prevent="router.push('/api-keys')"
          >
            API Keys
          </a>
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{ active: isActive('/audit-log') }"
            href="#"
            @click.prevent="router.push('/audit-log')"
          >
            Audit Log
          </a>
        </li>
      </ul>

      <div class="d-flex align-items-center">
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
