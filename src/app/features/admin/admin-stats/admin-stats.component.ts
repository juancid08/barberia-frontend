import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface MonthData   { month: number; label: string; revenue: number; count: number; }
interface ServiceData { name: string; revenue: number; count: number; }
interface StatsData {
  year:             number;
  years:            number[];
  totalRevenue:     number;
  totalCompleted:   number;
  totalThisMonth:   number;
  avgPerCompleted:  number;
  revenueByMonth:   MonthData[];
  revenueByService: ServiceData[];
  byStatus:         Record<string, number>;
}

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="st-wrap">

      <!-- ── Header ── -->
      <div class="st__header">
        <div>
          <p class="st__label">Panel de administración</p>
          <h1 class="st__title">Estadísticas de <em>ingresos</em></h1>
          <p class="st__sub"><span class="st__diamond"></span> Solo citas completadas</p>
        </div>
        <!-- Selector de año -->
        <div class="st__year-select">
          <label class="st__label">Año</label>
          <select [(ngModel)]="selectedYear" (change)="load()">
            @for (y of stats()?.years ?? [currentYear]; track y) {
              <option [value]="y">{{ y }}</option>
            }
          </select>
        </div>
      </div>

      <div class="st__divider"></div>

      @if (loading()) {
        <div class="st__loading">
          <div class="st__loading-dots">
            <span></span><span></span><span></span>
          </div>
          <p>Cargando estadísticas...</p>
        </div>
      } @else if (stats()) {

        <!-- ── KPIs ── -->
        <div class="st__kpis">
          <div class="st__kpi">
            <p class="st__kpi-label">Ingresos totales {{ selectedYear }}</p>
            <p class="st__kpi-value">{{ stats()!.totalRevenue | currency:'EUR':'symbol':'1.0-0' }}</p>
            <p class="st__kpi-sub">{{ stats()!.totalCompleted }} citas completadas</p>
          </div>
          <div class="st__kpi">
            <p class="st__kpi-label">Este mes</p>
            <p class="st__kpi-value">{{ stats()!.totalThisMonth | currency:'EUR':'symbol':'1.0-0' }}</p>
            <p class="st__kpi-sub">{{ currentMonthLabel }}</p>
          </div>
          <div class="st__kpi">
            <p class="st__kpi-label">Ticket medio</p>
            <p class="st__kpi-value">{{ stats()!.avgPerCompleted | currency:'EUR':'symbol':'1.2-2' }}</p>
            <p class="st__kpi-sub">por cita completada</p>
          </div>
          <div class="st__kpi st__kpi--status">
            <p class="st__kpi-label">Citas {{ selectedYear }}</p>
            <div class="st__kpi-status-grid">
              <span class="st__status-dot st__status-dot--completed"></span>
              <span>Completadas</span>
              <strong>{{ stats()!.byStatus['COMPLETED'] ?? 0 }}</strong>

              <span class="st__status-dot st__status-dot--confirmed"></span>
              <span>Confirmadas</span>
              <strong>{{ stats()!.byStatus['CONFIRMED'] ?? 0 }}</strong>

              <span class="st__status-dot st__status-dot--pending"></span>
              <span>Pendientes</span>
              <strong>{{ stats()!.byStatus['PENDING'] ?? 0 }}</strong>

              <span class="st__status-dot st__status-dot--cancelled"></span>
              <span>Canceladas</span>
              <strong>{{ stats()!.byStatus['CANCELLED'] ?? 0 }}</strong>
            </div>
          </div>
        </div>

        <!-- ── Gráfica de picos (SVG nativo) ── -->
        <div class="st__card">
          <p class="st__card-title">Ingresos mensuales {{ selectedYear }}</p>
          <div class="st__chart-wrap">
            <svg [attr.viewBox]="'0 0 ' + chartW + ' ' + chartH"
                 [attr.width]="'100%'" [attr.height]="chartH"
                 class="st__chart">

              <!-- Líneas de referencia horizontales -->
              @for (ref of yRefs(); track ref.value) {
                <line [attr.x1]="padL" [attr.y1]="ref.y"
                      [attr.x2]="chartW - padR" [attr.y2]="ref.y"
                      class="st__grid-line"/>
                <text [attr.x]="padL - 8" [attr.y]="ref.y + 4"
                      class="st__axis-label" text-anchor="end">
                  {{ ref.label }}
                </text>
              }

              <!-- Área bajo la curva -->
              <path [attr.d]="areaPath()" class="st__area"/>

              <!-- Línea de picos -->
              <path [attr.d]="linePath()" class="st__line"/>

              <!-- Puntos -->
              @for (pt of chartPoints(); track pt.month) {
                <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="5"
                        class="st__dot"
                        (mouseenter)="hovered.set(pt)"
                        (mouseleave)="hovered.set(null)"/>

                <!-- Etiqueta mes en eje X -->
                <text [attr.x]="pt.x" [attr.y]="chartH - 8"
                      class="st__axis-label" text-anchor="middle">
                  {{ pt.label }}
                </text>

                <!-- Tooltip al hacer hover -->
                @if (hovered()?.month === pt.month) {
                  <g>
                    <rect [attr.x]="clampTooltip(pt.x - 52)"
                          [attr.y]="pt.y - 46"
                          width="104" height="38" rx="2"
                          class="st__tooltip-bg"/>
                    <text [attr.x]="clampTooltip(pt.x - 52) + 52"
                          [attr.y]="pt.y - 29"
                          class="st__tooltip-value" text-anchor="middle">
                      {{ pt.revenue | currency:'EUR':'symbol':'1.0-0' }}
                    </text>
                    <text [attr.x]="clampTooltip(pt.x - 52) + 52"
                          [attr.y]="pt.y - 14"
                          class="st__tooltip-sub" text-anchor="middle">
                      {{ pt.count }} citas
                    </text>
                  </g>
                }
              }

            </svg>
          </div>
        </div>

        <!-- ── Por servicio ── -->
        @if (stats()!.revenueByService.length > 0) {
          <div class="st__card">
            <p class="st__card-title">Ingresos por servicio</p>
            <div class="st__services">
              @for (svc of stats()!.revenueByService; track svc.name; let i = $index) {
                <div class="st__svc-row">
                  <div class="st__svc-info">
                    <span class="st__svc-name">{{ svc.name }}</span>
                    <span class="st__svc-count">{{ svc.count }} citas</span>
                  </div>
                  <div class="st__svc-bar-wrap">
                    <div class="st__svc-bar"
                         [style.width.%]="(svc.revenue / stats()!.revenueByService[0].revenue) * 100">
                    </div>
                  </div>
                  <span class="st__svc-revenue">
                    {{ svc.revenue | currency:'EUR':'symbol':'1.0-0' }}
                  </span>
                </div>
              }
            </div>
          </div>
        }

        <!-- ── Distribución de citas (donut simple) ── -->
        <div class="st__card">
          <p class="st__card-title">Distribución de citas</p>
          <div class="st__status-bars">
            @for (s of statusList(); track s.key) {
              <div class="st__status-row">
                <span class="st__status-label">{{ s.label }}</span>
                <div class="st__status-bar-wrap">
                  <div class="st__status-bar st__status-bar--{{ s.key.toLowerCase() }}"
                       [style.width.%]="s.pct">
                  </div>
                </div>
                <span class="st__status-count">{{ s.count }}</span>
              </div>
            }
          </div>
        </div>

      }
    </div>
  `,
  styles: [`
    /* ── Base ── */
    .st-wrap { background: #f5f1ea; padding-bottom: 3rem; }

    /* ── Header ── */
    .st__header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; gap: 2rem; flex-wrap: wrap; }
    .st__label  { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.32em; text-transform: uppercase; color: #c8a96e; margin-bottom: 0.7rem; display: block; }
    .st__title  { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: clamp(2rem,4vw,2.8rem); font-weight: 500; color: #1a1614; line-height: 1.1; em { color: #c8a96e; font-style: italic; font-weight: 600; } }
    .st__sub    { display: flex; align-items: center; gap: 0.6rem; font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 0.95rem; font-style: italic; color: rgba(26,22,20,0.55); margin-top: 0.5rem; }
    .st__diamond { width: 5px; height: 5px; background: #c8a96e; transform: rotate(45deg); flex-shrink: 0; }
    .st__divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(200,169,110,0.4) 50%, transparent); margin-bottom: 2rem; }

    .st__year-select { display: flex; flex-direction: column; gap: 0.4rem;
      select { background: #ffffff; border: 1px solid rgba(26,22,20,0.12); color: #1a1614; font-family: var(--font-body,'Inter',sans-serif); font-size: 0.88rem; padding: 0.7rem 1rem; border-radius: 1px; outline: none; cursor: pointer; min-width: 100px; &:focus { border-color: #c8a96e; } }
    }

    /* ── Loading ── */
    .st__loading { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 5rem; background: #ffffff; border: 1px solid rgba(200,169,110,0.2); text-align: center;
      p { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 1rem; font-style: italic; color: rgba(26,22,20,0.5); }
    }
    .st__loading-dots { display: flex; gap: 6px; span { width: 8px; height: 8px; border-radius: 50%; background: #c8a96e; animation: dotPulse 1.2s ease-in-out infinite; &:nth-child(2) { animation-delay: 0.2s; } &:nth-child(3) { animation-delay: 0.4s; } } }
    @keyframes dotPulse { 0%,100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }

    /* ── KPIs ── */
    .st__kpis { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .st__kpi { background: #ffffff; border: 1px solid rgba(26,22,20,0.08); border-left: 3px solid #c8a96e; padding: 1.5rem 1.75rem; }
    .st__kpi-label { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(26,22,20,0.5); margin-bottom: 0.5rem; }
    .st__kpi-value { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 2rem; font-weight: 600; color: #c8a96e; line-height: 1; margin-bottom: 0.35rem; }
    .st__kpi-sub   { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.72rem; color: rgba(26,22,20,0.45); }
    .st__kpi--status { border-left-color: rgba(26,22,20,0.2); }
    .st__kpi-status-grid { display: grid; grid-template-columns: auto 1fr auto; gap: 0.3rem 0.6rem; align-items: center; margin-top: 0.5rem;
      strong { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 1rem; font-weight: 600; color: #1a1614; text-align: right; }
      span:not(.st__status-dot) { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.72rem; color: rgba(26,22,20,0.6); }
    }
    .st__status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .st__status-dot--completed { background: #4c9150; }
    .st__status-dot--confirmed { background: #c8a96e; }
    .st__status-dot--pending   { background: rgba(26,22,20,0.3); }
    .st__status-dot--cancelled { background: #c93838; }

    /* ── Card ── */
    .st__card { background: #ffffff; border: 1px solid rgba(26,22,20,0.08); padding: 1.75rem; margin-bottom: 1.5rem; box-shadow: 0 4px 16px rgba(26,22,20,0.04); }
    .st__card-title { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 1.2rem; font-weight: 500; color: #1a1614; margin-bottom: 1.5rem; }

    /* ── SVG Chart ── */
    .st__chart-wrap { overflow-x: auto; }
    .st__chart { overflow: visible; display: block; }

    .st__grid-line { stroke: rgba(26,22,20,0.07); stroke-width: 1; stroke-dasharray: 4 4; }
    .st__axis-label { font-family: var(--font-body,'Inter',sans-serif); font-size: 10px; fill: rgba(26,22,20,0.45); }

    .st__area { fill: url(#areaGradient); }
    .st__line { fill: none; stroke: #c8a96e; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
    .st__dot  { fill: #ffffff; stroke: #c8a96e; stroke-width: 2.5; cursor: pointer; transition: r 0.2s; &:hover { r: 7; } }

    .st__tooltip-bg    { fill: #1a1614; opacity: 0.92; }
    .st__tooltip-value { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 13px; fill: #c8a96e; font-weight: 600; }
    .st__tooltip-sub   { font-family: var(--font-body,'Inter',sans-serif); font-size: 10px; fill: rgba(245,241,234,0.7); }

    /* ── Servicios ── */
    .st__services { display: flex; flex-direction: column; gap: 1rem; }
    .st__svc-row { display: grid; grid-template-columns: 1fr 2fr auto; gap: 1rem; align-items: center; }
    .st__svc-info { display: flex; flex-direction: column; gap: 0.2rem; }
    .st__svc-name  { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 0.95rem; font-weight: 500; color: #1a1614; }
    .st__svc-count { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.65rem; color: rgba(26,22,20,0.45); }
    .st__svc-bar-wrap { background: rgba(26,22,20,0.06); height: 6px; border-radius: 3px; overflow: hidden; }
    .st__svc-bar { height: 100%; background: linear-gradient(to right, #c8a96e, #e8c98e); border-radius: 3px; transition: width 0.6s cubic-bezier(0.22,1,0.36,1); }
    .st__svc-revenue { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 1rem; font-weight: 600; color: #c8a96e; white-space: nowrap; }

    /* ── Estado barras ── */
    .st__status-bars { display: flex; flex-direction: column; gap: 0.85rem; }
    .st__status-row { display: grid; grid-template-columns: 100px 1fr 40px; gap: 1rem; align-items: center; }
    .st__status-label { font-family: var(--font-body,'Inter',sans-serif); font-size: 0.72rem; color: rgba(26,22,20,0.6); }
    .st__status-bar-wrap { background: rgba(26,22,20,0.06); height: 8px; border-radius: 4px; overflow: hidden; }
    .st__status-bar { height: 100%; border-radius: 4px; transition: width 0.6s cubic-bezier(0.22,1,0.36,1); }
    .st__status-bar--completed { background: #4c9150; }
    .st__status-bar--confirmed { background: #c8a96e; }
    .st__status-bar--pending   { background: rgba(26,22,20,0.3); }
    .st__status-bar--cancelled { background: #c93838; }
    .st__status-count { font-family: var(--font-display,'Cormorant Garamond',serif); font-size: 1rem; font-weight: 600; color: #1a1614; text-align: right; }

    @media (max-width: 640px) {
      .st__kpis { grid-template-columns: 1fr 1fr; }
      .st__svc-row { grid-template-columns: 1fr auto; .st__svc-bar-wrap { display: none; } }
      .st__status-row { grid-template-columns: 80px 1fr 30px; }
    }
  `]
})
export class AdminStatsComponent implements OnInit {
  stats   = signal<StatsData | null>(null);
  loading = signal(true);
  hovered = signal<any>(null);

  currentYear      = new Date().getFullYear();
  selectedYear     = this.currentYear;
  currentMonthLabel = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  // ── Dimensiones del SVG ────────────────────────────────────────────────────
  readonly chartW = 700;
  readonly chartH = 260;
  readonly padL   = 55;
  readonly padR   = 20;
  readonly padT   = 20;
  readonly padB   = 30;

  constructor(private http: HttpClient) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<{ data: StatsData }>(`${environment.apiUrl}/stats?year=${this.selectedYear}`).subscribe({
      next:  r => { this.stats.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  // ── Puntos del gráfico ─────────────────────────────────────────────────────
  chartPoints = computed(() => {
    const data = this.stats()?.revenueByMonth;
    if (!data) return [];
    const maxRev  = Math.max(...data.map(m => m.revenue), 1);
    const w       = this.chartW - this.padL - this.padR;
    const h       = this.chartH - this.padT - this.padB;
    const step    = w / 11;

    return data.map((m, i) => ({
      month:   m.month,
      label:   m.label,
      revenue: m.revenue,
      count:   m.count,
      x:       this.padL + i * step,
      y:       this.padT + h - (m.revenue / maxRev) * h,
    }));
  });

  // ── Path de la línea ───────────────────────────────────────────────────────
  linePath = computed(() => {
    const pts = this.chartPoints();
    if (!pts.length) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  });

  // ── Path del área ──────────────────────────────────────────────────────────
  areaPath = computed(() => {
    const pts = this.chartPoints();
    if (!pts.length) return '';
    const bottom = this.chartH - this.padB;
    const line   = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return `${line} L ${pts[pts.length-1].x} ${bottom} L ${pts[0].x} ${bottom} Z`;
  });

  // ── Líneas Y de referencia ─────────────────────────────────────────────────
  yRefs = computed(() => {
    const data = this.stats()?.revenueByMonth;
    if (!data) return [];
    const maxRev = Math.max(...data.map(m => m.revenue), 1);
    const h      = this.chartH - this.padT - this.padB;
    const steps  = 4;

    return Array.from({ length: steps + 1 }, (_, i) => {
      const pct   = i / steps;
      const value = Math.round(maxRev * pct / 10) * 10;
      return {
        value,
        label: value >= 1000 ? `${(value/1000).toFixed(1)}k€` : `${value}€`,
        y:     this.padT + h - pct * h,
      };
    });
  });

  // ── Lista de estados para las barras ──────────────────────────────────────
  statusList = computed(() => {
    const s = this.stats()?.byStatus;
    if (!s) return [];
    const total = Object.values(s).reduce((a, b) => a + b, 0) || 1;
    return [
      { key: 'COMPLETED', label: 'Completadas', count: s['COMPLETED'] ?? 0, pct: ((s['COMPLETED'] ?? 0) / total) * 100 },
      { key: 'CONFIRMED', label: 'Confirmadas', count: s['CONFIRMED'] ?? 0, pct: ((s['CONFIRMED'] ?? 0) / total) * 100 },
      { key: 'PENDING',   label: 'Pendientes',  count: s['PENDING']   ?? 0, pct: ((s['PENDING']   ?? 0) / total) * 100 },
      { key: 'CANCELLED', label: 'Canceladas',  count: s['CANCELLED'] ?? 0, pct: ((s['CANCELLED'] ?? 0) / total) * 100 },
    ];
  });

  // Evitar que el tooltip salga del SVG
  clampTooltip(x: number): number {
    return Math.min(Math.max(x, this.padL), this.chartW - this.padR - 104);
  }
}