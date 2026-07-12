import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

type AuthTab   = 'login' | 'register';
type ResetStep = 'email' | 'code' | 'password' | 'done';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="auth-page">
      <div class="auth-page__card">

        <!-- Logo -->
        <a routerLink="/" class="auth-logo">
          <div class="auth-logo__orn">
            <div class="auth-logo__rule"></div>
            <div class="auth-logo__diamond"></div>
            <div class="auth-logo__rule"></div>
          </div>
          <div class="auth-logo__main">
            <span class="auth-logo__hg">H.G.</span>
            <span class="auth-logo__barber">Barber</span>
          </div>
          <span class="auth-logo__sub">Est. 2023 · La Viñuela</span>
        </a>

        <!-- ══ MODO RESET ══ -->
        @if (mode === 'reset') {

          <!-- Paso 1: Email -->
          @if (resetStep() === 'email') {
            <div class="auth-reset__header">
              <p class="auth-reset__label">Recuperar contraseña</p>
              <h2 class="auth-reset__title">¿Olvidaste tu<br><em>contraseña?</em></h2>
              <p class="auth-reset__sub">Introduce tu email y te enviaremos un código de 6 dígitos válido durante 15 minutos.</p>
            </div>
            @if (error()) { <p class="auth-msg auth-msg--error">{{ error() }}</p> }
            <form class="auth-form" (ngSubmit)="onForgotPassword()">
              <div class="auth-field">
                <label>Email</label>
                <input type="email" [(ngModel)]="resetEmail" name="email"
                       placeholder="tu@email.com" required />
              </div>
              <button type="submit" class="auth-submit" [disabled]="loading()">
                <span>{{ loading() ? 'Enviando...' : 'Enviar código' }}</span>
              </button>
            </form>
            <button class="auth-reset__back" (click)="backToLogin()">← Volver al login</button>
          }

          <!-- Paso 2: Código -->
          @if (resetStep() === 'code') {
            <div class="auth-reset__header">
              <p class="auth-reset__label">Verificación</p>
              <h2 class="auth-reset__title">Introduce<br><em>el código</em></h2>
              <p class="auth-reset__sub">
                Hemos enviado un código de 6 dígitos a
                <strong>{{ resetEmail }}</strong>.
              </p>
            </div>
            @if (error()) { <p class="auth-msg auth-msg--error">{{ error() }}</p> }
            <form class="auth-form" (ngSubmit)="onVerifyCode()">
              <div class="auth-field">
                <label>Código de verificación</label>
                <input type="text" [(ngModel)]="resetCode" name="code"
                       placeholder="0 0 0 0 0 0" maxlength="6"
                       class="auth-code-input" required />
              </div>
              <button type="submit" class="auth-submit" [disabled]="loading()">
                <span>{{ loading() ? 'Verificando...' : 'Verificar código' }}</span>
              </button>
            </form>
            <button class="auth-reset__back" (click)="resetStep.set('email')">← Cambiar email</button>
          }

          <!-- Paso 3: Nueva contraseña -->
          @if (resetStep() === 'password') {
            <div class="auth-reset__header">
              <p class="auth-reset__label">Nueva contraseña</p>
              <h2 class="auth-reset__title">Elige tu<br><em>nueva contraseña</em></h2>
            </div>
            @if (error()) { <p class="auth-msg auth-msg--error">{{ error() }}</p> }
            <form class="auth-form" (ngSubmit)="onResetPassword()">
              <div class="auth-field">
                <label>Nueva contraseña</label>
                <input type="password" [(ngModel)]="newPassword" name="password"
                       placeholder="Mínimo 8 caracteres" required minlength="8" />
              </div>
              <div class="auth-field">
                <label>Confirmar contraseña</label>
                <input type="password" [(ngModel)]="confirmPassword" name="confirm"
                       placeholder="Repite la contraseña" required />
              </div>
              <button type="submit" class="auth-submit" [disabled]="loading()">
                <span>{{ loading() ? 'Guardando...' : 'Guardar contraseña' }}</span>
              </button>
            </form>
          }

          <!-- Paso 4: Éxito -->
          @if (resetStep() === 'done') {
            <div class="auth-reset__done">
              <div class="auth-reset__done-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" width="36" height="36">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
              </div>
              <div class="auth-logo__orn" style="margin: 0.5rem 0;">
                <div class="auth-logo__rule"></div>
                <div class="auth-logo__diamond"></div>
                <div class="auth-logo__rule"></div>
              </div>
              <p class="auth-reset__done-text">Contraseña actualizada correctamente</p>
              <button class="auth-submit" style="margin-top:1.5rem;" (click)="backToLogin()">
                <span>Iniciar sesión</span>
              </button>
            </div>
          }
        }

        <!-- ══ MODO NORMAL ══ -->
        @if (mode === 'auth') {

          <!-- Aviso reserva pendiente -->
          @if (hasBookingIntent) {
            <div class="auth-page__intent">
              <span class="auth-page__intent-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </span>
              <p>
                Inicia sesión para confirmar tu reserva de
                <strong>{{ bookingIntent?.serviceName }}</strong>
                el {{ bookingIntent?.date }} a las {{ bookingIntent?.time }}.
              </p>
            </div>
          }

          <!-- Tabs -->
          <div class="auth-tabs">
            <button [class.active]="tab() === 'login'"    (click)="switchTab('login')">
              <span>Iniciar sesión</span>
            </button>
            <button [class.active]="tab() === 'register'" (click)="switchTab('register')">
              <span>Registrarse</span>
            </button>
          </div>

          @if (error())      { <p class="auth-msg auth-msg--error">{{ error() }}</p> }
          @if (successMsg()) { <p class="auth-msg auth-msg--success">{{ successMsg() }}</p> }

          <!-- Login -->
          @if (tab() === 'login') {
            <form class="auth-form" (ngSubmit)="onLogin()">
              <div class="auth-field">
                <label>Email</label>
                <input type="email" [(ngModel)]="loginForm.email" name="email"
                       placeholder="tu@email.com" required />
              </div>
              <div class="auth-field">
                <label>Contraseña</label>
                <input type="password" [(ngModel)]="loginForm.password" name="password"
                       placeholder="••••••••" required />
              </div>
              <button type="submit" class="auth-submit" [disabled]="loading()">
                <span>{{ loading() ? 'Entrando...' : 'Entrar' }}</span>
              </button>
            </form>
            <button class="auth-forgot" (click)="goToReset()">
              ¿Olvidaste tu contraseña?
            </button>
          }

          <!-- Register -->
          @if (tab() === 'register') {
            <form class="auth-form" (ngSubmit)="onRegister()">
              <div class="auth-field">
                <label>Nombre</label>
                <input type="text" [(ngModel)]="registerForm.name" name="name"
                       placeholder="Tu nombre" required />
              </div>
              <div class="auth-field">
                <label>Email</label>
                <input type="email" [(ngModel)]="registerForm.email" name="email"
                       placeholder="tu@email.com" required />
              </div>
              <div class="auth-field">
                <label>Contraseña</label>
                <input type="password" [(ngModel)]="registerForm.password" name="password"
                       placeholder="Mínimo 8 caracteres" required minlength="8" />
              </div>
              <button type="submit" class="auth-submit" [disabled]="loading()">
                <span>{{ loading() ? 'Creando cuenta...' : 'Crear cuenta' }}</span>
              </button>
            </form>
          }
        }

      </div>
    </section>
  `,
  styles: [`
    /* ── Página ── */
    .auth-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      padding: calc(var(--navbar-height) + 2rem) 1.5rem 3rem;
      background: #f5f1ea;
    }

    /* ── Card ── */
    .auth-page__card {
      width: 100%; max-width: 440px;
      background: #ffffff; border: 1px solid rgba(200,169,110,0.25);
      padding: 3rem 2.5rem;
      box-shadow: 0 20px 50px rgba(26,22,20,0.08);
      position: relative;
    }
    .auth-page__card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, transparent, #c8a96e 50%, transparent);
    }

    /* ── Logo ── */
    .auth-logo { display: flex; flex-direction: column; align-items: center; gap: 5px; text-decoration: none; margin-bottom: 2rem; }
    .auth-logo__orn { display: flex; align-items: center; gap: 4px; margin-bottom: 2px; }
    .auth-logo__rule { width: 32px; height: 1px; background: linear-gradient(90deg, transparent, #c8a96e, transparent); }
    .auth-logo__diamond { width: 5px; height: 5px; background: #c8a96e; transform: rotate(45deg); }
    .auth-logo__main { font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: 1.6rem; font-weight: 500; letter-spacing: 0.06em; line-height: 1; display: flex; align-items: baseline; gap: 0.35rem; }
    .auth-logo__hg { color: #c8a96e; font-style: italic; }
    .auth-logo__barber { color: #1a1614; }
    .auth-logo__sub { font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.52rem; font-weight: 500; letter-spacing: 0.32em; text-transform: uppercase; color: rgba(26,22,20,0.4); margin-top: 4px; }

    /* ── Intent ── */
    .auth-page__intent { display: flex; align-items: flex-start; gap: 0.75rem; background: rgba(200,169,110,0.08); border: 1px solid rgba(200,169,110,0.3); padding: 0.9rem 1rem; margin-bottom: 1.75rem; font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.78rem; line-height: 1.55; color: rgba(26,22,20,0.7); }
    .auth-page__intent-icon { flex-shrink: 0; color: #c8a96e; margin-top: 1px; }
    .auth-page__intent strong { color: #c8a96e; font-weight: 600; }

    /* ── Tabs ── */
    .auth-tabs { display: flex; border-bottom: 1px solid rgba(26,22,20,0.1); margin-bottom: 2rem; }
    .auth-tabs button { flex: 1; padding: 0.85rem 0.5rem; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.7rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(26,22,20,0.4); transition: color 0.25s, border-color 0.25s; &.active { color: #c8a96e; border-bottom-color: #c8a96e; } &:hover:not(.active) { color: #1a1614; } }

    /* ── Mensajes ── */
    .auth-msg { font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.8rem; padding: 0.75rem 1rem; margin-bottom: 1.5rem; border: 1px solid; }
    .auth-msg--error   { background: rgba(220,50,50,0.06); border-color: rgba(220,50,50,0.25); color: #c93838; }
    .auth-msg--success { background: rgba(76,145,80,0.08); border-color: rgba(76,145,80,0.3); color: #4c9150; }

    /* ── Form ── */
    .auth-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .auth-field { display: flex; flex-direction: column; gap: 0.5rem; }
    .auth-field label { font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: #c8a96e; }
    .auth-field input { background: #fbf8f3; border: 1px solid rgba(26,22,20,0.12); color: #1a1614; font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.88rem; padding: 0.85rem 1rem; border-radius: 1px; outline: none; width: 100%; transition: border-color 0.25s, background 0.25s; &::placeholder { color: rgba(26,22,20,0.35); } &:focus { border-color: #c8a96e; background: #ffffff; } }

    /* Input código 6 dígitos */
    .auth-code-input {
      text-align: center !important;
      font-family: var(--font-display, 'Cormorant Garamond', serif) !important;
      font-size: 2rem !important;
      letter-spacing: 0.6em !important;
      padding: 1rem !important;
    }

    /* ── Submit ── */
    .auth-submit { display: inline-flex; align-items: center; justify-content: center; width: 100%; padding: 0.95rem 1.5rem; margin-top: 0.75rem; background: #1a1614; color: #f5f1ea; border: 1px solid #1a1614; border-radius: 1px; font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.7rem; font-weight: 600; letter-spacing: 0.28em; text-transform: uppercase; cursor: pointer; position: relative; overflow: hidden; transition: color 0.3s, border-color 0.3s;
      &::before { content: ''; position: absolute; inset: 0; background: #c8a96e; transform: scaleX(0); transform-origin: left; transition: transform 0.4s cubic-bezier(0.22,1,0.36,1); }
      &:hover:not(:disabled) { color: #1a1614; border-color: #c8a96e; }
      &:hover:not(:disabled)::before { transform: scaleX(1); }
      span { position: relative; z-index: 1; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    /* ── ¿Olvidaste tu contraseña? ── */
    .auth-forgot { background: none; border: none; width: 100%; text-align: center; margin-top: 1.25rem; font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.7rem; letter-spacing: 0.08em; color: rgba(26,22,20,0.45); cursor: pointer; transition: color 0.25s; &:hover { color: #c8a96e; } }

    /* ── Reset header ── */
    .auth-reset__header { margin-bottom: 2rem; }
    .auth-reset__label { font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.32em; text-transform: uppercase; color: #c8a96e; margin-bottom: 0.6rem; }
    .auth-reset__title { font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: 1.8rem; font-weight: 500; color: #1a1614; line-height: 1.15; margin-bottom: 0.75rem; em { color: #c8a96e; font-style: italic; font-weight: 600; } }
    .auth-reset__sub { font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.8rem; color: rgba(26,22,20,0.55); line-height: 1.6; strong { color: #1a1614; font-weight: 600; } }

    .auth-reset__back { background: none; border: none; font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.7rem; color: rgba(26,22,20,0.4); cursor: pointer; margin-top: 1rem; transition: color 0.25s; letter-spacing: 0.05em; &:hover { color: #1a1614; } }

    /* ── Éxito reset ── */
    .auth-reset__done { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 1rem 0; text-align: center; }
    .auth-reset__done-icon { color: #c8a96e; }
    .auth-reset__done-text { font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: 1.15rem; font-weight: 500; color: #1a1614; font-style: italic; }

    /* ── Responsive ── */
    @media (max-width: 480px) {
      .auth-page { padding: calc(var(--navbar-height) + 1.5rem) 1rem 2rem; }
      .auth-page__card { padding: 2rem 1.5rem; }
      .auth-logo__main { font-size: 1.4rem; }
    }
  `]
})
export class AuthComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);
  private http   = inject(HttpClient);

  // ── Modo ────────────────────────────────────────────────────────────────────
  mode: 'auth' | 'reset' = 'auth';

  // ── Auth normal ─────────────────────────────────────────────────────────────
  tab        = signal<AuthTab>('login');
  loading    = signal(false);
  error      = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  loginForm    = { email: '', password: '' };
  registerForm = { name: '', email: '', password: '' };

  bookingIntent = (() => {
    const raw = sessionStorage.getItem('booking_intent');
    return raw ? JSON.parse(raw) : null;
  })();
  hasBookingIntent = !!this.bookingIntent;

  // ── Reset ───────────────────────────────────────────────────────────────────
  resetStep       = signal<ResetStep>('email');
  resetEmail      = '';
  resetCode       = '';
  newPassword     = '';
  confirmPassword = '';

  // ── Navegación ──────────────────────────────────────────────────────────────
  switchTab(tab: AuthTab) {
    this.tab.set(tab);
    this.error.set(null);
    this.successMsg.set(null);
  }

  goToReset() {
    this.mode = 'reset';
    this.resetStep.set('email');
    this.error.set(null);
  }

  backToLogin() {
    this.mode = 'auth';
    this.tab.set('login');
    this.error.set(null);
    this.resetEmail = '';
    this.resetCode  = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }

  // ── Login ───────────────────────────────────────────────────────────────────
  onLogin() {
    this.error.set(null);
    this.loading.set(true);
    this.auth.login(this.loginForm.email, this.loginForm.password).subscribe({
      next: () => {
        this.loading.set(false);
        if (this.hasBookingIntent) {
          const intent = this.bookingIntent;
          sessionStorage.removeItem('booking_intent');
          sessionStorage.setItem('open_booking_service', intent.serviceId.toString());
          this.router.navigate(['/']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Credenciales incorrectas');
        this.loading.set(false);
      },
    });
  }

  // ── Register ─────────────────────────────────────────────────────────────────
  onRegister() {
    this.error.set(null);
    this.successMsg.set(null);
    this.loading.set(true);
    this.auth.register({
      name:     this.registerForm.name,
      email:    this.registerForm.email,
      password: this.registerForm.password,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMsg.set('Cuenta creada correctamente. Inicia sesión.');
        this.registerForm = { name: '', email: '', password: '' };
        setTimeout(() => this.switchTab('login'), 1500);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al crear la cuenta');
        this.loading.set(false);
      },
    });
  }

  // ── Paso 1: Pedir código ─────────────────────────────────────────────────────
  onForgotPassword() {
    this.error.set(null);
    this.loading.set(true);
    this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email: this.resetEmail }).subscribe({
      next: () => { this.loading.set(false); this.resetStep.set('code'); },
      error: (err) => { this.error.set(err.error?.message || 'Error al enviar el código'); this.loading.set(false); },
    });
  }

  // ── Paso 2: Verificar código ──────────────────────────────────────────────────
  onVerifyCode() {
    this.error.set(null);
    this.loading.set(true);
    this.http.post(`${environment.apiUrl}/auth/verify-code`, {
      email: this.resetEmail, code: this.resetCode,
    }).subscribe({
      next: () => { this.loading.set(false); this.resetStep.set('password'); },
      error: (err) => { this.error.set(err.error?.message || 'Código inválido o expirado'); this.loading.set(false); },
    });
  }

  // ── Paso 3: Nueva contraseña ──────────────────────────────────────────────────
  onResetPassword() {
    this.error.set(null);
    if (this.newPassword !== this.confirmPassword) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }
    this.loading.set(true);
    this.http.post(`${environment.apiUrl}/auth/reset-password`, {
      email: this.resetEmail, code: this.resetCode, newPassword: this.newPassword,
    }).subscribe({
      next: () => { this.loading.set(false); this.resetStep.set('done'); },
      error: (err) => { this.error.set(err.error?.message || 'Error al actualizar la contraseña'); this.loading.set(false); },
    });
  }
}