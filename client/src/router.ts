import { createRouter, createWebHistory } from 'vue-router';
import LoginView from './views/LoginView.vue';
import DashboardView from './views/DashboardView.vue';
import AppDetailsView from './views/AppDetailsView.vue';

const routes = [
  { path: '/', component: LoginView },
  { path: '/dashboard', component: DashboardView },
  { path: '/apps/:appKey', component: AppDetailsView }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
