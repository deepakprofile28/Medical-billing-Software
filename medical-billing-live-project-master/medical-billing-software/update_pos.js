const fs = require('fs');

// Update HTML
let html = fs.readFileSync('src/app/modules/patient/pages/pos-billing/pos-billing.html', 'utf-8');
const warehouseHtml = `
        <!-- Warehouse Selector -->
        <div class="patient-selector-card mb-2" style="padding-bottom: 15px;">
          <label class="form-label font-weight-bold mb-2"><i class="bi bi-building-gear me-1"></i> Select Warehouse</label>
          <select class="form-select" [(ngModel)]="selectedWarehouseId" (change)="onWarehouseChange()">
            <option value="">-- Choose Warehouse --</option>
            <option *ngFor="let w of warehouses" [value]="w.id">{{ w.name }}</option>
          </select>
        </div>
`;
if(!html.includes('Select Warehouse')) {
    html = html.replace('<!-- 1. Customer & Doctor Selector -->', warehouseHtml + '\n        <!-- 1. Customer & Doctor Selector -->');
    fs.writeFileSync('src/app/modules/patient/pages/pos-billing/pos-billing.html', html, 'utf-8');
}

// Update TS
let ts = fs.readFileSync('src/app/modules/patient/pages/pos-billing/pos-billing.ts', 'utf-8');
if(!ts.includes('selectedWarehouseId')) {
    ts = ts.replace("export class PosBilling implements OnInit, OnDestroy {", "export class PosBilling implements OnInit, OnDestroy {\n  selectedWarehouseId: string = '';\n  warehouses: any[] = [];\n  \n  onWarehouseChange() {\n    // Load stock for this warehouse\n    // this.loadMedicinesForWarehouse(this.selectedWarehouseId);\n  }\n");
    fs.writeFileSync('src/app/modules/patient/pages/pos-billing/pos-billing.ts', ts, 'utf-8');
}

console.log('Updated POS Billing');
