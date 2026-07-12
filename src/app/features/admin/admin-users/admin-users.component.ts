import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AdminService, AdminUser, UpdateUserPayload } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

// ── Extendemos AdminUser con los campos de penalización ────────────────────────
interface AdminUserExtended extends AdminUser {
  late_cancellations: number;
  is_flagged:         boolean;
  blocked_until:      string | null;
}

type RoleFilter = 'ALL' | 'CLIENT' | 'ADMIN';
type SortOption = 'name' | 'date_asc' | 'date_desc' | 'email';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="au-wrap">
      <!-- ── Header ── -->
      <div class="au__header">
        <div>
          <p class="au__label">Panel de administración</p>
          <h1 class="au__title">Gestión de <em>usuarios</em></h1>
          <p class="au__sub">
            <span class="au__diamond"></span>
            Clientes registrados y administradores
          </p>
        </div>
        <div class="au__stats">
          <div class="au__stat">
            <span class="au__stat-n">{{ users().length }}</span>
            <span class="au__stat-l">Total</span>
          </div>
          <div class="au__stat-div"></div>
          <div class="au__stat">
            <span class="au__stat-n au__stat-n--client">{{ clientCount() }}</span>
            <span class="au__stat-l">Clientes</span>
          </div>
          <div class="au__stat-div"></div>
          <div class="au__stat">
            <span class="au__stat-n au__stat-n--admin">{{ adminCount() }}</span>
            <span class="au__stat-l">Admins</span>
          </div>
          @if (flaggedCount() > 0) {
            <div class="au__stat-div"></div>
            <div class="au__stat">
              <span class="au__stat-n au__stat-n--flagged">{{ flaggedCount() }}</span>
              <span class="au__stat-l">Conflictivos</span>
            </div>
          }
        </div>
      </div>

      <div class="au__divider"></div>

      <!-- ── Toolbar ── -->
      <div class="au__toolbar">
        <div class="au__search" [class.focused]="searchFocused">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="15" height="15">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" [value]="searchQuery()"
                 (input)="searchQuery.set($any($event.target).value)"
                 (focus)="searchFocused = true" (blur)="searchFocused = false"
                 placeholder="Buscar por nombre, email o teléfono..." />
          @if (searchQuery()) {
            <button class="au__clear" (click)="searchQuery.set('')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          }
        </div>
        <div class="au__sort">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
          </svg>
          <select [value]="sortBy()" (change)="sortBy.set($any($event.target).value)">
            <option value="name">Nombre A-Z</option>
            <option value="email">Email A-Z</option>
            <option value="date_desc">Más recientes</option>
            <option value="date_asc">Más antiguos</option>
          </select>
        </div>
        <span class="au__results">{{ filtered().length }} de {{ users().length }}</span>
      </div>

      <!-- Filtros rol -->
      <div class="au__filter-row">
        <p class="au__filter-label">Rol</p>
        <div class="au__filter-group">
          @for (f of roleFilters; track f.value) {
            <button class="au__filter-btn" [class.active]="roleFilter() === f.value"
                    (click)="roleFilter.set(f.value)">
              {{ f.label }}
              @if (f.value !== 'ALL') {
                <span class="au__filter-count">{{ countByRole(f.value) }}</span>
              }
            </button>
          }
          <!-- Filtro extra: bloqueados -->
          <button class="au__filter-btn au__filter-btn--danger"
                  [class.active]="showOnlyBlocked()"
                  (click)="showOnlyBlocked.update(v => !v)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="12" height="12">
              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
            Bloqueados
            @if (blockedCount() > 0) {
              <span class="au__filter-count au__filter-count--danger">{{ blockedCount() }}</span>
            }
          </button>
        </div>
      </div>

      <!-- ── Tabla ── -->
      @if (loading()) {
        <div class="au__empty">Cargando usuarios...</div>
      } @else if (filtered().length === 0) {
        <div class="au__empty">
          {{ searchQuery() ? 'Sin resultados para "' + searchQuery() + '"' : 'No hay usuarios.' }}
        </div>
      } @else {
        <div class="au__table-wrap">
          <table class="au__table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Registro</th>
                <th class="au__th-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (u of filtered(); track u.id) {
                <tr [class.au__row--flagged]="u.is_flagged">
                  <td class="au__id">{{ u.id }}</td>
                  <td>
                    <div class="au__user-cell">
                      <div class="au__avatar" [class.au__avatar--flagged]="u.is_flagged">
                        {{ u.name.charAt(0).toUpperCase() }}
                      </div>
                      <div class="au__name-wrap">
                        <span class="au__name">{{ u.name }}</span>
                        @if (u.is_flagged) {
                          <span class="au__flag-badge">⚠ Conflictivo</span>
                        }
                      </div>
                    </div>
                  </td>
                  <td class="au__email">{{ u.email }}</td>
                  <td class="au__muted">{{ u.phone ?? '—' }}</td>
                  <td>
                    <span class="au__role" [class.au__role--admin]="u.role === 'ADMIN'">
                      {{ u.role === 'ADMIN' ? 'Admin' : 'Cliente' }}
                    </span>
                  </td>
                  <td>
                    @if (isBlocked(u)) {
                      <div class="au__status-cell">
                        <span class="au__blocked-badge">
                          Bloqueado hasta {{ formatDate(u.blocked_until!) }}
                        </span>
                      </div>
                    } @else if (u.late_cancellations > 0) {
                      <span class="au__late-badge">
                        {{ u.late_cancellations }} cancelac. tardías
                      </span>
                    } @else {
                      <span class="au__ok-badge">Normal</span>
                    }
                  </td>
                  <td class="au__date">{{ u.created_at | date:'dd MMM yyyy' }}</td>
                  <td>
                    <div class="au__row-actions">
                      <!-- Desbloquear (si está bloqueado) -->
                      @if (isBlocked(u)) {
                        <button class="au__icon-btn au__icon-btn--unblock"
                                title="Desbloquear usuario"
                                (click)="unblockUser(u)"
                                [disabled]="unblocking() === u.id">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 019.9-1"/>
                          </svg>
                        </button>
                      }
                      <!-- Editar -->
                      <button class="au__icon-btn" title="Editar" (click)="openEdit(u)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <!-- Eliminar -->
                      <button class="au__icon-btn au__icon-btn--danger" title="Eliminar"
                              [disabled]="u.id === currentUserId"
                              (click)="confirmDelete(u)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <p class="au__count">{{ filtered().length }} de {{ users().length }} usuarios</p>
      }
    </div>

    <!-- ── Modal editar ── -->
    @if (editModal()) {
      <div class="au__overlay" (click)="closeEdit()">
        <div class="au__modal" (click)="$event.stopPropagation()">
          <div class="au__modal-line"></div>
          <div class="au__modal-head">
            <div>
              <p class="au__label">Editar</p>
              <h2 class="au__modal-title">Editar <em>usuario</em></h2>
            </div>
            <button class="au__close-btn" (click)="closeEdit()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          @if (formError()) { <p class="au__form-error">{{ formError() }}</p> }
          <form class="au__form" (ngSubmit)="onSaveUser()">
            <div class="au__field">
              <label>Nombre</label>
              <input type="text" [(ngModel)]="editForm.name" name="name" required />
            </div>
            <div class="au__field">
              <label>Teléfono</label>
              <input type="tel" [(ngModel)]="editForm.phone" name="phone" placeholder="+34 600 000 000" />
            </div>
            <div class="au__field">
              <label>Rol</label>
              <select [(ngModel)]="editForm.role" name="role">
                <option value="CLIENT">Cliente</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            <div class="au__modal-foot">
              <button type="button" class="au__btn-ghost" (click)="closeEdit()">Cancelar</button>
              <button type="submit" class="au__btn-primary" [disabled]="saving()">
                <span>{{ saving() ? 'Guardando...' : 'Guardar' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- ── Modal eliminar ── -->
    @if (deleteModal()) {
      <div class="au__overlay" (click)="closeDelete()">
        <div class="au__modal au__modal--sm" (click)="$event.stopPropagation()">
          <div class="au__modal-line au__modal-line--danger"></div>
          <div class="au__modal-head">
            <div>
              <p class="au__label au__label--danger">Confirmar acción</p>
              <h2 class="au__modal-title">¿Eliminar <em>usuario</em>?</h2>
            </div>
          </div>
          <p class="au__modal-body">
            Se eliminará permanentemente la cuenta de <strong>{{ deletingUser?.name }}</strong>.
            Esta acción no se puede deshacer.
          </p>
          <div class="au__modal-foot">
            <button class="au__btn-ghost" (click)="closeDelete()">Cancelar</button>
            <button class="au__btn-delete" (click)="onDeleteUser()" [disabled]="saving()">
              {{ saving() ? 'Eliminando...' : 'Eliminar' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ── Modal confirmar desbloqueo ── -->
    @if (unblockModal()) {
      <div class="au__overlay" (click)="closeUnblock()">
        <div class="au__modal au__modal--sm" (click)="$event.stopPropagation()">
          <div class="au__modal-line"></div>
          <div class="au__modal-head">
            <div>
              <p class="au__label">Desbloquear usuario</p>
              <h2 class="au__modal-title">¿Desbloquear <em>cuenta</em>?</h2>
            </div>
          </div>
          <p class="au__modal-body">
            Se desbloqueará la cuenta de <strong>{{ unblockingUser?.name }}</strong>,
            se resetearán las cancelaciones tardías y se eliminará el flag de conflictivo.
          </p>
          <div class="au__modal-foot">
            <button class="au__btn-ghost" (click)="closeUnblock()">Cancelar</button>
            <button class="au__btn-primary" (click)="confirmUnblock()" [disabled]="unblocking() !== null">
              <span>{{ unblocking() !== null ? 'Desbloqueando...' : 'Confirmar' }}</span>
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      --cream:      #f5f1ea;
      --white:      #ffffff;
      --gold:       #c8a96e;
      --gold-soft:  rgba(200,169,110,0.12);
      --gold-mid:   rgba(200,169,110,0.4);
      --dark:       #1a1614;
      --dark-mid:   rgba(26,22,20,0.55);
      --dark-soft:  rgba(26,22,20,0.12);
      --dark-faint: rgba(26,22,20,0.05);
      --danger:     #c93838;
      --success:    #4c9150;
    }

    .au-wrap { background: var(--cream); }

    /* ─── Header ─── */
    .au__header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; gap: 2rem; flex-wrap: wrap; }
    .au__label { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.32em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.7rem; display: block; }
    .au__title { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: clamp(2rem,3.8vw,2.8rem); font-weight: 500; color: var(--dark); line-height: 1.1; margin-bottom: 0.7rem; em { color: var(--gold); font-style: italic; font-weight: 600; } }
    .au__sub { display: flex; align-items: center; gap: 0.6rem; font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 0.95rem; font-style: italic; color: var(--dark-mid); }
    .au__diamond { width: 5px; height: 5px; background: var(--gold); transform: rotate(45deg); flex-shrink: 0; }

    .au__stats { display: flex; align-items: center; gap: 1.75rem; background: var(--white); border: 1px solid var(--gold-mid); padding: 1.25rem 1.75rem; box-shadow: 0 8px 24px rgba(26,22,20,0.04); flex-wrap: wrap; }
    .au__stat { display: flex; flex-direction: column; gap: 0.3rem; align-items: center; }
    .au__stat-n { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 1.9rem; font-weight: 600; color: var(--dark); line-height: 1; }
    .au__stat-n--client { color: var(--dark); }
    .au__stat-n--admin  { color: var(--gold); }
    .au__stat-n--flagged { color: var(--danger); }
    .au__stat-l { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.58rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--dark-mid); }
    .au__stat-div { width: 1px; height: 36px; background: var(--dark-soft); }
    .au__divider { height: 1px; width: 100%; background: linear-gradient(90deg, transparent, var(--gold-mid) 50%, transparent); margin-bottom: 2rem; }

    /* ─── Toolbar ─── */
    .au__toolbar { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
    .au__search { display: flex; align-items: center; gap: 0.5rem; background: var(--white); border: 1px solid var(--dark-soft); padding: 0.7rem 1rem; flex: 1; min-width: 240px; color: var(--dark-mid); transition: border-color 0.3s; border-radius: 1px; &.focused { border-color: var(--gold); } input { background: none; border: none; outline: none; color: var(--dark); font-family: var(--font-body,'Inter',sans-serif); font-size: 0.85rem; width: 100%; &::placeholder { color: rgba(26,22,20,0.4); } } }
    .au__clear { background: none; border: none; color: var(--dark-mid); cursor: pointer; padding: 2px; display: flex; transition: color 0.25s; &:hover { color: var(--dark); } }
    .au__sort { display: flex; align-items: center; gap: 0.6rem; background: var(--white); border: 1px solid var(--dark-soft); padding: 0.7rem 1rem; color: var(--dark-mid); border-radius: 1px; select { background: none; border: none; outline: none; color: var(--dark); font-family: var(--font-body,'Inter',sans-serif); font-size: 0.78rem; font-weight: 500; cursor: pointer; option { background: var(--white); color: var(--dark); } } }
    .au__results { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 0.9rem; font-style: italic; color: var(--dark-mid); white-space: nowrap; margin-left: auto; }

    /* ─── Filtros ─── */
    .au__filter-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .au__filter-label { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.58rem; font-weight: 600; letter-spacing: 0.28em; text-transform: uppercase; color: var(--gold); min-width: 60px; }
    .au__filter-group { display: flex; gap: 0.4rem; flex-wrap: wrap; }
    .au__filter-btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.55rem 1rem; background: var(--white); border: 1px solid var(--dark-soft); border-radius: 1px; color: var(--dark-mid); font-family: var(--font-body,'Inter',sans-serif); font-size: 0.7rem; font-weight: 500; cursor: pointer; transition: all 0.25s; white-space: nowrap; &:hover { border-color: var(--dark); color: var(--dark); } &.active { border-color: var(--gold); color: var(--gold); background: var(--gold-soft); } }
    .au__filter-btn--danger.active { border-color: var(--danger); color: var(--danger); background: rgba(201,56,56,0.06); }
    .au__filter-count { font-size: 0.6rem; background: var(--dark-faint); padding: 0.1rem 0.4rem; border-radius: 10px; color: var(--dark-mid); font-weight: 600; }
    .au__filter-btn.active .au__filter-count { background: rgba(200,169,110,0.2); color: var(--gold); }
    .au__filter-count--danger { background: rgba(201,56,56,0.1) !important; color: var(--danger) !important; }

    /* ─── Empty ─── */
    .au__empty { padding: 5rem 1rem; background: var(--white); border: 1px solid var(--gold-mid); text-align: center; font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 1.1rem; font-style: italic; color: var(--dark-mid); }

    /* ─── Tabla ─── */
    .au__table-wrap { overflow-x: auto; border: 1px solid var(--dark-soft); background: var(--white); box-shadow: 0 8px 24px rgba(26,22,20,0.06); }
    .au__table { width: 100%; border-collapse: collapse; }
    .au__table th { padding: 1rem 1.25rem; text-align: left; white-space: nowrap; font-family: var(--font-body,'Inter',sans-serif); font-size: 0.58rem; font-weight: 600; letter-spacing: 0.28em; text-transform: uppercase; color: var(--gold); background: var(--cream); border-bottom: 1px solid var(--gold-mid); }
    .au__th-actions { text-align: right !important; }
    .au__table td { padding: 1rem 1.25rem; border-bottom: 1px solid var(--dark-soft); font-family: var(--font-body,'Inter',sans-serif); font-size: 0.85rem; color: var(--dark); vertical-align: middle; }
    .au__table tr:last-child td { border-bottom: none; }
    .au__table tbody tr { transition: background 0.2s; &:hover { background: rgba(200,169,110,0.04); } }
    .au__row--flagged { background: rgba(201,56,56,0.02) !important; }

    .au__id { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 0.95rem; font-style: italic; color: var(--dark-mid); }
    .au__user-cell { display: flex; align-items: center; gap: 0.85rem; }
    .au__avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--cream); border: 1px solid var(--gold-mid); color: var(--gold); font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 0.95rem; font-weight: 600; font-style: italic; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .au__avatar--flagged { border-color: rgba(201,56,56,0.4); background: rgba(201,56,56,0.06); color: var(--danger); }
    .au__name-wrap { display: flex; flex-direction: column; gap: 0.2rem; }
    .au__name { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 1.05rem; font-weight: 500; color: var(--dark); letter-spacing: 0.01em; }

    /* Badges de penalización */
    .au__flag-badge { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.55rem; font-weight: 600; letter-spacing: 0.1em; color: #a07835; background: rgba(200,169,110,0.1); border: 1px solid rgba(200,169,110,0.3); padding: 0.15rem 0.45rem; border-radius: 1px; }
    .au__blocked-badge { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.62rem; font-weight: 500; color: var(--danger); background: rgba(201,56,56,0.06); border: 1px solid rgba(201,56,56,0.25); padding: 0.25rem 0.6rem; border-radius: 1px; white-space: nowrap; }
    .au__late-badge { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.62rem; color: #a07835; font-style: italic; }
    .au__ok-badge { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.62rem; color: rgba(26,22,20,0.3); }
    .au__status-cell { display: flex; flex-direction: column; gap: 0.25rem; }

    .au__email { color: var(--dark); font-weight: 500; }
    .au__muted { color: var(--dark-mid); }
    .au__date { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 0.9rem; font-style: italic; color: var(--dark-mid); white-space: nowrap; }

    .au__role { display: inline-block; padding: 0.25rem 0.7rem; border-radius: 1px; font-family: var(--font-body,'Inter',sans-serif); font-size: 0.58rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--dark-mid); border: 1px solid var(--dark-soft); background: var(--dark-faint); }
    .au__role--admin { color: var(--gold); border-color: var(--gold-mid); background: var(--gold-soft); }

    .au__row-actions { display: flex; gap: 0.4rem; justify-content: flex-end; }
    .au__icon-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 1px; background: var(--cream); border: 1px solid var(--dark-soft); color: var(--dark-mid); cursor: pointer; transition: all 0.25s; &:hover { background: var(--gold); color: var(--white); border-color: var(--gold); } &:disabled { opacity: 0.3; cursor: not-allowed; pointer-events: none; } }
    .au__icon-btn--danger:hover { background: var(--danger) !important; color: var(--white) !important; border-color: var(--danger) !important; }
    .au__icon-btn--unblock:hover { background: var(--success) !important; color: var(--white) !important; border-color: var(--success) !important; }

    .au__count { margin-top: 1.25rem; font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 0.85rem; font-style: italic; color: var(--dark-mid); text-align: right; }

    /* ─── Modal ─── */
    .au__overlay { position: fixed; inset: 0; z-index: 300; background: rgba(26,22,20,0.55); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
    .au__modal { background: var(--white); width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; padding: 2.5rem; position: relative; box-shadow: 0 30px 60px rgba(26,22,20,0.15); border: 1px solid var(--gold-mid); }
    .au__modal--sm { max-width: 420px; }
    .au__modal-line { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--gold) 50%, transparent); }
    .au__modal-line--danger { background: linear-gradient(90deg, transparent, var(--danger) 50%, transparent); }
    .au__label--danger { color: var(--danger); }
    .au__modal-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2rem; gap: 1rem; }
    .au__modal-title { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 1.6rem; font-weight: 500; color: var(--dark); line-height: 1.15; margin-top: 0.3rem; em { color: var(--gold); font-style: italic; font-weight: 600; } }
    .au__close-btn { background: none; border: none; color: var(--dark-mid); cursor: pointer; padding: 4px; transition: color 0.25s; flex-shrink: 0; &:hover { color: var(--dark); } }
    .au__modal-body { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.88rem; color: var(--dark-mid); line-height: 1.7; margin-bottom: 1.5rem; strong { color: var(--dark); font-weight: 600; } }
    .au__form-error { background: rgba(220,50,50,0.06); border: 1px solid rgba(220,50,50,0.25); color: var(--danger); font-family: var(--font-body,'Inter',sans-serif); font-size: 0.8rem; padding: 0.75rem 1rem; margin-bottom: 1.25rem; }
    .au__form { display: flex; flex-direction: column; gap: 1.25rem; }
    .au__field { display: flex; flex-direction: column; gap: 0.5rem; label { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: var(--gold); } input, select { background: #fbf8f3; border: 1px solid var(--dark-soft); color: var(--dark); font-family: var(--font-body,'Inter',sans-serif); font-size: 0.88rem; padding: 0.85rem 1rem; border-radius: 1px; outline: none; width: 100%; transition: border-color 0.25s, background 0.25s; &:focus { border-color: var(--gold); background: var(--white); } option { background: var(--white); color: var(--dark); } } }
    .au__modal-foot { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; padding-top: 1.5rem; border-top: 1px solid var(--dark-soft); }
    .au__btn-ghost { padding: 0.85rem 1.6rem; background: transparent; color: var(--dark); border: 1px solid var(--dark-soft); border-radius: 1px; font-family: var(--font-body,'Inter',sans-serif); font-size: 0.65rem; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; cursor: pointer; transition: all 0.3s; &:hover { color: var(--gold); border-color: var(--gold); } }
    .au__btn-primary { padding: 0.85rem 1.85rem; background: var(--dark); color: var(--cream); border: 1px solid var(--dark); border-radius: 1px; font-family: var(--font-body,'Inter',sans-serif); font-size: 0.66rem; font-weight: 600; letter-spacing: 0.26em; text-transform: uppercase; cursor: pointer; position: relative; overflow: hidden; transition: color 0.3s, border-color 0.3s;
      &::before { content: ''; position: absolute; inset: 0; background: var(--gold); transform: scaleX(0); transform-origin: left; transition: transform 0.4s cubic-bezier(0.22,1,0.36,1); }
      &:hover:not(:disabled) { color: var(--dark); border-color: var(--gold); } &:hover:not(:disabled)::before { transform: scaleX(1); }
      span { position: relative; z-index: 1; } &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .au__btn-delete { padding: 0.85rem 1.85rem; background: var(--danger); color: var(--white); border: 1px solid var(--danger); border-radius: 1px; font-family: var(--font-body,'Inter',sans-serif); font-size: 0.66rem; font-weight: 600; letter-spacing: 0.26em; text-transform: uppercase; cursor: pointer; transition: background 0.3s; &:hover:not(:disabled) { background: #a52828; border-color: #a52828; } &:disabled { opacity: 0.5; cursor: not-allowed; } }

    @media (max-width: 900px) {
      .au__stats { width: 100%; justify-content: space-around; padding: 1rem; }
      .au__stat-n { font-size: 1.5rem; }
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  private adminSvc = inject(AdminService);
  private authSvc  = inject(AuthService);
  private http     = inject(HttpClient);

  users        = signal<AdminUserExtended[]>([]);
  loading      = signal(true);
  saving       = signal(false);
  formError    = signal<string | null>(null);
  searchQuery  = signal('');
  roleFilter   = signal<RoleFilter>('ALL');
  sortBy       = signal<SortOption>('date_desc');
  showOnlyBlocked = signal(false);
  searchFocused   = false;

  editModal    = signal(false);
  deleteModal  = signal(false);
  unblockModal = signal(false);

  deletingUser:  AdminUserExtended | null = null;
  unblockingUser: AdminUserExtended | null = null;
  editingId:     number | null = null;
  unblocking     = signal<number | null>(null);

  editForm: UpdateUserPayload & { phone: string } = { name: '', phone: '', role: 'CLIENT' };

  readonly roleFilters = [
    { label: 'Todos',    value: 'ALL'    as RoleFilter },
    { label: 'Clientes', value: 'CLIENT' as RoleFilter },
    { label: 'Admins',   value: 'ADMIN'  as RoleFilter },
  ];

  filtered = computed(() => {
    let list = this.users();
    if (this.roleFilter() !== 'ALL') list = list.filter(u => u.role === this.roleFilter());
    if (this.showOnlyBlocked()) list = list.filter(u => this.isBlocked(u));

    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone ?? '').includes(q)
    );

    return [...list].sort((a, b) => {
      switch (this.sortBy()) {
        case 'name':      return a.name.localeCompare(b.name);
        case 'email':     return a.email.localeCompare(b.email);
        case 'date_asc':  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  });

  clientCount  = computed(() => this.users().filter(u => u.role === 'CLIENT').length);
  adminCount   = computed(() => this.users().filter(u => u.role === 'ADMIN').length);
  flaggedCount = computed(() => this.users().filter(u => u.is_flagged).length);
  blockedCount = computed(() => this.users().filter(u => this.isBlocked(u)).length);

  countByRole(role: string) { return this.users().filter(u => u.role === role).length; }
  get currentUserId() { return this.authSvc.currentUser()?.id; }

  isBlocked(u: AdminUserExtended): boolean {
    return !!u.blocked_until && new Date(u.blocked_until) > new Date();
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.adminSvc.getUsers().subscribe({
      next: u => { this.users.set(u as AdminUserExtended[]); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  // ── Editar ────────────────────────────────────────────────────────────────
  openEdit(u: AdminUserExtended) {
    this.editingId = u.id;
    this.editForm  = { name: u.name, phone: u.phone ?? '', role: u.role };
    this.formError.set(null);
    this.editModal.set(true);
  }
  closeEdit() { this.editModal.set(false); }

  onSaveUser() {
    if (!this.editingId) return;
    this.saving.set(true);
    this.formError.set(null);
    this.adminSvc.updateUser(this.editingId, this.editForm).subscribe({
      next: () => { this.saving.set(false); this.closeEdit(); this.load(); },
      error: err => { this.formError.set(err.error?.message || 'Error al guardar'); this.saving.set(false); },
    });
  }

  // ── Eliminar ──────────────────────────────────────────────────────────────
  confirmDelete(u: AdminUserExtended) { this.deletingUser = u; this.deleteModal.set(true); }
  closeDelete() { this.deleteModal.set(false); this.deletingUser = null; }

  onDeleteUser() {
    if (!this.deletingUser) return;
    this.saving.set(true);
    this.adminSvc.deleteUser(this.deletingUser.id).subscribe({
      next: () => { this.saving.set(false); this.closeDelete(); this.load(); },
      error: () => { this.saving.set(false); this.closeDelete(); },
    });
  }

  // ── Desbloquear ───────────────────────────────────────────────────────────
  unblockUser(u: AdminUserExtended) { this.unblockingUser = u; this.unblockModal.set(true); }
  closeUnblock() { this.unblockModal.set(false); this.unblockingUser = null; }

  confirmUnblock() {
    if (!this.unblockingUser) return;
    const id = this.unblockingUser.id;
    this.unblocking.set(id);

    this.http.put(`${environment.apiUrl}/users/${id}/unblock`, {}).subscribe({
      next: () => {
        this.users.update(list => list.map(u =>
          u.id === id
            ? { ...u, blocked_until: null, is_flagged: false, late_cancellations: 0 }
            : u
        ));
        this.unblocking.set(null);
        this.closeUnblock();
      },
      error: () => { this.unblocking.set(null); this.closeUnblock(); },
    });
  }
}