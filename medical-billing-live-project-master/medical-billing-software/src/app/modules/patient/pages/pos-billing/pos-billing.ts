import { Component, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { SalesService, SuspendedOrder, CompletedSale } from '../../../services/sales.service';

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
  isSupplierMenuOpen = false;

  // =====================================================
  // DASHBOARD SHELL STATE (Exact match to Dashboard)
  // =====================================================
  // Default to true so Left Pane shows ONLY menu icons for wide POS alignment
  isSidebarCollapsed = true;
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
  isToastWarning = false;
  categoriesList: Category[] = [];

  // =====================================================
  // POS FLOW ACTIONS: SUSPENDED, COMPLETED, EXCHANGE, RETURN
  // =====================================================
  suspendedOrdersList: any[] = [];
  showSuspendedModal = false;
  showCompletedModal = false;
  completedSalesList: any[] = [];
  loadingSuspended = false;
  loadingCompleted = false;

  constructor(
    private posService: PosService,
    private medicineService: MedicineService,
    private patientService: PatientService,
    private doctorService: DoctorService,
    private warehouseService: WarehouseService,
    private authService: AuthService,
    private categoryService: CategoryService,
    private salesService: SalesService,
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
    this.loadSuspendedOrders();
    this.loadCompletedSales();
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
          this.syncCartWithCatalog();
          this.cdr.detectChanges();
        } else {
          // Fallback to fetch all medicines if specific companyId is empty
          this.posService.getMedicines().subscribe({
            next: (all) => {
              this.allMedicines = all || [];
              this.applyMedicineFilter();
              this.syncCartWithCatalog();
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
            this.syncCartWithCatalog();
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  private syncCartWithCatalog(): void {
    if (!this.cart || this.cart.length === 0) return;
    const initialCount = this.cart.length;
    this.cart = this.cart.filter(item => {
      const match = this.allMedicines.find(m => m.id === item.medicine.id);
      if (match) {
        item.medicine.stockQty = match.stockQty !== undefined && match.stockQty !== null ? Number(match.stockQty) : 0;
      }
      return (item.medicine.stockQty || 0) > 0;
    });

    for (const item of this.cart) {
      const maxStock = item.medicine.stockQty || 0;
      if (item.quantity > maxStock) {
        item.quantity = maxStock;
      }
      this.recalculateItem(item);
    }
    this.calculateCartTotals();

    if (this.cart.length < initialCount) {
      this.showToast('⚠️ Out-of-stock items were removed from active cart.', true);
    }
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
    const availableStock = med.stockQty !== undefined && med.stockQty !== null ? Number(med.stockQty) : 0;
    if (availableStock <= 0) {
      this.showToast(`⚠️ Out of Stock: "${med.name}" has 0 stock! Please purchase stock first.`, true);
      return;
    }

    const existingIndex = this.cart.findIndex(i => i.medicine.id === med.id && i.medicine.batchNo === med.batchNo);
    if (existingIndex >= 0) {
      if (this.cart[existingIndex].quantity >= availableStock) {
        this.showToast(`⚠️ Stock Limit Reached: Only ${availableStock} units available for "${med.name}"!`, true);
        return;
      }
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
    const availableStock = item.medicine.stockQty !== undefined && item.medicine.stockQty !== null 
      ? Number(item.medicine.stockQty) 
      : 0;
    if (item.quantity >= availableStock) {
      this.showToast(`⚠️ Stock Limit Reached: Only ${availableStock} units available for "${item.medicine.name}"!`, true);
      return;
    }
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
    const availableStock = item.medicine.stockQty !== undefined && item.medicine.stockQty !== null 
      ? Number(item.medicine.stockQty) 
      : 0;
    if (availableStock <= 0) {
      this.removeFromCart(item);
      this.showToast(`⚠️ "${item.medicine.name}" is out of stock and removed from cart.`, true);
      return;
    }
    if (!item.quantity || item.quantity < 1) {
      item.quantity = 1;
    }
    if (item.quantity > availableStock) {
      item.quantity = availableStock;
      this.showToast(`⚠️ Quantity adjusted to available stock (${availableStock}) for "${item.medicine.name}"!`, true);
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

    // Sync to Completed Sales records
    const completedRecord: CompletedSale = {
      invoiceNo: invoice.invoiceNo,
      customerName: invoice.customerName || invoice.patientName || 'Walk-in Customer',
      paymentMethod: invoice.paymentMethod,
      totalAmount: invoice.subtotal,
      netAmount: invoice.grandTotal,
      status: 'COMPLETED',
      companyId: this.activeStoreId
    };
    this.salesService.createCompleted(completedRecord, this.activeStoreId).subscribe({
      next: () => { this.loadCompletedSales(); },
      error: () => { this.loadCompletedSales(); }
    });

    // Deduct stock for sold items in backend database
    for (const item of this.cart) {
      const medId = item.medicine.id;
      if (medId) {
        const match = this.allMedicines.find(m => m.id === medId);
        const currentStock = match && match.stockQty !== undefined ? Number(match.stockQty) : (item.medicine.stockQty || 0);
        const newStock = Math.max(0, currentStock - item.quantity);
        if (match) {
          match.stockQty = newStock;
        }
        item.medicine.stockQty = newStock;

        this.medicineService.getMedicineById(medId).subscribe({
          next: (dbMed) => {
            if (dbMed) {
              dbMed.stockQty = newStock;
              this.medicineService.updateMedicine(medId, dbMed).subscribe({
                next: () => {
                  this.applyMedicineFilter();
                },
                error: (err) => console.warn(`Failed to update stock for ${dbMed.name}:`, err)
              });
            }
          },
          error: (err) => console.warn(`Failed to fetch medicine ${medId}:`, err)
        });
      }
    }
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
        if ((item.stockQty || 0) > 0) {
          this.addToCart(item);
        } else {
          this.showToast(`⚠️ "${saved.name}" saved with 0 stock. Stock purchase required before billing.`, true);
        }
      },
      error: (err) => {
        console.error('Error saving custom medicine:', err);
        alert('Failed to save medicine. Please verify backend is running on port 8082.');
      }
    });
  }

  private showToast(msg: string, isWarning = false): void {
    this.toastMessage = msg;
    this.isToastWarning = isWarning;
    setTimeout(() => {
      this.toastMessage = '';
      this.isToastWarning = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  

  


  

  


  // ==========================================
  // SIDEBAR & SUBMENU CONTROLS (EXPAND ON CLICK & OUTSIDE CLOSE)
  // ==========================================
  

  

  

  

  

  

  

  

  

  

  

  

  

  

  

  

  

  

  


  // ==========================================
  // SIDEBAR & SUBMENU CONTROLS (EXPAND ON CLICK & OUTSIDE CLOSE)
  // ==========================================
  toggleSidebar(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    if (this.isSidebarCollapsed) {
      this.closeAllMenus();
    }
    this.cdr.detectChanges();
  }

  togglePatientMenu(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isPatientMenuOpen = !this.isPatientMenuOpen;
    this.cdr.detectChanges();
  }

  toggleDoctorMenu(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isDoctorMenuOpen = !this.isDoctorMenuOpen;
    this.cdr.detectChanges();
  }

  toggleUserMenu(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isUserMenuOpen = !this.isUserMenuOpen;
    this.cdr.detectChanges();
  }

  toggleSettingsMenu(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSettingsMenuOpen = !this.isSettingsMenuOpen;
    this.cdr.detectChanges();
  }

  toggleSupplierMenu(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSupplierMenuOpen = !this.isSupplierMenuOpen;
    this.cdr.detectChanges();
  }

  togglePurchaseMenu(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isPurchaseMenuOpen = !this.isPurchaseMenuOpen;
    this.cdr.detectChanges();
  }

  toggleSalesMenu(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSalesMenuOpen = !this.isSalesMenuOpen;
    this.cdr.detectChanges();
  }

  openPatientFromCollapsed(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSidebarCollapsed = false;
    this.closeAllMenus();
    this.isPatientMenuOpen = true;
    this.cdr.detectChanges();
  }

  openDoctorFromCollapsed(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSidebarCollapsed = false;
    this.closeAllMenus();
    this.isDoctorMenuOpen = true;
    this.cdr.detectChanges();
  }

  openUserFromCollapsed(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSidebarCollapsed = false;
    this.closeAllMenus();
    this.isUserMenuOpen = true;
    this.cdr.detectChanges();
  }

  openSettingsFromCollapsed(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSidebarCollapsed = false;
    this.closeAllMenus();
    this.isSettingsMenuOpen = true;
    this.cdr.detectChanges();
  }

  openSupplierFromCollapsed(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSidebarCollapsed = false;
    this.closeAllMenus();
    this.isSupplierMenuOpen = true;
    this.cdr.detectChanges();
  }

  openPurchaseFromCollapsed(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSidebarCollapsed = false;
    this.closeAllMenus();
    this.isPurchaseMenuOpen = true;
    this.cdr.detectChanges();
  }

  openSalesFromCollapsed(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSidebarCollapsed = false;
    this.closeAllMenus();
    this.isSalesMenuOpen = true;
    this.cdr.detectChanges();
  }

  closeAllMenus(): void {
    this.isPatientMenuOpen = false;
    this.isDoctorMenuOpen = false;
    this.isUserMenuOpen = false;
    this.isSettingsMenuOpen = false;
    this.isSalesMenuOpen = false;
    this.isPurchaseMenuOpen = false;
    this.isSupplierMenuOpen = false;
  }

  closeSidebarOnNavigate(): void {
    this.isSidebarCollapsed = true;
    this.closeAllMenus();
    this.cdr.detectChanges();
  }

  onNavClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const link = target.closest('a[routerLink], a.sub-menu-item');
    if (link) {
      this.closeSidebarOnNavigate();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isSidebarCollapsed) {
      return;
    }
    const targetEl = (event.target as HTMLElement)?.nodeType === 1 
      ? (event.target as HTMLElement) 
      : (event.target as HTMLElement)?.parentElement;
    
    // If target element was detached during re-render, do NOT close!
    if (!targetEl || !targetEl.isConnected) {
      return;
    }

    const clickedInsideSidebar = !!targetEl.closest?.('.app-sidebar, .sidebar');
    const clickedToggleBtn = !!targetEl.closest?.('.btn-sidebar-toggle, .sidebar-toggle-btn, .btn-toggle-sidebar, .btn-sidebar-toggle-mobile, .toggle-btn');

    if (!clickedInsideSidebar && !clickedToggleBtn) {
      this.closeAllMenus();
      this.isSidebarCollapsed = true;
      this.cdr.detectChanges();
    }
  }

  // =====================================================
  // POS FLOW: SUSPENDED (HOLD BILL) & COMPLETED SALES
  // =====================================================
  suspendCurrentSale(): void {
    if (!this.cart || this.cart.length === 0) {
      alert('Cart is empty! Please add medicines before suspending the bill.');
      return;
    }

    const holdNo = 'HOLD-' + Math.floor(1000 + Math.random() * 9000);
    const cartSnapshot = JSON.stringify(this.cart);
    const total = this.grandTotal;
    const custName = this.customerName || 'Walk-in Customer';
    const custPhone = this.customerMobile || '';
    const dateStr = new Date().toISOString();

    const newHoldOrder: SuspendedOrder = {
      holdNo: holdNo,
      holdDate: dateStr,
      customerName: custName,
      customerPhone: custPhone,
      totalAmount: total,
      holdReason: cartSnapshot,
      suspendedStatus: 'ON_HOLD',
      status: 'ACTIVE',
      companyId: this.activeStoreId
    };

    // Save locally for instant offline recovery
    try {
      const localList = JSON.parse(localStorage.getItem('medbill_suspended_local') || '[]');
      localList.unshift(newHoldOrder);
      localStorage.setItem('medbill_suspended_local', JSON.stringify(localList));
      localStorage.setItem(`medbill_held_items_${holdNo}`, cartSnapshot);
    } catch (e) {
      console.warn('LocalStorage error saving suspended bill:', e);
    }

    // Persist via SalesService backend
    this.salesService.createSuspended(newHoldOrder, this.activeStoreId).subscribe({
      next: (created) => {
        if (created && created.id) {
          newHoldOrder.id = created.id;
        }
        this.loadSuspendedOrders();
      },
      error: (err) => {
        console.warn('Backend suspended save error, stored locally:', err);
        this.loadSuspendedOrders();
      }
    });

    this.showToast(`Bill Suspended as #${holdNo}!`);
    this.startNewSale();
  }

  loadSuspendedOrders(): void {
    this.loadingSuspended = true;
    this.salesService.getSuspended(this.activeStoreId).subscribe({
      next: (data) => {
        let list = data || [];
        // Merge with local storage entries
        try {
          const localList: any[] = JSON.parse(localStorage.getItem('medbill_suspended_local') || '[]');
          if (localList && localList.length > 0) {
            const existingNos = new Set(list.map(o => o.holdNo));
            for (const item of localList) {
              if (!existingNos.has(item.holdNo)) {
                list.push(item);
              }
            }
          }
        } catch {}
        this.suspendedOrdersList = list;
        this.loadingSuspended = false;
        this.cdr.detectChanges();
      },
      error: () => {
        try {
          this.suspendedOrdersList = JSON.parse(localStorage.getItem('medbill_suspended_local') || '[]');
        } catch {
          this.suspendedOrdersList = [];
        }
        this.loadingSuspended = false;
        this.cdr.detectChanges();
      }
    });
  }

  openSuspendedModal(): void {
    this.loadSuspendedOrders();
    this.showSuspendedModal = true;
  }

  closeSuspendedModal(): void {
    this.showSuspendedModal = false;
  }

  resumeSuspendedOrder(order: any): void {
    if (!order) return;

    if (this.cart.length > 0) {
      const confirmReplace = confirm('You have items in the current cart. Restoring this suspended bill will replace the current cart. Proceed?');
      if (!confirmReplace) return;
    }

    let items: CartItem[] = [];
    if (order.holdReason && typeof order.holdReason === 'string' && order.holdReason.startsWith('[')) {
      try {
        items = JSON.parse(order.holdReason);
      } catch {}
    }
    if ((!items || items.length === 0) && order.holdNo) {
      try {
        const stored = localStorage.getItem(`medbill_held_items_${order.holdNo}`);
        if (stored) items = JSON.parse(stored);
      } catch {}
    }

    if (items && items.length > 0) {
      const validItems: CartItem[] = [];
      let removedCount = 0;
      for (const it of items) {
        const match = this.allMedicines.find(m => m.id === it.medicine.id);
        const currentStock = match && match.stockQty !== undefined ? Number(match.stockQty) : (it.medicine.stockQty || 0);
        it.medicine.stockQty = currentStock;
        if (currentStock <= 0) {
          removedCount++;
          continue;
        }
        if (it.quantity > currentStock) {
          it.quantity = currentStock;
        }
        this.recalculateItem(it);
        validItems.push(it);
      }
      this.cart = validItems;
      if (removedCount > 0) {
        this.showToast(`⚠️ ${removedCount} out-of-stock item(s) removed from resumed bill.`, true);
      }
    }

    this.customerName = order.customerName || 'Walk-in Customer';
    this.customerMobile = order.customerPhone || '';
    this.isWalkInCustomer = (this.customerName === 'Walk-in Customer');
    this.calculateCartTotals();

    // Delete from suspended list
    this.deleteSuspendedOrder(order, false);
    this.closeSuspendedModal();
    this.showToast(`Resumed Bill #${order.holdNo} into Cart!`);
  }

  deleteSuspendedOrder(order: any, showToast = true): void {
    if (order.id) {
      this.salesService.deleteSuspended(order.id).subscribe({
        next: () => this.loadSuspendedOrders(),
        error: () => this.loadSuspendedOrders()
      });
    }
    try {
      let localList: any[] = JSON.parse(localStorage.getItem('medbill_suspended_local') || '[]');
      localList = localList.filter(o => o.holdNo !== order.holdNo);
      localStorage.setItem('medbill_suspended_local', JSON.stringify(localList));
      localStorage.removeItem(`medbill_held_items_${order.holdNo}`);
    } catch {}

    this.suspendedOrdersList = this.suspendedOrdersList.filter(o => o.holdNo !== order.holdNo);
    if (showToast) {
      this.showToast(`Deleted Suspended Bill #${order.holdNo}`);
    }
    this.cdr.detectChanges();
  }

  openCompletedSales(): void {
    this.loadCompletedSales();
    this.showCompletedModal = true;
  }

  closeCompletedModal(): void {
    this.showCompletedModal = false;
  }

  loadCompletedSales(): void {
    this.loadingCompleted = true;
    this.salesService.getCompleted(this.activeStoreId).subscribe({
      next: (data) => {
        let list = data || [];
        try {
          const invoices: any[] = this.posService.getInvoices();
          if (invoices && invoices.length > 0) {
            const existingNos = new Set(list.map((c: any) => c.invoiceNo));
            for (const inv of invoices) {
              if (!existingNos.has(inv.invoiceNo)) {
                list.push({
                  invoiceNo: inv.invoiceNo,
                  customerName: inv.customerName || inv.patientName || 'Customer',
                  paymentMethod: inv.paymentMethod,
                  totalAmount: inv.subtotal,
                  netAmount: inv.grandTotal,
                  completionDate: inv.dateTime,
                  status: 'COMPLETED'
                });
              }
            }
          }
        } catch {}
        this.completedSalesList = list;
        this.loadingCompleted = false;
        this.cdr.detectChanges();
      },
      error: () => {
        try {
          const invoices: any[] = this.posService.getInvoices();
          this.completedSalesList = (invoices || []).map((inv: any) => ({
            invoiceNo: inv.invoiceNo,
            customerName: inv.customerName || inv.patientName || 'Customer',
            paymentMethod: inv.paymentMethod,
            totalAmount: inv.subtotal,
            netAmount: inv.grandTotal,
            completionDate: inv.dateTime,
            status: 'COMPLETED'
          }));
        } catch {
          this.completedSalesList = [];
        }
        this.loadingCompleted = false;
        this.cdr.detectChanges();
      }
    });
  }

  reprintFromCompleted(completed: any): void {
    try {
      const allInvoices: any[] = this.posService.getInvoices();
      const match = (allInvoices || []).find((i: any) => i.invoiceNo === completed.invoiceNo);
      if (match) {
        this.currentInvoice = match;
        this.showCompletedModal = false;
        this.showInvoiceModal = true;
        return;
      }
    } catch {}

    this.currentInvoice = {
      invoiceNo: completed.invoiceNo,
      dateTime: completed.completionDate || new Date().toISOString(),
      storeName: this.activeStoreName,
      storeAddress: this.activeStoreAddress,
      storeGstin: this.activeStoreGstin,
      storeDlNo: this.activeStoreDlNo,
      cashierName: this.cashierName,
      patientName: completed.customerName,
      patientMobile: 'N/A',
      items: [],
      subtotal: completed.totalAmount || completed.netAmount,
      discountAmount: 0,
      taxableAmount: completed.totalAmount || completed.netAmount,
      cgstTotal: 0,
      sgstTotal: 0,
      roundOff: 0,
      grandTotal: completed.netAmount || completed.totalAmount,
      paymentMethod: completed.paymentMethod || 'Cash',
      amountReceived: completed.netAmount || completed.totalAmount,
      changeDue: 0,
      status: 'Completed'
    };
    this.showCompletedModal = false;
    this.showInvoiceModal = true;
  }

  openExchange(): void {
    this.router.navigate(['/sales-exchange']);
  }

  openReturn(): void {
    this.router.navigate(['/sales-returns']);
  }

}
