import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

interface AdminAppointment {
  id: number;
  date_time: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes: string | null;
  service: { name: string; price: number };
  user: { name: string; email: string; phone: string | null };
}

type StatusFilter = 'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
type DateFilter   = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';
type SortOption   = 'date_desc' | 'date_asc' | 'service' | 'user';

// Slots disponibles 09:00–19:30 cada 30 min
const ALL_SLOTS: string[] = [];
for (let h = 9; h < 20; h++) {
  ALL_SLOTS.push(`${String(h).padStart(2,'0')}:00`);
  ALL_SLOTS.push(`${String(h).padStart(2,'0')}:30`);
}

@Component({
  selector: 'app-admin-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="aa-wrap">
      <div class="container">

        <!-- ── Header ── -->
        <div class="aa__header">
          <div>
            <p class="aa__label">Panel de administración</p>
            <h1 class="aa__title">Gestión de <em>citas</em></h1>
            <p class="aa__sub">
              <span class="aa__diamond"></span>
              Reservas activas, pasadas y pendientes de confirmar
            </p>
          </div>
          <div class="aa__stats">
            <div class="aa__stat">
              <span class="aa__stat-n aa__stat-n--pending">{{ pendingCount() }}</span>
              <span class="aa__stat-l">Pendientes</span>
            </div>
            <div class="aa__stat-div"></div>
            <div class="aa__stat">
              <span class="aa__stat-n aa__stat-n--confirmed">{{ confirmedCount() }}</span>
              <span class="aa__stat-l">Confirmadas</span>
            </div>
            <div class="aa__stat-div"></div>
            <div class="aa__stat">
              <span class="aa__stat-n">{{ appointments().length }}</span>
              <span class="aa__stat-l">Total</span>
            </div>
          </div>
        </div>

        <div class="aa__divider"></div>

        <!-- ── Toolbar ── -->
        <div class="aa__toolbar">
          <div class="aa__search" [class.focused]="searchFocused">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="15" height="15">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" [value]="searchQuery()"
                   (input)="searchQuery.set($any($event.target).value)"
                   (focus)="searchFocused = true" (blur)="searchFocused = false"
                   placeholder="Buscar por cliente o servicio..." />
            @if (searchQuery()) {
              <button class="aa__clear" (click)="searchQuery.set('')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            }
          </div>
          <div class="aa__sort">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
            </svg>
            <select [value]="sortBy()" (change)="sortBy.set($any($event.target).value)">
              <option value="date_desc">Más recientes</option>
              <option value="date_asc">Más antiguas</option>
              <option value="service">Servicio A-Z</option>
              <option value="user">Cliente A-Z</option>
            </select>
          </div>
          <span class="aa__results">{{ filtered().length }} de {{ appointments().length }}</span>
        </div>

        <!-- Filtros estado -->
        <div class="aa__filter-row">
          <p class="aa__filter-label">Estado</p>
          <div class="aa__filter-group">
            @for (f of statusFilters; track f.value) {
              <button class="aa__filter-btn" [class.active]="statusFilter() === f.value"
                      (click)="statusFilter.set(f.value)">
                {{ f.label }}
                @if (f.value !== 'ALL') {
                  <span class="aa__filter-count">{{ countByStatus(f.value) }}</span>
                }
              </button>
            }
          </div>
        </div>

        <!-- Filtros fecha -->
        <div class="aa__filter-row">
          <p class="aa__filter-label">Fecha</p>
          <div class="aa__filter-group">
            @for (f of dateFilters; track f.value) {
              <button class="aa__filter-btn" [class.active]="dateFilter() === f.value"
                      (click)="dateFilter.set(f.value)">
                {{ f.label }}
              </button>
            }
          </div>
        </div>

        <!-- ── Lista ── -->
        @if (loading()) {
          <div class="aa__empty">
            <p>Cargando citas...</p>
          </div>
        } @else if (filtered().length === 0) {
          <div class="aa__empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="48" height="48">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p>No hay citas con los filtros aplicados.</p>
          </div>
        } @else {
          <div class="aa__list">
            @for (apt of filtered(); track apt.id) {
              <article class="aa__card" [class]="'aa__card--' + apt.status.toLowerCase()">

                <div class="aa__card-date">
                  <span class="aa__card-day">{{ apt.date_time | date:'dd' }}</span>
                  <span class="aa__card-month">{{ apt.date_time | date:'MMM' | uppercase }}</span>
                  <span class="aa__card-time">{{ apt.date_time | date:'HH:mm' }}</span>
                </div>

                <div class="aa__card-divider"></div>

                <div class="aa__card-info">
                  <p class="aa__card-service">{{ apt.service.name }}</p>
                  <p class="aa__card-user">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="13" height="13">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    <strong>{{ apt.user.name }}</strong>
                    <span class="aa__card-email">· {{ apt.user.email }}</span>
                    @if (apt.user.phone) { <span class="aa__card-phone">· {{ apt.user.phone }}</span> }
                  </p>
                  @if (apt.notes) { <p class="aa__card-notes">"{{ apt.notes }}"</p> }
                </div>

                <div class="aa__card-right">
                  <span class="aa__card-price">{{ apt.service.price | currency:'EUR':'symbol':'1.0-0' }}</span>
                  <span class="aa__badge" [class]="'aa__badge--' + apt.status.toLowerCase()">
                    {{ statusLabel(apt.status) }}
                  </span>
                  <div class="aa__card-actions">
                    <!-- Botón editar (disponible en PENDING y CONFIRMED) -->
                    @if (apt.status === 'PENDING' || apt.status === 'CONFIRMED') {
                      <button class="aa__action-btn aa__action-btn--edit"
                              (click)="openEdit(apt)"
                              [disabled]="updating() === apt.id">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Editar
                      </button>
                    }
                    @if (apt.status === 'PENDING') {
                      <button class="aa__action-btn aa__action-btn--confirm"
                              (click)="updateStatus(apt, 'CONFIRMED')" [disabled]="updating() === apt.id">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Confirmar
                      </button>
                      <button class="aa__action-btn aa__action-btn--cancel"
                              (click)="updateStatus(apt, 'CANCELLED')" [disabled]="updating() === apt.id">
                        Cancelar
                      </button>
                    }
                    @if (apt.status === 'CONFIRMED') {
                      <button class="aa__action-btn aa__action-btn--complete"
                              (click)="updateStatus(apt, 'COMPLETED')" [disabled]="updating() === apt.id">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                          <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
                        </svg>
                        Completar
                      </button>
                      <button class="aa__action-btn aa__action-btn--cancel"
                              (click)="updateStatus(apt, 'CANCELLED')" [disabled]="updating() === apt.id">
                        Cancelar
                      </button>
                    }
                  </div>
                </div>

              </article>
            }
          </div>
          <p class="aa__count">{{ filtered().length }} de {{ appointments().length }} citas</p>
        }

      </div>
    </div>

    <!-- ── Modal editar cita ── -->
    @if (editModal()) {
      <div class="aa__overlay" (click)="closeEdit()">
        <div class="aa__modal" (click)="$event.stopPropagation()">

          <!-- Línea dorada superior -->
          <div class="aa__modal-line"></div>

          <div class="aa__modal-head">
            <div>
              <p class="aa__label">Editar cita</p>
              <h2 class="aa__modal-title">Cambiar <em>fecha y hora</em></h2>
            </div>
            <button class="aa__modal-close" (click)="closeEdit()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Resumen de la cita actual -->
          <div class="aa__modal-current">
            <span class="aa__modal-current-label">Cita actual</span>
            <span class="aa__modal-current-value">
              {{ editingApt?.date_time | date:'EEEE d MMM':'':'es' }} ·
              <strong>{{ editingApt?.date_time | date:'HH:mm' }}</strong>
            </span>
          </div>

          @if (editError()) {
            <p class="aa__modal-error">{{ editError() }}</p>
          }

          <div class="aa__modal-form">
            <!-- Nueva fecha -->
            <div class="aa__modal-field">
              <label>Nueva fecha</label>
              <input type="date" [(ngModel)]="editDate" name="date"
                     [min]="todayISO" required />
            </div>

            <!-- Nueva hora -->
            <div class="aa__modal-field">
              <label>Nueva hora</label>
              <select [(ngModel)]="editTime" name="time">
                @for (slot of availableSlots(); track slot) {
                  <option [value]="slot">{{ slot }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Aviso domingo -->
          @if (isSelectedSunday()) {
            <p class="aa__modal-warn">
              ⚠ Los domingos la barbería está cerrada.
            </p>
          }

          <div class="aa__modal-foot">
            <button class="aa__modal-cancel-btn" (click)="closeEdit()">Cancelar</button>
            <button class="aa__modal-save-btn"
                    (click)="onSaveEdit()"
                    [disabled]="editSaving() || !editDate || !editTime || isSelectedSunday()">
              <span>{{ editSaving() ? 'Guardando...' : 'Guardar cambio' }}</span>
            </button>
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    /* ─── Wrap ─── */
    .aa-wrap { background: #f5f1ea; padding-top: calc(var(--navbar-height, 72px) + 3rem); padding-bottom: 5rem; min-height: 100vh; }

    /* ─── Header ─── */
    .aa__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 2rem; flex-wrap: wrap; margin-bottom: 2rem; }
    .aa__label { font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.32em; text-transform: uppercase; color: #c8a96e; margin-bottom: 0.7rem; display: block; }
    .aa__title { font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: clamp(2rem, 4vw, 2.8rem); font-weight: 500; color: #1a1614; line-height: 1.1; letter-spacing: 0.01em; margin-bottom: 0.85rem; em { color: #c8a96e; font-style: italic; font-weight: 600; } }
    .aa__sub { display: flex; align-items: center; gap: 0.6rem; font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: 0.95rem; font-style: italic; color: rgba(26,22,20,0.55); }
    .aa__diamond { width: 5px; height: 5px; background: #c8a96e; transform: rotate(45deg); flex-shrink: 0; }

    .aa__stats { display: flex; align-items: center; gap: 1.75rem; background: #ffffff; border: 1px solid rgba(200,169,110,0.2); padding: 1.25rem 1.75rem; box-shadow: 0 8px 24px rgba(26,22,20,0.04); }
    .aa__stat { display: flex; flex-direction: column; gap: 0.3rem; align-items: center; }
    .aa__stat-n { font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: 1.9rem; font-weight: 600; color: #1a1614; line-height: 1; }
    .aa__stat-n--pending   { color: rgba(26,22,20,0.45); }
    .aa__stat-n--confirmed { color: #c8a96e; }
    .aa__stat-l { font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.58rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(26,22,20,0.5); }
    .aa__stat-div { width: 1px; height: 36px; background: rgba(26,22,20,0.12); }

    .aa__divider { height: 1px; width: 100%; background: linear-gradient(90deg, transparent, rgba(200,169,110,0.4) 50%, transparent); margin-bottom: 2rem; }

    /* ─── Toolbar ─── */
    .aa__toolbar { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .aa__search { display: flex; align-items: center; gap: 0.5rem; background: #ffffff; border: 1px solid rgba(26,22,20,0.12); padding: 0.7rem 1rem; flex: 1; min-width: 240px; color: rgba(26,22,20,0.45); transition: border-color 0.3s; border-radius: 1px; &.focused { border-color: #c8a96e; } input { background: none; border: none; outline: none; color: #1a1614; font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.85rem; width: 100%; &::placeholder { color: rgba(26,22,20,0.4); } } }
    .aa__clear { background: none; border: none; color: rgba(26,22,20,0.45); cursor: pointer; padding: 2px; display: flex; transition: color 0.25s; &:hover { color: #1a1614; } }
    .aa__sort { display: flex; align-items: center; gap: 0.6rem; background: #ffffff; border: 1px solid rgba(26,22,20,0.12); padding: 0.7rem 1rem; color: rgba(26,22,20,0.5); border-radius: 1px; select { background: none; border: none; outline: none; color: #1a1614; font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.78rem; font-weight: 500; cursor: pointer; option { background: #ffffff; color: #1a1614; } } }
    .aa__results { font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: 0.9rem; font-style: italic; color: rgba(26,22,20,0.5); white-space: nowrap; margin-left: auto; }

    /* ─── Filtros ─── */
    .aa__filter-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .aa__filter-label { font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.58rem; font-weight: 600; letter-spacing: 0.28em; text-transform: uppercase; color: #c8a96e; min-width: 60px; }
    .aa__filter-group { display: flex; gap: 0.4rem; flex-wrap: wrap; }
    .aa__filter-btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.55rem 1rem; background: #ffffff; border: 1px solid rgba(26,22,20,0.12); border-radius: 1px; color: rgba(26,22,20,0.55); font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.7rem; font-weight: 500; letter-spacing: 0.06em; cursor: pointer; transition: all 0.25s; white-space: nowrap; &:hover { border-color: #1a1614; color: #1a1614; } &.active { border-color: #c8a96e; color: #c8a96e; background: rgba(200,169,110,0.08); } }
    .aa__filter-count { font-size: 0.6rem; background: rgba(26,22,20,0.08); padding: 0.1rem 0.4rem; border-radius: 10px; color: rgba(26,22,20,0.55); font-weight: 600; }
    .aa__filter-btn.active .aa__filter-count { background: rgba(200,169,110,0.2); color: #c8a96e; }

    /* ─── Empty ─── */
    .aa__empty { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 5rem 1rem; background: #ffffff; border: 1px solid rgba(200,169,110,0.2); text-align: center; margin-top: 1rem; svg { color: #c8a96e; opacity: 0.4; } p { font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: 1.1rem; font-style: italic; color: rgba(26,22,20,0.5); } }

    /* ─── Lista ─── */
    .aa__list { display: flex; flex-direction: column; gap: 0.85rem; margin-top: 1.5rem; }
    .aa__count { margin-top: 1.5rem; font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: 0.85rem; font-style: italic; color: rgba(26,22,20,0.45); text-align: right; }

    /* ─── Card ─── */
    .aa__card { display: flex; align-items: center; gap: 1.5rem; background: #ffffff; border: 1px solid rgba(26,22,20,0.08); border-left: 3px solid rgba(26,22,20,0.15); padding: 1.4rem 1.6rem; transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s; &:hover { border-color: rgba(200,169,110,0.4); box-shadow: 0 8px 24px rgba(26,22,20,0.06); transform: translateY(-2px); } }
    .aa__card--pending   { border-left-color: rgba(26,22,20,0.3); }
    .aa__card--confirmed { border-left-color: #c8a96e; }
    .aa__card--completed { border-left-color: #4c9150; }
    .aa__card--cancelled { border-left-color: #c93838; opacity: 0.55; }

    .aa__card-date { display: flex; flex-direction: column; align-items: center; min-width: 56px; flex-shrink: 0; }
    .aa__card-day   { font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: 1.9rem; font-weight: 600; color: #1a1614; line-height: 1; }
    .aa__card-month { font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.58rem; font-weight: 600; letter-spacing: 0.22em; color: #c8a96e; margin-top: 0.3rem; }
    .aa__card-time  { font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: 0.85rem; font-style: italic; font-weight: 600; color: #c8a96e; margin-top: 0.35rem; }

    .aa__card-divider { width: 1px; height: 60px; background: linear-gradient(to bottom, transparent, rgba(200,169,110,0.45), transparent); flex-shrink: 0; }

    .aa__card-info { flex: 1; min-width: 220px; }
    .aa__card-service { font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: 1.2rem; font-weight: 500; color: #1a1614; margin-bottom: 0.5rem; letter-spacing: 0.01em; }
    .aa__card-user { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.78rem; color: rgba(26,22,20,0.55); flex-wrap: wrap; line-height: 1.5; svg { color: #c8a96e; flex-shrink: 0; } strong { color: #1a1614; font-weight: 600; } }
    .aa__card-email, .aa__card-phone { color: rgba(26,22,20,0.45); }
    .aa__card-notes { font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: 0.85rem; font-style: italic; color: rgba(26,22,20,0.5); margin-top: 0.5rem; }

    .aa__card-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.6rem; flex-shrink: 0; min-width: 160px; }
    .aa__card-price { font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: 1.4rem; font-weight: 600; color: #c8a96e; line-height: 1; }

    .aa__badge { font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.58rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; padding: 0.25rem 0.65rem; border-radius: 1px; border: 1px solid; }
    .aa__badge--pending   { color: rgba(26,22,20,0.5); border-color: rgba(26,22,20,0.2); background: rgba(26,22,20,0.04); }
    .aa__badge--confirmed { color: #c8a96e; border-color: rgba(200,169,110,0.4); background: rgba(200,169,110,0.08); }
    .aa__badge--completed { color: #4c9150; border-color: rgba(76,145,80,0.35); background: rgba(76,145,80,0.07); }
    .aa__badge--cancelled { color: #c93838; border-color: rgba(220,50,50,0.3); background: rgba(220,50,50,0.06); }

    .aa__card-actions { display: flex; flex-direction: column; gap: 0.35rem; width: 100%; }
    .aa__action-btn { display: flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.5rem 0.85rem; border-radius: 1px; font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; cursor: pointer; transition: all 0.25s; border: 1px solid; &:disabled { opacity: 0.4; cursor: not-allowed; } }

    .aa__action-btn--edit     { background: rgba(26,22,20,0.04); border-color: rgba(26,22,20,0.2); color: rgba(26,22,20,0.6); &:hover:not(:disabled) { background: #1a1614; color: #f5f1ea; border-color: #1a1614; } }
    .aa__action-btn--confirm  { background: rgba(200,169,110,0.08); border-color: rgba(200,169,110,0.45); color: #c8a96e; &:hover:not(:disabled) { background: #c8a96e; color: #ffffff; border-color: #c8a96e; } }
    .aa__action-btn--complete { background: rgba(76,145,80,0.08); border-color: rgba(76,145,80,0.4); color: #4c9150; &:hover:not(:disabled) { background: #4c9150; color: #ffffff; border-color: #4c9150; } }
    .aa__action-btn--cancel   { background: transparent; border-color: rgba(26,22,20,0.15); color: rgba(26,22,20,0.5); &:hover:not(:disabled) { border-color: #c93838; color: #c93838; background: rgba(220,50,50,0.04); } }

    /* ─── Modal edición ─── */
    .aa__overlay { position: fixed; inset: 0; z-index: 300; background: rgba(26,22,20,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 1.5rem; }

    .aa__modal {
      background: #ffffff; width: 100%; max-width: 460px;
      max-height: 90vh; overflow-y: auto;
      padding: 2.5rem; position: relative;
      box-shadow: 0 30px 60px rgba(26,22,20,0.15);
      border: 1px solid rgba(200,169,110,0.2);
    }

    /* Línea dorada superior */
    .aa__modal-line { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #c8a96e 50%, transparent); }

    .aa__modal-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.75rem; gap: 1rem; }
    .aa__modal-title { font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: 1.7rem; font-weight: 500; color: #1a1614; line-height: 1.15; margin-top: 0.3rem; em { color: #c8a96e; font-style: italic; } }
    .aa__modal-close { background: none; border: none; color: rgba(26,22,20,0.45); cursor: pointer; padding: 4px; transition: color 0.25s; flex-shrink: 0; &:hover { color: #1a1614; } }

    /* Cita actual */
    .aa__modal-current { display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 1rem; background: #f5f1ea; border: 1px solid rgba(200,169,110,0.2); margin-bottom: 1.5rem; }
    .aa__modal-current-label { font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.58rem; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(26,22,20,0.5); }
    .aa__modal-current-value { font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: 0.95rem; font-style: italic; color: #1a1614; strong { color: #c8a96e; } }

    .aa__modal-error { background: rgba(220,50,50,0.06); border: 1px solid rgba(220,50,50,0.25); color: #c93838; font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.8rem; padding: 0.75rem 1rem; margin-bottom: 1.25rem; }
    .aa__modal-warn  { background: rgba(200,169,110,0.08); border: 1px solid rgba(200,169,110,0.3); color: #a07835; font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.8rem; padding: 0.75rem 1rem; margin-top: 1rem; }

    .aa__modal-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .aa__modal-field { display: flex; flex-direction: column; gap: 0.5rem;
      label { font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: #c8a96e; }
      input, select { background: #fbf8f3; border: 1px solid rgba(26,22,20,0.12); color: #1a1614; font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.88rem; padding: 0.85rem 1rem; border-radius: 1px; outline: none; width: 100%; transition: border-color 0.25s; &:focus { border-color: #c8a96e; background: #ffffff; } option { background: #ffffff; } }
    }

    .aa__modal-foot { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(26,22,20,0.08); }

    .aa__modal-cancel-btn { padding: 0.85rem 1.5rem; background: transparent; border: 1px solid rgba(26,22,20,0.2); color: rgba(26,22,20,0.6); font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.68rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; transition: all 0.25s; &:hover { border-color: #1a1614; color: #1a1614; } }

    .aa__modal-save-btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.85rem 1.85rem; background: #1a1614; color: #f5f1ea; border: 1px solid #1a1614; font-family: var(--font-body, 'Inter', sans-serif); font-size: 0.68rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; position: relative; overflow: hidden; transition: color 0.3s, border-color 0.3s;
      &::before { content: ''; position: absolute; inset: 0; background: #c8a96e; transform: scaleX(0); transform-origin: left; transition: transform 0.4s cubic-bezier(0.22,1,0.36,1); }
      &:hover:not(:disabled) { color: #1a1614; border-color: #c8a96e; }
      &:hover:not(:disabled)::before { transform: scaleX(1); }
      span { position: relative; z-index: 1; }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }

    /* ─── Responsive ─── */
    @media (max-width: 900px) {
      .aa__stats { width: 100%; justify-content: space-around; padding: 1rem; }
    }
    @media (max-width: 720px) {
      .aa__card { flex-wrap: wrap; gap: 1rem; }
      .aa__card-divider { display: none; }
      .aa__card-info { min-width: 100%; order: 3; }
      .aa__card-right { flex-direction: row; align-items: center; width: 100%; justify-content: space-between; order: 4; min-width: unset; padding-top: 1rem; border-top: 1px solid rgba(26,22,20,0.08); }
      .aa__card-actions { flex-direction: row; width: auto; flex-wrap: wrap; }
    }
  `]
})
export class AdminAppointmentsComponent implements OnInit {
  appointments = signal<AdminAppointment[]>([]);
  loading      = signal(true);
  updating     = signal<number | null>(null);
  searchQuery  = signal('');
  statusFilter = signal<StatusFilter>('ALL');
  dateFilter   = signal<DateFilter>('ALL');
  sortBy       = signal<SortOption>('date_desc');
  searchFocused = false;

  // ── Edición ───────────────────────────────────────────────────────────────
  editModal   = signal(false);
  editSaving  = signal(false);
  editError   = signal<string | null>(null);
  editingApt: AdminAppointment | null = null;
  editDate    = '';
  editTime    = '09:00';

  get todayISO(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  isSelectedSunday = computed(() => {
    if (!this.editDate) return false;
    return new Date(this.editDate).getDay() === 0;
  });

  availableSlots = computed(() => {
    // Sábado cierra a las 15:00
    if (this.editDate) {
      const isSat = new Date(this.editDate).getDay() === 6;
      return isSat ? ALL_SLOTS.filter(s => s < '15:00') : ALL_SLOTS;
    }
    return ALL_SLOTS;
  });

  // ── Filtros ───────────────────────────────────────────────────────────────
  readonly statusFilters = [
    { label: 'Todas',       value: 'ALL'       as StatusFilter },
    { label: 'Pendientes',  value: 'PENDING'   as StatusFilter },
    { label: 'Confirmadas', value: 'CONFIRMED' as StatusFilter },
    { label: 'Completadas', value: 'COMPLETED' as StatusFilter },
    { label: 'Canceladas',  value: 'CANCELLED' as StatusFilter },
  ];

  readonly dateFilters = [
    { label: 'Todas las fechas', value: 'ALL'   as DateFilter },
    { label: 'Hoy',              value: 'TODAY' as DateFilter },
    { label: 'Esta semana',      value: 'WEEK'  as DateFilter },
    { label: 'Este mes',         value: 'MONTH' as DateFilter },
  ];

  filtered = computed(() => {
    let list = this.appointments();
    const now = new Date();

    if (this.statusFilter() !== 'ALL') {
      list = list.filter(a => a.status === this.statusFilter());
    }
    if (this.dateFilter() !== 'ALL') {
      list = list.filter(a => {
        const d = new Date(a.date_time);
        if (this.dateFilter() === 'TODAY') return d.toDateString() === now.toDateString();
        if (this.dateFilter() === 'WEEK') {
          const ws = new Date(now); ws.setDate(now.getDate() - now.getDay() + 1); ws.setHours(0,0,0,0);
          const we = new Date(ws); we.setDate(ws.getDate() + 6);
          return d >= ws && d <= we;
        }
        if (this.dateFilter() === 'MONTH') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        return true;
      });
    }
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(a =>
      a.user.name.toLowerCase().includes(q) ||
      a.user.email.toLowerCase().includes(q) ||
      a.service.name.toLowerCase().includes(q)
    );

    return [...list].sort((a, b) => {
      switch (this.sortBy()) {
        case 'date_asc': return new Date(a.date_time).getTime() - new Date(b.date_time).getTime();
        case 'service':  return a.service.name.localeCompare(b.service.name);
        case 'user':     return a.user.name.localeCompare(b.user.name);
        default:         return new Date(b.date_time).getTime() - new Date(a.date_time).getTime();
      }
    });
  });

  pendingCount   = computed(() => this.appointments().filter(a => a.status === 'PENDING').length);
  confirmedCount = computed(() => this.appointments().filter(a => a.status === 'CONFIRMED').length);
  countByStatus(status: string) { return this.appointments().filter(a => a.status === status).length; }

  constructor(private http: HttpClient) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http
      .get<{ data: { appointments: AdminAppointment[] } }>(`${environment.apiUrl}/appointments`)
      .pipe(map(res => res.data.appointments))
      .subscribe({
        next:  a => { this.appointments.set(a); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  // ── Cambiar estado ────────────────────────────────────────────────────────
  updateStatus(apt: AdminAppointment, status: AdminAppointment['status']) {
    this.updating.set(apt.id);
    this.http.put(`${environment.apiUrl}/appointments/${apt.id}/status`, { status }).subscribe({
      next: () => {
        this.appointments.update(list => list.map(a => a.id === apt.id ? { ...a, status } : a));
        this.updating.set(null);
      },
      error: () => this.updating.set(null),
    });
  }

  // ── Editar fecha/hora ─────────────────────────────────────────────────────
  openEdit(apt: AdminAppointment) {
    this.editingApt = apt;
    const d = new Date(apt.date_time);
    this.editDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    this.editTime = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    this.editError.set(null);
    this.editModal.set(true);
  }

  closeEdit() { this.editModal.set(false); this.editingApt = null; }

  onSaveEdit() {
    if (!this.editingApt || !this.editDate || !this.editTime) return;
    this.editSaving.set(true);
    this.editError.set(null);

    this.http.put(`${environment.apiUrl}/appointments/${this.editingApt.id}`, {
      date: this.editDate,
      time: this.editTime,
    }).subscribe({
      next: (res: any) => {
        const updated = res.data.appointment;
        this.appointments.update(list =>
          list.map(a => a.id === updated.id ? { ...a, date_time: updated.date_time } : a)
        );
        this.editSaving.set(false);
        this.closeEdit();
      },
      error: (err) => {
        this.editError.set(err.error?.message || 'Error al guardar el cambio');
        this.editSaving.set(false);
      },
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pendiente', CONFIRMED: 'Confirmada',
      CANCELLED: 'Cancelada', COMPLETED: 'Completada',
    };
    return labels[status] ?? status;
  }
}