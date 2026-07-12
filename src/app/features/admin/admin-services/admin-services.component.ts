import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, ServicePayload } from '../../../core/services/admin.service';
import { Service } from '../../../core/services/barber.service';

type ModalMode = 'create' | 'edit';
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
type SortOption = 'name' | 'price_asc' | 'price_desc' | 'duration';

@Component({
  selector: 'app-admin-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ap-wrap">
      <!-- ── Header ── -->
      <div class="ap__header">
        <div>
          <p class="ap__label">Panel de administración</p>
          <h1 class="ap__title">Gestión de <em>servicios</em></h1>
          <p class="ap__sub">
            <span class="ap__diamond"></span>
            Cortes, afeitados y tratamientos disponibles
          </p>
        </div>
        <button class="ap__new" (click)="openCreate()">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="14"
            height="14"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Nuevo servicio</span>
        </button>
      </div>

      <div class="ap__divider"></div>

      <!-- ── Toolbar ── -->
      <div class="ap__toolbar">
        <div class="ap__search" [class.focused]="searchFocused">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            width="15"
            height="15"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            [value]="searchQuery()"
            (input)="searchQuery.set($any($event.target).value)"
            (focus)="searchFocused = true"
            (blur)="searchFocused = false"
            placeholder="Buscar servicio..."
          />
          @if (searchQuery()) {
            <button class="ap__clear" (click)="searchQuery.set('')">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                width="13"
                height="13"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          }
        </div>

        <div class="ap__sort">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            width="14"
            height="14"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="15" y2="12" />
            <line x1="3" y1="18" x2="9" y2="18" />
          </svg>
          <select [value]="sortBy()" (change)="sortBy.set($any($event.target).value)">
            <option value="name">Nombre A-Z</option>
            <option value="price_asc">Precio ↑</option>
            <option value="price_desc">Precio ↓</option>
            <option value="duration">Duración</option>
          </select>
        </div>

        <span class="ap__results">{{ filtered().length }} de {{ services().length }}</span>
      </div>

      <!-- Filtros estado -->
      <div class="ap__filter-row">
        <p class="ap__filter-label">Estado</p>
        <div class="ap__filter-group">
          @for (f of statusFilters; track f.value) {
            <button
              class="ap__filter-btn"
              [class.active]="statusFilter() === f.value"
              (click)="statusFilter.set(f.value)"
            >
              {{ f.label }}
              @if (f.value !== 'ALL') {
                <span class="ap__filter-count">{{ countByStatus(f.value) }}</span>
              }
            </button>
          }
        </div>
      </div>

      <!-- ── Tabla ── -->
      @if (loading()) {
        <div class="ap__empty">Cargando servicios...</div>
      } @else if (filtered().length === 0) {
        <div class="ap__empty">
          {{ searchQuery() ? 'Sin resultados para "' + searchQuery() + '"' : 'No hay servicios.' }}
        </div>
      } @else {
        <div class="ap__table-wrap">
          <table class="ap__table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Duración</th>
                <th>Estado</th>
                <th class="ap__th-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (s of filtered(); track s.id) {
                <tr [class.row-inactive]="!s.is_active">
                  <td>
                    <span class="ap__name">{{ s.name }}</span>
                    <span class="ap__desc">{{ s.description }}</span>
                  </td>
                  <td class="ap__price">{{ s.price | currency: 'EUR' : 'symbol' : '1.0-0' }}</td>
                  <td class="ap__duration">{{ s.duration_min }} min</td>
                  <td>
                    <span class="ap__badge" [class.ap__badge--on]="s.is_active">
                      {{ s.is_active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td>
                    <div class="ap__row-actions">
                      <button class="ap__icon-btn" title="Editar" (click)="openEdit(s)">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.5"
                          width="14"
                          height="14"
                        >
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        class="ap__icon-btn"
                        [title]="s.is_active ? 'Desactivar' : 'Activar'"
                        (click)="toggleActive(s)"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.5"
                          width="14"
                          height="14"
                        >
                          <circle cx="12" cy="12" r="10" />
                          @if (s.is_active) {
                            <line x1="8" y1="12" x2="16" y2="12" />
                          } @else {
                            <polyline points="9 12 11 14 15 10" />
                          }
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- ── Modal ── -->
    @if (modalOpen()) {
      <div class="ap__overlay" (click)="closeModal()">
        <div class="ap__modal" (click)="$event.stopPropagation()">
          <div class="ap__modal-line"></div>

          <div class="ap__modal-head">
            <div>
              <p class="ap__label">{{ modalMode() === 'create' ? 'Crear nuevo' : 'Editar' }}</p>
              <h2 class="ap__modal-title">
                {{ modalMode() === 'create' ? 'Nuevo' : 'Editar' }}
                <em>servicio</em>
              </h2>
            </div>
            <button class="ap__close-btn" (click)="closeModal()">
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

          @if (formError()) {
            <p class="ap__form-error">{{ formError() }}</p>
          }

          <form class="ap__form" (ngSubmit)="onSubmit()">
            <div class="ap__field">
              <label>Nombre *</label>
              <input
                type="text"
                [(ngModel)]="form.name"
                name="name"
                placeholder="Ej: Corte clásico"
                required
              />
            </div>
            <div class="ap__field">
              <label>Descripción</label>
              <textarea
                [(ngModel)]="form.description"
                name="description"
                rows="3"
                placeholder="Descripción del servicio"
              ></textarea>
            </div>
            <div class="ap__field-row">
              <div class="ap__field">
                <label>Precio (€) *</label>
                <input
                  type="number"
                  [(ngModel)]="form.price"
                  name="price"
                  placeholder="15"
                  min="0"
                  step="0.5"
                  required
                />
              </div>
              <div class="ap__field">
                <label>Duración (min) *</label>
                <input
                  type="number"
                  [(ngModel)]="form.duration_min"
                  name="duration_min"
                  placeholder="30"
                  min="5"
                  step="5"
                  required
                />
              </div>
            </div>
            <div class="ap__field">
              <label>URL de imagen</label>
              <input
                type="url"
                [(ngModel)]="form.image_url"
                name="image_url"
                placeholder="https://..."
              />
            </div>
            <div class="ap__modal-foot">
              <button type="button" class="ap__btn-ghost" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="ap__btn-primary" [disabled]="saving()">
                <span>{{
                  saving() ? 'Guardando...' : modalMode() === 'create' ? 'Crear' : 'Guardar'
                }}</span>
              </button>
            </div>
          </form>
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

      .ap-wrap {
        background: var(--cream);
      }

      /* ─── Header ─── */
      .ap__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 1.5rem;
        gap: 1.5rem;
        flex-wrap: wrap;
      }
      .ap__label {
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.6rem;
        font-weight: 600;
        letter-spacing: 0.32em;
        text-transform: uppercase;
        color: var(--gold);
        margin-bottom: 0.7rem;
      }
      .ap__title {
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: clamp(2rem, 3.8vw, 2.8rem);
        font-weight: 500;
        color: var(--dark);
        line-height: 1.1;
        margin-bottom: 0.7rem;
      }
      .ap__title em {
        color: var(--gold);
        font-style: italic;
        font-weight: 600;
      }
      .ap__sub {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: 0.95rem;
        font-style: italic;
        color: var(--dark-mid);
      }
      .ap__diamond {
        width: 5px;
        height: 5px;
        background: var(--gold);
        transform: rotate(45deg);
        flex-shrink: 0;
      }

      /* Botón "Nuevo servicio" */
      .ap__new {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.85rem 1.85rem;
        background: var(--dark);
        color: var(--cream);
        border: 1px solid var(--dark);
        border-radius: 1px;
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.66rem;
        font-weight: 600;
        letter-spacing: 0.26em;
        text-transform: uppercase;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        transition:
          color 0.3s,
          border-color 0.3s;
      }
      .ap__new::before {
        content: '';
        position: absolute;
        inset: 0;
        background: var(--gold);
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .ap__new:hover {
        color: var(--dark);
        border-color: var(--gold);
      }
      .ap__new:hover::before {
        transform: scaleX(1);
      }
      .ap__new svg,
      .ap__new span {
        position: relative;
        z-index: 1;
      }

      /* Divider dorado */
      .ap__divider {
        height: 1px;
        width: 100%;
        background: linear-gradient(90deg, transparent, var(--gold-mid) 50%, transparent);
        margin-bottom: 2rem;
      }

      /* ─── Toolbar ─── */
      .ap__toolbar {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
        flex-wrap: wrap;
      }

      .ap__search {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--white);
        border: 1px solid var(--dark-soft);
        padding: 0.7rem 1rem;
        flex: 1;
        min-width: 240px;
        color: var(--dark-mid);
        transition: border-color 0.3s;
        border-radius: 1px;
      }
      .ap__search.focused {
        border-color: var(--gold);
      }
      .ap__search input {
        background: none;
        border: none;
        outline: none;
        color: var(--dark);
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.85rem;
        width: 100%;
      }
      .ap__search input::placeholder {
        color: rgba(26, 22, 20, 0.4);
      }
      .ap__clear {
        background: none;
        border: none;
        color: var(--dark-mid);
        cursor: pointer;
        padding: 2px;
        display: flex;
        transition: color 0.25s;
      }
      .ap__clear:hover {
        color: var(--dark);
      }

      .ap__sort {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        background: var(--white);
        border: 1px solid var(--dark-soft);
        padding: 0.7rem 1rem;
        color: var(--dark-mid);
        border-radius: 1px;
      }
      .ap__sort select {
        background: none;
        border: none;
        outline: none;
        color: var(--dark);
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.78rem;
        font-weight: 500;
        cursor: pointer;
      }
      .ap__sort select option {
        background: var(--white);
        color: var(--dark);
      }

      .ap__results {
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: 0.9rem;
        font-style: italic;
        color: var(--dark-mid);
        white-space: nowrap;
        margin-left: auto;
      }

      /* ─── Filtros ─── */
      .ap__filter-row {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
      }
      .ap__filter-label {
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.58rem;
        font-weight: 600;
        letter-spacing: 0.28em;
        text-transform: uppercase;
        color: var(--gold);
        min-width: 60px;
      }
      .ap__filter-group {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
      }
      .ap__filter-btn {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.55rem 1rem;
        background: var(--white);
        border: 1px solid var(--dark-soft);
        border-radius: 1px;
        color: var(--dark-mid);
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.7rem;
        font-weight: 500;
        letter-spacing: 0.06em;
        cursor: pointer;
        transition: all 0.25s;
        white-space: nowrap;
      }
      .ap__filter-btn:hover {
        border-color: var(--dark);
        color: var(--dark);
      }
      .ap__filter-btn.active {
        border-color: var(--gold);
        color: var(--gold);
        background: var(--gold-soft);
      }
      .ap__filter-count {
        font-size: 0.6rem;
        background: var(--dark-faint);
        padding: 0.1rem 0.4rem;
        border-radius: 10px;
        color: var(--dark-mid);
        font-weight: 600;
      }
      .ap__filter-btn.active .ap__filter-count {
        background: rgba(200, 169, 110, 0.2);
        color: var(--gold);
      }

      /* ─── Empty ─── */
      .ap__empty {
        padding: 5rem 1rem;
        background: var(--white);
        border: 1px solid var(--gold-mid);
        text-align: center;
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: 1.1rem;
        font-style: italic;
        color: var(--dark-mid);
      }

      /* ─── Tabla ─── */
      .ap__table-wrap {
        overflow-x: auto;
        border: 1px solid var(--dark-soft);
        background: var(--white);
        box-shadow: 0 8px 24px rgba(26, 22, 20, 0.06);
      }
      .ap__table {
        width: 100%;
        border-collapse: collapse;
      }
      .ap__table th {
        padding: 1rem 1.25rem;
        text-align: left;
        white-space: nowrap;
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.58rem;
        font-weight: 600;
        letter-spacing: 0.28em;
        text-transform: uppercase;
        color: var(--gold);
        background: var(--cream);
        border-bottom: 1px solid var(--gold-mid);
      }
      .ap__th-actions {
        text-align: right !important;
      }

      .ap__table td {
        padding: 1.1rem 1.25rem;
        border-bottom: 1px solid var(--dark-soft);
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.85rem;
        color: var(--dark);
        vertical-align: middle;
      }
      .ap__table tr:last-child td {
        border-bottom: none;
      }
      .ap__table tr.row-inactive td {
        opacity: 0.45;
      }
      .ap__table tbody tr {
        transition: background 0.2s;
      }
      .ap__table tbody tr:hover {
        background: rgba(200, 169, 110, 0.04);
      }

      .ap__name {
        display: block;
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: 1.15rem;
        font-weight: 600;
        color: var(--dark);
        letter-spacing: 0.01em;
        margin-bottom: 0.2rem;
      }
      .ap__desc {
        display: block;
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.78rem;
        color: var(--dark-mid);
        line-height: 1.5;
      }
      .ap__price {
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: 1.3rem;
        font-weight: 600;
        color: var(--gold);
        letter-spacing: 0.01em;
        white-space: nowrap;
      }
      .ap__duration {
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: 0.9rem;
        font-style: italic;
        color: var(--dark-mid);
        white-space: nowrap;
      }

      .ap__badge {
        display: inline-block;
        padding: 0.25rem 0.65rem;
        border-radius: 1px;
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.58rem;
        font-weight: 600;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--dark-mid);
        border: 1px solid var(--dark-soft);
        background: var(--dark-faint);
      }
      .ap__badge--on {
        color: #4c9150;
        border-color: rgba(76, 145, 80, 0.35);
        background: rgba(76, 145, 80, 0.07);
      }

      .ap__row-actions {
        display: flex;
        gap: 0.4rem;
        justify-content: flex-end;
      }
      .ap__icon-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 1px;
        background: var(--cream);
        border: 1px solid var(--dark-soft);
        color: var(--dark-mid);
        cursor: pointer;
        transition: all 0.25s;
      }
      .ap__icon-btn:hover {
        background: var(--gold);
        color: var(--white);
        border-color: var(--gold);
      }

      /* ─── Modal ─── */
      .ap__overlay {
        position: fixed;
        inset: 0;
        z-index: 200;
        background: rgba(26, 22, 20, 0.55);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
      }
      .ap__modal {
        background: var(--white);
        width: 100%;
        max-width: 520px;
        max-height: 90vh;
        overflow-y: auto;
        padding: 2.5rem;
        position: relative;
        box-shadow: 0 30px 60px rgba(26, 22, 20, 0.15);
        border: 1px solid var(--gold-mid);
      }
      .ap__modal-line {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, var(--gold) 50%, transparent);
      }
      .ap__modal-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 2rem;
        gap: 1rem;
      }
      .ap__modal-title {
        font-family: var(--font-display, 'Cormorant Garamond', serif);
        font-size: 1.7rem;
        font-weight: 500;
        color: var(--dark);
        line-height: 1.15;
        margin-top: 0.3rem;
      }
      .ap__modal-title em {
        color: var(--gold);
        font-style: italic;
        font-weight: 600;
      }
      .ap__close-btn {
        background: none;
        border: none;
        color: var(--dark-mid);
        cursor: pointer;
        padding: 4px;
        transition: color 0.25s;
        flex-shrink: 0;
      }
      .ap__close-btn:hover {
        color: var(--dark);
      }

      .ap__form-error {
        background: rgba(220, 50, 50, 0.06);
        border: 1px solid rgba(220, 50, 50, 0.25);
        color: #c93838;
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.8rem;
        padding: 0.75rem 1rem;
        margin-bottom: 1.25rem;
      }

      .ap__form {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }
      .ap__field-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      .ap__field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .ap__field label {
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.6rem;
        font-weight: 600;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--gold);
      }
      .ap__field input,
      .ap__field textarea {
        background: #fbf8f3;
        border: 1px solid var(--dark-soft);
        color: var(--dark);
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.88rem;
        padding: 0.85rem 1rem;
        border-radius: 1px;
        outline: none;
        width: 100%;
        resize: vertical;
        transition:
          border-color 0.25s,
          background 0.25s;
      }
      .ap__field input::placeholder,
      .ap__field textarea::placeholder {
        color: rgba(26, 22, 20, 0.35);
      }
      .ap__field input:focus,
      .ap__field textarea:focus {
        border-color: var(--gold);
        background: var(--white);
      }

      .ap__modal-foot {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 1rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--dark-soft);
      }

      .ap__btn-ghost {
        padding: 0.85rem 1.6rem;
        background: transparent;
        color: var(--dark);
        border: 1px solid var(--dark-soft);
        border-radius: 1px;
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.65rem;
        font-weight: 600;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.3s;
      }
      .ap__btn-ghost:hover {
        color: var(--gold);
        border-color: var(--gold);
      }

      .ap__btn-primary {
        padding: 0.85rem 1.85rem;
        background: var(--dark);
        color: var(--cream);
        border: 1px solid var(--dark);
        border-radius: 1px;
        font-family: var(--font-body, 'Inter', sans-serif);
        font-size: 0.66rem;
        font-weight: 600;
        letter-spacing: 0.26em;
        text-transform: uppercase;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        transition:
          color 0.3s,
          border-color 0.3s;
      }
      .ap__btn-primary::before {
        content: '';
        position: absolute;
        inset: 0;
        background: var(--gold);
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .ap__btn-primary:hover:not(:disabled) {
        color: var(--dark);
        border-color: var(--gold);
      }
      .ap__btn-primary:hover:not(:disabled)::before {
        transform: scaleX(1);
      }
      .ap__btn-primary span {
        position: relative;
        z-index: 1;
      }
      .ap__btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      @media (max-width: 720px) {
        .ap__field-row {
          grid-template-columns: 1fr;
        }
        .ap__modal {
          padding: 1.75rem;
        }
      }
    `,
  ],
})
export class AdminServicesComponent implements OnInit {
  services = signal<Service[]>([]);
  loading = signal(true);
  saving = signal(false);
  modalOpen = signal(false);
  modalMode = signal<ModalMode>('create');
  formError = signal<string | null>(null);
  searchQuery = signal('');
  statusFilter = signal<StatusFilter>('ALL');
  sortBy = signal<SortOption>('name');
  searchFocused = false;
  editingId: number | null = null;

  form: ServicePayload & { image_url: string } = {
    name: '',
    description: '',
    price: 0,
    duration_min: 30,
    image_url: '',
  };

  readonly statusFilters = [
    { label: 'Todos', value: 'ALL' as StatusFilter },
    { label: 'Activos', value: 'ACTIVE' as StatusFilter },
    { label: 'Inactivos', value: 'INACTIVE' as StatusFilter },
  ];

  filtered = computed(() => {
    let list = this.services();
    if (this.statusFilter() === 'ACTIVE') list = list.filter((s) => s.is_active);
    if (this.statusFilter() === 'INACTIVE') list = list.filter((s) => !s.is_active);

    const q = this.searchQuery().toLowerCase().trim();
    if (q)
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q),
      );

    return [...list].sort((a, b) => {
      switch (this.sortBy()) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'duration':
          return a.duration_min - b.duration_min;
        default:
          return a.name.localeCompare(b.name);
      }
    });
  });

  countByStatus(status: StatusFilter) {
    if (status === 'ACTIVE') return this.services().filter((s) => s.is_active).length;
    if (status === 'INACTIVE') return this.services().filter((s) => !s.is_active).length;
    return this.services().length;
  }

  constructor(private adminSvc: AdminService) {}
  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.adminSvc.getAllServices().subscribe({
      next: (s) => {
        this.services.set(s);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    this.form = { name: '', description: '', price: 0, duration_min: 30, image_url: '' };
    this.editingId = null;
    this.modalMode.set('create');
    this.formError.set(null);
    this.modalOpen.set(true);
  }

  openEdit(s: Service) {
    this.form = {
      name: s.name,
      description: s.description ?? '',
      price: s.price,
      duration_min: s.duration_min,
      image_url: s.image_url ?? '',
    };
    this.editingId = s.id;
    this.modalMode.set('edit');
    this.formError.set(null);
    this.modalOpen.set(true);
  }

  closeModal() {
    this.modalOpen.set(false);
  }

  onSubmit() {
    this.saving.set(true);
    this.formError.set(null);
    const req$ =
      this.modalMode() === 'create'
        ? this.adminSvc.createService(this.form)
        : this.adminSvc.updateService(this.editingId!, this.form);
    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
      },
      error: (err) => {
        this.formError.set(err.error?.message || 'Error al guardar');
        this.saving.set(false);
      },
    });
  }

  toggleActive(s: Service) {
    this.adminSvc
      .updateService(s.id, { is_active: !s.is_active })
      .subscribe({ next: () => this.load() });
  }
}
