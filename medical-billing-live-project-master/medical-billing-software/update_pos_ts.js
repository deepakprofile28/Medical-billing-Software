const fs = require('fs');
let ts = fs.readFileSync('src/app/modules/patient/pages/pos-billing/pos-billing.ts', 'utf-8');

if (!ts.includes('WarehouseService')) {
    ts = ts.replace(/import \{ DoctorService, Doctor \} from '..\/..\/..\/services\/doctor.service';/, "import { DoctorService, Doctor } from '../../../services/doctor.service';\nimport { WarehouseService, Warehouse } from '../../../services/warehouse.service';");
    
    // add to constructor
    ts = ts.replace(/private doctorService: DoctorService/, "private doctorService: DoctorService,\n    private warehouseService: WarehouseService");
    
    // add to ngOnInit
    ts = ts.replace(/this.loadCategories\(\);/, "this.loadCategories();\n    this.loadWarehouses();");
    
    // add loadWarehouses method
    const loadW = `
  loadWarehouses() {
    this.warehouseService.getWarehouses(this.activeStoreId, true).subscribe({
      next: (data) => {
        this.warehouses = data;
        if(this.warehouses.length > 0) {
            this.selectedWarehouseId = this.warehouses[0].id.toString();
            this.onWarehouseChange();
        }
      },
      error: (err) => console.error('Failed to load warehouses', err)
    });
  }
`;
    ts = ts.replace(/loadCategories\(\) \{/, loadW + '\n  loadCategories() {');
    fs.writeFileSync('src/app/modules/patient/pages/pos-billing/pos-billing.ts', ts, 'utf-8');
    console.log('Updated POS TS with Warehouse');
}
