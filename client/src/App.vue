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
  <div class="bg-light min-vh-100 d-flex flex-column">
    <!-- Navbar handles its own container inside -->
    <Navbar v-if="showNavbar" />
    
    <!-- Main Content Area - Centered Fixed Width -->
    <main :class="['flex-grow-1', showNavbar ? 'py-4' : '']">
      <div :class="[showNavbar ? 'container-xxl' : '']">
        <router-view></router-view>
      </div>
    </main>

    <!-- Global Footer -->
    <footer v-if="showNavbar" class="py-4 text-center text-muted small mt-auto">
      <div class="container-xxl border-top pt-3">
        VersionStack Registry &copy; {{ new Date().getFullYear() }}
      </div>
    </footer>
  </div>
</template>

<style>
/* Global styles */
body {
  background-color: #f8f9fa;
}
</style>
