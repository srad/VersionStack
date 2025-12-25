<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authApi, getErrorMessage } from '../api';

const router = useRouter();
const apiKey = ref('');
const errorMsg = ref('');

const login = async () => {
  try {
    const response = await authApi().authLoginPost({
      apiKey: apiKey.value
    });
    localStorage.setItem('token', response.data.token);
    router.push('/dashboard');
  } catch (err: unknown) {
    errorMsg.value = getErrorMessage(err);
  }
};
</script>

<template>
  <div class="d-flex justify-content-center align-items-center min-vh-100 bg-light w-100" style="position: absolute; top: 0; left: 0;">
    <div class="card p-4 shadow-sm border-0" style="max-width: 400px; width: 100%;">
      <h3 class="text-center mb-4 fw-light">VersionStack</h3>
      <div class="text-center mb-4 text-muted small">
        Admin Console
      </div>

      <div class="mb-3">
        <label>API Key</label>
        <input
          v-model="apiKey"
          type="password"
          class="form-control"
          placeholder="Enter your API key"
          @keyup.enter="login"
        />
        <div class="form-text">Contact your administrator to obtain an API key.</div>
      </div>

      <div class="d-grid gap-2">
        <button @click="login" class="btn btn-primary">Login</button>
      </div>

      <div v-if="errorMsg" class="alert alert-danger mt-3">
        {{ errorMsg }}
      </div>
    </div>
  </div>
</template>
