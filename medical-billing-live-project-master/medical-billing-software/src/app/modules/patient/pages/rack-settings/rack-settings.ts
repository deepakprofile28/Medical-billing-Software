import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-rack-settings',
  imports: [],
  templateUrl: './rack-settings.html',
  styleUrl: './rack-settings.css',
})
export class RackSettings {
  isSidebarCollapsed = true;
  isSupplierMenuOpen = false;
  isPurchaseMenuOpen = false;

  toggleSupplierMenu(): void {
    this.isSupplierMenuOpen = !this.isSupplierMenuOpen;
  }

  openSupplierFromCollapsed(): void {
    this.isSidebarCollapsed = true;
    this.isSupplierMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.querySelector('.btn-sidebar-toggle') || document.querySelector('.toggle-btn');
    const target = event.target as Node;
    
    if (sidebar && !sidebar.contains(target) && (!toggleBtn || !toggleBtn.contains(target))) {
      this.closeAllMenus();
      this.isSidebarCollapsed = true;
    }
  }

  closeAllMenus() {
    const self = this as any;
    if (typeof self.isPatientMenuOpen !== 'undefined') self.isPatientMenuOpen = false;
    if (typeof self.isDoctorMenuOpen !== 'undefined') self.isDoctorMenuOpen = false;
    if (typeof self.isUserMenuOpen !== 'undefined') self.isUserMenuOpen = false;
    if (typeof self.isSettingsMenuOpen !== 'undefined') self.isSettingsMenuOpen = false;
    if (typeof self.isSalesMenuOpen !== 'undefined') self.isSalesMenuOpen = false;
    if (typeof self.isPurchaseMenuOpen !== 'undefined') self.isPurchaseMenuOpen = false;
    if (typeof self.isSupplierMenuOpen !== 'undefined') self.isSupplierMenuOpen = false;
  }

  closeSidebarOnNavigate(): void {
    this.isSidebarCollapsed = true;
    this.closeAllMenus();
  }

  onNavClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const link = target.closest('a[routerLink], a.sub-menu-item');
    if (link) {
      this.closeSidebarOnNavigate();
    }
  }


  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    if (this.isSidebarCollapsed) {
      this.closeAllMenus();
    }
  }
}

