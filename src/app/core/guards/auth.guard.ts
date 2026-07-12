import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// ─── Auth Guard ───────────────────────────────────────────────────────────────
// Protege rutas que requieren estar autenticado
// Uso: canActivate: [authGuard]
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  // Redirige al login guardando la URL destino para volver tras el login
  return router.createUrlTree(['/auth']);
};

// ─── Admin Guard ──────────────────────────────────────────────────────────────
// Protege rutas que requieren rol ADMIN
// Uso: canActivate: [authGuard, adminGuard]
export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isAdmin()) {
    return true;
  }

  // Autenticado pero sin permisos → vuelve a home
  return router.createUrlTree(['/']);
};

// ─── Guest Guard ──────────────────────────────────────────────────────────────
// Evita que un usuario ya logueado acceda a /auth
// Uso: canActivate: [guestGuard]
export const guestGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return true;
  }

  // Ya autenticado → redirige a home
  return router.createUrlTree(['/']);
};