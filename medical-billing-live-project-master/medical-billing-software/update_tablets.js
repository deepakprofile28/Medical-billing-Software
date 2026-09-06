const fs = require('fs');

let html = fs.readFileSync('src/app/modules/patient/pages/tablets-inventory/tablets-inventory.html', 'utf-8');

const originalStock = `
                <td class="text-center">
                  <span class="stock-pill" [class.low-stock]="(med.stockQty || 0) < 10">
                    {{ (med.stockQty || 0) }}
                  </span>
                </td>`;
const newStock = `
                <td class="text-center">
                  <span class="stock-pill" *ngIf="(med.stockQty || 0) > 0" [class.low-stock]="(med.stockQty || 0) < 10">
                    {{ (med.stockQty || 0) }}
                  </span>
                  <span class="stock-pill" *ngIf="(med.stockQty || 0) === 0" style="background: #fee2e2; color: #dc2626; border-color: #fca5a5;">
                    Out Of Stock
                  </span>
                </td>`;

if (html.includes('<span class="stock-pill" [class.low-stock]="(med.stockQty || 0) < 10">')) {
    // A bit risky with regex, let's just replace the exact block if possible
    html = html.replace(/<td class="text-center">\s*<span class="stock-pill" \[class\.low-stock\]="\(med\.stockQty \|\| 0\) < 10">\s*\{\{ \(med\.stockQty \|\| 0\) \}\}\s*<\/span>\s*<\/td>/, newStock.trim());
    fs.writeFileSync('src/app/modules/patient/pages/tablets-inventory/tablets-inventory.html', html, 'utf-8');
    console.log('Updated tablets inventory stock pill.');
} else {
    console.log('Could not find the stock pill to update.');
}
