const fs = require('fs');
const path = require('path');

function getTsFiles(dir, files = []) {
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getTsFiles(fullPath, files);
        } else if (fullPath.endsWith('.ts') && !fullPath.endsWith('.spec.ts')) {
            files.push(fullPath);
        }
    }
    return files;
}

const baseDir = 'src/app/modules/patient/pages';
const salesDirs = fs.readdirSync(baseDir).filter(d => d.startsWith('sales-') && fs.statSync(path.join(baseDir, d)).isDirectory());

const methodsToInject = `
  totalPatientsCount = 0;
  totalUsersCount = 0;

  togglePatientMenu() { this.isPatientMenuOpen = !this.isPatientMenuOpen; }
  openPatientFromCollapsed() { this.isSidebarCollapsed = false; this.isPatientMenuOpen = true; }
  
  toggleDoctorMenu() { this.isDoctorMenuOpen = !this.isDoctorMenuOpen; }
  openDoctorFromCollapsed() { this.isSidebarCollapsed = false; this.isDoctorMenuOpen = true; }
  
  toggleUserMenu() { this.isUserMenuOpen = !this.isUserMenuOpen; }
  openUserFromCollapsed() { this.isSidebarCollapsed = false; this.isUserMenuOpen = true; }
  
  toggleSettingsMenu() { this.isSettingsMenuOpen = !this.isSettingsMenuOpen; }
  openSettingsFromCollapsed() { this.isSidebarCollapsed = false; this.isSettingsMenuOpen = true; }
`;

let count = 0;
for (const sDir of salesDirs) {
    const tsFiles = getTsFiles(path.join(baseDir, sDir));
    for (const file of tsFiles) {
        let content = fs.readFileSync(file, 'utf-8');
        if (!content.includes('openPatientFromCollapsed()')) {
            content = content.replace(/(export class.*?{)/, '$1\n' + methodsToInject);
            fs.writeFileSync(file, content, 'utf-8');
            count++;
        }
    }
}
console.log('Updated ' + count + ' TS files.');
