import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

interface AdminAppointment {
  id: number;
  date_time: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes: string | null;
  service: { name: string; price: number; duration_min: number };
  user: { name: string; email: string; phone: string | null };
}

interface ModalData {
  apt: AdminAppointment;
  dateLabel: string;
  timeLabel: string;
  priceLabel: string;
}

const ALL_SLOTS: string[] = [];
for (let h = 9; h < 20; h++) {
  ALL_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  ALL_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

@Component({
  selector: 'app-admin-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  template: `
    <div class="cal-wrap">
      <!-- ── Header ── -->
      <div class="cal__header">
        <div class="cal__header-left">
          <p class="cal__label">Panel de administración</p>
          <h1 class="cal__title">Calendario <em>semanal</em></h1>
          <p class="cal__sub"><span class="cal__diamond"></span> Vista de citas por semana</p>
        </div>
        <div class="cal__week-nav">
          <button class="cal__nav-btn" (click)="prevWeek()" aria-label="Semana anterior">
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
          <span class="cal__week-label">{{ weekLabel() }}</span>
          <button class="cal__nav-btn" (click)="nextWeek()" aria-label="Semana siguiente">
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
          <button class="cal__today-btn" (click)="goToToday()">Hoy</button>
        </div>
      </div>

      <div class="cal__divider"></div>

      <!-- ── Leyenda ── -->
      <div class="cal__legend">
        <span class="cal__legend-item cal__legend-item--pending">Pendiente</span>
        <span class="cal__legend-item cal__legend-item--confirmed">Confirmada</span>
        <span class="cal__legend-item cal__legend-item--completed">Completada</span>
        <span class="cal__legend-item cal__legend-item--cancelled">Cancelada</span>
      </div>

      <!-- ── Grid ── -->
      @if (loading()) {
        <div class="cal__loading">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1"
            width="40"
            height="40"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <p>Cargando citas...</p>
        </div>
      } @else {
        <div class="cal__wrap">
          <div class="cal__grid">
            <div class="cal__corner"></div>
            @for (day of weekDays(); track day.iso) {
              <div class="cal__day-header" [class.cal__day-header--today]="day.isToday">
                <span class="cal__day-name">{{ day.name }}</span>
                <span class="cal__day-num" [class.cal__day-num--today]="day.isToday">{{
                  day.num
                }}</span>
              </div>
            }
            @for (slot of timeSlots; track slot) {
              <div class="cal__time">{{ slot }}</div>
              @for (day of weekDays(); track day.iso) {
                <div
                  class="cal__cell"
                  [class.cal__cell--closed]="day.isSunday || (day.isSaturday && slot >= '15:00')"
                  [class.cal__cell--today]="day.isToday"
                >
                  @for (apt of getApts(day.iso, slot); track apt.id) {
                    <div
                      class="cal__apt"
                      [class]="'cal__apt--' + apt.status.toLowerCase()"
                      (click)="openDetail(apt)"
                    >
                      <span class="cal__apt-time">{{ formatTime(apt.date_time) }}</span>
                      <span class="cal__apt-name">{{ apt.user.name }}</span>
                      <span class="cal__apt-service">{{ apt.service.name }}</span>
                    </div>
                  }
                </div>
              }
            }
          </div>
        </div>
      }
    </div>

    <!-- ══ MODAL ══ -->
    @if (modal()) {
      <div class="cal__overlay" (click)="closeDetail()">
        <div class="cal__modal" (click)="$event.stopPropagation()">
          <div class="cal__modal-line"></div>

          <!-- ── Vista detalle ── -->
          @if (!editMode()) {
            <div class="cal__modal-head">
              <div>
                <p class="cal__label">Detalle de cita</p>
                <h2 class="cal__modal-title">{{ modal()!.apt.service.name }}</h2>
              </div>
              <button class="cal__modal-close" (click)="closeDetail()">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  width="20"
                  height="20"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div class="cal__detail-grid">
              <div class="cal__detail-item">
                <span class="cal__detail-label">Cliente</span>
                <span class="cal__detail-value">{{ modal()!.apt.user.name }}</span>
              </div>
              <div class="cal__detail-item">
                <span class="cal__detail-label">Email</span>
                <span class="cal__detail-value">{{ modal()!.apt.user.email }}</span>
              </div>
              <div class="cal__detail-item">
                <span class="cal__detail-label">Teléfono</span>
                <span class="cal__detail-value">{{ modal()!.apt.user.phone ?? '—' }}</span>
              </div>
              <div class="cal__detail-item">
                <span class="cal__detail-label">Fecha y hora</span>
                <span class="cal__detail-value">
                  {{ modal()!.dateLabel }} · <strong>{{ modal()!.timeLabel }}</strong>
                </span>
              </div>
              <div class="cal__detail-item">
                <span class="cal__detail-label">Duración</span>
                <span class="cal__detail-value">{{ modal()!.apt.service.duration_min }} min</span>
              </div>
              <div class="cal__detail-item">
                <span class="cal__detail-label">Precio</span>
                <span class="cal__detail-value cal__detail-price">{{ modal()!.priceLabel }}</span>
              </div>
              @if (modal()!.apt.notes) {
                <div class="cal__detail-item cal__detail-item--full">
                  <span class="cal__detail-label">Notas</span>
                  <span class="cal__detail-value">"{{ modal()!.apt.notes }}"</span>
                </div>
              }
            </div>

            <div class="cal__detail-status">
              <span class="cal__badge cal__badge--{{ modal()!.apt.status.toLowerCase() }}">
                {{ statusLabel(modal()!.apt.status) }}
              </span>
            </div>

            <div class="cal__detail-actions">
              @if (modal()!.apt.status === 'PENDING' || modal()!.apt.status === 'CONFIRMED') {
                <button
                  class="cal__action cal__action--edit"
                  (click)="openEdit()"
                  [disabled]="updating()"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    width="13"
                    height="13"
                  >
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Editar fecha
                </button>
              }
              @if (modal()!.apt.status === 'PENDING') {
                <button
                  class="cal__action cal__action--confirm"
                  (click)="updateStatus(modal()!.apt.id, 'CONFIRMED')"
                  [disabled]="updating()"
                >
                  ✓ Confirmar
                </button>
                <button
                  class="cal__action cal__action--cancel"
                  (click)="updateStatus(modal()!.apt.id, 'CANCELLED')"
                  [disabled]="updating()"
                >
                  Cancelar
                </button>
              }
              @if (modal()!.apt.status === 'CONFIRMED') {
                <button
                  class="cal__action cal__action--complete"
                  (click)="updateStatus(modal()!.apt.id, 'COMPLETED')"
                  [disabled]="updating()"
                >
                  ✓ Completada
                </button>
                <button
                  class="cal__action cal__action--cancel"
                  (click)="updateStatus(modal()!.apt.id, 'CANCELLED')"
                  [disabled]="updating()"
                >
                  Cancelar
                </button>
              }
            </div>
          }

          <!-- ── Vista edición ── -->
          @if (editMode()) {
            <div class="cal__modal-head">
              <div>
                <p class="cal__label">Editar cita</p>
                <h2 class="cal__modal-title">Cambiar <em>fecha y hora</em></h2>
              </div>
              <button class="cal__modal-close" (click)="closeEdit()">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  width="20"
                  height="20"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div class="cal__edit-current">
              <span class="cal__detail-label">Cita actual</span>
              <span class="cal__edit-current-value">
                {{ modal()!.dateLabel }} · <strong>{{ modal()!.timeLabel }}</strong>
              </span>
            </div>

            @if (editError()) {
              <p class="cal__edit-error">{{ editError() }}</p>
            }

            <div class="cal__edit-form">
              <div class="cal__edit-field">
                <label>Nueva fecha</label>
                <input type="date" [(ngModel)]="editDate" name="date" [min]="todayISO" />
              </div>
              <div class="cal__edit-field">
                <label>Nueva hora</label>
                <select [(ngModel)]="editTime" name="time">
                  @for (slot of editableSlots(); track slot) {
                    <option [value]="slot">{{ slot }}</option>
                  }
                </select>
              </div>
            </div>

            @if (isSelectedSunday()) {
              <p class="cal__edit-warn">⚠ Los domingos la barbería está cerrada.</p>
            }

            <div class="cal__edit-foot">
              <button class="cal__action cal__action--back" (click)="closeEdit()">← Volver</button>
              <button
                class="cal__action cal__action--save"
                (click)="onSaveEdit()"
                [disabled]="editSaving() || !editDate || !editTime || isSelectedSunday()"
              >
                <span>{{ editSaving() ? 'Guardando...' : 'Guardar cambio' }}</span>
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        --cream: #f5f1ea;
        --white: #ffffff;
        --gold: #c8a96e;
        --gold-soft: rgba(200, 169, 110, 0.12);
        --gold-mid: rgba(200, 169, 110, 0.4);
        --dark: #1a1614;
        --dark-mid: rgba(26, 22, 20, 0.55);
        --dark-soft: rgba(26, 22, 20, 0.12);
        --dark-faint: rgba(26, 22, 20, 0.05);
      }

      /* ── Wrapper crema (como el resto de páginas) ── */
      .cal-wrap {
        background: var(--cream);
        padding-block: 1rem;
      }

      /* ── Header ── */
      .cal__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 1.25rem;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .cal__header-left {
      }
      .cal__label {
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.6rem;
        font-weight: 600;
        letter-spacing: 0.32em;
        text-transform: uppercase;
        color: var(--gold);
        margin-bottom: 0.5rem;
        display: block;
      }
      .cal__title {
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: clamp(1.8rem, 3.5vw, 2.4rem);
        font-weight: 500;
        color: var(--dark);
        line-height: 1.1;
        em {
          color: var(--gold);
          font-style: italic;
        }
      }
      .cal__sub {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: 0.9rem;
        font-style: italic;
        color: var(--dark-mid);
        margin-top: 0.5rem;
      }
      .cal__diamond {
        width: 5px;
        height: 5px;
        background: var(--gold);
        transform: rotate(45deg);
        flex-shrink: 0;
      }
      .cal__divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--gold-mid) 50%, transparent);
        margin-bottom: 1.5rem;
      }

      /* Navegación semana */
      .cal__week-nav {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        align-self: flex-end;
        padding-bottom: 0.25rem;
      }
      .cal__nav-btn {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--white);
        border: 1px solid rgba(26, 22, 20, 0.18);
        color: var(--dark);
        cursor: pointer;
        border-radius: 1px;
        transition: all 0.25s;
        &:hover {
          border-color: var(--gold);
          color: var(--gold);
        }
      }
      .cal__week-label {
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: 1rem;
        font-style: italic;
        color: var(--dark);
        min-width: 220px;
        text-align: center;
        white-space: nowrap;
      }
      .cal__today-btn {
        padding: 0.5rem 1rem;
        border: 1px solid rgba(26, 22, 20, 0.18);
        background: var(--white);
        color: var(--dark);
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.68rem;
        font-weight: 600;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        cursor: pointer;
        border-radius: 1px;
        transition: all 0.25s;
        &:hover {
          border-color: var(--gold);
          color: var(--gold);
        }
      }

      /* ── Leyenda ── */
      .cal__legend {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
        flex-wrap: wrap;
      }
      .cal__legend-item {
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.58rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        padding: 0.25rem 0.65rem;
        border: 1px solid;
      }
      .cal__legend-item--pending {
        color: var(--dark-mid);
        border-color: var(--dark-soft);
        background: var(--dark-faint);
      }
      .cal__legend-item--confirmed {
        color: #8a6b30;
        border-color: var(--gold-mid);
        background: var(--gold-soft);
      }
      .cal__legend-item--completed {
        color: #4c9150;
        border-color: rgba(76, 145, 80, 0.35);
        background: rgba(76, 145, 80, 0.07);
      }
      .cal__legend-item--cancelled {
        color: #c93838;
        border-color: rgba(220, 50, 50, 0.3);
        background: rgba(220, 50, 50, 0.06);
      }

      /* ── Loading ── */
      .cal__loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 5rem 1rem;
        background: var(--white);
        border: 1px solid var(--gold-mid);
        text-align: center;
        svg {
          color: var(--gold);
          opacity: 0.4;
        }
        p {
          font-family: var(--font-display, 'Cormorant Garamond', serif);
          font-size: 1.1rem;
          font-style: italic;
          color: var(--dark-mid);
        }
      }

      /* ── Grid ── */
      .cal__wrap {
        overflow-x: auto;
        border: 1px solid var(--dark-soft);
        background: var(--white);
        box-shadow: 0 8px 24px rgba(26, 22, 20, 0.06);
      }
      .cal__grid {
        display: grid;
        grid-template-columns: 56px repeat(6, 1fr);
        min-width: 700px;
      }

      .cal__corner {
        background: var(--cream);
        border-bottom: 1px solid var(--dark-soft);
        border-right: 1px solid var(--dark-soft);
      }
      .cal__day-header {
        background: var(--cream);
        border-bottom: 1px solid var(--dark-soft);
        border-right: 1px solid var(--dark-soft);
        padding: 0.75rem 0.5rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        &--today {
          background: var(--gold-soft);
        }
      }
      .cal__day-name {
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.6rem;
        font-weight: 600;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--dark-mid);
      }
      .cal__day-num {
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: 1.4rem;
        font-weight: 500;
        color: var(--dark);
        line-height: 1;
        &--today {
          color: var(--gold);
          font-weight: 600;
        }
      }

      .cal__time {
        border-right: 1px solid var(--dark-soft);
        border-bottom: 1px solid var(--dark-soft);
        padding: 0.4rem 0.5rem 0;
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.6rem;
        color: var(--dark-mid);
        text-align: right;
        background: var(--cream);
        min-height: 54px;
        display: flex;
        align-items: flex-start;
        justify-content: flex-end;
      }

      .cal__cell {
        border-right: 1px solid var(--dark-soft);
        border-bottom: 1px solid var(--dark-soft);
        padding: 2px;
        min-height: 54px;
        background: var(--white);
        transition: background 0.2s;
        &:hover {
          background: rgba(200, 169, 110, 0.03);
        }
        &--today {
          background: rgba(200, 169, 110, 0.03);
        }
        &--closed {
          background: rgba(26, 22, 20, 0.03);
          cursor: not-allowed;
        }
      }

      /* ── Cita en grid ── */
      .cal__apt {
        border-radius: 1px;
        padding: 0.25rem 0.45rem;
        margin-bottom: 2px;
        display: flex;
        flex-direction: column;
        gap: 1px;
        cursor: pointer;
        font-size: 0.62rem;
        transition:
          opacity 0.2s,
          transform 0.2s;
        border: 1px solid;
        &:hover {
          opacity: 0.8;
          transform: scale(1.01);
        }
      }
      .cal__apt--pending {
        background: var(--dark-faint);
        border-color: var(--dark-soft);
        color: var(--dark-mid);
      }
      .cal__apt--confirmed {
        background: var(--gold-soft);
        border-color: var(--gold-mid);
        color: #8a6b30;
      }
      .cal__apt--completed {
        background: rgba(76, 145, 80, 0.08);
        border-color: rgba(76, 145, 80, 0.35);
        color: #4c9150;
      }
      .cal__apt--cancelled {
        background: rgba(220, 50, 50, 0.06);
        border-color: rgba(220, 50, 50, 0.25);
        color: #c93838;
        opacity: 0.7;
      }

      .cal__apt-time {
        font-family: var(--font-body, 'Inter', sans-serif);
        font-weight: 700;
        font-size: 0.58rem;
        letter-spacing: 0.05em;
      }
      .cal__apt-name {
        font-family: var(--font-body, 'Inter', sans-serif);
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .cal__apt-service {
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-style: italic;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        opacity: 0.8;
      }

      /* ── Modal ── */
      .cal__overlay {
        position: fixed;
        inset: 0;
        z-index: 300;
        background: rgba(26, 22, 20, 0.55);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
      }
      .cal__modal {
        background: var(--white);
        width: 100%;
        max-width: 480px;
        max-height: 90vh;
        overflow-y: auto;
        padding: 2.5rem;
        position: relative;
        box-shadow: 0 30px 60px rgba(26, 22, 20, 0.15);
        border: 1px solid rgba(200, 169, 110, 0.2);
      }
      .cal__modal-line {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, var(--gold) 50%, transparent);
      }
      .cal__modal-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 1.75rem;
        gap: 1rem;
      }
      .cal__modal-title {
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: 1.7rem;
        font-weight: 500;
        color: var(--dark);
        line-height: 1.15;
        margin-top: 0.3rem;
        em {
          color: var(--gold);
          font-style: italic;
        }
      }
      .cal__modal-close {
        background: none;
        border: none;
        color: var(--dark-mid);
        cursor: pointer;
        padding: 4px;
        transition: color 0.25s;
        flex-shrink: 0;
        &:hover {
          color: var(--dark);
        }
      }

      .cal__detail-grid {
        display: flex;
        flex-direction: column;
        border: 1px solid var(--dark-soft);
        overflow: hidden;
        margin-bottom: 1.25rem;
      }
      .cal__detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--dark-soft);
        gap: 1rem;
        &:last-child {
          border-bottom: none;
        }
        &--full {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.3rem;
        }
      }
      .cal__detail-label {
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.58rem;
        font-weight: 600;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--gold);
        flex-shrink: 0;
      }
      .cal__detail-value {
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.85rem;
        color: var(--dark);
        text-align: right;
        strong {
          color: var(--gold);
          font-weight: 600;
        }
      }
      .cal__detail-price {
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--gold);
      }

      .cal__detail-status {
        margin-bottom: 1.25rem;
      }
      .cal__badge {
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.58rem;
        font-weight: 600;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        padding: 0.25rem 0.65rem;
        border: 1px solid;
        display: inline-block;
      }
      .cal__badge--pending {
        color: var(--dark-mid);
        border-color: var(--dark-soft);
        background: var(--dark-faint);
      }
      .cal__badge--confirmed {
        color: #8a6b30;
        border-color: var(--gold-mid);
        background: var(--gold-soft);
      }
      .cal__badge--completed {
        color: #4c9150;
        border-color: rgba(76, 145, 80, 0.35);
        background: rgba(76, 145, 80, 0.07);
      }
      .cal__badge--cancelled {
        color: #c93838;
        border-color: rgba(220, 50, 50, 0.3);
        background: rgba(220, 50, 50, 0.06);
      }

      .cal__detail-actions {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
      }
      .cal__action {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.65rem 1.1rem;
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.62rem;
        font-weight: 600;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.25s;
        border: 1px solid;
        border-radius: 1px;
        &:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      }
      .cal__action--edit {
        background: var(--dark-faint);
        border-color: var(--dark-soft);
        color: var(--dark-mid);
        &:hover:not(:disabled) {
          background: var(--dark);
          color: var(--cream);
          border-color: var(--dark);
        }
      }
      .cal__action--confirm {
        background: var(--gold-soft);
        border-color: var(--gold-mid);
        color: #8a6b30;
        &:hover:not(:disabled) {
          background: var(--gold);
          color: var(--white);
        }
      }
      .cal__action--complete {
        background: rgba(76, 145, 80, 0.08);
        border-color: rgba(76, 145, 80, 0.4);
        color: #4c9150;
        &:hover:not(:disabled) {
          background: #4c9150;
          color: var(--white);
        }
      }
      .cal__action--cancel {
        background: transparent;
        border-color: var(--dark-soft);
        color: var(--dark-mid);
        &:hover:not(:disabled) {
          border-color: #c93838;
          color: #c93838;
        }
      }
      .cal__action--back {
        background: transparent;
        border-color: var(--dark-soft);
        color: var(--dark-mid);
        &:hover {
          color: var(--dark);
          border-color: var(--dark);
        }
      }
      .cal__action--save {
        background: var(--dark);
        color: var(--cream);
        border-color: var(--dark);
        position: relative;
        overflow: hidden;
        &::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--gold);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        &:hover:not(:disabled) {
          color: var(--dark);
          border-color: var(--gold);
        }
        &:hover:not(:disabled)::before {
          transform: scaleX(1);
        }
        span {
          position: relative;
          z-index: 1;
        }
        &:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      }

      .cal__edit-current {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.85rem 1rem;
        background: var(--cream);
        border: 1px solid rgba(200, 169, 110, 0.2);
        margin-bottom: 1.5rem;
      }
      .cal__edit-current-value {
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: 0.95rem;
        font-style: italic;
        color: var(--dark);
        strong {
          color: var(--gold);
        }
      }
      .cal__edit-error {
        background: rgba(220, 50, 50, 0.06);
        border: 1px solid rgba(220, 50, 50, 0.25);
        color: #c93838;
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.8rem;
        padding: 0.75rem 1rem;
        margin-bottom: 1.25rem;
      }
      .cal__edit-warn {
        background: rgba(200, 169, 110, 0.08);
        border: 1px solid rgba(200, 169, 110, 0.3);
        color: #a07835;
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.78rem;
        padding: 0.75rem 1rem;
        margin-top: 1rem;
      }
      .cal__edit-form {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }
      .cal__edit-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        label {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.6rem;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--gold);
        }
        input,
        select {
          background: #fbf8f3;
          border: 1px solid var(--dark-soft);
          color: var(--dark);
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.88rem;
          padding: 0.85rem 1rem;
          border-radius: 1px;
          outline: none;
          width: 100%;
          transition: border-color 0.25s;
          &:focus {
            border-color: var(--gold);
            background: var(--white);
          }
          option {
            background: var(--white);
          }
        }
      }
      .cal__edit-foot {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--dark-soft);
      }
    `,
  ],
})
export class AdminCalendarComponent implements OnInit {
  appointments = signal<AdminAppointment[]>([]);
  loading = signal(true);
  updating = signal(false);

  modal = signal<ModalData | null>(null);

  editMode = signal(false);
  editSaving = signal(false);
  editError = signal<string | null>(null);
  editDate = '';
  editTime = '09:00';

  get todayISO(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  isSelectedSunday = computed(() => !!this.editDate && new Date(this.editDate).getDay() === 0);
  editableSlots = computed(() => {
    if (this.editDate && new Date(this.editDate).getDay() === 6)
      return ALL_SLOTS.filter((s) => s < '15:00');
    return ALL_SLOTS;
  });

  private weekStart = signal<Date>(this.getMonday(new Date()));
  readonly timeSlots = ALL_SLOTS;

  constructor(
    private http: HttpClient,
    private datePipe: DatePipe,
  ) {}

  weekDays = computed(() => {
    const monday = this.weekStart();
    const today = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        iso: this.toISO(d),
        name: d.toLocaleDateString('es-ES', { weekday: 'short' }),
        num: d.getDate(),
        isToday: d.toDateString() === today.toDateString(),
        isSunday: d.getDay() === 0,
        isSaturday: d.getDay() === 6,
      };
    });
  });

  weekLabel = computed(() => {
    const days = this.weekDays();
    const d0 = new Date(days[0].iso);
    const d1 = new Date(days[days.length - 1].iso);
    const m0 = d0.toLocaleDateString('es-ES', { month: 'long' });
    const m1 = d1.toLocaleDateString('es-ES', { month: 'long' });
    const year = d1.getFullYear();
    return m0 === m1
      ? `${days[0].num} – ${days[days.length - 1].num} de ${m0} ${year}`
      : `${days[0].num} ${m0} – ${days[days.length - 1].num} ${m1} ${year}`;
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.http
      .get<{ data: { appointments: AdminAppointment[] } }>(`${environment.apiUrl}/appointments`)
      .pipe(map((res) => res.data.appointments))
      .subscribe({
        next: (a) => {
          this.appointments.set(a);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  prevWeek() {
    this.weekStart.update((d) => {
      const n = new Date(d);
      n.setDate(d.getDate() - 7);
      return n;
    });
  }
  nextWeek() {
    this.weekStart.update((d) => {
      const n = new Date(d);
      n.setDate(d.getDate() + 7);
      return n;
    });
  }
  goToToday() {
    this.weekStart.set(this.getMonday(new Date()));
  }

  getMonday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
    date.setHours(0, 0, 0, 0);
    return date;
  }

  toISO(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  formatTime(dateTime: string): string {
    const d = new Date(dateTime);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  getApts(isoDate: string, slot: string): AdminAppointment[] {
    return this.appointments().filter((a) => {
      const d = new Date(a.date_time);
      return this.toISO(d) === isoDate && this.formatTime(a.date_time) === slot;
    });
  }

  openDetail(apt: AdminAppointment) {
    const d = new Date(apt.date_time);
    const dateLabel = d.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const timeLabel = this.formatTime(apt.date_time);
    const priceLabel = `${apt.service.price} €`;

    this.modal.set({ apt, dateLabel, timeLabel, priceLabel });
    this.editMode.set(false);
    this.editError.set(null);
  }

  closeDetail() {
    this.modal.set(null);
    this.editMode.set(false);
    this.editError.set(null);
  }

  openEdit() {
    if (!this.modal()) return;
    const d = new Date(this.modal()!.apt.date_time);
    this.editDate = this.toISO(d);
    this.editTime = this.formatTime(this.modal()!.apt.date_time);
    this.editError.set(null);
    this.editMode.set(true);
  }

  closeEdit() {
    this.editMode.set(false);
    this.editError.set(null);
  }

  onSaveEdit() {
    if (!this.modal() || !this.editDate || !this.editTime) return;
    this.editSaving.set(true);
    this.editError.set(null);

    this.http
      .put(`${environment.apiUrl}/appointments/${this.modal()!.apt.id}`, {
        date: this.editDate,
        time: this.editTime,
      })
      .subscribe({
        next: (res: any) => {
          const updated = res.data.appointment;
          this.appointments.update((list) =>
            list.map((a) => (a.id === updated.id ? { ...a, date_time: updated.date_time } : a)),
          );
          const newD = new Date(updated.date_time);
          this.modal.update((m) =>
            m
              ? {
                  ...m,
                  apt: { ...m.apt, date_time: updated.date_time },
                  dateLabel: newD.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  }),
                  timeLabel: this.formatTime(updated.date_time),
                }
              : null,
          );
          this.editSaving.set(false);
          this.editMode.set(false);
        },
        error: (err) => {
          this.editError.set(err.error?.message || 'Error al guardar el cambio');
          this.editSaving.set(false);
        },
      });
  }

  updateStatus(id: number, status: AdminAppointment['status']) {
    this.updating.set(true);
    this.http.put(`${environment.apiUrl}/appointments/${id}/status`, { status }).subscribe({
      next: () => {
        this.appointments.update((list) => list.map((a) => (a.id === id ? { ...a, status } : a)));
        this.modal.update((m) => (m?.apt.id === id ? { ...m, apt: { ...m.apt, status } } : m));
        this.updating.set(false);
      },
      error: () => this.updating.set(false),
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmada',
      CANCELLED: 'Cancelada',
      COMPLETED: 'Completada',
    };
    return labels[status] ?? status;
  }
}
