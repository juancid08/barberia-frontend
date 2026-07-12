import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface BlockedSlot {
  id:         number;
  date:       string;
  all_day:    boolean;
  start_time: string | null;
  end_time:   string | null;
  reason:     string | null;
}

const TIME_SLOTS: string[] = [];
for (let h = 9; h < 20; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2,'0')}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2,'0')}:30`);
}

@Component({
  selector: 'app-admin-blocked',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bl-wrap">
      <div class="container">

        <!-- ── Header ── -->
        <div class="bl__header">
          <div>
            <p class="bl__label">Panel de administración</p>
            <h1 class="bl__title">Bloqueo de <em>fechas</em></h1>
            <p class="bl__sub">
              <span class="bl__diamond"></span>
              Cierra días completos o franjas horarias
            </p>
          </div>
          <button class="bl__add-btn" (click)="openForm()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo bloqueo
          </button>
        </div>

        <div class="bl__divider"></div>

        <!-- ── Lista de bloqueos ── -->
        @if (loading()) {
          <div class="bl__empty"><p>Cargando bloqueos...</p></div>
        } @else if (slots().length === 0) {
          <div class="bl__empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="48" height="48">
              <circle cx="12" cy="12" r="10"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
            <p>No hay fechas bloqueadas.</p>
          </div>
        } @else {
          <div class="bl__list">
            @for (slot of slots(); track slot.id) {
              <article class="bl__card" [class.bl__card--allday]="slot.all_day">
                <div class="bl__card-icon">
                  @if (slot.all_day) {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" width="22" height="22">
                      <rect x="3" y="4" width="18" height="18" rx="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                    </svg>
                  } @else {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" width="22" height="22">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  }
                </div>

                <div class="bl__card-info">
                  <p class="bl__card-date">{{ formatDate(slot.date) }}</p>
                  <p class="bl__card-range">
                    @if (slot.all_day) {
                      <span class="bl__tag bl__tag--allday">Día completo</span>
                    } @else {
                      <span class="bl__tag bl__tag--partial">{{ slot.start_time }} – {{ slot.end_time }}</span>
                    }
                    @if (slot.reason) {
                      <span class="bl__card-reason">· {{ slot.reason }}</span>
                    }
                  </p>
                </div>

                <button class="bl__delete" (click)="deleteSlot(slot.id)" [disabled]="deleting() === slot.id">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                  </svg>
                </button>
              </article>
            }
          </div>
        }

      </div>
    </div>

    <!-- ── Modal nuevo bloqueo ── -->
    @if (formOpen()) {
      <div class="bl__overlay" (click)="closeForm()">
        <div class="bl__modal" (click)="$event.stopPropagation()">
          <div class="bl__modal-line"></div>

          <div class="bl__modal-head">
            <div>
              <p class="bl__label">Nuevo bloqueo</p>
              <h2 class="bl__modal-title">Bloquear <em>fecha u hora</em></h2>
            </div>
            <button class="bl__modal-close" (click)="closeForm()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          @if (formError()) {
            <p class="bl__form-error">{{ formError() }}</p>
          }

          <div class="bl__form">
            <!-- Fecha -->
            <div class="bl__field">
              <label>Fecha *</label>
              <input type="date" [(ngModel)]="form.date" name="date" [min]="todayISO" />
            </div>

            <!-- Tipo -->
            <div class="bl__field">
              <label>Tipo de bloqueo</label>
              <div class="bl__toggle">
                <button [class.active]="form.all_day" (click)="form.all_day = true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Día completo
                </button>
                <button [class.active]="!form.all_day" (click)="form.all_day = false">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Franja horaria
                </button>
              </div>
            </div>

            <!-- Franja horaria (solo si no es día completo) -->
            @if (!form.all_day) {
              <div class="bl__field-row">
                <div class="bl__field">
                  <label>Desde</label>
                  <select [(ngModel)]="form.start_time" name="start">
                    @for (slot of timeSlots; track slot) {
                      <option [value]="slot">{{ slot }}</option>
                    }
                  </select>
                </div>
                <div class="bl__field">
                  <label>Hasta</label>
                  <select [(ngModel)]="form.end_time" name="end">
                    @for (slot of endSlots(); track slot) {
                      <option [value]="slot">{{ slot }}</option>
                    }
                  </select>
                </div>
              </div>
            }

            <!-- Motivo -->
            <div class="bl__field">
              <label>Motivo <span class="bl__optional">(visible al usuario)</span></label>
              <input type="text" [(ngModel)]="form.reason" name="reason"
                     placeholder="Ej: Vacaciones, festivo local, formación..." />
            </div>
          </div>

          <!-- Preview del bloqueo -->
          @if (form.date) {
            <div class="bl__preview">
              <p class="bl__preview-label">Vista previa</p>
              <p class="bl__preview-text">
                <strong>{{ formatDate(form.date) }}</strong>
                @if (form.all_day) { — Día completo cerrado }
                @else { — Bloqueado de {{ form.start_time }} a {{ form.end_time }} }
                @if (form.reason) { · <em>{{ form.reason }}</em> }
              </p>
            </div>
          }

          <div class="bl__modal-foot">
            <button class="bl__cancel-btn" (click)="closeForm()">Cancelar</button>
            <button class="bl__save-btn" (click)="onSave()" [disabled]="saving() || !form.date">
              <span>{{ saving() ? 'Guardando...' : 'Crear bloqueo' }}</span>
            </button>
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    /* ── Wrap ── */
    .bl-wrap { background: #f5f1ea; padding-top: calc(var(--navbar-height, 72px) + 3rem); padding-bottom: 5rem; min-height: 100vh; }

    /* ── Header ── */
    .bl__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 2rem; flex-wrap: wrap; margin-bottom: 2rem; }
    .bl__label  { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.32em; text-transform: uppercase; color: #c8a96e; margin-bottom: 0.7rem; display: block; }
    .bl__title  { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: clamp(2rem,4vw,2.8rem); font-weight: 500; color: #1a1614; line-height: 1.1; em { color: #c8a96e; font-style: italic; font-weight: 600; } }
    .bl__sub    { display: flex; align-items: center; gap: 0.6rem; font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 0.95rem; font-style: italic; color: rgba(26,22,20,0.55); margin-top: 0.5rem; }
    .bl__diamond { width: 5px; height: 5px; background: #c8a96e; transform: rotate(45deg); flex-shrink: 0; }
    .bl__divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(200,169,110,0.4) 50%, transparent); margin-bottom: 2rem; }

    .bl__add-btn { display: inline-flex; align-items: center; gap: 0.6rem; padding: 0.85rem 1.5rem; background: #1a1614; color: #f5f1ea; border: 1px solid #1a1614; font-family: var(--font-body,'Inter',sans-serif); font-size: 0.68rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; border-radius: 1px; transition: all 0.3s; position: relative; overflow: hidden;
      &::before { content: ''; position: absolute; inset: 0; background: #c8a96e; transform: scaleX(0); transform-origin: left; transition: transform 0.4s cubic-bezier(0.22,1,0.36,1); }
      &:hover { color: #1a1614; border-color: #c8a96e; } &:hover::before { transform: scaleX(1); }
      svg, span { position: relative; z-index: 1; }
    }

    /* ── Empty ── */
    .bl__empty { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 5rem 1rem; background: #ffffff; border: 1px solid rgba(200,169,110,0.2); text-align: center; svg { color: #c8a96e; opacity: 0.4; } p { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 1.1rem; font-style: italic; color: rgba(26,22,20,0.5); } }

    /* ── Lista ── */
    .bl__list { display: flex; flex-direction: column; gap: 0.75rem; }

    .bl__card { display: flex; align-items: center; gap: 1.25rem; background: #ffffff; border: 1px solid rgba(26,22,20,0.08); border-left: 3px solid rgba(26,22,20,0.2); padding: 1.25rem 1.5rem; transition: all 0.25s; &:hover { border-color: rgba(200,169,110,0.4); box-shadow: 0 4px 16px rgba(26,22,20,0.06); } &--allday { border-left-color: #c8a96e; } }

    .bl__card-icon { color: rgba(26,22,20,0.4); flex-shrink: 0; }
    .bl__card--allday .bl__card-icon { color: #c8a96e; }

    .bl__card-info { flex: 1; }
    .bl__card-date  { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 1.15rem; font-weight: 500; color: #1a1614; margin-bottom: 0.3rem; text-transform: capitalize; }
    .bl__card-range { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .bl__card-reason { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 0.82rem; font-style: italic; color: rgba(26,22,20,0.5); }

    .bl__tag { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; padding: 0.2rem 0.6rem; border: 1px solid; border-radius: 1px; }
    .bl__tag--allday  { color: #c8a96e; border-color: rgba(200,169,110,0.4); background: rgba(200,169,110,0.08); }
    .bl__tag--partial { color: rgba(26,22,20,0.6); border-color: rgba(26,22,20,0.2); background: rgba(26,22,20,0.04); }

    .bl__delete { background: none; border: none; color: rgba(26,22,20,0.3); cursor: pointer; padding: 6px; transition: color 0.25s; flex-shrink: 0; &:hover { color: #c93838; } &:disabled { opacity: 0.3; cursor: not-allowed; } }

    /* ── Modal ── */
    .bl__overlay { position: fixed; inset: 0; z-index: 300; background: rgba(26,22,20,0.55); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
    .bl__modal { background: #ffffff; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; padding: 2.5rem; position: relative; box-shadow: 0 30px 60px rgba(26,22,20,0.15); border: 1px solid rgba(200,169,110,0.2); }
    .bl__modal-line { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #c8a96e 50%, transparent); }
    .bl__modal-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.75rem; gap: 1rem; }
    .bl__modal-title { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 1.7rem; font-weight: 500; color: #1a1614; line-height: 1.15; margin-top: 0.3rem; em { color: #c8a96e; font-style: italic; } }
    .bl__modal-close { background: none; border: none; color: rgba(26,22,20,0.45); cursor: pointer; padding: 4px; transition: color 0.25s; flex-shrink: 0; &:hover { color: #1a1614; } }

    .bl__form-error { background: rgba(220,50,50,0.06); border: 1px solid rgba(220,50,50,0.25); color: #c93838; font-family: var(--font-body,'Inter',sans-serif); font-size: 0.8rem; padding: 0.75rem 1rem; margin-bottom: 1.25rem; }

    .bl__form { display: flex; flex-direction: column; gap: 1.25rem; }
    .bl__field { display: flex; flex-direction: column; gap: 0.5rem;
      label { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: #c8a96e; }
      input, select { background: #fbf8f3; border: 1px solid rgba(26,22,20,0.12); color: #1a1614; font-family: var(--font-body,'Inter',sans-serif); font-size: 0.88rem; padding: 0.85rem 1rem; border-radius: 1px; outline: none; width: 100%; transition: border-color 0.25s; &:focus { border-color: #c8a96e; background: #ffffff; } option { background: #ffffff; } }
    }
    .bl__optional { font-weight: 400; letter-spacing: 0; text-transform: none; color: rgba(26,22,20,0.45); font-size: 0.58rem; }
    .bl__field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

    /* Toggle tipo */
    .bl__toggle { display: flex; border: 1px solid rgba(26,22,20,0.12); border-radius: 1px; overflow: hidden; }
    .bl__toggle button { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem; background: #fbf8f3; border: none; color: rgba(26,22,20,0.5); font-family: var(--font-body,'Inter',sans-serif); font-size: 0.7rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.25s; border-right: 1px solid rgba(26,22,20,0.12); &:last-child { border-right: none; } &.active { background: #1a1614; color: #f5f1ea; } }

    /* Preview */
    .bl__preview { background: #f5f1ea; border: 1px solid rgba(200,169,110,0.25); padding: 1rem; margin-top: 1.25rem; }
    .bl__preview-label { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.58rem; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: #c8a96e; margin-bottom: 0.4rem; }
    .bl__preview-text { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 0.95rem; color: #1a1614; line-height: 1.5; strong { font-weight: 600; } em { color: rgba(26,22,20,0.6); } }

    .bl__modal-foot { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(26,22,20,0.08); }
    .bl__cancel-btn { padding: 0.85rem 1.5rem; background: transparent; border: 1px solid rgba(26,22,20,0.2); color: rgba(26,22,20,0.6); font-family: var(--font-body,'Inter',sans-serif); font-size: 0.68rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; transition: all 0.25s; border-radius: 1px; &:hover { border-color: #1a1614; color: #1a1614; } }
    .bl__save-btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.85rem 1.85rem; background: #1a1614; color: #f5f1ea; border: 1px solid #1a1614; font-family: var(--font-body,'Inter',sans-serif); font-size: 0.68rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; position: relative; overflow: hidden; border-radius: 1px; transition: color 0.3s, border-color 0.3s;
      &::before { content: ''; position: absolute; inset: 0; background: #c8a96e; transform: scaleX(0); transform-origin: left; transition: transform 0.4s cubic-bezier(0.22,1,0.36,1); }
      &:hover:not(:disabled) { color: #1a1614; border-color: #c8a96e; } &:hover:not(:disabled)::before { transform: scaleX(1); }
      span { position: relative; z-index: 1; } &:disabled { opacity: 0.4; cursor: not-allowed; }
    }
  `]
})
export class AdminBlockedComponent implements OnInit {
  slots    = signal<BlockedSlot[]>([]);
  loading  = signal(true);
  deleting = signal<number | null>(null);
  formOpen = signal(false);
  saving   = signal(false);
  formError = signal<string | null>(null);

