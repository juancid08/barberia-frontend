import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface ChangeRequest {
  id:             number;
  status:         'PENDING' | 'APPROVED' | 'REJECTED';
  requested_date: string;
  reason:         string | null;
  created_at:     string;
  resolved_at:    string | null;
  appointment: {
    id:        number;
    date_time: string;
    service:   { name: string; price: number; duration_min: number };
  };
  user: { name: string; email: string; phone: string | null };
}

@Component({
  selector: 'app-admin-change-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cr-wrap">
      <div class="container">

        <!-- ── Header ── -->
        <div class="cr__header">
          <div>
            <p class="cr__label">Panel de administración</p>
            <h1 class="cr__title">Solicitudes de <em>cambio</em></h1>
            <p class="cr__sub">
              <span class="cr__diamond"></span>
              Peticiones de cambio de fecha u hora enviadas por los usuarios
            </p>
          </div>
          <div class="cr__stats">
            <div class="cr__stat">
              <span class="cr__stat-n cr__stat-n--pending">{{ pendingCount() }}</span>
              <span class="cr__stat-l">Pendientes</span>
            </div>
            <div class="cr__stat-div"></div>
            <div class="cr__stat">
              <span class="cr__stat-n">{{ requests().length }}</span>
              <span class="cr__stat-l">Total</span>
            </div>
          </div>
        </div>

        <div class="cr__divider"></div>

        <!-- ── Filtros ── -->
        <div class="cr__filters">
          @for (f of filters; track f.value) {
            <button class="cr__filter-btn"
                    [class.active]="activeFilter() === f.value"
                    (click)="activeFilter.set(f.value)">
              {{ f.label }}
              @if (f.value !== 'ALL') {
                <span class="cr__filter-count">{{ countByStatus(f.value) }}</span>
              }
            </button>
          }
        </div>

        <!-- ── Lista ── -->
        @if (loading()) {
          <div class="cr__empty"><p>Cargando solicitudes...</p></div>
        } @else if (filtered().length === 0) {
          <div class="cr__empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="48" height="48">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="9" y1="13" x2="15" y2="13"/>
            </svg>
            <p>No hay solicitudes {{ activeFilter() !== 'ALL' ? 'con este estado' : '' }}.</p>
          </div>
        } @else {
          <div class="cr__list">
            @for (req of filtered(); track req.id) {
              <article class="cr__card" [class]="'cr__card--' + req.status.toLowerCase()">

                <!-- Estado badge -->
                <div class="cr__card-status">
                  <span class="cr__badge" [class]="'cr__badge--' + req.status.toLowerCase()">
                    {{ statusLabel(req.status) }}
                  </span>
                  <span class="cr__card-date">{{ formatDate(req.created_at) }}</span>
                </div>

                <!-- Info -->
                <div class="cr__card-body">

                  <!-- Usuario -->
                  <div class="cr__card-user">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" width="14" height="14">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    <strong>{{ req.user.name }}</strong>
                    <span class="cr__card-email">· {{ req.user.email }}</span>
                    @if (req.user.phone) { <span class="cr__card-phone">· {{ req.user.phone }}</span> }
                  </div>

                  <!-- Servicio -->
                  <p class="cr__card-service">{{ req.appointment.service.name }}</p>

                  <!-- Cambio de fecha -->
                  <div class="cr__card-dates">
                    <div class="cr__date-item cr__date-item--current">
                      <span class="cr__date-label">Fecha actual</span>
                      <span class="cr__date-value">
                        {{ formatDateTime(req.appointment.date_time) }}
                      </span>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16" class="cr__arrow">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                    <div class="cr__date-item cr__date-item--requested">
                      <span class="cr__date-label">Nueva fecha solicitada</span>
                      <span class="cr__date-value">
                        {{ formatDateTime(req.requested_date) }}
                      </span>
                    </div>
                  </div>

                  <!-- Motivo -->
                  @if (req.reason) {
                    <p class="cr__card-reason">"{{ req.reason }}"</p>
                  }

                </div>

                <!-- Acciones (solo si está pendiente) -->
                @if (req.status === 'PENDING') {
                  <div class="cr__card-actions">
                    <button class="cr__action cr__action--approve"
                            (click)="approve(req)"
                            [disabled]="processing() === req.id">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {{ processing() === req.id ? 'Procesando...' : 'Aprobar' }}
                    </button>
                    <button class="cr__action cr__action--reject"
                            (click)="openReject(req)"
                            [disabled]="processing() === req.id">
                      Rechazar
                    </button>
                  </div>
                }

                <!-- Si ya fue procesada -->
                @if (req.status !== 'PENDING' && req.resolved_at) {
                  <p class="cr__card-resolved">
                    {{ req.status === 'APPROVED' ? 'Aprobada' : 'Rechazada' }} el
                    {{ formatDate(req.resolved_at) }}
                  </p>
                }

              </article>
            }
          </div>
        }

      </div>
    </div>

    <!-- ── Modal rechazo con motivo ── -->
    @if (rejectModal()) {
      <div class="cr__overlay" (click)="closeReject()">
        <div class="cr__modal" (click)="$event.stopPropagation()">
          <div class="cr__modal-line"></div>

          <div class="cr__modal-head">
            <div>
              <p class="cr__label">Rechazar solicitud</p>
              <h2 class="cr__modal-title">Indica el <em>motivo</em></h2>
            </div>
            <button class="cr__modal-close" (click)="closeReject()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <p class="cr__modal-sub">
            El usuario recibirá un email con el motivo del rechazo.
          </p>

          <div class="cr__modal-field">
            <label>Motivo del rechazo <span class="cr__optional">(opcional)</span></label>
            <textarea [(ngModel)]="rejectReason" rows="3"
                      placeholder="Ej: El horario solicitado ya está ocupado. Por favor contacta con nosotros para buscar una alternativa."></textarea>
          </div>

          <div class="cr__modal-foot">
            <button class="cr__modal-cancel-btn" (click)="closeReject()">Cancelar</button>
            <button class="cr__modal-reject-btn" (click)="confirmReject()" [disabled]="processing() !== null">
              <span>{{ processing() !== null ? 'Rechazando...' : 'Confirmar rechazo' }}</span>
            </button>
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    /* ── Wrap ── */
    .cr-wrap { background: #f5f1ea; padding-top: calc(var(--navbar-height, 72px) + 3rem); padding-bottom: 5rem; min-height: 100vh; }

    /* ── Header ── */
    .cr__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 2rem; flex-wrap: wrap; margin-bottom: 2rem; }
    .cr__label  { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.32em; text-transform: uppercase; color: #c8a96e; margin-bottom: 0.7rem; display: block; }
    .cr__title  { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: clamp(2rem,4vw,2.8rem); font-weight: 500; color: #1a1614; line-height: 1.1; em { color: #c8a96e; font-style: italic; font-weight: 600; } }
    .cr__sub    { display: flex; align-items: center; gap: 0.6rem; font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 0.95rem; font-style: italic; color: rgba(26,22,20,0.55); margin-top: 0.5rem; }
    .cr__diamond { width: 5px; height: 5px; background: #c8a96e; transform: rotate(45deg); flex-shrink: 0; }
    .cr__divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(200,169,110,0.4) 50%, transparent); margin-bottom: 2rem; }

    .cr__stats  { display: flex; align-items: center; gap: 1.75rem; background: #ffffff; border: 1px solid rgba(200,169,110,0.2); padding: 1.25rem 1.75rem; box-shadow: 0 8px 24px rgba(26,22,20,0.04); }
    .cr__stat   { display: flex; flex-direction: column; gap: 0.3rem; align-items: center; }
    .cr__stat-n { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 1.9rem; font-weight: 600; color: #1a1614; line-height: 1; }
    .cr__stat-n--pending { color: #c8a96e; }
    .cr__stat-l { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.58rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(26,22,20,0.5); }
    .cr__stat-div { width: 1px; height: 36px; background: rgba(26,22,20,0.12); }

    /* ── Filtros ── */
    .cr__filters { display: flex; gap: 0.4rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .cr__filter-btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.55rem 1rem; background: #ffffff; border: 1px solid rgba(26,22,20,0.12); border-radius: 1px; color: rgba(26,22,20,0.55); font-family: var(--font-body,'Inter',sans-serif); font-size: 0.7rem; font-weight: 500; letter-spacing: 0.06em; cursor: pointer; transition: all 0.25s;
      &:hover { border-color: #1a1614; color: #1a1614; }
      &.active { border-color: #c8a96e; color: #c8a96e; background: rgba(200,169,110,0.08); }
    }
    .cr__filter-count { font-size: 0.6rem; background: rgba(26,22,20,0.08); padding: 0.1rem 0.4rem; border-radius: 10px; }
    .cr__filter-btn.active .cr__filter-count { background: rgba(200,169,110,0.2); color: #c8a96e; }

    /* ── Empty ── */
    .cr__empty { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 5rem 1rem; background: #ffffff; border: 1px solid rgba(200,169,110,0.2); text-align: center;
      svg { color: #c8a96e; opacity: 0.4; }
      p { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 1.1rem; font-style: italic; color: rgba(26,22,20,0.5); }
    }

    /* ── Lista ── */
    .cr__list { display: flex; flex-direction: column; gap: 1rem; }

    /* ── Card ── */
    .cr__card { background: #ffffff; border: 1px solid rgba(26,22,20,0.08); border-left: 3px solid rgba(26,22,20,0.2); padding: 1.5rem 1.75rem; display: flex; flex-direction: column; gap: 1.25rem; transition: box-shadow 0.3s, transform 0.3s;
      &:hover { box-shadow: 0 8px 24px rgba(26,22,20,0.06); transform: translateY(-2px); }
    }
    .cr__card--pending  { border-left-color: #c8a96e; }
    .cr__card--approved { border-left-color: #4c9150; opacity: 0.75; }
    .cr__card--rejected { border-left-color: #c93838; opacity: 0.65; }

    .cr__card-status { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .cr__card-date { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.7rem; color: rgba(26,22,20,0.45); }

    .cr__badge { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.58rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; padding: 0.25rem 0.65rem; border: 1px solid; border-radius: 1px; }
    .cr__badge--pending  { color: #c8a96e; border-color: rgba(200,169,110,0.4); background: rgba(200,169,110,0.08); }
    .cr__badge--approved { color: #4c9150; border-color: rgba(76,145,80,0.35); background: rgba(76,145,80,0.07); }
    .cr__badge--rejected { color: #c93838; border-color: rgba(220,50,50,0.3); background: rgba(220,50,50,0.06); }

    .cr__card-body { display: flex; flex-direction: column; gap: 0.75rem; }

    .cr__card-user { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-body,'Inter',sans-serif); font-size: 0.78rem; color: rgba(26,22,20,0.55); flex-wrap: wrap;
      svg { color: #c8a96e; flex-shrink: 0; }
      strong { color: #1a1614; font-weight: 600; }
    }
    .cr__card-email, .cr__card-phone { color: rgba(26,22,20,0.4); }

    .cr__card-service { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 1.2rem; font-weight: 500; color: #1a1614; }

    .cr__card-dates { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; background: #f5f1ea; padding: 1rem 1.25rem; border: 1px solid rgba(200,169,110,0.15); }
    .cr__date-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .cr__date-label { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.58rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(26,22,20,0.45); }
    .cr__date-value { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 1rem; font-weight: 500; color: #1a1614; }
    .cr__date-item--requested .cr__date-value { color: #c8a96e; }
    .cr__arrow { color: rgba(26,22,20,0.3); flex-shrink: 0; }

    .cr__card-reason { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 0.88rem; font-style: italic; color: rgba(26,22,20,0.5); }

    .cr__card-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; }
    .cr__action { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.65rem 1.25rem; font-family: var(--font-body,'Inter',sans-serif); font-size: 0.62rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; cursor: pointer; border: 1px solid; border-radius: 1px; transition: all 0.25s; &:disabled { opacity: 0.4; cursor: not-allowed; } }
    .cr__action--approve { background: rgba(200,169,110,0.08); border-color: rgba(200,169,110,0.45); color: #8a6b30; &:hover:not(:disabled) { background: #c8a96e; color: #ffffff; } }
    .cr__action--reject  { background: transparent; border-color: rgba(26,22,20,0.2); color: rgba(26,22,20,0.6); &:hover:not(:disabled) { border-color: #c93838; color: #c93838; } }

    .cr__card-resolved { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.72rem; color: rgba(26,22,20,0.4); font-style: italic; }

    /* ── Modal ── */
    .cr__overlay { position: fixed; inset: 0; z-index: 300; background: rgba(26,22,20,0.55); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
    .cr__modal { background: #ffffff; width: 100%; max-width: 460px; padding: 2.5rem; position: relative; box-shadow: 0 30px 60px rgba(26,22,20,0.15); border: 1px solid rgba(200,169,110,0.2); }
    .cr__modal-line { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #c8a96e 50%, transparent); }
    .cr__modal-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.75rem; gap: 1rem; }
    .cr__modal-title { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 1.7rem; font-weight: 500; color: #1a1614; line-height: 1.15; margin-top: 0.3rem; em { color: #c8a96e; font-style: italic; } }
    .cr__modal-close { background: none; border: none; color: rgba(26,22,20,0.45); cursor: pointer; padding: 4px; flex-shrink: 0; &:hover { color: #1a1614; } }
    .cr__modal-sub { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.8rem; color: rgba(26,22,20,0.55); line-height: 1.5; margin-bottom: 1.5rem; }

    .cr__modal-field { display: flex; flex-direction: column; gap: 0.5rem;
      label { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: #c8a96e; }
      textarea { background: #fbf8f3; border: 1px solid rgba(26,22,20,0.12); color: #1a1614; font-family: var(--font-body,'Inter',sans-serif); font-size: 0.88rem; padding: 0.85rem 1rem; border-radius: 1px; outline: none; width: 100%; resize: vertical; transition: border-color 0.25s; &:focus { border-color: #c8a96e; background: #ffffff; } &::placeholder { color: rgba(26,22,20,0.35); } }
    }
    .cr__optional { font-weight: 400; letter-spacing: 0; text-transform: none; color: rgba(26,22,20,0.45); font-size: 0.58rem; }

    .cr__modal-foot { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(26,22,20,0.08); }
    .cr__modal-cancel-btn { padding: 0.85rem 1.5rem; background: transparent; border: 1px solid rgba(26,22,20,0.2); color: rgba(26,22,20,0.6); font-family: var(--font-body,'Inter',sans-serif); font-size: 0.68rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; border-radius: 1px; transition: all 0.25s; &:hover { border-color: #1a1614; color: #1a1614; } }
    .cr__modal-reject-btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.85rem 1.85rem; background: #c93838; color: #ffffff; border: 1px solid #c93838; font-family: var(--font-body,'Inter',sans-serif); font-size: 0.68rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; border-radius: 1px; transition: opacity 0.25s; span { position: relative; z-index: 1; } &:disabled { opacity: 0.4; cursor: not-allowed; } }
  `]
})
export class AdminChangeRequestsComponent implements OnInit {
  requests    = signal<ChangeRequest[]>([]);
  loading     = signal(true);
  processing  = signal<number | null>(null);
  activeFilter = signal<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  rejectModal  = signal<ChangeRequest | null>(null);
  rejectReason = '';

  readonly filters = [
    { label: 'Pendientes', value: 'PENDING'  as const },
    { label: 'Aprobadas',  value: 'APPROVED' as const },
    { label: 'Rechazadas', value: 'REJECTED' as const },
    { label: 'Todas',      value: 'ALL'      as const },
  ];

  filtered = computed(() => {
    if (this.activeFilter() === 'ALL') return this.requests();
    return this.requests().filter(r => r.status === this.activeFilter());
  });

  pendingCount  = computed(() => this.requests().filter(r => r.status === 'PENDING').length);
  countByStatus = (s: string) => this.requests().filter(r => r.status === s).length;

  constructor(private http: HttpClient) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<{ data: { requests: ChangeRequest[] } }>(`${environment.apiUrl}/change-requests`).subscribe({
      next:  r => { this.requests.set(r.data.requests); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  approve(req: ChangeRequest) {
    this.processing.set(req.id);
    this.http.put(`${environment.apiUrl}/change-requests/${req.id}/approve`, {}).subscribe({
      next: () => {
        this.requests.update(list =>
          list.map(r => r.id === req.id ? { ...r, status: 'APPROVED' as const, resolved_at: new Date().toISOString() } : r)
        );
        this.processing.set(null);
      },
      error: (err) => {
        alert(err.error?.message || 'Error al aprobar la solicitud');
        this.processing.set(null);
      },
    });
  }

  openReject(req: ChangeRequest) {
    this.rejectReason = '';
    this.rejectModal.set(req);
  }

  closeReject() { this.rejectModal.set(null); }

  confirmReject() {
    if (!this.rejectModal()) return;
    const req = this.rejectModal()!;
    this.processing.set(req.id);

    this.http.put(`${environment.apiUrl}/change-requests/${req.id}/reject`, {
      reason: this.rejectReason || undefined,
    }).subscribe({
      next: () => {
        this.requests.update(list =>
          list.map(r => r.id === req.id ? { ...r, status: 'REJECTED' as const, resolved_at: new Date().toISOString() } : r)
        );
        this.processing.set(null);
        this.closeReject();
      },
      error: () => { this.processing.set(null); this.closeReject(); },
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatDateTime(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  statusLabel(s: string): string {
    return { PENDING: 'Pendiente', APPROVED: 'Aprobada', REJECTED: 'Rechazada' }[s] ?? s;
  }
}