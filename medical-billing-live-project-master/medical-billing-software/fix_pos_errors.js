const fs = require('fs');
let ts = fs.readFileSync('src/app/modules/patient/pages/pos-billing/pos-billing.ts', 'utf-8');

ts = ts.replace("this.warehouseService.getWarehouses(cid, true)", "this.warehouseService.getAllWarehouses(cid, true)");
ts = ts.replace("next: (data) => {", "next: (data: any) => {");
ts = ts.replace("error: (err) => console.error", "error: (err: any) => console.error");

fs.writeFileSync('src/app/modules/patient/pages/pos-billing/pos-billing.ts', ts, 'utf-8');
console.log('Fixed POS TS errors');
