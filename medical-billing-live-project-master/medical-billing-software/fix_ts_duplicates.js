const fs = require('fs');
const path = require('path');

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

let count = 0;
for (const sDir of salesDirs) {
    const tsFiles = getTsFiles(path.join(baseDir, sDir));
    for (const file of tsFiles) {
        let content = fs.readFileSync(file, 'utf-8');
        
        // Remove the block I previously injected right after class declaration
        content = content.replace(methodsToInject, '');
        
        // Now, we still need 'openPatientFromCollapsed', etc. 
        // Let's remove any existing toggle*Menu from the file to avoid duplicates,
        // then inject the full block at the bottom of the class
        content = content.replace(/togglePatientMenu\(\)[\s\S]*?\n/g, '');
        content = content.replace(/toggleDoctorMenu\(\)[\s\S]*?\n/g, '');
        content = content.replace(/toggleUserMenu\(\)[\s\S]*?\n/g, '');
        content = content.replace(/toggleSettingsMenu\(\)[\s\S]*?\n/g, '');
        content = content.replace(/togglePatientMenu\(\)\s*:\s*void[\s\S]*?\n/g, '');
        content = content.replace(/toggleDoctorMenu\(\)\s*:\s*void[\s\S]*?\n/g, '');
        content = content.replace(/toggleUserMenu\(\)\s*:\s*void[\s\S]*?\n/g, '');
        content = content.replace(/toggleSettingsMenu\(\)\s*:\s*void[\s\S]*?\n/g, '');
        
        // Remove existing total counts
        content = content.replace(/totalPatientsCount.*?;\n/g, '');
        content = content.replace(/totalUsersCount.*?;\n/g, '');
        
        // Inject block at the end of the class (before the last closing brace)
        const lastBraceIndex = content.lastIndexOf('}');
        if (lastBraceIndex !== -1) {
            content = content.substring(0, lastBraceIndex) + methodsToInject + '\n}' + content.substring(lastBraceIndex + 1);
            fs.writeFileSync(file, content, 'utf-8');
            count++;
        }
    }
}
console.log('Fixed ' + count + ' TS files.');
