const fs = require('fs');

let content = fs.readFileSync('src/app/app.routes.ts', 'utf-8');

// Add imports
const imports = `
import { PurchaseList } from './modules/patient/pages/purchase/purchase-list/purchase-list';
import { PurchaseReturnsList } from './modules/patient/pages/purchase-returns/purchase-returns-list/purchase-returns-list';
`;
content = content.replace(/(import .*;\n)+/, '$&\n' + imports);

// Add routes
const routesStr = `
  // Purchase Routes
  {
    path: 'purchase',
    component: PurchaseList,
    canActivate: [authGuard]
  },
  {
    path: 'purchase-returns',
    component: PurchaseReturnsList,
    canActivate: [authGuard]
  },
`;

content = content.replace(/(export const routes: Routes = \[)/, '$1\n' + routesStr);

fs.writeFileSync('src/app/app.routes.ts', content, 'utf-8');
console.log('Added purchase routes.');