  readonly timeSlots = TIME_SLOTS;

  form = {
    date:       '',
    all_day:    true,
    start_time: '09:00',
    end_time:   '10:00',
    reason:     '',
  };

  get todayISO(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  // Slots de fin — solo los posteriores al inicio
  endSlots = computed(() => {
    const idx = TIME_SLOTS.indexOf(this.form.start_time);
    return TIME_SLOTS.slice(idx + 1);
  });

  constructor(private http: HttpClient) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<{ data: { slots: BlockedSlot[] } }>(`${environment.apiUrl}/blocked?all=true`).subscribe({
      next:  r => { this.slots.set(r.data.slots); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm() {
    this.form = { date: '', all_day: true, start_time: '09:00', end_time: '10:00', reason: '' };
    this.formError.set(null);
    this.formOpen.set(true);
  }

  closeForm() { this.formOpen.set(false); }

  onSave() {
    if (!this.form.date) { this.formError.set('La fecha es obligatoria'); return; }
    if (!this.form.all_day && this.form.start_time >= this.form.end_time) {
      this.formError.set('La hora de fin debe ser posterior a la de inicio');
      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    this.http.post<{ data: { slot: BlockedSlot } }>(`${environment.apiUrl}/blocked`, this.form).subscribe({
      next: r => {
        this.slots.update(list => [...list, r.data.slot].sort(
          (a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ));
        this.saving.set(false);
        this.closeForm();
      },
      error: err => {
        this.formError.set(err.error?.message || 'Error al crear el bloqueo');
        this.saving.set(false);
      },
    });
  }

  deleteSlot(id: number) {
    this.deleting.set(id);
    this.http.delete(`${environment.apiUrl}/blocked/${id}`).subscribe({
      next:  () => { this.slots.update(list => list.filter(s => s.id !== id)); this.deleting.set(null); },
      error: () => this.deleting.set(null),
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }
}