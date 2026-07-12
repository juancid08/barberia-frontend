import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ─── Públicas ──────────────────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'servicios',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: 'contacto',
    loadComponent: () =>
      import('./features/contact/contact.component').then(m => m.ContactComponent),
  },

  // ─── Solo invitados ────────────────────────────────────────────────────────
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/auth.component').then(m => m.AuthComponent),
  },

  // ─── Privadas ──────────────────────────────────────────────────────────────
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/profile.component').then(m => m.ProfileComponent),
  },

  // ─── Admin ─────────────────────────────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'calendario', pathMatch: 'full' },
      {
        path: 'calendario',
        loadComponent: () =>
          import('./features/admin/admin-calendar/admin-calendar.component').then(m => m.AdminCalendarComponent),
      },
      {
        path: 'citas',
        loadComponent: () =>
          import('./features/admin/admin-appointments/admin-appointments.component').then(m => m.AdminAppointmentsComponent),
      },
      {
        path: 'servicios',
        loadComponent: () =>
          import('./features/admin/admin-services/admin-services.component').then(m => m.AdminServicesComponent),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/admin/admin-users/admin-users.component').then(m => m.AdminUsersComponent),
      },
      {
        path: 'bloqueados',
        loadComponent: () =>
          import('./features/admin/admin-blocked/admin-blocked.component').then(m => m.AdminBlockedComponent),
      },
      {
        path: 'solicitudes',
        loadComponent: () =>
          import('./features/admin/admin-change-requests/admin-change-requests.component')
            .then(m => m.AdminChangeRequestsComponent),
      },
      {
        path: 'estadisticas',
        loadComponent: () =>
          import('./features/admin/admin-stats/admin-stats.component')
            .then(m => m.AdminStatsComponent),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];