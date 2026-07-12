import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="admin">
      <!-- ── Sidebar ── -->
      <aside class="admin__sidebar">
        <div class="admin__brand">
          <a routerLink="/" class="admin__logo">
            <img src="logo.svg" alt="HG Barber" width="28" height="28" />
            <span class="admin__logo-hg">H.G.</span>
            <span class="admin__logo-b">Barber</span>
          </a>
          <span class="admin__badge">Admin</span>
        </div>

        <nav class="admin__nav">
          <p class="admin__nav-label">Vistas</p>

          <a routerLink="/admin/calendario" routerLinkActive="active" class="admin__nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" width="17" height="17">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>Calendario</span>
          </a>

          <a routerLink="/admin/citas" routerLinkActive="active" class="admin__nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" width="17" height="17">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            <span>Lista de citas</span>
          </a>

          <p class="admin__nav-label admin__nav-label--gap">Gestión</p>

          <a routerLink="/admin/servicios" routerLinkActive="active" class="admin__nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" width="17" height="17">
              <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
            </svg>
            <span>Servicios</span>
          </a>

          <a routerLink="/admin/usuarios" routerLinkActive="active" class="admin__nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" width="17" height="17">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
            <span>Usuarios</span>
          </a>

          <a routerLink="/admin/bloqueados" routerLinkActive="active" class="admin__nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" width="17" height="17">
              <circle cx="12" cy="12" r="10"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
            <span>Fechas bloqueadas</span>
          </a>

          <a routerLink="/admin/solicitudes" routerLinkActive="active" class="admin__nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" width="17" height="17">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="9" y1="13" x2="15" y2="13"/>
              <line x1="9" y1="17" x2="11" y2="17"/>
            </svg>
            <span>Solicitudes de cambio</span>
          </a>

          <p class="admin__nav-label admin__nav-label--gap">Análisis</p>

          <a routerLink="/admin/estadisticas" routerLinkActive="active" class="admin__nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" width="17" height="17">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            <span>Estadísticas</span>
          </a>
        </nav>

        <div class="admin__footer">
          <a routerLink="/" class="admin__nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" width="17" height="17">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Ver web</span>
          </a>
          <button class="admin__nav-item admin__logout" (click)="onLogout()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" width="17" height="17">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <!-- ── Main ── -->
      <main class="admin__main">
        <div class="admin__main-inner">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      background: #f5f1ea;
    }

    .admin {
      display: grid;
      grid-template-columns: 260px 1fr;
      min-height: 100vh;
      background: #f5f1ea;
    }

    /* ── Sidebar ── */
    .admin__sidebar {
      background: #1a1614;
      border-right: 1px solid rgba(200,169,110,0.15);
      display: flex;
      flex-direction: column;
      padding: 1.75rem 1.5rem;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }

    /* ── Brand ── */
    .admin__brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.75rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid rgba(200,169,110,0.12);
    }

    .admin__logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: var(--font-display,'Cormorant Garamond',serif);
      font-size: 1.25rem;
      font-weight: 500;
      letter-spacing: 0.04em;
      text-decoration: none;
    }
    .admin__logo img { flex-shrink: 0; }
    .admin__logo-hg  { color: #c8a96e; font-style: italic; }
    .admin__logo-b   { color: #f5f1ea; }

    .admin__badge {
      font-family: var(--font-body,'Inter',sans-serif);
      font-size: 0.5rem;
      font-weight: 600;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: #c8a96e;
      border: 1px solid rgba(200,169,110,0.4);
      padding: 0.2rem 0.55rem;
      background: rgba(200,169,110,0.08);
    }

    /* ── Nav ── */
    .admin__nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .admin__nav-label {
      font-family: var(--font-body,'Inter',sans-serif);
      font-size: 0.55rem;
      font-weight: 600;
      letter-spacing: 0.32em;
      text-transform: uppercase;
      color: rgba(200,169,110,0.55);
      margin-bottom: 0.6rem;
      padding-left: 0.95rem;
    }
    .admin__nav-label--gap { margin-top: 1.5rem; }

    .admin__nav-item {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.7rem 0.95rem;
      border-radius: 1px;
      font-family: var(--font-body,'Inter',sans-serif);
      font-size: 0.76rem;
      font-weight: 500;
      letter-spacing: 0.04em;
      color: rgba(245,241,234,0.55);
      text-decoration: none;
      background: none;
      border: none;
      cursor: pointer;
      width: 100%;
      text-align: left;
      position: relative;
      transition: color 0.25s, background 0.25s;
    }
    .admin__nav-item svg { flex-shrink: 0; transition: color 0.25s; }
    .admin__nav-item:hover { color: #f5f1ea; background: rgba(200,169,110,0.05); }
    .admin__nav-item.active { color: #c8a96e; background: rgba(200,169,110,0.1); }
    .admin__nav-item.active::before {
      content: '';
      position: absolute;
      left: 0; top: 8px; bottom: 8px;
      width: 2px;
      background: #c8a96e;
    }

    /* ── Footer ── */
    .admin__footer {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding-top: 1.25rem;
      margin-top: 1rem;
      border-top: 1px solid rgba(200,169,110,0.12);
    }

    .admin__logout { color: rgba(245,241,234,0.55); }
    .admin__logout:hover { color: #c93838 !important; background: rgba(220,50,50,0.08) !important; }

    /* ── Main ── */
    .admin__main { background: #f5f1ea; min-height: 100vh; overflow-y: auto; }
    .admin__main-inner { padding: 2.5rem 2.5rem 3rem; }

    /* ── Mobile ── */
    @media (max-width: 768px) {
      .admin { grid-template-columns: 1fr; }
      .admin__sidebar {
        position: sticky; top: 0; z-index: 50;
        height: auto; flex-direction: row; flex-wrap: wrap;
        gap: 1rem; align-items: center; padding: 1rem 1.25rem;
      }
      .admin__brand { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
      .admin__nav { flex-direction: row; flex: unset; gap: 0; }
      .admin__nav-label { display: none; }
      .admin__nav-item span { display: none; }
      .admin__footer { flex-direction: row; padding-top: 0; margin-top: 0; border-top: none; }
      .admin__footer .admin__nav-item span { display: none; }
      .admin__main-inner { padding: 1.5rem 1.25rem 2rem; }
    }
  `]
})
export class AdminLayoutComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  onLogout() {
    this.auth.logout().subscribe(() => this.router.navigate(['/']));
  }
}