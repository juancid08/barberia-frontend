import { Component, AfterViewInit, ElementRef, ViewChild, inject } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [],
  template: `
    <section class="about-wrap" #sectionEl>
      <div class="about">
        <div class="about__media">
          <div class="about__img"></div>
          <div class="about__badge">
            <div class="about__badge-line"></div>
            <span class="about__badge-text">Est. 2023</span>
            <div class="about__badge-line"></div>
          </div>
        </div>

        <div class="about__text" [class.visible]="isVisible">
          <p class="about__small">Sobre nosotros</p>
          <h2 class="about__title">H.G. Barber<br /><em>en La Viñuela</em></h2>
          <div class="about__intro">
            <div class="about__diamond"></div>
            <p>Más de dos años pelando con oficio</p>
          </div>
          <p class="about__body">
            H.G. Barber es una barbería en La Viñuela, Málaga, donde la precisión y el detalle
            definen cada corte. Desde mediados de 2023 atendemos a hombres del Axarquía que valoran
            el tiempo, el trato cercano y un resultado a la altura.
          </p>
          <p class="about__body">
            No somos solo una barbería: somos el rato en el que paras, te sientas, conversas y sales
            sintiéndote mejor. Cortes clásicos, afeitados tradicionales con navaja y arreglo de
            barba — todo hecho con calma y con las manos justas.
          </p>
          <div class="about__stats">
            <div class="about__stat"><span class="about__stat-n">2,5</span><span class="about__stat-l">Años de oficio</span></div>
            <div class="about__stat-divider"></div>
            <div class="about__stat"><span class="about__stat-n">+500</span><span class="about__stat-l">Clientes</span></div>
            <div class="about__stat-divider"></div>
            <div class="about__stat"><span class="about__stat-n">★ 4,9</span><span class="about__stat-l">Valoración</span></div>
          </div>
          <div class="about__actions">
            <button class="about__cta about__cta--primary" (click)="onReservar()">
              <span>Reservar cita</span>
            </button>
            <a href="https://www.instagram.com/hg.barberr" target="_blank" rel="noopener"
               class="about__cta about__cta--ghost">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="14" height="14">
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
              </svg>
              Síguenos
            </a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    @keyframes textIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes zoomIn { from { transform: scale(1.06); } to { transform: scale(1); } }

    .about-wrap { background: #f5f1ea; padding-block: 6rem; }
    .about { display: grid; grid-template-columns: 1fr 1.15fr; gap: 0; min-height: 600px; align-items: stretch; max-width: 1400px; margin: 0 auto; }
    .about__media { position: relative; overflow: hidden; min-height: 600px; }
    .about__img { position: absolute; inset: 0; background: url('/assets/images/about-bg.jpg') center/cover no-repeat; background-image: url('https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1000&q=85'); animation: zoomIn 12s ease-out both; transition: transform 0.6s ease; }
    .about__media:hover .about__img { transform: scale(1.03); }
    .about__badge { position: absolute; bottom: 2.5rem; left: 2.5rem; display: flex; align-items: center; gap: 0.75rem; background: rgba(15,12,11,0.85); backdrop-filter: blur(8px); padding: 0.75rem 1.5rem; border: 1px solid rgba(200,169,110,0.4); animation: textIn 0.7s 0.6s both; }
    .about__badge-line { width: 18px; height: 1px; background: #c8a96e; }
    .about__badge-text { font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: 0.95rem; font-weight: 500; font-style: italic; letter-spacing: 0.15em; color: #c8a96e; }
    .about__text { padding: 4rem; display: flex; flex-direction: column; justify-content: center; transform: translateX(30px); }
    .about__text.visible { animation: textIn 0.8s 0.2s cubic-bezier(0.22,1,0.36,1) both; }
    .about__small { font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.62rem; font-weight: 600; letter-spacing: 0.32em; text-transform: uppercase; color: #c8a96e; margin-bottom: 1.25rem; }
    .about__title { font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: clamp(2rem, 4vw, 3.2rem); font-weight: 500; color: #1a1614; line-height: 1.1; letter-spacing: 0.01em; margin-bottom: 1.75rem; em { color: #c8a96e; font-style: italic; font-weight: 600; } }
    .about__intro { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: 1.05rem; font-style: italic; color: rgba(26,22,20,0.6); }
    .about__diamond { width: 6px; height: 6px; background: #c8a96e; transform: rotate(45deg); flex-shrink: 0; }
    .about__body { font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.92rem; color: rgba(26,22,20,0.7); line-height: 1.9; margin-bottom: 1.25rem; max-width: 540px; }
    .about__stats { display: flex; align-items: center; gap: 2rem; margin: 2.5rem 0; padding-block: 1.5rem; border-top: 1px solid rgba(26,22,20,0.1); border-bottom: 1px solid rgba(26,22,20,0.1); }
    .about__stat { display: flex; flex-direction: column; gap: 0.2rem; }
    .about__stat-n { font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: 1.75rem; font-weight: 600; color: #c8a96e; line-height: 1; }
    .about__stat-l { font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.6rem; font-weight: 500; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(26,22,20,0.5); }
    .about__stat-divider { width: 1px; height: 38px; background: rgba(26,22,20,0.12); }
    .about__actions { display: flex; gap: 1rem; flex-wrap: wrap; }
    .about__cta { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.85rem 1.85rem; font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.68rem; font-weight: 600; letter-spacing: 0.28em; text-transform: uppercase; border-radius: 1px; text-decoration: none; cursor: pointer; position: relative; overflow: hidden; transition: color 0.3s, border-color 0.3s; }
    .about__cta--primary { background: #1a1614; color: #f5f1ea; border: 1px solid #1a1614;
      &::before { content: ''; position: absolute; inset: 0; background: #c8a96e; transform: scaleX(0); transform-origin: left; transition: transform 0.4s cubic-bezier(0.22,1,0.36,1); }
      &:hover { color: #1a1614; border-color: #c8a96e; } &:hover::before { transform: scaleX(1); }
      span { position: relative; z-index: 1; }
    }
    .about__cta--ghost { background: transparent; color: #1a1614; border: 1px solid rgba(26,22,20,0.25); &:hover { color: #c8a96e; border-color: #c8a96e; } }
    @media (max-width: 900px) {
      .about-wrap { padding-block: 3rem; }
      .about { grid-template-columns: 1fr; }
      .about__media { min-height: 380px; }
      .about__text { padding: 3rem 1.75rem; }
    }
    @media (prefers-reduced-motion: reduce) {
      .about__img, .about__text, .about__badge { animation: none !important; opacity: 1 !important; transform: none !important; }
    }
  `],
})
export class AboutComponent implements AfterViewInit {
  @ViewChild('sectionEl') sectionEl!: ElementRef;
  private auth   = inject(AuthService);
  private router = inject(Router);
  isVisible = false;

  ngAfterViewInit() {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { this.isVisible = true; observer.disconnect(); } },
      { threshold: 0.15 }
    );
    observer.observe(this.sectionEl.nativeElement);
  }

  onReservar() {
    if (this.auth.isLoggedIn()) {
      document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      this.router.navigate(['/auth']);
    }
  }
}