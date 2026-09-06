import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PosService, MedicineItem, CartItem, PosInvoice } from '../../../services/pos.service';
import { MedicineService, Medicine } from '../../../services/medicine.service';
import { PatientService, Patient } from '../../../services/patient.service';
import { AuthService } from '../../../services/auth.service';
import { CategoryService, Category } from '../../../services/category.service';
import { DoctorService, Doctor } from '../../../services/doctor.service';
import { WarehouseService, Warehouse } from '../../../services/warehouse.service';

@Component({
  selector: 'app-pos-billing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './pos-billing.html',
  styleUrl: './pos-billing.css'
})
export class PosBilling implements OnInit, OnDestroy {
  selectedWarehouseId: string = '';
  warehouses: any[] = [];
  
  onWarehouseChange() {
    // Load stock for this warehouse
    // this.loadMedicinesForWarehouse(this.selectedWarehouseId);
  }

  isPurchaseMenuOpen = false;

  // =====================================================
  // DASHBOARD SHELL STATE (Exact match to Dashboard)
  // =====================================================
  // Default to true so Left Pane shows ONLY menu icons for wide POS alignment
  isSidebarCollapsed = false;
  isPatientMenuOpen = false;
  isDoctorMenuOpen = false;
  isUserMenuOpen = false;
  isSettingsMenuOpen = false;
  isSalesMenuOpen = false;

  totalPatientsCount = 3;
  draftsCount = 0;
  totalUsersCount = 2;

  // =====================================================
  // STORE & CASHIER CONTEXT
  // =====================================================
  activeStoreName = 'Apollo';
  activeStoreId = '1';
  activeStoreAddress = 'Muthu Mari Amman Koil St, Adhi Nagar, Chennai';
  activeStoreGstin = '33AABCA1234F1Z8';
  activeStoreDlNo = 'TN/CHN/20B/2026/0091';
  cashierName = 'Administrator';
  cashierRole = 'ADMIN';

  currentDateTime = '';
  private clockTimer?: ReturnType<typeof setInterval>;

  // =====================================================
  // MEDICINE CATALOG & SEARCH
  // =====================================================
  allMedicines: MedicineItem[] = [];
  filteredMedicines: MedicineItem[] = [];
  searchQuery = '';
  selectedCategory = 'All';
  categories = ['All', 'Tablets', 'Syrups', 'Injections', 'Antibiotics', 'Vitamins', 'First Aid', 'General'];

  // =====================================================
  // PATIENT SELECTION
  // =====================================================
  patientsList: Patient[] = [];
  patientSearchQuery = '';
  selectedPatient: Patient | null = null;
  isWalkInCustomer = true;
  customerName = 'Walk-in Customer';
  customerMobile = '';
  doctorName = 'Dr. Self / General';
  doctorsList: Doctor[] = [];

  // =====================================================
  // ACTIVE POS CART
  // =====================================================
  cart: CartItem[] = [];
  overallDiscountPercent = 0;

  // Totals
  subtotal = 0;
  discountTotal = 0;
  taxableAmount = 0;
  cgstTotal = 0;
  sgstTotal = 0;
  roundOff = 0;
  grandTotal = 0;

  // Payment
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Insurance' | 'Credit' = 'Cash';
  amountReceived = 0;
  changeDue = 0;

  // =====================================================
  // PRINT & INVOICE MODAL
  // =====================================================
  showInvoiceModal = false;
  currentInvoice: PosInvoice | null = null;
  printReceiptType: 'thermal' | 'a4' = 'thermal';

  // =====================================================
  // ADD NEW MEDICINE MODAL
  // =====================================================
  showAddMedModal = false;
  newMed: Medicine = {
    name: '',
    genericName: '',
    category: 'Tablets',
    batchNo: '',
    expiryDate: '',
    unitPrice: 0,
    mrp: 0,
    gstRate: 12,
    stockQty: 100,
    manufacturer: ''
  };

  // Toast / notification
  toastMessage = '';
  categoriesList: Category[] = [];

