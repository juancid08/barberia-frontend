import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Service } from '../../../core/services/barber.service';

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="card">
      <div class="card__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke-dasharray="2 2"/>
          <path d="M8 12l2.5 2.5L16 9"/>
        </svg>
      </div>

      <div class="card__body">
        <h3 class="card__name">{{ service.name }}</h3>
        <p class="card__desc">{{ service.description }}</p>
      </div>

      <div class="card__footer">
        <span class="card__price">{{ service.price | currency:'EUR':'symbol':'1.0-0' }}</span>
        <span class="card__duration">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" width="12" height="12">
            <circle cx="8" cy="8" r="6.5"/>
            <path d="M8 4.5V8l2.5 2"/>
          </svg>
          {{ service.duration_min }} min
        </span>
      </div>
    </article>
  `,
  styles: [`
    .card {
      display: flex;
      flex-direction: column;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      padding: 2rem;
      border-radius: var(--radius-md);
      transition: border-color var(--transition), transform var(--transition);
      height: 100%;

      &:hover {
        border-color: var(--color-accent);
        transform: translateY(-4px);

        .card__icon svg {
          stroke: var(--color-accent);
        }
      }
    }

    .card__icon {
      width: 44px;
      height: 44px;
      margin-bottom: 1.5rem;

      svg {
        width: 100%;
        height: 100%;
        stroke: var(--color-muted);
        transition: stroke var(--transition);
      }
    }

    .card__body {
      flex: 1;
    }

    .card__name {
      font-family: var(--font-display);
      font-size: 1.35rem;
      font-weight: 400;
      color: var(--color-text);
      margin-bottom: 0.6rem;
      line-height: 1.2;
    }

    .card__desc {
      font-size: var(--size-sm);
      color: var(--color-muted);
      line-height: 1.6;
    }

    .card__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 1.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--color-border);
    }

    .card__price {
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 300;
      color: var(--color-accent);
    }

    .card__duration {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: var(--size-xs);
      color: var(--color-muted);
      letter-spacing: 0.05em;

      svg { flex-shrink: 0; }
    }
  `]
})
export class ServiceCardComponent {
  @Input({ required: true }) service!: Service;
}