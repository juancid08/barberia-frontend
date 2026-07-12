import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentService, Appointment } from '../../core/services/appointment.service';
import { environment } from '../../../environments/environment';

const TIME_SLOTS: string[] = [];
for (let h = 9; h < 20; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2,'0')}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2,'0')}:30`);
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="pf">
      <div class="container">

        <!-- ── Header ── -->
        <div class="pf__header">
          <div class="pf__avatar">{{ initial() }}</div>
          <div class="pf__identity">
            <p class="pf__label">Mi cuenta</p>
            <h1 class="pf__name">{{ user()?.name }}</h1>
            <p class="pf__email">
              <span class="pf__diamond"></span>
              {{ user()?.email }}
            </p>
          </div>
          <button class="pf__logout" (click)="onLogout()">
            <span>Cerrar sesión</span>
          </button>
        </div>

        <div class="pf__divider"></div>

        <!-- ── Citas ── -->
        <div class="pf__section">
          <div class="pf__section-head">
            <div>
              <p class="pf__label">Reservas</p>
              <h2 class="pf__section-title">Mis <em>citas</em></h2>
            </div>
            <a routerLink="/" fragment="servicios" class="pf__new">
              <span>Nueva reserva</span>
            </a>
          </div>

          @if (loading()) {
            <div class="pf__loading">Cargando citas...</div>
          } @else if (appointments().length === 0) {
            <div class="pf__empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="56" height="56">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <p class="pf__empty-text">Aún no tienes citas reservadas.</p>
              <a routerLink="/" fragment="servicios" class="pf__new"><span>Reservar ahora</span></a>
            </div>
          } @else {
            <div class="pf__appointments">
              @for (apt of appointments(); track apt.id) {
                <article class="pf__apt" [class]="'pf__apt--' + apt.status.toLowerCase()">

                  <div class="pf__apt-date">
                    <span class="pf__apt-day">{{ apt.date_time | date:'dd' }}</span>
                    <span class="pf__apt-month">{{ apt.date_time | date:'MMM' | uppercase }}</span>
                    <span class="pf__apt-time">{{ apt.date_time | date:'HH:mm' }}</span>
                  </div>

                  <div class="pf__apt-divider"></div>

                  <div class="pf__apt-info">
                    <p class="pf__apt-service">{{ apt.service.name }}</p>
                    <p class="pf__apt-meta">
                      {{ apt.date_time | date:'EEEE, d MMMM':'':'es' }} ·
                      <strong>{{ apt.date_time | date:'HH:mm' }}</strong> ·
                      {{ apt.service.duration_min }} min
                    </p>
                    @if (apt.notes) {
                      <p class="pf__apt-notes">"{{ apt.notes }}"</p>
                    }
                    <!-- Badge solicitud pendiente -->
                    @if (hasPendingRequest(apt.id)) {
                      <p class="pf__apt-request-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="12" height="12">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        Cambio pendiente de aprobación
                      </p>
                    }
                  </div>

                  <div class="pf__apt-right">
                    <span class="pf__apt-price">{{ apt.service.price | currency:'EUR':'symbol':'1.0-0' }}</span>
                    <span class="pf__apt-status" [class]="'pf__apt-status--' + apt.status.toLowerCase()">
                      {{ statusLabel(apt.status) }}
                    </span>
                    <div class="pf__apt-actions">
                      <!-- Solicitar cambio (solo si canEdit) -->
                      @if (canEdit(apt) && !hasPendingRequest(apt.id)) {
                        <button class="pf__apt-edit" (click)="openChangeRequest(apt)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="12" height="12">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          Solicitar cambio
                        </button>
                      }
                      <!-- Cancelar -->
                      @if (apt.status === 'PENDING' || apt.status === 'CONFIRMED') {
                        <button class="pf__apt-cancel" (click)="cancelApt(apt)"
                                [disabled]="cancelling() === apt.id">
                          {{ cancelling() === apt.id ? 'Cancelando...' : 'Cancelar' }}
                        </button>
                      }
                    </div>
                  </div>

                </article>
              }
            </div>
          }
        </div>

      </div>
    </section>

    <!-- ══ MODAL SOLICITUD DE CAMBIO ══ -->
    @if (changeModal()) {
      <div class="pf__overlay" (click)="closeChangeRequest()">
        <div class="pf__modal" (click)="$event.stopPropagation()">
          <div class="pf__modal-line"></div>

          <div class="pf__modal-head">
            <div>
              <p class="pf__label">Solicitar cambio</p>
              <h2 class="pf__modal-title">Nueva <em>fecha y hora</em></h2>
            </div>
            <button class="pf__modal-close" (click)="closeChangeRequest()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Cita actual -->
          <div class="pf__modal-current">
            <span class="pf__modal-current-label">Cita actual</span>
            <span class="pf__modal-current-value">
              {{ changeModal()!.date_time | date:'EEEE d MMM':'':'es' }} ·
              <strong>{{ changeModal()!.date_time | date:'HH:mm' }}</strong>
            </span>
          </div>

          <!-- Aviso -->
          <div class="pf__modal-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>Tu solicitud será revisada por el administrador. Recibirás un email con la decisión.</p>
          </div>

          @if (changeError()) {
            <p class="pf__modal-error">{{ changeError() }}</p>
          }

          <div class="pf__modal-form">
            <!-- Fecha -->
            <div class="pf__modal-field">
              <label>Nueva fecha</label>
              <input type="date" [(ngModel)]="changeDate" name="date" [min]="todayISO" />
            </div>

            <!-- Hora -->
            <div class="pf__modal-field">
              <label>Nueva hora</label>
              <select [(ngModel)]="changeTime" name="time">
                @for (slot of availableSlots(); track slot) {
                  <option [value]="slot">{{ slot }}</option>
                }
              </select>
            </div>

            <!-- Motivo -->
            <div class="pf__modal-field">
              <label>Motivo del cambio <span class="pf__optional">(opcional)</span></label>
              <input type="text" [(ngModel)]="changeReason" name="reason"
                     placeholder="Ej: Surgió un imprevisto, viaje..." />
            </div>
          </div>

          @if (isSelectedSunday()) {
            <p class="pf__modal-warn">⚠ Los domingos la barbería está cerrada.</p>
          }

          <div class="pf__modal-foot">
            <button class="pf__modal-cancel-btn" (click)="closeChangeRequest()">Cancelar</button>
            <button class="pf__modal-save-btn"
                    (click)="onSubmitChangeRequest()"
                    [disabled]="changeSaving() || !changeDate || !changeTime || isSelectedSunday()">
              <span>{{ changeSaving() ? 'Enviando...' : 'Enviar solicitud' }}</span>
            </button>
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    /* ── Base ── */
    .pf { background: #f5f1ea; padding-top: calc(var(--navbar-height) + 4rem); padding-bottom: 6rem; min-height: 100vh; }

    /* ── Header ── */
    .pf__header { display: flex; align-items: center; gap: 1.75rem; margin-bottom: 3rem; flex-wrap: wrap; }
    .pf__avatar { width: 76px; height: 76px; border-radius: 50%; flex-shrink: 0; background: #ffffff; border: 1px solid rgba(200,169,110,0.45); color: #c8a96e; font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 2.1rem; font-weight: 600; font-style: italic; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(26,22,20,0.06); }
    .pf__identity { flex: 1; min-width: 200px; }
    .pf__label { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.32em; text-transform: uppercase; color: #c8a96e; margin-bottom: 0.6rem; display: block; }
    .pf__name  { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 2.4rem; font-weight: 500; color: #1a1614; line-height: 1.05; letter-spacing: 0.01em; margin-bottom: 0.5rem; }
    .pf__email { display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-body,'Inter',sans-serif); font-size: 0.85rem; color: rgba(26,22,20,0.55); }
    .pf__diamond { width: 5px; height: 5px; background: #c8a96e; transform: rotate(45deg); flex-shrink: 0; }

    .pf__logout { display: inline-flex; align-items: center; padding: 0.72rem 1.6rem; background: transparent; color: #1a1614; border: 1px solid rgba(26,22,20,0.25); border-radius: 1px; font-family: var(--font-body,'Inter',sans-serif); font-size: 0.65rem; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; cursor: pointer; transition: all 0.3s; margin-left: auto; &:hover { background: #1a1614; color: #c8a96e; border-color: #1a1614; } }

    .pf__divider { height: 1px; width: 100%; background: linear-gradient(90deg, transparent, rgba(200,169,110,0.4) 50%, transparent); margin-bottom: 3rem; }

    /* ── Sección ── */
    .pf__section-head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 2.5rem; gap: 1.5rem; flex-wrap: wrap; }
    .pf__section-title { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: clamp(1.8rem,3.5vw,2.4rem); font-weight: 500; color: #1a1614; line-height: 1.1; letter-spacing: 0.01em; margin-top: 0.3rem; em { color: #c8a96e; font-style: italic; font-weight: 600; } }

    .pf__new { display: inline-flex; align-items: center; justify-content: center; padding: 0.85rem 1.85rem; background: #1a1614; color: #f5f1ea; border: 1px solid #1a1614; border-radius: 1px; font-family: var(--font-body,'Inter',sans-serif); font-size: 0.66rem; font-weight: 600; letter-spacing: 0.26em; text-transform: uppercase; text-decoration: none; cursor: pointer; position: relative; overflow: hidden; transition: color 0.3s, border-color 0.3s;
      &::before { content: ''; position: absolute; inset: 0; background: #c8a96e; transform: scaleX(0); transform-origin: left; transition: transform 0.4s cubic-bezier(0.22,1,0.36,1); }
      &:hover { color: #1a1614; border-color: #c8a96e; } &:hover::before { transform: scaleX(1); }
      span { position: relative; z-index: 1; }
    }

    /* ── Loading / Empty ── */
    .pf__loading { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 1rem; font-style: italic; color: rgba(26,22,20,0.45); padding: 3rem 0; }
    .pf__empty { display: flex; flex-direction: column; align-items: center; gap: 1.25rem; padding: 5rem 1rem; background: #ffffff; border: 1px solid rgba(200,169,110,0.2); text-align: center; svg { color: #c8a96e; opacity: 0.5; } }
    .pf__empty-text { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 1.15rem; font-style: italic; color: rgba(26,22,20,0.5); margin-bottom: 0.5rem; }

    /* ── Cards ── */
    .pf__appointments { display: flex; flex-direction: column; gap: 1rem; }
    .pf__apt { display: flex; align-items: center; gap: 1.75rem; background: #ffffff; border: 1px solid rgba(26,22,20,0.08); padding: 1.5rem 1.75rem; transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s; position: relative;
      &:hover { border-color: rgba(200,169,110,0.4); box-shadow: 0 8px 24px rgba(26,22,20,0.06); transform: translateY(-2px); }
    }
    .pf__apt--cancelled { opacity: 0.55; }
    .pf__apt--completed { border-left: 2px solid #4c9150; }
    .pf__apt--confirmed { border-left: 2px solid #c8a96e; }
    .pf__apt--pending   { border-left: 2px solid rgba(26,22,20,0.3); }
    .pf__apt--cancelled { border-left: 2px solid #c93838; }

    .pf__apt-date { display: flex; flex-direction: column; align-items: center; min-width: 52px; flex-shrink: 0; }
    .pf__apt-day   { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 2.2rem; font-weight: 600; color: #1a1614; line-height: 1; }
    .pf__apt-month { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.22em; color: #c8a96e; margin-top: 0.3rem; }
    .pf__apt-time  { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 0.85rem; font-style: italic; font-weight: 600; color: #c8a96e; margin-top: 0.35rem; }

    .pf__apt-divider { width: 1px; height: 60px; background: linear-gradient(to bottom, transparent, rgba(200,169,110,0.45), transparent); flex-shrink: 0; }

    .pf__apt-info { flex: 1; min-width: 200px; }
    .pf__apt-service { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 1.2rem; font-weight: 500; color: #1a1614; margin-bottom: 0.35rem; }
    .pf__apt-meta    { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.78rem; color: rgba(26,22,20,0.55); line-height: 1.5; strong { color: #c8a96e; font-weight: 600; } }
    .pf__apt-notes   { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 0.85rem; font-style: italic; color: rgba(26,22,20,0.5); margin-top: 0.5rem; }

    .pf__apt-request-badge { display: inline-flex; align-items: center; gap: 0.4rem; margin-top: 0.5rem; font-family: var(--font-body,'Inter',sans-serif); font-size: 0.62rem; font-weight: 500; letter-spacing: 0.08em; color: #c8a96e; svg { flex-shrink: 0; } }

    .pf__apt-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; flex-shrink: 0; }
    .pf__apt-price { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 1.5rem; font-weight: 600; color: #c8a96e; line-height: 1; }

    .pf__apt-status { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.58rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; padding: 0.25rem 0.65rem; border-radius: 1px; border: 1px solid; }
    .pf__apt-status--pending   { color: rgba(26,22,20,0.5); border-color: rgba(26,22,20,0.2); background: rgba(26,22,20,0.04); }
    .pf__apt-status--confirmed { color: #c8a96e; border-color: rgba(200,169,110,0.4); background: rgba(200,169,110,0.08); }
    .pf__apt-status--completed { color: #4c9150; border-color: rgba(76,145,80,0.35); background: rgba(76,145,80,0.07); }
    .pf__apt-status--cancelled { color: #c93838; border-color: rgba(220,50,50,0.3); background: rgba(220,50,50,0.06); }

    .pf__apt-actions { display: flex; flex-direction: column; gap: 0.3rem; align-items: flex-end; }

    .pf__apt-edit { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.62rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; background: none; border: 1px solid rgba(26,22,20,0.18); color: rgba(26,22,20,0.55); cursor: pointer; padding: 0.3rem 0.65rem; border-radius: 1px; transition: all 0.25s; display: flex; align-items: center; gap: 0.3rem; svg { flex-shrink: 0; } &:hover { border-color: #c8a96e; color: #c8a96e; } }

    .pf__apt-cancel { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.62rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; background: none; border: none; cursor: pointer; color: rgba(26,22,20,0.45); padding: 0.3rem 0; transition: color 0.25s; &:hover { color: #c93838; } &:disabled { opacity: 0.4; cursor: not-allowed; } }

    /* ── Modal ── */
    .pf__overlay { position: fixed; inset: 0; z-index: 300; background: rgba(26,22,20,0.55); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
    .pf__modal { background: #ffffff; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; padding: 2.5rem; position: relative; box-shadow: 0 30px 60px rgba(26,22,20,0.15); border: 1px solid rgba(200,169,110,0.2); }
    .pf__modal-line { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #c8a96e 50%, transparent); }
    .pf__modal-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.75rem; gap: 1rem; }
    .pf__modal-title { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 1.7rem; font-weight: 500; color: #1a1614; line-height: 1.15; margin-top: 0.3rem; em { color: #c8a96e; font-style: italic; } }
    .pf__modal-close { background: none; border: none; color: rgba(26,22,20,0.45); cursor: pointer; padding: 4px; transition: color 0.25s; flex-shrink: 0; &:hover { color: #1a1614; } }

    .pf__modal-current { display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 1rem; background: #f5f1ea; border: 1px solid rgba(200,169,110,0.2); margin-bottom: 1rem; }
    .pf__modal-current-label { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.58rem; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(26,22,20,0.5); }
    .pf__modal-current-value { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 0.95rem; font-style: italic; color: #1a1614; strong { color: #c8a96e; } }

    .pf__modal-notice { display: flex; align-items: flex-start; gap: 0.6rem; background: rgba(200,169,110,0.08); border: 1px solid rgba(200,169,110,0.25); padding: 0.85rem 1rem; margin-bottom: 1.5rem; svg { color: #c8a96e; flex-shrink: 0; margin-top: 1px; } p { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.78rem; color: rgba(26,22,20,0.6); line-height: 1.5; } }

    .pf__modal-error { background: rgba(220,50,50,0.06); border: 1px solid rgba(220,50,50,0.25); color: #c93838; font-family: var(--font-body,'Inter',sans-serif); font-size: 0.8rem; padding: 0.75rem 1rem; margin-bottom: 1.25rem; }
    .pf__modal-warn  { background: rgba(200,169,110,0.08); border: 1px solid rgba(200,169,110,0.3); color: #a07835; font-family: var(--font-body,'Inter',sans-serif); font-size: 0.78rem; padding: 0.75rem 1rem; margin-top: 1rem; }

    .pf__modal-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .pf__modal-field { display: flex; flex-direction: column; gap: 0.5rem;
      label { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: #c8a96e; }
      input, select { background: #fbf8f3; border: 1px solid rgba(26,22,20,0.12); color: #1a1614; font-family: var(--font-body,'Inter',sans-serif); font-size: 0.88rem; padding: 0.85rem 1rem; border-radius: 1px; outline: none; width: 100%; transition: border-color 0.25s; &:focus { border-color: #c8a96e; background: #ffffff; } option { background: #ffffff; } }
    }
    .pf__optional { font-weight: 400; letter-spacing: 0; text-transform: none; color: rgba(26,22,20,0.45); font-size: 0.58rem; }

    .pf__modal-foot { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(26,22,20,0.08); }
    .pf__modal-cancel-btn { padding: 0.85rem 1.5rem; background: transparent; border: 1px solid rgba(26,22,20,0.2); color: rgba(26,22,20,0.6); font-family: var(--font-body,'Inter',sans-serif); font-size: 0.68rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; transition: all 0.25s; border-radius: 1px; &:hover { border-color: #1a1614; color: #1a1614; } }
    .pf__modal-save-btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.85rem 1.85rem; background: #1a1614; color: #f5f1ea; border: 1px solid #1a1614; font-family: var(--font-body,'Inter',sans-serif); font-size: 0.68rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; position: relative; overflow: hidden; border-radius: 1px; transition: color 0.3s, border-color 0.3s;
      &::before { content: ''; position: absolute; inset: 0; background: #c8a96e; transform: scaleX(0); transform-origin: left; transition: transform 0.4s cubic-bezier(0.22,1,0.36,1); }
      &:hover:not(:disabled) { color: #1a1614; border-color: #c8a96e; } &:hover:not(:disabled)::before { transform: scaleX(1); }
      span { position: relative; z-index: 1; } &:disabled { opacity: 0.4; cursor: not-allowed; }
    }

    /* ── Responsive ── */
    @media (max-width: 720px) {
      .pf { padding-top: calc(var(--navbar-height) + 2.5rem); padding-bottom: 4rem; }
      .pf__apt { flex-wrap: wrap; gap: 1rem; }
      .pf__apt-divider { display: none; }
      .pf__apt-info { min-width: 100%; order: 3; }
      .pf__apt-right { flex-direction: row; align-items: center; width: 100%; justify-content: space-between; order: 4; padding-top: 1rem; border-top: 1px solid rgba(26,22,20,0.08); }
      .pf__apt-actions { flex-direction: row; align-items: center; }
      .pf__logout { margin-left: 0; width: 100%; justify-content: center; }
    }
  `]
})
export class ProfileComponent implements OnInit {
  private auth           = inject(AuthService);
  private appointmentSvc = inject(AppointmentService);
  private router         = inject(Router);
  private http           = inject(HttpClient);

