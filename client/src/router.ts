import { createRouter, createWebHistory } from 'vue-router';
import LoginView from './views/LoginView.vue';
import DashboardView from './views/DashboardView.vue';
import AppDetailsView from './views/AppDetailsView.vue';
import ApiKeysView from './views/ApiKeysView.vue';
import AuditLogView from './views/AuditLogView.vue';

const routes = [
  { path: '/', component: LoginView },
  { path: '/dashboard', component: DashboardView },
  { path: '/apps/:appKey', component: AppDetailsView },
  { path: '/api-keys', component: ApiKeysView },
  { path: '/audit-log', component: AuditLogView },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
