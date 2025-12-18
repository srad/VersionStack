<script setup lang="ts">
import { ref } from 'vue';
import api from '../services/api';
import { useRouter } from 'vue-router';

const router = useRouter();
const username = ref('');
const password = ref('');
const errorMsg = ref('');

const login = async () => {
  try {
    const res = await api.post('/auth/login', {
      username: username.value,
      password: password.value
    });
    localStorage.setItem('token', res.data.token);
    router.push('/dashboard');
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Login failed';
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
        <label>Username</label>
        <input v-model="username" type="text" class="form-control" @keyup.enter="login" />
      </div>
      
      <div class="mb-3">
        <label>Password</label>
        <input v-model="password" type="password" class="form-control" @keyup.enter="login" />
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