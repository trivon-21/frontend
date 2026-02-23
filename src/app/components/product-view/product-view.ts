import { Component } from '@angular/core';
import { NavbarComponent } from '../../shared/navbar/navbar';
import { HeroSectionComponent } from '../../shared/hero-section/hero-section';
import { FooterComponent } from '../../shared/footer/footer';

@Component({
  selector: 'app-product-view',
  imports: [NavbarComponent, HeroSectionComponent, FooterComponent],
  templateUrl: './product-view.html',
  styleUrl: './product-view.css',
})
export class ProductViewComponent {}
