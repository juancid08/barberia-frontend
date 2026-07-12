import { Component } from '@angular/core';
import { HeroComponent } from './components/hero/hero.component';
import { ServicesPreviewComponent } from './components/services-preview/services.preview.component';
import { AboutComponent } from './components/about/About.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeroComponent, ServicesPreviewComponent, AboutComponent],
  template: `
    <app-hero />
    <app-about />
    <app-services-preview />
  `,
})
export class HomeComponent {}
