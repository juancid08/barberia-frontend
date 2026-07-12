import { Component, HostListener, signal, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <header class="navbar" [class.scrolled]="isScrolled()" [class.solid]="isSolid()">
      <div class="container navbar__inner">
        <a routerLink="/" class="navbar__logo">
          <img src="logo.svg" alt="HG Barber" width="32" height="32" />
          <span class="navbar__logo-hg">H.G.</span>
          <span class="navbar__logo-barber">Barber</span>
        </a>

        <nav class="navbar__nav" [class.open]="menuOpen()">
          <a
            routerLink="/"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            (click)="closeMenu()"
            >Inicio</a
          >
          <a routerLink="/contacto" routerLinkActive="active" (click)="closeMenu()">Contacto</a>

          @if (auth.isLoggedIn()) {
            <a routerLink="/perfil" class="navbar__user" (click)="closeMenu()">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.2"
                width="16"
                height="16"
              >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {{ auth.currentUser()?.name }}
            </a>
            @if (auth.isAdmin()) {
              <a routerLink="/admin" class="btn-ghost navbar__cta" (click)="closeMenu()">Admin</a>
            }
            <button class="btn-ghost navbar__cta" (click)="onLogout()">Salir</button>
          } @else {
            <a routerLink="/auth" class="btn-primary navbar__cta" (click)="closeMenu()">Reservar cita</a>
          }
        </nav>

        <button
          class="navbar__hamburger"
          [class.open]="menuOpen()"
          (click)="toggleMenu()"
          aria-label="Abrir menú"
        >
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>
  `,
  styles: [
    `
      .navbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 100;
        height: var(--navbar-height);
        transition:
          background var(--transition),
          border-color var(--transition);
        border-bottom: 1px solid transparent;
      }

      /* Scrolled (en home, al hacer scroll) → blur oscuro */
      .navbar.scrolled {
        background: rgba(10, 10, 10, 0.92);
        backdrop-filter: blur(12px);
        border-bottom-color: var(--color-border);
      }

      /* Solid (fuera del home) → fondo oscuro sólido siempre */
      .navbar.solid {
        background: #0a0a0a;
        border-bottom-color: var(--color-border);
      }

      .navbar__inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 100%;
      }

      .navbar__logo {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-family: var(--font-display);
        font-size: 1.4rem;
        font-weight: 300;
        letter-spacing: 0.05em;
        text-decoration: none;
      }
      .navbar__logo-hg {
        color: var(--color-accent);
        font-style: italic;
      }
      .navbar__logo-barber {
        color: var(--color-text);
      }

      .navbar__nav {
        display: flex;
        align-items: center;
        gap: 2.5rem;
        a {
          font-size: var(--size-sm);
          color: var(--color-muted);
          letter-spacing: 0.04em;
          transition: color var(--transition);
          position: relative;
          text-decoration: none;
          &::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            width: 0;
            height: 1px;
            background: var(--color-accent);
            transition: width var(--transition);
          }
          &:hover,
          &.active {
            color: var(--color-text);
            &::after {
              width: 100%;
            }
          }
        }
      }
      .navbar__user {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: var(--size-sm);
        color: var(--color-muted);
        text-decoration: none;
        transition: color var(--transition);
        &:hover {
          color: var(--color-accent);
        }
      }
      .navbar__cta {
        margin-left: 0.5rem;
        padding: 0.6rem 1.4rem;
        font-size: var(--size-xs);
      }

      .navbar__hamburger {
        display: none;
        flex-direction: column;
        gap: 5px;
        padding: 4px;
        background: none;
        border: none;
        cursor: pointer;
        span {
          display: block;
          width: 24px;
          height: 1.5px;
          background: var(--color-text);
          transition:
            transform var(--transition),
            opacity var(--transition);
        }
        &.open {
          span:nth-child(1) {
            transform: translateY(6.5px) rotate(45deg);
          }
          span:nth-child(2) {
            opacity: 0;
          }
          span:nth-child(3) {
            transform: translateY(-6.5px) rotate(-45deg);
          }
        }
      }

      @media (max-width: 768px) {
        .navbar__hamburger {
          display: flex;
        }
        .navbar__nav {
          display: none;
          position: fixed;
          inset: var(--navbar-height) 0 0 0;
          flex-direction: column;
          justify-content: center;
          gap: 2rem;
          background: var(--color-bg);
          padding: 2rem;
          &.open {
            display: flex;
          }
          a {
            font-size: var(--size-lg);
          }
        }
        .navbar__cta {
          margin-left: 0;
          margin-top: 0.5rem;
          width: 100%;
          justify-content: center;
          text-align: center;
        }
      }
    `,
  ],
})
export class NavbarComponent {
  auth = inject(AuthService);
  router = inject(Router);

  isScrolled = signal(false);
  menuOpen = signal(false);

  // ── Detecta cambios de ruta ─────────────────────────────────────────────
  private currentUrl = toSignal<NavigationEnd | null>(
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)) as any,
    { initialValue: null },
  );

  // ── Solid: navbar oscuro permanente en TODAS las rutas excepto el home
  isSolid = computed(() => {
    const ev = this.currentUrl();
    const url = ev?.urlAfterRedirects ?? this.router.url;
    return url !== '/' && url !== '';
  });

  @HostListener('window:scroll')
  onScroll() {
    this.isScrolled.set(window.scrollY > 20);
  }

  toggleMenu() {
    this.menuOpen.update((v) => !v);
  }
  closeMenu() {
    this.menuOpen.set(false);
  }

  onLogout() {
    this.auth.logout().subscribe(() => {
      this.closeMenu();
      this.router.navigate(['/']);
    });
  }
}
