import { Component, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AiConsultationService, AiConsultation } from '../../../services/ai-consultation.service';
import { AuthService } from '../../../services/auth.service';
import { AccessService } from '../../../services/access.service';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './ai-assistant.html',
  styleUrl: './ai-assistant.css'
})
export class AiAssistant implements OnInit, OnDestroy {
  isPurchaseMenuOpen = false;
  isSupplierMenuOpen = false;

  // Permissions
  canDeleteAi = true;

  // Dashboard Shell State
  isSidebarCollapsed = false;
  isPatientMenuOpen = false;
  isDoctorMenuOpen = false;
  isUserMenuOpen = false;
  isSettingsMenuOpen = false;
  isSalesMenuOpen = false;

  loggedInUser = 'Apollo';
  userRole = 'ADMIN';
  activeStoreName = 'Apollo';
  activeStoreId = '1';

  totalPatientsCount = 3;
  draftsCount = 0;
  totalUsersCount = 2;

  currentDateTime = '';
  private clockTimer?: ReturnType<typeof setInterval>;

  // AI State
  searchPrompt = '';
  analyzing = false;
  currentResult: AiConsultation | null = null;
  historyList: AiConsultation[] = [];
  loadingHistory = false;

  // Quick suggestion chips
  quickPrompts = [
    'Dolo 650 Dosage & Precautions',
    'Pan 40 for Gastric Ulcers & Acidity',
    'Augmentin 625 Duo Antibiotic Usage',
    'Azithral 500 Side Effects & Alternatives',
    'Cetzine 10mg Allergic Rhinitis Regimen'
  ];

  toastMessage = '';

  constructor(
    private aiService: AiConsultationService,
    private authService: AuthService,
    private accessService: AccessService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.canDeleteAi = this.accessService.canDelete('AI_ASSISTANT');
    this.accessService.permissions$.subscribe(() => {
      this.canDeleteAi = this.accessService.canDelete('AI_ASSISTANT');
      this.cdr.detectChanges();
    });

    this.initContext();
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);
    this.loadHistory();
  }

  ngOnDestroy(): void {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
  }

  private initContext(): void {
    this.loggedInUser = this.authService.getUserName() || localStorage.getItem('companyName') || 'Apollo';
    this.userRole = (this.authService.getRole() || 'ADMIN').toUpperCase();
    this.activeStoreName = localStorage.getItem('companyName') || 'Apollo';
    this.activeStoreId = localStorage.getItem('companyId') || '1';
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

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    if (!this.isSidebarCollapsed) {
      this.isSettingsMenuOpen = true;
    }
  }

  openSettingsFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isSettingsMenuOpen = true;
    this.cdr.detectChanges();
  }

  openPatientFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isPatientMenuOpen = true;
    this.cdr.detectChanges();
  }

  openDoctorFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isDoctorMenuOpen = true;
    this.cdr.detectChanges();
  }

  openUserFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isUserMenuOpen = true;
    this.cdr.detectChanges();
  }

  
  toggleSupplierMenu(): void {
    this.isSupplierMenuOpen = !this.isSupplierMenuOpen;
  }

  openSupplierFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isSupplierMenuOpen = true;
  }

  togglePatientMenu(): void {
    this.isPatientMenuOpen = !this.isPatientMenuOpen;
  }

  toggleDoctorMenu(): void {
    this.isDoctorMenuOpen = !this.isDoctorMenuOpen;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  toggleSettingsMenu(): void {
    this.isSettingsMenuOpen = !this.isSettingsMenuOpen;
  }

  logout(): void {
    if (confirm('Are you sure you want to sign out?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  // =========================================================
  // RUN AI CLINICAL ANALYSIS
  // =========================================================
  runAnalysis(customPrompt?: string): void {
    const query = (customPrompt || this.searchPrompt || '').trim();
    if (!query) {
      alert('Please enter a medicine name, symptom, or prescription query.');
      return;
    }

    this.searchPrompt = query;
    this.analyzing = true;
    this.currentResult = null;

    this.aiService.analyzeDrug(query, this.activeStoreId).subscribe({
      next: (res) => {
        this.currentResult = res;
        this.analyzing = false;
        this.showToast(`AI analysis generated and saved to MySQL table!`);
        this.loadHistory();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error calling AI service:', err);
        this.analyzing = false;
        alert('Failed to connect to AI backend. Please verify backend is running on port 8082.');
        this.cdr.detectChanges();
      }
    });
  }

  loadHistory(): void {
    this.loadingHistory = true;
    this.aiService.getHistory(this.activeStoreId).subscribe({
      next: (list) => {
        this.historyList = Array.isArray(list) ? list : [];
        this.loadingHistory = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching AI history:', err);
        this.historyList = [];
        this.loadingHistory = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectHistoryItem(item: AiConsultation): void {
    this.currentResult = item;
    this.searchPrompt = item.queryPrompt;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteHistoryItem(item: AiConsultation, event: Event): void {
    event.stopPropagation();
    if (!this.canDeleteAi) {
      alert('Permission Denied: Delete permission required.');
      return;
    }

    if (!item.id) return;
    if (confirm(`Delete AI consultation record #${item.id} from MySQL?`)) {
      this.aiService.deleteById(item.id).subscribe({
        next: () => {
          this.showToast(`Deleted consultation record #${item.id}`);
          if (this.currentResult?.id === item.id) {
            this.currentResult = null;
          }
          this.loadHistory();
        },
        error: (err) => {
          console.error('Error deleting record:', err);
          alert('Failed to delete consultation record.');
        }
      });
    }
  }

  clearSearch(): void {
    this.searchPrompt = '';
    this.currentResult = null;
  }

  private showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => {
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, 3200);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.querySelector('.btn-sidebar-toggle') || document.querySelector('.toggle-btn');
    const target = event.target as Node;
    
    if (sidebar && !sidebar.contains(target) && (!toggleBtn || !toggleBtn.contains(target))) {
      this.closeAllMenus();
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
    if (typeof self.isSupplierMenuOpen !== "undefined") self.isSupplierMenuOpen = false;
  }

}