  constructor(
    private posService: PosService,
    private medicineService: MedicineService,
    private patientService: PatientService,
    private doctorService: DoctorService,
    private warehouseService: WarehouseService,
    private authService: AuthService,
    private categoryService: CategoryService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initStoreContext();
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);
    this.loadCatalog();
    this.loadPatients();
    this.loadDoctors();
    this.loadCategories();
    this.loadWarehouses();
  }

  loadDoctors(): void {
    const cid = localStorage.getItem('companyId') || this.activeStoreId || '1';
    this.doctorService.getAllDoctors(cid, true).subscribe({
      next: (docs) => {
        if (docs && docs.length > 0) {
          this.doctorsList = docs;
        } else {
          this.doctorService.getAllDoctors(cid, false).subscribe({
            next: (allDocs) => {
              this.doctorsList = allDocs || [];
              this.cdr.detectChanges();
            }
          });
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('Could not load doctors in POS:', err);
        this.doctorService.getAllDoctors(undefined, false).subscribe({
          next: (allDocs) => {
            this.doctorsList = allDocs || [];
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

    loadWarehouses(): void {
    const cid = localStorage.getItem('companyId') || this.activeStoreId || '1';
    this.warehouseService.getAllWarehouses(cid, true).subscribe({
      next: (data: any) => {
        this.warehouses = data || [];
        if(this.warehouses.length > 0) {
            this.selectedWarehouseId = this.warehouses[0].id.toString();
            this.onWarehouseChange();
        }
      },
      error: (err: any) => console.error('Failed to load warehouses', err)
    });
  }
  loadCategories(): void {
    this.categoryService.getAllCategories(this.activeStoreId, true).subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.categoriesList = data;
          this.categories = ['All', ...data.map(c => c.name)];
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.warn('Error loading categories in POS:', err)
    });
  }

  ngOnDestroy(): void {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
  }

  private initStoreContext(): void {
    this.activeStoreName = localStorage.getItem('companyName') || sessionStorage.getItem('signupCompanyName') || 'Apollo';
    this.activeStoreId = localStorage.getItem('companyId') || '1';
    this.cashierName = this.authService.getUserName() || 'Administrator';
    this.cashierRole = (this.authService.getRole() || 'ADMIN').toUpperCase();

    try {
      const stored = localStorage.getItem('medbill_store_settings');
      if (stored) {
        const s = JSON.parse(stored);
        if (s.storeName) this.activeStoreName = s.storeName;
        if (s.address) this.activeStoreAddress = s.address;
        if (s.gstin) this.activeStoreGstin = s.gstin;
        if (s.drugLicenseNo) this.activeStoreDlNo = s.drugLicenseNo;
        if (s.defaultReceiptType) this.printReceiptType = s.defaultReceiptType;
      }
    } catch (e) {
      console.warn('Error reading store settings in POS:', e);
    }
  }

  private updateClock(): void {
    const now = new Date();
    this.currentDateTime = now.toLocaleString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    if (!this.isSidebarCollapsed) {
      this.isSettingsMenuOpen = true;
    }
  }

  openSettingsFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isSettingsMenuOpen = true;
    this.cdr.detectChanges();
  }

  openPatientFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isPatientMenuOpen = true;
    this.cdr.detectChanges();
  }

  openDoctorFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isDoctorMenuOpen = true;
    this.cdr.detectChanges();
  }

  openUserFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isUserMenuOpen = true;
    this.cdr.detectChanges();
  }

  togglePatientMenu(): void {
    this.isPatientMenuOpen = !this.isPatientMenuOpen;
  }

  toggleDoctorMenu(): void {
    this.isDoctorMenuOpen = !this.isDoctorMenuOpen;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  toggleSettingsMenu(): void {
    this.isSettingsMenuOpen = !this.isSettingsMenuOpen;
  }

  logout(): void {
    if (confirm('Are you sure you want to sign out?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  // =====================================================
  // LOAD CATALOG & PATIENTS (Strictly from MySQL)
  // =====================================================
  loadCatalog(): void {
    this.posService.getMedicines(this.activeStoreId).subscribe({
      next: (meds) => {
        if (meds && meds.length > 0) {
          this.allMedicines = meds;
          this.applyMedicineFilter();
          this.cdr.detectChanges();
        } else {
          // Fallback to fetch all medicines if specific companyId is empty
          this.posService.getMedicines().subscribe({
            next: (all) => {
              this.allMedicines = all || [];
              this.applyMedicineFilter();
              this.cdr.detectChanges();
            }
          });
        }
      },
      error: (err) => {
        console.error('Error loading medicines for POS:', err);
        this.posService.getMedicines().subscribe({
          next: (all) => {
            this.allMedicines = all || [];
            this.applyMedicineFilter();
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  loadPatients(): void {
    this.patientService.getAllPatients().subscribe({
      next: (data) => {
        this.patientsList = Array.isArray(data) ? data : [];
      },
      error: (err) => {
        console.error('Error fetching patients for POS:', err);
      }
    });
  }

  // =====================================================
  // MEDICINE SEARCH & FILTER
  // =====================================================
  filterByCategory(cat: string): void {
    this.selectedCategory = cat;
    this.applyMedicineFilter();
  }

  onSearchChange(): void {
    this.applyMedicineFilter();
  }

  private applyMedicineFilter(): void {
    const q = (this.searchQuery || '').toLowerCase().trim();
    this.filteredMedicines = (this.allMedicines || []).filter(m => {
      if (!m) return false;
      const matchCat = (this.selectedCategory === 'All') || (m.category === this.selectedCategory);
      if (!matchCat) return false;
      if (!q) return true;
      return (m.name || '').toLowerCase().includes(q) ||
             (m.genericName || '').toLowerCase().includes(q) ||
             (m.code || '').toLowerCase().includes(q) ||
             (m.batchNo || '').toLowerCase().includes(q) ||
             (m.manufacturer || '').toLowerCase().includes(q);
    });
  }

  // =====================================================
  // CART OPERATIONS
  // =====================================================
  addToCart(med: MedicineItem): void {
    const existingIndex = this.cart.findIndex(i => i.medicine.id === med.id && i.medicine.batchNo === med.batchNo);
    if (existingIndex >= 0) {
      this.cart[existingIndex].quantity++;
      this.recalculateItem(this.cart[existingIndex]);
    } else {
      const newItem: CartItem = {
        medicine: med,
        quantity: 1,
        unitPrice: med.unitPrice,
        discountPercent: 0,
        taxableAmount: med.unitPrice,
        gstRate: med.gstRate,
        cgstAmount: 0,
        sgstAmount: 0,
        totalAmount: 0
      };
      this.recalculateItem(newItem);
      this.cart.unshift(newItem);
    }
    this.calculateCartTotals();
    this.showToast(`Added "${med.name}" to bill`);
  }

  increaseQty(item: CartItem): void {
    item.quantity++;
    this.recalculateItem(item);
    this.calculateCartTotals();
  }

  decreaseQty(item: CartItem): void {
    if (item.quantity > 1) {
      item.quantity--;
      this.recalculateItem(item);
      this.calculateCartTotals();
    } else {
      this.removeFromCart(item);
    }
  }

  onQtyInputChange(item: CartItem): void {
    if (!item.quantity || item.quantity < 1) {
      item.quantity = 1;
    }
    this.recalculateItem(item);
    this.calculateCartTotals();
  }

  removeFromCart(item: CartItem): void {
    const index = this.cart.indexOf(item);
    if (index >= 0) {
      this.cart.splice(index, 1);
      this.calculateCartTotals();
      this.showToast(`Removed "${item.medicine.name}"`);
    }
  }

  clearCart(): void {
    if (this.cart.length === 0) return;
    if (confirm('Are you sure you want to clear the current cart?')) {
      this.cart = [];
      this.calculateCartTotals();
      this.showToast('Cart cleared.');
    }
  }

  // =====================================================
  // CALCULATIONS & TAX COMPUTATION
  // =====================================================
  private recalculateItem(item: CartItem): void {
    const gross = item.unitPrice * item.quantity;
    const discount = (gross * item.discountPercent) / 100;
    item.taxableAmount = gross - discount;

    const totalTaxRate = item.gstRate;
    const halfTaxRate = totalTaxRate / 2;

    item.cgstAmount = (item.taxableAmount * halfTaxRate) / 100;
    item.sgstAmount = (item.taxableAmount * halfTaxRate) / 100;
    item.totalAmount = item.taxableAmount + item.cgstAmount + item.sgstAmount;
  }

  calculateCartTotals(): void {
    let sub = 0;
    let taxable = 0;
    let cgst = 0;
    let sgst = 0;

    for (const item of this.cart) {
      sub += item.unitPrice * item.quantity;
      taxable += item.taxableAmount;
      cgst += item.cgstAmount;
      sgst += item.sgstAmount;
    }

    this.subtotal = sub;
    this.discountTotal = (this.subtotal * this.overallDiscountPercent) / 100;
    
    // Adjust taxable based on overall discount if any
    const discountedTaxable = Math.max(0, taxable - this.discountTotal);
    this.taxableAmount = discountedTaxable;
    
    // Scale GST proportionally
    const taxRatio = taxable > 0 ? (discountedTaxable / taxable) : 1;
    this.cgstTotal = cgst * taxRatio;
    this.sgstTotal = sgst * taxRatio;

    const exactTotal = this.taxableAmount + this.cgstTotal + this.sgstTotal;
    const rounded = Math.round(exactTotal);
    this.roundOff = rounded - exactTotal;
    this.grandTotal = rounded;

    // Default amount received to grand total for cash
    if (this.amountReceived === 0 || this.amountReceived < this.grandTotal) {
      this.amountReceived = this.grandTotal;
    }
    this.calculateChange();
  }

  onDiscountChange(): void {
    if (this.overallDiscountPercent < 0) this.overallDiscountPercent = 0;
    if (this.overallDiscountPercent > 100) this.overallDiscountPercent = 100;
    this.calculateCartTotals();
  }

  onAmountReceivedChange(): void {
    this.calculateChange();
  }

  private calculateChange(): void {
    if (this.paymentMethod === 'Cash') {
      this.changeDue = Math.max(0, this.amountReceived - this.grandTotal);
    } else {
      this.amountReceived = this.grandTotal;
      this.changeDue = 0;
    }
  }

  setPaymentMethod(method: 'Cash' | 'UPI' | 'Card' | 'Insurance' | 'Credit'): void {
    this.paymentMethod = method;
    if (method !== 'Cash') {
      this.amountReceived = this.grandTotal;
      this.changeDue = 0;
    } else {
      this.calculateChange();
    }
  }

  // =====================================================
  // PATIENT SELECTION HANDLERS
  // =====================================================
  togglePatientType(isWalkIn: boolean): void {
    this.isWalkInCustomer = isWalkIn;
    if (isWalkIn) {
      this.customerName = 'Walk-in Customer';
      this.customerMobile = '';
      this.selectedPatient = null;
    } else {
      if (this.patientsList.length > 0) {
        this.selectPatient(this.patientsList[0]);
      } else {
        this.customerName = 'Registered Patient';
      }
    }
  }

  selectPatient(p: Patient): void {
    this.selectedPatient = p;
    this.customerName = p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Patient';
    this.customerMobile = p.mobile || p.mobileNumber || '';
  }

  onPatientSelectChange(): void {
    if (this.selectedPatient) {
      this.customerName = this.selectedPatient.name || `${this.selectedPatient.firstName || ''} ${this.selectedPatient.lastName || ''}`.trim() || 'Patient';
      this.customerMobile = this.selectedPatient.mobile || this.selectedPatient.mobileNumber || '';
    }
  }

  // =====================================================
  // SALE COMPLETION & PRINTING
  // =====================================================
  completeSale(): void {
    if (this.cart.length === 0) {
      alert('Cart is empty! Please add medicines before checkout.');
      return;
    }

    if (this.paymentMethod === 'Cash' && this.amountReceived < this.grandTotal) {
      alert(`Amount received (₹${this.amountReceived}) is less than Total (₹${this.grandTotal})!`);
      return;
    }

    const invNum = this.posService.generateInvoiceNumber();
    const nowIso = new Date().toISOString();
    const custName = this.customerName || 'Walk-in Customer';
    const custMob = this.customerMobile || 'N/A';

    const invoice: PosInvoice = {
      invoiceNo: invNum,
      invoiceNumber: invNum,
      dateTime: nowIso,
      invoiceDate: nowIso,
      storeName: this.activeStoreName,
      storeAddress: this.activeStoreAddress,
      storeGstin: this.activeStoreGstin,
      storeDlNo: this.activeStoreDlNo,
      cashierName: this.cashierName,
      patientName: custName,
      customerName: custName,
      patientMobile: custMob,
      customerMobile: custMob,
      doctorName: this.doctorName || 'Dr. Self / General',
      items: JSON.parse(JSON.stringify(this.cart)),
      subtotal: this.subtotal,
      discountAmount: this.discountTotal,
      discountTotal: this.discountTotal,
      taxableAmount: this.taxableAmount,
      cgstTotal: this.cgstTotal,
      sgstTotal: this.sgstTotal,
      roundOff: this.roundOff,
      grandTotal: this.grandTotal,
      paymentMethod: this.paymentMethod,
      amountReceived: this.amountReceived,
      changeDue: this.changeDue,
      status: 'Completed'
    };

    this.posService.saveInvoice(invoice);
    this.currentInvoice = invoice;
    this.showInvoiceModal = true;
    this.showToast(`Invoice #${invoice.invoiceNo} Generated!`);
  }

  printInvoice(): void {
    window.print();
  }

  closeInvoiceModal(): void {
    this.showInvoiceModal = false;
    this.startNewSale();
  }

  startNewSale(): void {
    this.cart = [];
    this.overallDiscountPercent = 0;
    this.calculateCartTotals();
    this.searchQuery = '';
    this.selectedCategory = 'All';
    this.applyMedicineFilter();
    this.isWalkInCustomer = true;
    this.customerName = 'Walk-in Customer';
    this.customerMobile = '';
    this.doctorName = 'Dr. Self / General';
    this.paymentMethod = 'Cash';
  }

  // =====================================================
  // ADD CUSTOM MEDICINE MODAL
  // =====================================================
  openAddMedModal(): void {
    this.newMed = {
      name: '',
      genericName: '',
      category: 'Tablets',
      batchNo: 'B' + Math.floor(1000 + Math.random() * 9000),
      expiryDate: '2028-12',
      unitPrice: 50,
      mrp: 60,
      gstRate: 12,
      stockQty: 100,
      manufacturer: ''
    };
    this.showAddMedModal = true;
  }

  closeAddMedModal(): void {
    this.showAddMedModal = false;
  }

  saveCustomMedicine(): void {
    if (!this.newMed.name.trim()) {
      alert('Please enter Medicine Name');
      return;
    }
    if (this.newMed.unitPrice <= 0) {
      alert('Please enter valid unit price');
      return;
    }

    this.medicineService.addMedicine(this.newMed, this.activeStoreId).subscribe({
      next: (saved) => {
        this.showToast(`Added "${saved.name}" to database!`);
        this.closeAddMedModal();
        this.loadCatalog();
        // Immediately add to cart for fast cashier experience
        const item: MedicineItem = {
          id: saved.id || 0,
          code: `MED-${saved.id}`,
          name: saved.name,
          genericName: saved.genericName || '',
          category: saved.category || 'Tablets',
          batchNo: saved.batchNo || 'N/A',
          expiryDate: saved.expiryDate || 'N/A',
          unitPrice: saved.unitPrice || 0,
          mrp: saved.mrp || saved.unitPrice || 0,
          gstRate: saved.gstRate !== undefined ? saved.gstRate : 12,
          stockQty: saved.stockQty !== undefined ? saved.stockQty : 0,
          manufacturer: saved.manufacturer || ''
        };
        this.addToCart(item);
      },
      error: (err) => {
        console.error('Error saving custom medicine:', err);
        alert('Failed to save medicine. Please verify backend is running on port 8082.');
      }
    });
  }

  private showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => {
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, 2600);
  }
}

