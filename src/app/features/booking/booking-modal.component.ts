import { Component, Input, Output, EventEmitter, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Service } from '../../core/services/barber.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

type Step = 'datetime' | 'confirm' | 'success';

interface BlockedSlot {
  id:         number;
  all_day:    boolean;
  start_time: string | null;
  end_time:   string | null;
  reason:     string | null;
}

@Component({
  selector: 'app-booking-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bm__overlay" (click)="onOverlayClick($event)">
      <div class="bm__modal">

        <!-- ── Header ── -->
        <div class="bm__header">
          <div>
            <p class="bm__service-name">{{ service.name }}</p>
            <p class="bm__service-meta">
              {{ service.price | currency:'EUR':'symbol':'1.0-0' }} · {{ service.duration_min }} min
            </p>
          </div>
          <button class="bm__close" (click)="close.emit()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- ── Stepper ── -->
        @if (step() !== 'success') {
          <div class="bm__steps">
            <div class="bm__step" [class.active]="step() === 'datetime'" [class.done]="step() === 'confirm'">
              <span class="bm__step-n">1</span>
              <span class="bm__step-l">Fecha y hora</span>
            </div>
            <div class="bm__step-line"></div>
            <div class="bm__step" [class.active]="step() === 'confirm'">
              <span class="bm__step-n">2</span>
              <span class="bm__step-l">Confirmar</span>
            </div>
          </div>
        }

        <!-- ══ PASO 1: Fecha y hora ══ -->
        @if (step() === 'datetime') {
          <div class="bm__body">

            <!-- Selector de fecha -->
            <div class="bm__section">
              <p class="bm__section-title">Selecciona una fecha</p>
              <div class="bm__calendar">
                <div class="bm__cal-header">
                  <button class="bm__cal-nav" (click)="prevMonth()" [disabled]="!canGoPrev()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                  </button>
                  <span class="bm__cal-month">{{ monthLabel() }}</span>
                  <button class="bm__cal-nav" (click)="nextMonth()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                </div>
                <div class="bm__cal-weekdays">
                  @for (d of weekdays; track d) { <span>{{ d }}</span> }
                </div>
                <div class="bm__cal-grid">
                  @for (cell of calendarCells(); track $index) {
                    @if (cell === null) {
                      <span></span>
                    } @else {
                      <button
                        class="bm__cal-day"
                        [class.selected]="selectedDate() === cell.iso"
                        [class.today]="cell.isToday"
                        [disabled]="cell.disabled"
                        (click)="selectDate(cell.iso)">
                        {{ cell.day }}
                      </button>
                    }
                  }
                </div>
              </div>
            </div>

            <!-- Mensaje día bloqueado -->
            @if (dayBlockedMsg()) {
              <div class="bm__blocked-day">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                </svg>
                <p>{{ dayBlockedMsg() }}</p>
              </div>
            }

            <!-- Selector de hora -->
            @if (selectedDate() && !dayBlockedMsg()) {
              <div class="bm__section">
                <p class="bm__section-title">Selecciona una hora</p>
                @if (loadingSlots()) {
                  <p class="bm__slots-loading">Cargando disponibilidad...</p>
                } @else if (slots().length === 0) {
                  <p class="bm__slots-empty">No hay horas disponibles para este día.</p>
                } @else {
                  <div class="bm__slots">
                    @for (slot of slots(); track slot) {
                      <button
                        class="bm__slot"
                        [class.selected]="selectedTime() === slot"
                        (click)="selectedTime.set(slot)">
                        {{ slot }}
                      </button>
                    }
                  </div>
                }
              </div>
            }

            <!-- Notas opcionales -->
            @if (selectedTime()) {
              <div class="bm__section">
                <p class="bm__section-title">Notas <span class="bm__optional">(opcional)</span></p>
                <textarea class="bm__notes" [(ngModel)]="notes" rows="2"
                          placeholder="¿Algún detalle que quieras comentar?"></textarea>
              </div>
            }

          </div>

          <div class="bm__footer">
            <button class="btn-ghost" (click)="close.emit()">Cancelar</button>
            <button class="btn-primary" [disabled]="!selectedDate() || !selectedTime()"
                    (click)="goToConfirm()">
              Continuar
            </button>
          </div>
        }

        <!-- ══ PASO 2: Confirmar ══ -->
        @if (step() === 'confirm') {
          <div class="bm__body">

            @if (!isLoggedIn()) {
              <div class="bm__login-prompt">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="40" height="40">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <p class="bm__login-title">Inicia sesión para confirmar</p>
                <p class="bm__login-sub">Necesitas una cuenta para reservar tu cita.</p>
                <button class="btn-primary bm__login-btn" (click)="goToAuth()">
                  Iniciar sesión / Registrarse
                </button>
              </div>
            } @else {
              <div class="bm__summary">
                <p class="bm__section-title">Resumen de tu reserva</p>
                <div class="bm__summary-grid">
                  <div class="bm__summary-item">
                    <span class="bm__summary-label">Servicio</span>
                    <span class="bm__summary-value">{{ service.name }}</span>
                  </div>
                  <div class="bm__summary-item">
                    <span class="bm__summary-label">Fecha</span>
                    <span class="bm__summary-value">{{ formattedDate() }}</span>
                  </div>
                  <div class="bm__summary-item">
                    <span class="bm__summary-label">Hora</span>
                    <span class="bm__summary-value">{{ selectedTime() }}</span>
                  </div>
                  <div class="bm__summary-item">
                    <span class="bm__summary-label">Duración</span>
                    <span class="bm__summary-value">{{ service.duration_min }} min</span>
                  </div>
                  <div class="bm__summary-item">
                    <span class="bm__summary-label">Precio</span>
                    <span class="bm__summary-value bm__price">
                      {{ service.price | currency:'EUR':'symbol':'1.0-0' }}
                    </span>
                  </div>
                </div>
                @if (notes) {
                  <div class="bm__summary-notes">
                    <span class="bm__summary-label">Notas</span>
                    <p>{{ notes }}</p>
                  </div>
                }
              </div>
              @if (bookingError()) {
                <p class="bm__error">{{ bookingError() }}</p>
              }
            }
          </div>

          <div class="bm__footer">
            <button class="btn-ghost" (click)="step.set('datetime')">Atrás</button>
            @if (isLoggedIn()) {
              <button class="btn-primary" (click)="confirmBooking()" [disabled]="booking()">
                {{ booking() ? 'Reservando...' : 'Confirmar reserva' }}
              </button>
            }
          </div>
        }

        <!-- ══ ÉXITO ══ -->
        @if (step() === 'success') {
          <div class="bm__success">
            <div class="bm__success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            </div>
            <h3 class="bm__success-title">¡Reserva confirmada!</h3>
            <p class="bm__success-sub">
              Te esperamos el <strong>{{ formattedDate() }}</strong> a las <strong>{{ selectedTime() }}</strong>.
            </p>
            <p class="bm__success-service">{{ service.name }}</p>
            <button class="btn-primary bm__success-btn" (click)="close.emit()">Perfecto</button>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .bm__overlay {
      position: fixed; inset: 0; z-index: 500;
      background: rgba(0,0,0,0.8); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center; padding: 1rem;
    }
    .bm__modal {
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); width: 100%; max-width: 480px;
      max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column;
    }

    /* ── Header ── */
    .bm__header { display: flex; align-items: flex-start; justify-content: space-between; padding: 1.5rem; border-bottom: 1px solid var(--color-border); }
    .bm__service-name { font-family: var(--font-display); font-size: 1.4rem; font-weight: 300; color: var(--color-text); margin-bottom: 0.2rem; }
    .bm__service-meta { font-size: var(--size-sm); color: var(--color-accent); }
    .bm__close { background: none; border: none; color: var(--color-muted); cursor: pointer; padding: 4px; transition: color var(--transition); &:hover { color: var(--color-text); } }

    /* ── Stepper ── */
    .bm__steps { display: flex; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--color-border); gap: 0; }
    .bm__step { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
    .bm__step-n { width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--color-border); display: flex; align-items: center; justify-content: center; font-size: var(--size-xs); font-weight: 500; color: var(--color-muted); transition: all var(--transition); }
    .bm__step-l { font-size: var(--size-xs); color: var(--color-muted); letter-spacing: 0.05em; }
    .bm__step.active .bm__step-n { border-color: var(--color-accent); color: var(--color-accent); background: rgba(200,169,110,0.1); }
    .bm__step.active .bm__step-l { color: var(--color-text); }
    .bm__step.done .bm__step-n   { border-color: #6bcb77; color: #6bcb77; background: rgba(100,200,100,0.08); }
    .bm__step-line { flex: 1; height: 1px; background: var(--color-border); margin: 0 0.75rem; }

    /* ── Body ── */
    .bm__body { padding: 1.5rem; flex: 1; display: flex; flex-direction: column; gap: 1.5rem; overflow-y: auto; }
    .bm__section-title { font-size: var(--size-xs); font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-muted); margin-bottom: 0.85rem; }
    .bm__optional { font-weight: 400; letter-spacing: 0; text-transform: none; font-size: var(--size-xs); color: var(--color-muted); opacity: 0.6; }

    /* ── Calendario ── */
    .bm__calendar { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1rem; }
    .bm__cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
    .bm__cal-month { font-family: var(--font-display); font-size: 1.1rem; font-weight: 300; color: var(--color-text); }
    .bm__cal-nav { background: none; border: 1px solid var(--color-border); color: var(--color-muted); cursor: pointer; width: 28px; height: 28px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; transition: all var(--transition); &:hover:not(:disabled) { border-color: var(--color-accent); color: var(--color-accent); } &:disabled { opacity: 0.3; cursor: not-allowed; } }
    .bm__cal-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 0.4rem; span { text-align: center; font-size: 0.65rem; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-muted); padding: 0.25rem 0; } }
    .bm__cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
    .bm__cal-day { aspect-ratio: 1; border-radius: var(--radius-sm); border: 1px solid transparent; background: none; color: var(--color-text); font-size: var(--size-sm); cursor: pointer; transition: all var(--transition); display: flex; align-items: center; justify-content: center;
      &:hover:not(:disabled) { background: rgba(200,169,110,0.1); border-color: var(--color-accent); color: var(--color-accent); }
      &.today { border-color: var(--color-border); color: var(--color-accent); }
      &.selected { background: var(--color-accent); border-color: var(--color-accent); color: var(--color-bg); font-weight: 500; }
      &:disabled { opacity: 0.25; cursor: not-allowed; }
    }

    /* ── Día bloqueado ── */
    .bm__blocked-day {
      display: flex; align-items: flex-start; gap: 0.75rem;
      background: rgba(200,169,110,0.08); border: 1px solid rgba(200,169,110,0.3);
      padding: 1rem 1.25rem; border-radius: var(--radius-sm); color: #a07835;
      svg { flex-shrink: 0; margin-top: 1px; }
      p { font-size: var(--size-sm); line-height: 1.5; }
    }

    /* ── Slots ── */
    .bm__slots-loading, .bm__slots-empty { font-size: var(--size-sm); color: var(--color-muted); }
    .bm__slots { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
    .bm__slot { padding: 0.5rem; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: none; color: var(--color-muted); font-size: var(--size-sm); cursor: pointer; transition: all var(--transition); font-family: var(--font-body);
      &:hover { border-color: var(--color-accent); color: var(--color-accent); }
      &.selected { background: var(--color-accent); border-color: var(--color-accent); color: var(--color-bg); font-weight: 500; }
    }

    /* ── Notas ── */
    .bm__notes { width: 100%; background: var(--color-bg); border: 1px solid var(--color-border); color: var(--color-text); font-family: var(--font-body); font-size: var(--size-sm); padding: 0.75rem; border-radius: var(--radius-sm); resize: none; outline: none; transition: border-color var(--transition); &::placeholder { color: var(--color-muted); opacity: 0.5; } &:focus { border-color: var(--color-accent); } }

    /* ── Login prompt ── */
    .bm__login-prompt { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 2rem; text-align: center; color: var(--color-muted); }
    .bm__login-title { font-family: var(--font-display); font-size: 1.4rem; font-weight: 300; color: var(--color-text); }
    .bm__login-sub { font-size: var(--size-sm); }
    .bm__login-btn { margin-top: 0.5rem; }

    /* ── Summary ── */
    .bm__summary-grid { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; margin-top: 0.75rem; }
    .bm__summary-item { display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 1rem; border-bottom: 1px solid var(--color-border); &:last-child { border-bottom: none; } }
    .bm__summary-label { font-size: var(--size-xs); font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-muted); }
    .bm__summary-value { font-size: var(--size-sm); color: var(--color-text); }
    .bm__price { color: var(--color-accent); font-family: var(--font-display); font-size: 1.1rem; }
    .bm__summary-notes { margin-top: 0.75rem; padding: 0.85rem 1rem; border: 1px solid var(--color-border); border-radius: var(--radius-sm); span { display: block; margin-bottom: 0.4rem; } p { font-size: var(--size-sm); color: var(--color-muted); } }
    .bm__error { background: rgba(220,50,50,0.1); border: 1px solid rgba(220,50,50,0.3); color: #ff6b6b; font-size: var(--size-sm); padding: 0.75rem 1rem; border-radius: var(--radius-sm); }

    /* ── Footer ── */
    .bm__footer { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-top: 1px solid var(--color-border); gap: 0.75rem; }
    .bm__footer button:disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }

    /* ── Success ── */
    .bm__success { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3rem 2rem; text-align: center; }
    .bm__success-icon { color: #6bcb77; }
    .bm__success-title { font-family: var(--font-display); font-size: 1.8rem; font-weight: 300; color: var(--color-text); }
    .bm__success-sub { font-size: var(--size-sm); color: var(--color-muted); line-height: 1.6; strong { color: var(--color-text); } }
    .bm__success-service { font-size: var(--size-xs); font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-accent); }
    .bm__success-btn { margin-top: 0.5rem; }
  `]
})
export class BookingModalComponent implements OnInit {
  @Input({ required: true }) service!: Service;
  @Output() close = new EventEmitter<void>();

  private appointmentSvc = inject(AppointmentService);
  private authSvc        = inject(AuthService);
  private router         = inject(Router);
  private http           = inject(HttpClient);

  step         = signal<Step>('datetime');
  selectedDate = signal<string>('');
  selectedTime = signal<string>('');
  slots        = signal<string[]>([]);
  loadingSlots = signal(false);
  booking      = signal(false);
  bookingError = signal<string | null>(null);
  notes        = '';

  // Bloqueos
  blockedSlots  = signal<BlockedSlot[]>([]);
  dayBlockedMsg = signal<string | null>(null);

  // Calendario
  today        = new Date();
  currentYear  = signal(this.today.getFullYear());
  currentMonth = signal(this.today.getMonth());

  readonly weekdays   = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
  readonly monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  monthLabel    = computed(() => `${this.monthNames[this.currentMonth()]} ${this.currentYear()}`);
  isLoggedIn    = computed(() => this.authSvc.isLoggedIn());
  formattedDate = computed(() => {
    if (!this.selectedDate()) return '';
    const d = new Date(this.selectedDate() + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  });

  calendarCells = computed(() => {
    const year  = this.currentYear();
    const month = this.currentMonth();
    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset      = firstDay === 0 ? 6 : firstDay - 1;
    const cells: (null | { day: number; iso: string; isToday: boolean; disabled: boolean })[] = [];

    for (let i = 0; i < offset; i++) cells.push(null);

    for (let d = 1; d <= daysInMonth; d++) {
      const date    = new Date(year, month, d);
      const iso     = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday = date.toDateString() === this.today.toDateString();
      const isPast  = date < new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
      const isSunday = date.getDay() === 0;
      cells.push({ day: d, iso, isToday, disabled: isPast || isSunday });
    }
    return cells;
  });

  canGoPrev = computed(() =>
    this.currentYear() > this.today.getFullYear() ||
    this.currentMonth() > this.today.getMonth()
  );

  ngOnInit() {}

  prevMonth() {
    if (!this.canGoPrev()) return;
    if (this.currentMonth() === 0) { this.currentMonth.set(11); this.currentYear.update(y => y-1); }
    else { this.currentMonth.update(m => m-1); }
    this.selectedDate.set(''); this.selectedTime.set(''); this.slots.set([]);
    this.dayBlockedMsg.set(null);
  }

  nextMonth() {
    if (this.currentMonth() === 11) { this.currentMonth.set(0); this.currentYear.update(y => y+1); }
    else { this.currentMonth.update(m => m+1); }
    this.selectedDate.set(''); this.selectedTime.set(''); this.slots.set([]);
    this.dayBlockedMsg.set(null);
  }

  selectDate(iso: string) {
    this.selectedDate.set(iso);
    this.selectedTime.set('');
    this.slots.set([]);
    this.dayBlockedMsg.set(null);
    this.loadingSlots.set(true);

    // 1. Comprobar bloqueos del día
    this.http.get<{ data: { slots: BlockedSlot[] } }>(
      `${environment.apiUrl}/blocked/check?date=${iso}`
    ).subscribe({
      next: res => {
        this.blockedSlots.set(res.data.slots);

        // Día completo bloqueado
        const allDay = res.data.slots.find(s => s.all_day);
        if (allDay) {
          this.dayBlockedMsg.set(
            allDay.reason
              ? `La barbería estará cerrada este día: ${allDay.reason}`
              : 'La barbería está cerrada este día'
          );
          this.loadingSlots.set(false);
          return;
        }

        // 2. Sin bloqueo total → cargar slots disponibles (el backend ya filtra franjas)
        this.appointmentSvc.getAvailableSlots(iso, this.service.id).subscribe({
          next:  s => { this.slots.set(s); this.loadingSlots.set(false); },
          error: () => this.loadingSlots.set(false),
        });
      },
      error: () => {
        // Si falla la comprobación cargamos slots igualmente
        this.appointmentSvc.getAvailableSlots(iso, this.service.id).subscribe({
          next:  s => { this.slots.set(s); this.loadingSlots.set(false); },
          error: () => this.loadingSlots.set(false),
        });
      },
    });
  }

  goToConfirm() {
    if (!this.selectedDate() || !this.selectedTime()) return;
    this.step.set('confirm');
  }

  goToAuth() {
    sessionStorage.setItem('booking_intent', JSON.stringify({
      serviceId:   this.service.id,
      serviceName: this.service.name,
      date:        this.selectedDate(),
      time:        this.selectedTime(),
      notes:       this.notes,
    }));
    this.close.emit();
    this.router.navigate(['/auth']);
  }

  confirmBooking() {
    this.booking.set(true);
    this.bookingError.set(null);
    this.appointmentSvc.book({
      serviceId: this.service.id,
      date:      this.selectedDate(),
      time:      this.selectedTime(),
      notes:     this.notes || undefined,
    }).subscribe({
      next:  () => { this.booking.set(false); this.step.set('success'); },
      error: (err) => {
        this.bookingError.set(err.error?.message || 'Error al confirmar la reserva');
        this.booking.set(false);
      },
    });
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('bm__overlay')) this.close.emit();
  }
}