  user         = this.auth.currentUser;
  appointments = signal<Appointment[]>([]);
  loading      = signal(true);
  cancelling   = signal<number | null>(null);

  // Solicitudes de cambio pendientes
  pendingRequests = signal<number[]>([]); // IDs de citas con solicitud pendiente

  // Modal de cambio
  changeModal  = signal<Appointment | null>(null);
  changeSaving = signal(false);
  changeError  = signal<string | null>(null);
  changeDate   = '';
  changeTime   = '09:00';
  changeReason = '';

  readonly timeSlots = TIME_SLOTS;

  get todayISO(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  isSelectedSunday = computed(() => !!this.changeDate && new Date(this.changeDate).getDay() === 0);

  availableSlots = computed(() => {
    if (this.changeDate && new Date(this.changeDate).getDay() === 6) {
      return TIME_SLOTS.filter(s => s < '15:00');
    }
    return TIME_SLOTS;
  });

  initial = () => this.user()?.name?.charAt(0).toUpperCase() ?? '?';

  ngOnInit() {
    this.appointmentSvc.getMyAppointments().subscribe({
      next: a => {
        this.appointments.set(a);
        this.loading.set(false);
        this.loadPendingRequests();
      },
      error: () => this.loading.set(false),
    });
  }

  // Cargar solicitudes pendientes del usuario
  loadPendingRequests() {
    this.http.get<{ data: { requests: any[] } }>(`${environment.apiUrl}/change-requests/my`).subscribe({
      next: res => {
        const ids = res.data.requests.map(r => r.appointmentId);
        this.pendingRequests.set(ids);
      },
      error: () => {},
    });
  }

  hasPendingRequest(aptId: number): boolean {
    return this.pendingRequests().includes(aptId);
  }

  // Determina si la cita es editable (PENDING o CONFIRMED y con más de 2h)
  canEdit(apt: Appointment): boolean {
    if (!['PENDING', 'CONFIRMED'].includes(apt.status)) return false;
    const hoursUntil = (new Date(apt.date_time).getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntil >= 2;
    
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pendiente', CONFIRMED: 'Confirmada',
      CANCELLED: 'Cancelada', COMPLETED: 'Completada',
    };
    return labels[status] ?? status;
  }

  cancelApt(apt: Appointment) {
    this.cancelling.set(apt.id);
    this.appointmentSvc.cancel(apt.id).subscribe({
      next: () => {
        this.appointments.update(list =>
          list.map(a => a.id === apt.id ? { ...a, status: 'CANCELLED' as const } : a)
        );
        this.cancelling.set(null);
      },
      error: () => this.cancelling.set(null),
    });
  }

  // ── Modal solicitud de cambio ──────────────────────────────────────────────
  openChangeRequest(apt: Appointment) {
    const d = new Date(apt.date_time);
    this.changeDate   = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    this.changeTime   = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    this.changeReason = '';
    this.changeError.set(null);
    this.changeModal.set(apt);
  }

  closeChangeRequest() {
    this.changeModal.set(null);
    this.changeError.set(null);
  }

  onSubmitChangeRequest() {
    if (!this.changeModal() || !this.changeDate || !this.changeTime) return;
    this.changeSaving.set(true);
    this.changeError.set(null);

    this.http.post(
      `${environment.apiUrl}/appointments/${this.changeModal()!.id}/change-request`,
      { date: this.changeDate, time: this.changeTime, reason: this.changeReason || undefined }
    ).subscribe({
      next: () => {
        // Añadir a solicitudes pendientes
        this.pendingRequests.update(ids => [...ids, this.changeModal()!.id]);
        this.changeSaving.set(false);
        this.closeChangeRequest();
      },
      error: err => {
        this.changeError.set(err.error?.message || 'Error al enviar la solicitud');
        this.changeSaving.set(false);
      },
    });
  }

  onLogout() {
    this.auth.logout().subscribe(() => this.router.navigate(['/']));
  }
}