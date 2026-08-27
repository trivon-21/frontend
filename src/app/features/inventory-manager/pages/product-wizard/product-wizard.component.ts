import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  INVENTORY_ITEM_CLASSES,
  INVENTORY_ITEM_FORMS,
  INVENTORY_PHASES,
  INVENTORY_SUBCATEGORIES,
  INVENTORY_SYSTEM_TYPES,
  INVENTORY_UNITS,
  InventoryItem,
  InventoryItemClass,
  InventoryItemForm,
  InventoryPhase,
  InventorySystemType,
  UpdateInventoryMasterDataInput,
  deriveStockStatus,
  isValidSubcategory,
  normalizeInventoryList,
  supplierIdOf,
} from '../../services/inventory-domain';
import { InventoryManagerDashboardService } from '../../services/inventory-manager-dashboard.service';

interface SupplierOption {
  _id: string;
  name: string;
}

@Component({
  selector: 'app-product-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './product-wizard.component.html',
  styleUrls: ['./product-wizard.component.css'],
})
export class ProductWizardComponent implements OnInit {
  readonly itemClasses = INVENTORY_ITEM_CLASSES;
  readonly itemForms = INVENTORY_ITEM_FORMS;
  readonly systemTypes = INVENTORY_SYSTEM_TYPES;
  readonly phases = INVENTORY_PHASES;
  readonly units = INVENTORY_UNITS;

  currentStep = 1;
  readonly totalSteps = 3;
  itemId: string | null = null;
  item: InventoryItem | null = null;
  suppliers: SupplierOption[] = [];
  loading = false;
  isSubmitting = false;
  savedItem: InventoryItem | null = null;
  createdNewProduct = false;
  errorMessage = '';
  compatibleModelInput = '';
  refrigerantInput = '';

