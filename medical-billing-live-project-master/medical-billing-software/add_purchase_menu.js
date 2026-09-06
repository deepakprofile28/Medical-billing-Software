const fs = require('fs');
const path = require('path');

function getFiles(dir, ext, files = []) {
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getFiles(fullPath, ext, files);
        } else if (fullPath.endsWith(ext) && !fullPath.endsWith('.spec.ts')) {
            files.push(fullPath);
        }
    }
    return files;
}

const baseDir = 'src/app/modules/patient/pages';
const htmlFiles = getFiles(baseDir, '.html');
const tsFiles = getFiles(baseDir, '.ts');

const purchaseMenuHtml = `
      <!-- PURCHASE MENU -->
      <div class="nav-group">
        <div class="menu-header" (click)="isPurchaseMenuOpen = !isPurchaseMenuOpen" [class.expanded]="isPurchaseMenuOpen" *ngIf="!isSidebarCollapsed">
          <div class="header-left">
            <i class="bi bi-bag-check-fill header-icon" style="color: #f59e0b;"></i>
            <span>Purchase Management</span>
          </div>
          <i class="bi bi-chevron-down chevron-icon" [class.rotate]="isPurchaseMenuOpen"></i>
        </div>

        <a *ngIf="isSidebarCollapsed" (click)="isSidebarCollapsed = false; isPurchaseMenuOpen = true" class="menu-item root-item" style="cursor: pointer;" title="Purchase Management">
          <i class="bi bi-bag-check-fill menu-icon" style="color: #f59e0b;"></i>
        </a>

        <div class="sub-menu" *ngIf="isPurchaseMenuOpen && !isSidebarCollapsed">
          <a routerLink="/purchase" class="sub-menu-item">
            <i class="bi bi-cart-plus-fill sub-icon text-info"></i>
            <span>Purchase</span>
          </a>
          <a routerLink="/purchase-returns" class="sub-menu-item">
            <i class="bi bi-arrow-return-left sub-icon text-danger"></i>
            <span>Purchase Return</span>
          </a>
        </div>
      </div>
`;

let htmlCount = 0;
for (const file of htmlFiles) {
    let content = fs.readFileSync(file, 'utf-8');
    if (!content.includes('PURCHASE MENU')) {
        content = content.replace('<!-- 3. TABLETS & MEDICINES -->', purchaseMenuHtml + '\n      <!-- 3. TABLETS & MEDICINES -->');
        // fallback if "3. TABLETS & MEDICINES" is different
        if (!content.includes('PURCHASE MENU') && content.includes('routerLink="/tablets"')) {
            content = content.replace(/<a routerLink="\/tablets"/, purchaseMenuHtml + '\n      <a routerLink="/tablets"');
        }
        fs.writeFileSync(file, content, 'utf-8');
        htmlCount++;
    }
}

let tsCount = 0;
for (const file of tsFiles) {
    let content = fs.readFileSync(file, 'utf-8');
    if (!content.includes('isPurchaseMenuOpen')) {
        content = content.replace(/(export class.*?{)/, '$1\n  isPurchaseMenuOpen = false;');
        fs.writeFileSync(file, content, 'utf-8');
        tsCount++;
    }
}

console.log('Updated ' + htmlCount + ' HTML files and ' + tsCount + ' TS files.');
