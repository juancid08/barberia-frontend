import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { CommonModule } from '@angular/common';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, CommonModule],
  template: `
    @if (!isAdminRoute()) {
      <app-navbar />
    }

    <main>
      <router-outlet />
    </main>

    @if (!isAdminRoute()) {
      <app-footer />
    }
  `,
})
export class App {
  private router = inject(Router);

  // Signal reactivo que detecta si estamos en /admin
  isAdminRoute = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map((e: NavigationEnd) => e.urlAfterRedirects.startsWith('/admin')),
    ),
    { initialValue: this.router.url.startsWith('/admin') }
  );
}