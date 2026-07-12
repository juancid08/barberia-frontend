import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BarberService, Service } from '../../core/services/barber.service';
import { BookingModalComponent } from '../booking/booking-modal.component';
import { ServicesPreviewComponent } from '../home/components/services-preview/services.preview.component';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, BookingModalComponent, ServicesPreviewComponent],
  template: `
    <!-- ── Hero ── -->
    <section class="svc-hero">
      <div class="svc-hero__bg-grid"></div>
      <div class="container svc-hero__content">
        <p class="label">Lo que ofrecemos</p>
        <h1 class="svc-hero__title">Nuestros<br><em>servicios</em></h1>
        <p class="svc-hero__sub">
          Cada servicio es ejecutado con los mejores productos
          y la precisión que mereces.
        </p>
      </div>
      <div class="svc-hero__line"></div>
    </section>

    <!-- ── Slider reutilizado del home ── -->
    <app-services-preview />

    <!-- ── Modal de reserva ── -->
    @if (bookingService()) {
      <app-booking-modal
        [service]="bookingService()!"
        (close)="closeBooking()" />
    }
  `,
  styles: [`
    .svc-hero {
      position: relative;
      padding-top: calc(var(--navbar-height) + 5rem);
      padding-bottom: 5rem;
      overflow: hidden;
    }
    .svc-hero__bg-grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(var(--color-border) 1px, transparent 1px),
        linear-gradient(90deg, var(--color-border) 1px, transparent 1px);
      background-size: 80px 80px; opacity: 0.2;
      mask-image: radial-gradient(ellipse 70% 90% at 20% 50%, black 30%, transparent 100%);
    }
    .svc-hero__content { position: relative; z-index: 1; }
    .label {
      display: block; margin-bottom: 1.25rem;
      font-size: var(--size-xs); font-weight: 500; letter-spacing: 0.2em;
      text-transform: uppercase; color: var(--color-accent);
    }
    .svc-hero__title {
      font-family: var(--font-display);
      font-size: clamp(3rem, 8vw, 6rem);
      font-weight: 300; line-height: 1.05;
      color: var(--color-text); letter-spacing: -0.02em; margin-bottom: 1.5rem;
      em { font-style: italic; color: var(--color-accent); }
    }
    .svc-hero__sub {
      font-size: var(--size-lg); color: var(--color-muted);
      line-height: 1.7; max-width: 480px;
    }
    .svc-hero__line {
      position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(to right, transparent, var(--color-accent) 30%, var(--color-accent) 70%, transparent);
      opacity: 0.4;
    }
  `]
})
export class ServicesComponent implements OnInit {
  bookingService = signal<Service | null>(null);
  private barberSvc = inject(BarberService);

  ngOnInit() {}

  openBooking(service: Service) { this.bookingService.set(service); }
  closeBooking()                { this.bookingService.set(null); }
}