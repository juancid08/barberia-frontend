import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [],
  template: `
    <!-- ══ TODO en un solo wrapper crema ══ -->
    <section class="ct-wrap">
      <!-- Hero crema integrado -->
      <div class="container ct-hero">
        <p class="ct-hero__small">Contacto</p>
        <h1 class="ct-hero__title">
          Visítanos<br />
          <em>cuando quieras</em>
        </h1>
        <p class="ct-hero__sub">
          <span class="ct-hero__diamond"></span>
          La Viñuela, Málaga · Axarquía
        </p>
      </div>

      <!-- Grid info + mapa -->
      <div class="container ct-grid">
        <!-- Info -->
        <div class="ct-info">
          <!-- Dirección -->
          <div class="ct-block">
            <p class="ct-block__label">Dirección</p>
            <div class="ct-block__row">
              <div class="ct-block__icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  width="18"
                  height="18"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <p class="ct-block__text">
                La Viñuela<br />
                <span class="ct-block__muted">29714 Málaga · España</span>
              </p>
            </div>
          </div>

          <!-- Horario -->
          <div class="ct-block">
            <p class="ct-block__label">Horario</p>
            <ul class="ct-schedule">
              <li>
                <span class="ct-schedule__day">Lunes – Viernes</span>
                <span class="ct-schedule__hours">09:00 – 20:00</span>
              </li>
              <li>
                <span class="ct-schedule__day">Sábado</span>
                <span class="ct-schedule__hours">09:00 – 15:00</span>
              </li>
              <li class="ct-schedule--closed">
                <span class="ct-schedule__day">Domingo</span>
                <span class="ct-schedule__hours">Cerrado</span>
              </li>
            </ul>
          </div>

          <!-- Contacto -->
          <div class="ct-block">
            <p class="ct-block__label">Contacto</p>
            <div class="ct-contacts">
              <a href="tel:+34600000000" class="ct-contact">
                <span class="ct-contact__icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    width="14"
                    height="14"
                  >
                    <path
                      d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
                    />
                  </svg>
                </span>
                <span class="ct-contact__text">+34 600 000 000</span>
              </a>

              <a href="https://wa.me/34600000000" target="_blank" rel="noopener" class="ct-contact">
                <span class="ct-contact__icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    width="14"
                    height="14"
                  >
                    <path
                      d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
                    />
                  </svg>
                </span>
                <span class="ct-contact__text">WhatsApp directo</span>
              </a>

              <a
                href="https://instagram.com/hg.barberr"
                target="_blank"
                rel="noopener"
                class="ct-contact"
              >
                <span class="ct-contact__icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    width="14"
                    height="14"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                  </svg>
                </span>
                <span class="ct-contact__text">&#64;hg.barberr</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Mapa -->
        <div class="ct-map">
          <iframe
            [src]="mapUrl"
            width="100%"
            height="100%"
            style="border:0;"
            allowfullscreen=""
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            title="Ubicación HG Barber — La Viñuela, Málaga"
          >
          </iframe>

          <!-- Badge sobre el mapa -->
          <div class="ct-map__badge">
            <div class="ct-map__badge-line"></div>
            <span class="ct-map__badge-text">Encuéntranos</span>
            <div class="ct-map__badge-line"></div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      /* ══ WRAPPER CREMA ÚNICO ══ */
      .ct-wrap {
        background: #f5f1ea;
        padding-top: calc(var(--navbar-height) + 5rem);
        padding-bottom: 6rem;
      }

      /* ══ HERO integrado en crema ══ */
      .ct-hero {
        padding-bottom: 4rem;
        border-bottom: 1px solid rgba(200, 169, 110, 0.18);
        margin-bottom: 4rem;
      }

      .ct-hero__small {
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.62rem;
        font-weight: 600;
        letter-spacing: 0.32em;
        text-transform: uppercase;
        color: #c8a96e;
        margin-bottom: 1.5rem;
      }

      .ct-hero__title {
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: clamp(2.8rem, 7vw, 5.5rem);
        font-weight: 500;
        line-height: 1.05;
        letter-spacing: 0.01em;
        color: #1a1614;
        margin-bottom: 1.5rem;
      }
      .ct-hero__title em {
        color: #c8a96e;
        font-style: italic;
        font-weight: 600;
      }

      .ct-hero__sub {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: 1.1rem;
        font-style: italic;
        color: rgba(26, 22, 20, 0.55);
      }
      .ct-hero__diamond {
        width: 5px;
        height: 5px;
        background: #c8a96e;
        transform: rotate(45deg);
        flex-shrink: 0;
      }

      /* ══ GRID ══ */
      .ct-grid {
        display: grid;
        grid-template-columns: 360px 1fr;
        gap: 4rem;
        align-items: start;
      }

      @media (max-width: 900px) {
        .ct-grid {
          grid-template-columns: 1fr;
          gap: 3rem;
        }
        .ct-wrap {
          padding-top: calc(var(--navbar-height) + 3rem);
          padding-bottom: 4rem;
        }
        .ct-hero {
          margin-bottom: 3rem;
          padding-bottom: 2.5rem;
        }
      }

      /* ══ INFO ══ */
      .ct-info {
        display: flex;
        flex-direction: column;
        gap: 2.5rem;
      }

      .ct-block {
      }

      .ct-block__label {
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.6rem;
        font-weight: 600;
        letter-spacing: 0.32em;
        text-transform: uppercase;
        color: #c8a96e;
        margin-bottom: 1.25rem;
        padding-bottom: 0.85rem;
        border-bottom: 1px solid rgba(200, 169, 110, 0.25);
      }

      .ct-block__row {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
      }
      .ct-block__icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(200, 169, 110, 0.4);
        border-radius: 50%;
        color: #c8a96e;
        background: #ffffff;
        flex-shrink: 0;
      }
      .ct-block__text {
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: 1.3rem;
        font-weight: 500;
        color: #1a1614;
        line-height: 1.4;
      }
      .ct-block__muted {
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.78rem;
        font-weight: 400;
        color: rgba(26, 22, 20, 0.5);
        letter-spacing: 0.02em;
      }

      /* Horario */
      .ct-schedule {
        list-style: none;
        display: flex;
        flex-direction: column;
      }
      .ct-schedule li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-block: 0.85rem;
        border-bottom: 1px solid rgba(26, 22, 20, 0.08);
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.85rem;
      }
      .ct-schedule li:last-child {
        border-bottom: none;
      }
      .ct-schedule__day {
        color: #1a1614;
        font-weight: 500;
        letter-spacing: 0.02em;
      }
      .ct-schedule__hours {
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: 0.95rem;
        font-style: italic;
        color: #c8a96e;
        font-weight: 600;
      }
      .ct-schedule--closed .ct-schedule__hours {
        color: rgba(26, 22, 20, 0.35);
        font-weight: 400;
      }

      /* Contactos */
      .ct-contacts {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .ct-contact {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        padding: 0.7rem 0;
        text-decoration: none;
        transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .ct-contact:hover {
        transform: translateX(4px);
      }
      .ct-contact:hover .ct-contact__icon {
        background: #c8a96e;
        color: #ffffff;
        border-color: #c8a96e;
      }
      .ct-contact:hover .ct-contact__text {
        color: #c8a96e;
      }

      .ct-contact__icon {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(200, 169, 110, 0.35);
        border-radius: 50%;
        color: #c8a96e;
        background: #ffffff;
        flex-shrink: 0;
        transition: all 0.3s;
      }
      .ct-contact__text {
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.85rem;
        font-weight: 500;
        color: #1a1614;
        letter-spacing: 0.02em;
        transition: color 0.3s;
      }

      /* ══ MAPA ══ */
      .ct-map {
        position: relative;
        height: 560px;
        overflow: hidden;
        border: 1px solid rgba(200, 169, 110, 0.2);
        background: #ffffff;
        filter: grayscale(15%) contrast(1.05);
        box-shadow: 0 20px 50px rgba(26, 22, 20, 0.08);
      }
      .ct-map iframe {
        display: block;
        width: 100%;
        height: 100%;
      }

      .ct-map__badge {
        position: absolute;
        top: 1.5rem;
        left: 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.6rem 1.1rem;
        background: rgba(26, 22, 20, 0.92);
        border: 1px solid rgba(200, 169, 110, 0.4);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 1;
      }
      .ct-map__badge-line {
        width: 14px;
        height: 1px;
        background: #c8a96e;
      }
      .ct-map__badge-text {
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: 0.78rem;
        font-weight: 500;
        font-style: italic;
        letter-spacing: 0.18em;
        color: #c8a96e;
      }

      @media (max-width: 900px) {
        .ct-map {
          height: 380px;
        }
        .ct-map__badge {
          top: 1rem;
          left: 1rem;
          padding: 0.5rem 0.9rem;
        }
        .ct-map__badge-text {
          font-size: 0.7rem;
        }
      }
    `,
  ],
})
export class ContactComponent {
  mapUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://maps.google.com/maps?q=36.865999,-4.142888&z=16&output=embed',
    );
  }
}
