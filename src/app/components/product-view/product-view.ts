import { Component } from '@angular/core';
import { NavbarComponent } from '../../shared/navbar/navbar';
import { HeroSectionComponent } from '../../shared/hero-section/hero-section';

@Component({
  selector: 'app-product-view',
  imports: [NavbarComponent, HeroSectionComponent],
  templateUrl: './product-view.html',
  styleUrl: './product-view.css',
})
export class ProductViewComponent {}
