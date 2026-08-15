import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { NgFor, NgIf, DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
  imports: [NgFor, NgIf, DecimalPipe, NgClass, FormsModule, RouterModule],
})
export class Catalog implements OnInit {
  products: any[] = [];

  // Filter state
  selectedCategory: string = '';
  selectedBrands: string[] = [];
  selectedCapacities: number[] = [];
  maxPrice: number = 500000;

  // Pagination
  currentPage: number = 1;
  totalPages: number = 1;
  totalProducts: number = 0;

  // Static filter options
  categories: string[] = ['Split AC', 'Window AC', 'Central AC', 'Inverter AC'];
  brands: string[] = ['Samsung', 'LG', 'Daikin', 'Panasonic'];
  capacities: number[] = [12000, 18000, 24000];

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.fetchProducts();
  }

  fetchProducts() {
  let params = new HttpParams()
    .set('page', this.currentPage.toString())
    .set('limit', '9');

  if (this.selectedCategory) {
    params = params.set('category', this.selectedCategory);
  }
  if (this.selectedBrands.length > 0) {
    params = params.set('brand', this.selectedBrands.join(','));
  }
  if (this.selectedCapacities.length > 0) {
    params = params.set('capacity', this.selectedCapacities.join(','));
  }
  if (this.maxPrice < 500000) {
    params = params.set('maxPrice', this.maxPrice.toString());
  }

  this.http.get<any>(`${environment.apiUrl}/products`, { params }).subscribe({
    next: (res) => {
      // Always use res.data if present and success is true
      if (res && res.success && Array.isArray(res.data)) {
        this.products = res.data;
        this.totalPages = res.totalPages || 1;
        this.totalProducts = res.total || 0;
        this.currentPage = res.page || 1;
      } else {
        this.products = [];
        this.totalPages = 1;
        this.totalProducts = 0;
      }
    },
    error: (err) => {
      console.error('Failed to load products:', err);
      this.products = [];
    }
  })
}

  // Category filter
  selectCategory(category: string) {
    this.selectedCategory = category;
    this.currentPage = 1;
    this.fetchProducts();
  }

  // Brand filter
  toggleBrand(brand: string) {
    const index = this.selectedBrands.indexOf(brand);
    if (index > -1) {
      this.selectedBrands.splice(index, 1);
    } else {
      this.selectedBrands.push(brand);
    }
    this.currentPage = 1;
    this.fetchProducts();
  }

  isBrandSelected(brand: string): boolean {
    return this.selectedBrands.includes(brand);
  }

  // Capacity filter
  toggleCapacity(cap: number) {
    const index = this.selectedCapacities.indexOf(cap);
    if (index > -1) {
      this.selectedCapacities.splice(index, 1);
    } else {
      this.selectedCapacities.push(cap);
    }
    this.currentPage = 1;
    this.fetchProducts();
  }

  isCapacitySelected(cap: number): boolean {
    return this.selectedCapacities.includes(cap);
  }

  // Price slider
  onPriceChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.maxPrice = parseInt(target.value);
  }

  // Apply filter (for the Apply button)
  applyFilter() {
    this.currentPage = 1;
    this.fetchProducts();
  }

  // Reset all filters
  resetFilter(event: Event) {
    event.preventDefault();
    this.selectedCategory = '';
    this.selectedBrands = [];
    this.selectedCapacities = [];
    this.maxPrice = 500000;
    this.currentPage = 1;
    this.fetchProducts();
  }

  // Pagination
  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.fetchProducts();
  }

  getPages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  getImageUrl(product: any): string {
    const image = product.image;
    if (!image) return 'assets/placeholder.png';
    if (image.startsWith('http')) return image;
    return '/images/' + image;
  }

  isInStock(product: any): boolean {
    return product.inStock === true;
  }

  getStars(rating: number): string {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }
}
