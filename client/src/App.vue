<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Navbar from './components/Navbar.vue';

const route = useRoute();

// Show Navbar on all pages except the login page ('/')
const showNavbar = computed(() => {
  return route.path !== '/';
});
</script>

<template>
  <div class="min-vh-100 d-flex flex-column bg-light">
    <Navbar v-if="showNavbar" />
    
    <!-- Main Content Area -->
    <main :class="['flex-grow-1', showNavbar ? 'container py-4' : '']">
      <router-view></router-view>
    </main>

    <!-- Global Footer -->
    <footer v-if="showNavbar" class="py-3 text-center text-muted small border-top bg-white mt-auto">
      VersionStack Registry &copy; {{ new Date().getFullYear() }}
    </footer>
  </div>
</template>

<style>
/* Global styles */
body {
  background-color: #f8f9fa;
}
</style>