  readonly form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly inventoryService: InventoryManagerDashboardService,
  ) {
    this.form = this.fb.group(
      {
        name: ['', [Validators.required, Validators.maxLength(160)]],
        sku: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9._-]+$')]],
        itemClass: ['Unclassified', Validators.required],
        subcategory: ['Unclassified', Validators.required],
        brand: ['', [Validators.required, Validators.maxLength(100)]],
        manufacturerPartNumber: [''],
        type: ['Single', Validators.required],
        unit: ['units', Validators.required],
        reorderLevel: [10, [Validators.required, Validators.min(0)]],
        maxStockLevel: [100, [Validators.required, Validators.min(0)]],
        unitCost: [0, [Validators.required, Validators.min(0)]],
        location: ['Warehouse', Validators.required],
        binLocation: [''],
        supplierId: [''],
        isSerialized: [false],
        compatibleModels: this.fb.control<string[]>([]),
        systemType: ['Not Applicable'],
        refrigerants: this.fb.control<string[]>([]),
        capacityBtu: [null, Validators.min(0)],
        voltage: [''],
        phase: ['Not Applicable'],
        specsUrl: ['', Validators.pattern(/^https?:\/\/\S+$/i)],
      },
      { validators: [this.stockLevelsValidator, this.classificationValidator] },
    );
  }

  ngOnInit(): void {
    this.loadSuppliers();

    this.itemId = this.route.snapshot.paramMap.get('id');
    if (this.itemId) this.loadItem(this.itemId);
  }

  loadSuppliers(): void {
    this.inventoryService.getSuppliers().subscribe({
      next: (suppliers) => (this.suppliers = suppliers),
      error: () => this.errorMessage = 'Suppliers could not be loaded. Retry before saving a supplier-linked product.',
    });
  }

  get isEditMode(): boolean {
    return !!this.itemId;
  }

  get availableSubcategories(): string[] {
    return INVENTORY_SUBCATEGORIES[this.form.controls['itemClass'].value as InventoryItemClass] || ['Unclassified'];
  }

  get compatibleModels(): string[] {
    return this.form.controls['compatibleModels'].value || [];
  }

  get refrigerants(): string[] {
    return this.form.controls['refrigerants'].value || [];
  }

  get serializationLocked(): boolean {
    return !!this.item && (this.item.available > 0 || (this.item.serialNumbers?.length || 0) > 0);
  }

  get stockStatusLabel(): string {
    if (!this.item) return 'Out of stock';
    return deriveStockStatus(this.item).replaceAll('-', ' ');
  }

  onItemClassChange(): void {
    const itemClass = this.form.controls['itemClass'].value as InventoryItemClass;
    const current = this.form.controls['subcategory'].value;
    if (!isValidSubcategory(itemClass, current)) {
      this.form.controls['subcategory'].setValue(itemClass === 'Unclassified' ? 'Unclassified' : '');
    }
    this.form.updateValueAndValidity();
  }

  addCompatibleModel(): void {
    this.addTag('compatibleModels', this.compatibleModelInput);
    this.compatibleModelInput = '';
  }

  addRefrigerant(): void {
    this.addTag('refrigerants', this.refrigerantInput);
    this.refrigerantInput = '';
  }

  removeTag(controlName: 'compatibleModels' | 'refrigerants', value: string): void {
    const control = this.form.controls[controlName];
    control.setValue((control.value as string[]).filter((entry) => entry !== value));
    control.markAsDirty();
  }

  nextStep(): void {
    this.touchStep(this.currentStep);
    if (!this.isStepValid(this.currentStep)) return;
    this.currentStep = Math.min(this.totalSteps, this.currentStep + 1);
  }

  previousStep(): void {
    this.currentStep = Math.max(1, this.currentStep - 1);
  }

  goToStep(step: number): void {
    if (step < this.currentStep) this.currentStep = step;
  }

  save(): void {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();
    if (this.form.invalid || this.isSubmitting) {
      this.currentStep = this.firstInvalidStep();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    const payload = this.buildMasterDataPayload();
    const creating = !this.itemId;
    const request = this.itemId
      ? this.inventoryService.updateItem(this.itemId, payload)
      : this.inventoryService.addItem({ ...payload, sku: this.form.getRawValue().sku.trim() });

    request.subscribe({
      next: (item) => {
        this.item = item;
        this.savedItem = item;
        this.createdNewProduct = creating;
        this.itemId = item._id || item.id || this.itemId;
        this.isSubmitting = false;
        this.form.markAsPristine();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.applyServerError(error);
      },
    });
  }

  receiveStock(): void {
    const id = this.savedItem?._id || this.savedItem?.id || this.itemId;
    if (id) this.router.navigate(['/inventory-manager/procurement'], { queryParams: { inventoryId: id } });
  }

  canDeactivate(): boolean {
    return !this.form.dirty || !!this.savedItem || window.confirm('Discard your unsaved product changes?');
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(event: BeforeUnloadEvent): void {
    if (this.form.dirty && !this.savedItem) event.preventDefault();
  }

  hasError(name: string, error?: string): boolean {
    const control = this.form.controls[name];
    return control.touched && (error ? control.hasError(error) : control.invalid);
  }

  private loadItem(id: string): void {
    this.loading = true;
    this.inventoryService.getItem(id).subscribe({
      next: (item) => {
        this.item = item;
        this.form.patchValue({
          name: item.name,
          sku: item.sku,
          itemClass: item.itemClass || 'Unclassified',
          subcategory: item.subcategory || 'Unclassified',
          brand: item.brand,
          manufacturerPartNumber: item.manufacturerPartNumber || '',
          type: item.type,
          unit: item.unit,
          reorderLevel: item.reorderLevel,
          maxStockLevel: item.maxStockLevel,
          unitCost: item.unitCost,
          location: item.location,
          binLocation: item.binLocation || '',
          supplierId: supplierIdOf(item),
          isSerialized: item.isSerialized,
          compatibleModels: item.compatibleModels || [],
          systemType: item.systemType || 'Not Applicable',
          refrigerants: item.refrigerants || [],
          capacityBtu: item.capacityBtu ?? null,
          voltage: item.voltage || '',
          phase: item.phase || 'Not Applicable',
          specsUrl: item.specsUrl || '',
        });
        this.form.controls['sku'].disable({ emitEvent: false });
        if (this.serializationLocked) this.form.controls['isSerialized'].disable({ emitEvent: false });
        this.form.markAsPristine();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load this product.';
        this.loading = false;
      },
    });
  }

  private buildMasterDataPayload(): UpdateInventoryMasterDataInput {
    const value = this.form.getRawValue();
    const capacity = value.capacityBtu;
    return {
      name: value.name.trim(),
      itemClass: value.itemClass as InventoryItemClass,
      subcategory: value.subcategory,
      brand: value.brand.trim(),
      manufacturerPartNumber: value.manufacturerPartNumber?.trim() || '',
      type: value.type as InventoryItemForm,
      unit: value.unit,
      reorderLevel: Number(value.reorderLevel),
      maxStockLevel: Number(value.maxStockLevel),
      unitCost: Number(value.unitCost),
      location: value.location.trim(),
      binLocation: value.binLocation?.trim() || '',
      supplierId: value.supplierId || null,
      isSerialized: !!value.isSerialized,
      compatibleModels: normalizeInventoryList(value.compatibleModels || []),
      systemType: value.systemType as InventorySystemType,
      refrigerants: normalizeInventoryList(value.refrigerants || []),
      capacityBtu: capacity === null || capacity === '' ? undefined : Number(capacity),
      voltage: value.voltage?.trim() || '',
      phase: value.phase as InventoryPhase,
      specsUrl: value.specsUrl?.trim() || '',
    };
  }

  private addTag(controlName: 'compatibleModels' | 'refrigerants', input: string): void {
    const entries = input.split(',');
    const control = this.form.controls[controlName];
    control.setValue(normalizeInventoryList([...(control.value as string[]), ...entries]));
    control.markAsDirty();
  }

  private touchStep(step: number): void {
    this.stepFields(step).forEach((name) => this.form.controls[name].markAsTouched());
    this.form.updateValueAndValidity();
  }

  private isStepValid(step: number): boolean {
    return this.stepFields(step).every((name) => this.form.controls[name].valid)
      && !(step === 1 && this.form.hasError('classification'))
      && !(step === 2 && this.form.hasError('stockLevels'));
  }

  private firstInvalidStep(): number {
    if (!this.isStepValid(1)) return 1;
    if (!this.isStepValid(2)) return 2;
    return 3;
  }

  private stepFields(step: number): string[] {
    if (step === 1) return ['name', 'sku', 'itemClass', 'subcategory', 'brand', 'manufacturerPartNumber', 'type'];
    if (step === 2) return ['unit', 'reorderLevel', 'maxStockLevel', 'unitCost', 'location', 'binLocation', 'supplierId', 'isSerialized'];
    return ['compatibleModels', 'systemType', 'refrigerants', 'capacityBtu', 'voltage', 'phase', 'specsUrl'];
  }

  private applyServerError(error: any): void {
    const code = error?.error?.code;
    if (code === 'DUPLICATE_SKU') this.form.controls['sku'].setErrors({ server: true });
    if (code === 'SUPPLIER_NOT_FOUND') this.form.controls['supplierId'].setErrors({ server: true });
    if (code === 'INVALID_CLASSIFICATION') this.form.controls['subcategory'].setErrors({ server: true });
    this.errorMessage = error?.error?.message || 'Unable to save the product. Review the highlighted fields and try again.';
  }

  private stockLevelsValidator(group: AbstractControl): ValidationErrors | null {
    const reorder = Number(group.get('reorderLevel')?.value);
    const maximum = Number(group.get('maxStockLevel')?.value);
    return maximum < reorder ? { stockLevels: true } : null;
  }

  private classificationValidator(group: AbstractControl): ValidationErrors | null {
    const itemClass = group.get('itemClass')?.value as InventoryItemClass;
    const subcategory = group.get('subcategory')?.value;
    return itemClass !== 'Unclassified' && isValidSubcategory(itemClass, subcategory) ? null : { classification: true };
  }
}
