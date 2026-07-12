import { Component } from '@angular/core';

@Component({
  selector: 'app-admin',
  standalone: true,
  template: `
    <section class="section" style="padding-top: calc(var(--navbar-height) + 4rem); min-height: 100vh;">
      <div class="container">
        <p class="label">Panel de administración</p>
        <h1 style="font-family: var(--font-display); font-size: 3rem; font-weight: 300; color: var(--color-text); margin-bottom: 2rem;">
          Admin <em style="color: var(--color-accent); font-style: italic;">H.G. Barber</em>
        </h1>
        <p style="color: var(--color-muted);">Panel de gestión — próximamente.</p>
      </div>
    </section>
  `,
})
export class AdminComponent {}