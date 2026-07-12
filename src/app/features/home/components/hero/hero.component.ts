import { Component, inject } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [],
  template: `
    <section class="hero">
      <div class="hero__img"></div>
      <div class="hero__overlay"></div>
      <div class="hero__content">
        <p class="hero__welcome">Bienvenido a</p>
        <h1 class="hero__title">H.G. <em>Barber</em></h1>
        <button class="hero__cta" (click)="onReservar()">
          <span>Reservar cita</span>
        </button>
      </div>
    </section>
  `,
  styles: [`
    @keyframes fadeUp    { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes panSlow   { from { transform: scale(1.07); } to { transform: scale(1); } }

    .hero { position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; overflow: hidden; }
    .hero__img { position: absolute; inset: 0; background: url('/assets/images/hero-bg.jpg') center/cover no-repeat; background-image: url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1800&q=85'); animation: panSlow 14s ease-out both; }
    .hero__overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(15,12,11,0.55) 0%, rgba(15,12,11,0.45) 50%, rgba(15,12,11,0.75) 100%); }
    .hero__content { position: relative; z-index: 2; padding: 0 1.5rem; max-width: 1300px; color: #f5f1ea; animation: fadeUp 0.8s 0.4s both; }
    .hero__welcome { font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: clamp(1rem, 1.6vw, 1.3rem); font-style: italic; color: rgba(245,241,234,0.75); margin-bottom: 0.5rem; animation: fadeUp 0.6s 0.7s both; }
    .hero__title { font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: clamp(2.8rem, 7vw, 6rem); font-weight: 700; line-height: 1.05; letter-spacing: 0.02em; text-transform: uppercase; color: #f5f1ea; margin-bottom: 3rem; text-shadow: 0 4px 30px rgba(0,0,0,0.4); animation: fadeUp 0.7s 0.85s both; em { color: #c8a96e; font-style: italic; font-weight: 600; text-transform: none; } }
    .hero__cta { display: inline-flex; align-items: center; padding: 1rem 2.5rem; font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.32em; text-transform: uppercase; background: #c8a96e; color: #f5f1ea; border: 1px solid #c8a96e; border-radius: 1px; cursor: pointer; position: relative; overflow: hidden; transition: color 0.3s; animation: fadeUp 0.6s 1s both;
      &::before { content: ''; position: absolute; inset: 0; background: #f5f1ea; transform: scaleX(0); transform-origin: left; transition: transform 0.4s cubic-bezier(0.22,1,0.36,1); }
      &:hover { color: #0f0c0b; } &:hover::before { transform: scaleX(1); }
      span { position: relative; z-index: 1; }
    }
    @media (max-width: 640px) { .hero__title { font-size: clamp(2rem, 10vw, 3rem); } .hero__cta { padding: 0.85rem 1.8rem; font-size: 0.65rem; } }
    @media (prefers-reduced-motion: reduce) { .hero__img, .hero__content, .hero__welcome, .hero__title, .hero__cta { animation: none !important; opacity: 1 !important; transform: none !important; } }
  `],
})
export class HeroComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  onReservar() {
    if (this.auth.isLoggedIn()) {
      // Logueado → scroll suave a la sección de servicios
      document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // No logueado → a /auth
      this.router.navigate(['/auth']);
    }
  }
}