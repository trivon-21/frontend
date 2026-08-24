import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { NgFor, NgIf, DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthService, AuthUser } from '../../../core/services/auth.service';
import { ClickOutsideDirective } from '../../../directives/click-outside.directive';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
  imports: [NgFor, NgIf, DecimalPipe, NgClass, FormsModule, RouterModule, ClickOutsideDirective],
})
export class Catalog implements OnInit {
  products: any[] = [];

  // Authentication state
  currentUser: AuthUser | null = null;
  showDropdown = false;
  showLoginPromptModal = false;

  // Filter state
  searchQuery: string = '';
  private searchTimeout: any = null;
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

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    public router: Router
  ) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
    this.fetchProducts();
  }

  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.fetchProducts();
    }, 250);
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }

  logout(): void {
    this.authService.logout();
    this.showDropdown = false;
    this.router.navigate(['/']);
  }

  getDashboardUrl(): string {
    if (this.currentUser?.role === 'SUPER_ADMIN') {
      return '/super-admin';
    }
    return '/dashboard';
  }

  onCartClick(event?: Event): void {
    if (event) event.preventDefault();
    if (!this.authService.isLoggedIn()) {
      this.showLoginPromptModal = true;
    } else {
      this.router.navigate(['/cart']);
    }
  }

  closeLoginPromptModal(): void {
    this.showLoginPromptModal = false;
  }

  goToLoginFromModal(): void {
    this.showLoginPromptModal = false;
    this.router.navigate(['/login'], { queryParams: { returnUrl: '/cart' } });
  }

  fetchProducts() {
  let params = new HttpParams()
    .set('page', this.currentPage.toString())
    .set('limit', '9');

  if (this.searchQuery && this.searchQuery.trim()) {
    params = params.set('search', this.searchQuery.trim());
  }
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
    this.searchQuery = '';
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
