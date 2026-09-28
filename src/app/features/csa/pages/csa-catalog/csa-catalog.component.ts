import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CsaCatalogService, CsaCatalogProduct } from '../../services/csa-catalog.service';

@Component({
  selector: 'app-csa-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './csa-catalog.component.html',
  styleUrls: ['./csa-catalog.component.css']
})
export class CsaCatalogComponent implements OnInit {
  private catalogService = inject(CsaCatalogService);

  products: CsaCatalogProduct[] = [];
  filteredProducts: CsaCatalogProduct[] = [];

  isLoading = false;
  error = '';
  successToast = '';

  searchQuery = '';
  selectedCategory = 'All';
  categories: string[] = [
    'All',
    'Split Indoor Unit',
    'Split Outdoor Unit',
    'Cassette Unit',
    'Ducted Unit',
    'Multi-Split / VRF Unit',
    'Fan-Coil / Air-Handling Unit',
    'Packaged / Rooftop Unit'
  ];

  // Edit Modal State
  isEditModalOpen = false;
  selectedProduct: CsaCatalogProduct | null = null;
  editImage = '';
  imagePreview = '';
  editDescription = '';
  editFeatures: string[] = [];
  newFeatureInput = '';
  isSaving = false;
  editError = '';
  imageUploadError = '';

  ngOnInit(): void {
    this.loadCatalogProducts();
  }

  loadCatalogProducts(): void {
    this.isLoading = true;
    this.error = '';
    this.catalogService.getCatalogProducts().subscribe({
      next: (res) => {
        this.isLoading = false;
        const list = res?.products || res?.data || [];
        if (res && res.success && Array.isArray(list)) {
          this.products = list;
        } else {
          this.products = [];
        }
        this.applyFilter();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load catalog products for CSA:', err);
        this.error = 'Unable to load AC equipment catalog. Please try again.';
      }
    });
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.applyFilter();
  }

  applyFilter(): void {
    const query = this.searchQuery.trim().toLowerCase();
    this.filteredProducts = this.products.filter(p => {
      // Category filter
      const matchesCategory =
        this.selectedCategory === 'All' ||
        (p.category && p.category.toLowerCase() === this.selectedCategory.toLowerCase()) ||
        (p.subcategory && p.subcategory.toLowerCase() === this.selectedCategory.toLowerCase());

      if (!matchesCategory) return false;

      // Text search
      if (!query) return true;
      const name = (p.name || '').toLowerCase();
      const brand = (p.brand || '').toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      const itemCode = (p.itemCode || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();

      return (
        name.includes(query) ||
        brand.includes(query) ||
        sku.includes(query) ||
        itemCode.includes(query) ||
        desc.includes(query)
      );
    });
  }

  getImageUrl(productOrImage: any): string {
    const img = typeof productOrImage === 'object' ? productOrImage?.image : productOrImage;
    if (!img || typeof img !== 'string' || !img.trim()) {
      return '/images/placeholder.png';
    }
    const trimmed = img.trim();
    if (trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
      return trimmed;
    }
    if (trimmed.startsWith('assets/')) {
      return '/' + trimmed;
    }
    return '/images/' + trimmed;
  }

  isInStock(product: CsaCatalogProduct): boolean {
    return product.inStock === true || ((product.availableQuantity ?? product.available ?? 0) > 0);
  }

  openEditModal(product: CsaCatalogProduct): void {
    this.selectedProduct = product;
    this.editImage = product.image || '';
    this.imagePreview = this.getImageUrl(product.image);
    this.editDescription = product.description || '';
    this.editFeatures = Array.isArray(product.features) ? [...product.features] : [];
    this.newFeatureInput = '';
    this.editError = '';
    this.imageUploadError = '';
    this.isSaving = false;
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.selectedProduct = null;
    this.editError = '';
    this.imageUploadError = '';
  }

  onImageUrlChange(val: string): void {
    this.editImage = val;
    this.imagePreview = this.getImageUrl(val);
  }

  onImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.imageUploadError = '';

    if (!file.type.startsWith('image/')) {
      this.imageUploadError = 'Please choose a valid image file (JPEG, PNG, WebP, SVG).';
      return;
    }

    // 2.5MB maximum recommended to avoid huge base64 payload
    if (file.size > 2.5 * 1024 * 1024) {
      this.imageUploadError = 'Image size exceeds 2.5MB. Please choose an optimized image or enter an image URL.';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.editImage = result;
      this.imagePreview = result;
    };
    reader.onerror = () => {
      this.imageUploadError = 'Failed to read image file. Please try again.';
    };
    reader.readAsDataURL(file);
  }

  addFeature(): void {
    const trimmed = this.newFeatureInput.trim();
    if (!trimmed) return;
    if (!this.editFeatures.includes(trimmed)) {
      this.editFeatures.push(trimmed);
    }
    this.newFeatureInput = '';
  }

  onFeatureKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addFeature();
    }
  }

  removeFeature(index: number): void {
    this.editFeatures.splice(index, 1);
  }

  saveProduct(): void {
    if (!this.selectedProduct || !this.selectedProduct._id) return;

    this.isSaving = true;
    this.editError = '';

    const payload = {
      image: this.editImage,
      description: this.editDescription,
      features: this.editFeatures
    };

    this.catalogService.updateCatalogProduct(this.selectedProduct._id, payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        const updated = res?.product || res?.data;
        if (res && res.success && updated) {
          // Update in local lists
          const idx = this.products.findIndex(p => p._id === updated._id);
          if (idx !== -1) {
            this.products[idx] = { ...this.products[idx], ...updated };
          }
          this.applyFilter();

          // Close modal immediately
          this.closeEditModal();

          // Show confirmation message in green
          const msg = res.message || 'Product catalog presentation updated successfully';
          this.showToast(msg);
        } else {
          this.editError = res?.message || 'Failed to update product details.';
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Failed to update catalog product:', err);
        this.editError = err.error?.message || 'Error updating product. Please try again.';
      }
    });
  }

  showToast(msg: string): void {
    this.successToast = msg;
    setTimeout(() => {
      if (this.successToast === msg) {
        this.successToast = '';
      }
    }, 4500);
  }
}
