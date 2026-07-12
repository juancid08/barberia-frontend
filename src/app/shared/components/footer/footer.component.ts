import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="container footer__inner">
        <!-- Columna 1: Marca + Tagline -->
        <div class="footer__brand">
          <a routerLink="/" class="footer__logo">
            <div class="footer__logo-orn">
              <div class="footer__logo-rule"></div>
              <div class="footer__logo-diamond"></div>
              <div class="footer__logo-rule"></div>
            </div>
            <div class="footer__logo-main">
              <span class="footer__logo-hg">H.G.</span>
              <span class="footer__logo-barber">Barber</span>
            </div>
            <span class="footer__logo-sub">Est. 2023 · La Viñuela</span>
          </a>
          <p class="footer__tagline">
            <span class="footer__diamond"></span>
            Precisión y oficio,<br />en cada detalle.
          </p>
          <div class="footer__socials">
            <a
              href="https://www.instagram.com/hg.barberr"
              target="_blank"
              rel="noopener"
              class="footer__social"
              aria-label="Instagram"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                width="15"
                height="15"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
              </svg>
            </a>
            <a
              href="https://wa.me/34600000000"
              target="_blank"
              rel="noopener"
              class="footer__social"
              aria-label="WhatsApp"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                width="15"
                height="15"
              >
                <path
                  d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
                />
              </svg>
            </a>
            <a
              href="https://facebook.com/hgbarber"
              target="_blank"
              rel="noopener"
              class="footer__social"
              aria-label="Facebook"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                <path
                  d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"
                />
              </svg>
            </a>
          </div>
        </div>

        <!-- Columna 2: Navegación -->
        <div class="footer__col">
          <p class="footer__col-title">Navegación</p>
          <nav class="footer__nav">
            <a routerLink="/" class="footer__link">Inicio</a>
            <a routerLink="/sobre-nosotros" class="footer__link">Sobre nosotros</a>
            <a routerLink="/servicios" class="footer__link">Servicios</a>
            <a routerLink="/contacto" class="footer__link">Contacto</a>
            <a routerLink="/auth" class="footer__link">Reservar cita</a>
          </nav>
        </div>

        <!-- Columna 3: Contacto -->
        <div class="footer__col">
          <p class="footer__col-title">Contacto</p>
          <div class="footer__info">
            <div class="footer__info-line">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                width="14"
                height="14"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>La Viñuela, Málaga</span>
            </div>
            <div class="footer__info-line">
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
              <a href="tel:+34600000000">+34 600 000 000</a>
            </div>
            <div class="footer__info-line">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                width="14"
                height="14"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Lun – Vie: 09:00 – 20:00</span>
            </div>
            <p class="footer__info-muted">Sáb: 09:00 – 15:00 · Dom: Cerrado</p>
          </div>
        </div>
      </div>

      <!-- Bottom -->
      <div class="footer__bottom">
        <div class="container footer__bottom-inner">
          <p class="footer__copy">© {{ year }} H.G. Barber · Todos los derechos reservados</p>
          <p class="footer__copy">La Viñuela, Málaga · España</p>
        </div>
      </div>
    </footer>
  `,
  styles: [
    `
      /* ─── Base ─── */
      .footer {
        background: #1a1614;
        color: rgba(245, 241, 234, 0.6);
        position: relative;
      }

      /* Línea dorada superior */
      .footer::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(200, 169, 110, 0.5) 50%, transparent);
      }

      /* ─── Inner ─── */
      .footer__inner {
        display: grid;
        grid-template-columns: 1.4fr 1fr 1.2fr;
        gap: 4rem;
        padding-block: 4.5rem 3.5rem;
      }

      /* ─── Brand ─── */
      .footer__brand {
      }

      .footer__logo {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        text-decoration: none;
        margin-bottom: 1.5rem;
        cursor: pointer;
      }
      .footer__logo:hover .footer__logo-hg {
        text-shadow: 0 0 14px rgba(200, 169, 110, 0.5);
      }
      .footer__logo:hover .footer__logo-diamond {
        transform: rotate(225deg);
      }

      .footer__logo-orn {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 2px;
      }
      .footer__logo-rule {
        width: 26px;
        height: 1px;
        background: linear-gradient(90deg, transparent, #c8a96e, transparent);
      }
      .footer__logo-diamond {
        width: 5px;
        height: 5px;
        background: #c8a96e;
        transform: rotate(45deg);
        flex-shrink: 0;
        transition: transform 1.2s linear;
      }
      .footer__logo-main {
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: 1.6rem;
        font-weight: 500;
        letter-spacing: 0.06em;
        line-height: 1;
        display: flex;
        align-items: baseline;
        gap: 0.35rem;
      }
      .footer__logo-hg {
        color: #c8a96e;
        font-style: italic;
        transition: text-shadow 0.3s;
      }
      .footer__logo-barber {
        color: #f5f1ea;
      }
      .footer__logo-sub {
        font-size: 0.55rem;
        font-weight: 500;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: rgba(245, 241, 234, 0.4);
      }

      /* Tagline */
      .footer__tagline {
        display: flex;
        align-items: flex-start;
        gap: 0.6rem;
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: 0.95rem;
        font-style: italic;
        color: rgba(245, 241, 234, 0.55);
        line-height: 1.7;
        margin-bottom: 1.5rem;
      }
      .footer__diamond {
        width: 5px;
        height: 5px;
        background: #c8a96e;
        transform: rotate(45deg);
        flex-shrink: 0;
        margin-top: 9px;
      }

      /* Sociales */
      .footer__socials {
        display: flex;
        gap: 0.6rem;
      }
      .footer__social {
        width: 36px;
        height: 36px;
        border-radius: 1px;
        border: 1px solid rgba(200, 169, 110, 0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(200, 169, 110, 0.6);
        text-decoration: none;
        transition: all 0.3s;
      }
      .footer__social:hover {
        border-color: #c8a96e;
        color: #1a1614;
        background: #c8a96e;
        transform: translateY(-2px);
      }

      /* ─── Columnas ─── */
      .footer__col {
      }

      .footer__col-title {
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.6rem;
        font-weight: 600;
        letter-spacing: 0.32em;
        text-transform: uppercase;
        color: #c8a96e;
        margin-bottom: 1.5rem;
      }

      /* Nav */
      .footer__nav {
        display: flex;
        flex-direction: column;
      }
      .footer__link {
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.78rem;
        font-weight: 400;
        color: rgba(245, 241, 234, 0.5);
        text-decoration: none;
        padding: 0.4rem 0;
        position: relative;
        display: inline-block;
        transition:
          color 0.25s,
          transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        letter-spacing: 0.04em;
      }
      .footer__link::before {
        content: '';
        position: absolute;
        left: -14px;
        top: 50%;
        width: 6px;
        height: 1px;
        background: #c8a96e;
        opacity: 0;
        transform: translateY(-50%);
        transition:
          opacity 0.25s,
          left 0.3s;
      }
      .footer__link:hover {
        color: #c8a96e;
        transform: translateX(4px);
      }
      .footer__link:hover::before {
        opacity: 1;
        left: -10px;
      }

      /* Info contacto */
      .footer__info {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }
      .footer__info-line {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.78rem;
        color: rgba(245, 241, 234, 0.55);
        letter-spacing: 0.02em;
        padding-block: 0.3rem;
        transition: color 0.25s;
      }
      .footer__info-line svg {
        color: rgba(200, 169, 110, 0.6);
        flex-shrink: 0;
      }
      .footer__info-line a {
        color: inherit;
        text-decoration: none;
        transition: color 0.25s;
      }
      .footer__info-line a:hover {
        color: #c8a96e;
      }

      .footer__info-muted {
        font-size: 0.68rem;
        color: rgba(245, 241, 234, 0.3);
        padding-left: 22px;
        letter-spacing: 0.02em;
        margin-top: 0.2rem;
      }

      /* ─── Bottom ─── */
      .footer__bottom {
        border-top: 1px solid rgba(200, 169, 110, 0.1);
        padding-block: 1.5rem;
      }
      .footer__bottom-inner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .footer__copy {
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.7rem;
        color: rgba(245, 241, 234, 0.3);
        letter-spacing: 0.05em;
      }

      /* ─── Responsive ─── */
      @media (max-width: 900px) {
        .footer__inner {
          grid-template-columns: 1fr 1fr;
          gap: 3rem 2.5rem;
          padding-block: 3.5rem 2.5rem;
        }
        .footer__brand {
          grid-column: 1 / -1;
        }
      }

      @media (max-width: 580px) {
        .footer__inner {
          grid-template-columns: 1fr;
          gap: 2.5rem;
          padding-block: 3rem 2rem;
        }
        .footer__bottom-inner {
          flex-direction: column;
          text-align: center;
        }
      }
    `,
  ],
})
export class FooterComponent {
  year = new Date().getFullYear();
}
