import {
  Component,
  OnInit,
  signal,
  AfterViewInit,
  ElementRef,
  ViewChild,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BarberService, Service } from '../../../../core/services/barber.service';
import { AuthService } from '../../../../core/services/auth.service';
import { BookingModalComponent } from '../../../booking/booking-modal.component';
import { Router } from '@angular/router';

// ─── Iconos por keyword ───────────────────────────────────────────────────────
const SERVICE_ICONS: { keywords: string[]; svg: string }[] = [
  {
    keywords: [
      'corte',
      'pelo',
      'cabello',
      'tijera',
      'clásico',
      'clasico',
      'degradado',
      'fade',
      'infantil',
    ],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/>
      <path d="M8.12 8.12L18 18"/><path d="M18 6L8.12 15.88"/>
    </svg>`,
  },
  {
    keywords: ['afeitado', 'navaja', 'rasurado', 'shave'],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 12 L17 5 L21 12 L17 19 Z"/>
      <path d="M17 5 L17 19" stroke-width="0.6" opacity="0.5"/>
      <rect x="1" y="10.5" width="4" height="3" rx="0.5"/>
    </svg>`,
  },
  {
    keywords: ['barba', 'beard', 'bigote', 'perfilado', 'arreglo'],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 4 C5 4 3 8 3 13 C3 17.5 7 21 12 21 C17 21 21 17.5 21 13 C21 8 19 4 19 4"/>
      <path d="M8 11 C9.5 13 14.5 13 16 11" stroke-width="0.8"/>
    </svg>`,
  },
  {
    keywords: ['pack', 'completo', 'combo', 'premium', 'novio'],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 17 L3 9 L7.5 13 L12 4 L16.5 13 L21 9 L21 17 Z"/>
      <path d="M3 17 L21 17" stroke-width="1.2"/>
    </svg>`,
  },
  {
    keywords: ['color', 'tinte', 'decoloración', 'mechas'],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2 L15 8 L21 9 L17 14 L18 20 L12 17 L6 20 L7 14 L3 9 L9 8 Z"/>
    </svg>`,
  },
];

const DEFAULT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="8" r="4"/>
  <path d="M6 20 C6 16.7 8.7 14 12 14 C15.3 14 18 16.7 18 20"/>
</svg>`;

@Component({
  selector: 'app-services-preview',
  standalone: true,
  imports: [CommonModule, BookingModalComponent],
  template: `
    <section class="sp-wrap" id="servicios" #sectionEl>
      <div class="container sp">
        <!-- Header -->
        <div class="sp__header">
          <div>
            <p class="sp__small">Servicios</p>
            <h2 class="sp__title">Nuestros <em>servicios</em></h2>
            <p class="sp__sub">
              <span class="sp__diamond"></span>
              Cortes, afeitados y barba — hechos con calma
            </p>
          </div>

          <!-- Flechas -->
          <div class="sp__nav">
            <button
              class="sp__arrow"
              (click)="prev()"
              [disabled]="currentIndex() === 0"
              aria-label="Anterior"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                width="18"
                height="18"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span class="sp__nav-count">{{ currentIndex() + 1 }} / {{ totalDots() }}</span>
            <button
              class="sp__arrow"
              (click)="next()"
              [disabled]="currentIndex() >= maxIndex()"
              aria-label="Siguiente"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                width="18"
                height="18"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Skeleton -->
        @if (loading()) {
          <div class="sp__grid-skeleton">
            @for (i of skeletons; track $index) {
              <div class="sp__skeleton"></div>
            }
          </div>
        }

        <!-- Slider -->
        @if (!loading() && services().length) {
          <div class="sp__track-wrap">
            <div
              class="sp__track"
              [style.transform]="'translateX(-' + trackOffset() + 'px)'"
              (mousedown)="onDragStart($event)"
              (touchstart)="onTouchStart($event)"
              (touchend)="onTouchEnd($event)"
            >
              @for (service of services(); track service.id; let i = $index) {
                <article class="sp__card">
                  <div class="sp__card-icon" [innerHTML]="getSafeIcon(service.name)"></div>
                  <h3 class="sp__card-name">{{ service.name }}</h3>
                  <p class="sp__card-desc">{{ service.description }}</p>
                  <div class="sp__card-divider"></div>
                  <div class="sp__card-footer">
                    <div class="sp__card-meta">
                      <span class="sp__card-price">{{
                        service.price | currency: 'EUR' : 'symbol' : '1.0-0'
                      }}</span>
                      <span class="sp__card-duration">{{ service.duration_min }} min</span>
                    </div>
                    <button class="sp__card-btn" (click)="onReservar(service)">
                      <span>Reservar</span>
                    </button>
                  </div>
                </article>
              }
            </div>
          </div>

          <!-- Dots -->
          <div class="sp__dots">
            @for (dot of dotsArray(); track $index) {
              <button
                class="sp__dot"
                [class.active]="$index === currentIndex()"
                (click)="goTo($index)"
              ></button>
            }
          </div>
        }
      </div>
    </section>

    <!-- Modal de reserva -->
    @if (bookingService()) {
      <app-booking-modal [service]="bookingService()!" (close)="closeBooking()" />
    }
  `,
  styles: [
    `
      @keyframes shimmer {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }

      /* ─── Wrapper crema ─── */
      .sp-wrap {
        background: #f5f1ea;
        padding-block: 6rem;
        position: relative;
        overflow: hidden;
      }

      .sp {
        max-width: 1400px;
        margin: 0 auto;
      }

      /* ─── Header ─── */
      .sp__header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        margin-bottom: 3rem;
        gap: 1.5rem;
        flex-wrap: wrap;
      }
      .sp__small {
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.62rem;
        font-weight: 600;
        letter-spacing: 0.32em;
        text-transform: uppercase;
        color: #c8a96e;
        margin-bottom: 1rem;
      }
      .sp__title {
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: clamp(2rem, 4vw, 3rem);
        font-weight: 500;
        color: #1a1614;
        line-height: 1.1;
        letter-spacing: 0.01em;
        margin-bottom: 1rem;
      }
      .sp__title em {
        color: #c8a96e;
        font-style: italic;
        font-weight: 600;
      }

      .sp__sub {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: 1rem;
        font-style: italic;
        color: rgba(26, 22, 20, 0.55);
      }
      .sp__diamond {
        width: 5px;
        height: 5px;
        background: #c8a96e;
        transform: rotate(45deg);
        flex-shrink: 0;
      }

      /* ─── Flechas + contador ─── */
      .sp__nav {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .sp__arrow {
        width: 42px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: 1px solid rgba(26, 22, 20, 0.2);
        color: #1a1614;
        cursor: pointer;
        border-radius: 1px;
        transition: all 0.25s;
      }
      .sp__arrow:hover:not(:disabled) {
        background: #1a1614;
        color: #c8a96e;
        border-color: #1a1614;
      }
      .sp__arrow:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .sp__nav-count {
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: 0.85rem;
        font-style: italic;
        color: rgba(26, 22, 20, 0.5);
        min-width: 42px;
        text-align: center;
        letter-spacing: 0.05em;
      }

      /* ─── Track ─── */
      .sp__track-wrap {
        overflow: hidden;
      }
      .sp__track {
        display: flex;
        gap: 1.5rem;
        transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        cursor: grab;
      }
      .sp__track:active {
        cursor: grabbing;
      }

      /* ─── Card ─── */
      .sp__card {
        background: #ffffff;
        padding: 2.25rem 1.75rem 1.75rem;
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        position: relative;
        transition:
          transform 0.35s ease,
          box-shadow 0.35s ease;
        border: 1px solid rgba(26, 22, 20, 0.06);
      }
      .sp__card:hover {
        transform: translateY(-6px);
        box-shadow: 0 16px 40px rgba(26, 22, 20, 0.08);
      }
      .sp__card:hover .sp__card-icon {
        background: #c8a96e;
        color: #ffffff;
        border-color: #c8a96e;
      }

      /* Icono circular dorado */
      .sp__card-icon {
        width: 56px;
        height: 56px;
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(200, 169, 110, 0.4);
        border-radius: 50%;
        color: #c8a96e;
        background: #f5f1ea;
        transition: all 0.35s;
      }
      .sp__card-icon ::ng-deep svg {
        width: 26px;
        height: 26px;
      }

      .sp__card-name {
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: 1.3rem;
        font-weight: 600;
        color: #1a1614;
        margin-bottom: 0.6rem;
        line-height: 1.2;
        letter-spacing: 0.01em;
      }
      .sp__card-desc {
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.82rem;
        color: rgba(26, 22, 20, 0.55);
        line-height: 1.7;
        flex: 1;
        margin-bottom: 1.25rem;
      }

      /* Separador estilo ornamento */
      .sp__card-divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(200, 169, 110, 0.4), transparent);
        margin-bottom: 1.25rem;
      }

      .sp__card-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }
      .sp__card-meta {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      }
      .sp__card-price {
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: 1.4rem;
        font-weight: 600;
        color: #c8a96e;
        line-height: 1;
        letter-spacing: 0.02em;
      }
      .sp__card-duration {
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.62rem;
        font-weight: 500;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: rgba(26, 22, 20, 0.45);
      }

      .sp__card-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.7rem 1.3rem;
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.62rem;
        font-weight: 600;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        background: transparent;
        color: #1a1614;
        border: 1px solid #1a1614;
        border-radius: 1px;
        cursor: pointer;
        white-space: nowrap;
        position: relative;
        overflow: hidden;
        transition:
          color 0.3s,
          border-color 0.3s;
        flex-shrink: 0;
      }
      .sp__card-btn::before {
        content: '';
        position: absolute;
        inset: 0;
        background: #c8a96e;
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .sp__card-btn:hover {
        color: #1a1614;
        border-color: #c8a96e;
      }
      .sp__card-btn:hover::before {
        transform: scaleX(1);
      }
      .sp__card-btn span {
        position: relative;
        z-index: 1;
      }

      /* ─── Dots ─── */
      .sp__dots {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 2.5rem;
      }
      .sp__dot {
        width: 24px;
        height: 2px;
        border: none;
        cursor: pointer;
        background: rgba(26, 22, 20, 0.15);
        transition: all 0.3s;
        padding: 0;
      }
      .sp__dot.active {
        background: #c8a96e;
        width: 36px;
      }
      .sp__dot:hover:not(.active) {
        background: rgba(26, 22, 20, 0.3);
      }

      /* ─── Skeleton ─── */
      .sp__grid-skeleton {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 1.5rem;
      }
      .sp__skeleton {
        height: 280px;
        background: #ffffff;
        border: 1px solid rgba(26, 22, 20, 0.06);
        position: relative;
        overflow: hidden;
      }
      .sp__skeleton::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, transparent, rgba(200, 169, 110, 0.08), transparent);
        animation: shimmer 1.8s infinite;
      }

      /* ─── Anchos de card responsive ─── */
      @media (min-width: 1024px) {
        .sp__card {
          width: calc((100% - 3rem) / 3);
        }
      }
      @media (min-width: 640px) and (max-width: 1023px) {
        .sp__card {
          width: calc((100% - 1.5rem) / 2);
        }
      }
      @media (max-width: 639px) {
        .sp-wrap {
          padding-block: 4rem;
        }
        .sp__card {
          width: 100%;
        }
        .sp__header {
          gap: 1rem;
        }
        .sp__nav-count {
          font-size: 0.78rem;
        }
        .sp__arrow {
          width: 38px;
          height: 38px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .sp__track {
          transition: none;
        }
        .sp__card {
          transition: none;
        }
      }
    `,
  ],
})
export class ServicesPreviewComponent implements OnInit, AfterViewInit {
  @ViewChild('sectionEl') sectionEl!: ElementRef;

  private auth = inject(AuthService);
  private sanitizer = inject(DomSanitizer);
  private barberSvc = inject(BarberService);
  private router = inject(Router);

  services = signal<Service[]>([]);
  loading = signal(true);
  skeletons = Array(4);
  currentIndex = signal(0);
  bookingService = signal<Service | null>(null);

  private iconCache = new Map<string, SafeHtml>();
  private cardWidth = 0;
  private gapSize = 24; // 1.5rem en px
  private visibleCards = 3;
  private touchStartX = 0;

  maxIndex = () => Math.max(0, this.services().length - this.visibleCards);
  totalDots = () => this.maxIndex() + 1;
  dotsArray = () => Array(this.totalDots());
  trackOffset = () => this.currentIndex() * (this.cardWidth + this.gapSize);

  ngOnInit() {
    this.barberSvc.getAll().subscribe({
      next: (d) => {
        this.services.set(d);
        this.loading.set(false);
        this.updateDimensions();
        // Recuperar intención de reserva tras login
        const pendingId = sessionStorage.getItem('open_booking_service');
        if (pendingId) {
          sessionStorage.removeItem('open_booking_service');
          const service = d.find((s) => s.id === Number(pendingId));
          if (service) setTimeout(() => this.bookingService.set(service), 300);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  ngAfterViewInit() {
    this.updateDimensions();
  }

  @HostListener('window:resize')
  updateDimensions() {
    const containerWidth = Math.min(window.innerWidth - 48, 1400);
    if (window.innerWidth >= 1024) {
      this.visibleCards = 3;
      this.cardWidth = (containerWidth - this.gapSize * 2) / 3;
    } else if (window.innerWidth >= 640) {
      this.visibleCards = 2;
      this.cardWidth = (containerWidth - this.gapSize) / 2;
    } else {
      this.visibleCards = 1;
      this.cardWidth = containerWidth;
    }
    const max = this.maxIndex();
    if (this.currentIndex() > max) this.currentIndex.set(max);
  }

  prev() {
    if (this.currentIndex() > 0) this.currentIndex.update((i) => i - 1);
  }
  next() {
    if (this.currentIndex() < this.maxIndex()) this.currentIndex.update((i) => i + 1);
  }
  goTo(i: number) {
    this.currentIndex.set(i);
  }

  onDragStart(e: MouseEvent) {
    const startX = e.clientX;
    const onMove = (m: MouseEvent) => {
      const diff = startX - m.clientX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? this.next() : this.prev();
        document.removeEventListener('mousemove', onMove);
      }
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', () => document.removeEventListener('mousemove', onMove), {
      once: true,
    });
  }

  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.touches[0].clientX;
  }
  onTouchEnd(e: TouchEvent) {
    const diff = this.touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? this.next() : this.prev();
  }

  onReservar(service: Service) {
    if (this.auth.isLoggedIn()) {
      this.bookingService.set(service);
    } else {
      sessionStorage.setItem(
        'booking_intent',
        JSON.stringify({
          serviceId: service.id,
          serviceName: service.name,
        }),
      );
      sessionStorage.setItem('open_booking_service', service.id.toString());
      this.router.navigate(['/auth']);
    }
  }

  closeBooking() {
    this.bookingService.set(null);
  }

  getSafeIcon(name: string): SafeHtml {
    if (this.iconCache.has(name)) return this.iconCache.get(name)!;
    const lower = name.toLowerCase();
    const match = SERVICE_ICONS.find(({ keywords }) => keywords.some((kw) => lower.includes(kw)));
    const safe = this.sanitizer.bypassSecurityTrustHtml(match ? match.svg : DEFAULT_ICON);
    this.iconCache.set(name, safe);
    return safe;
  }
}
