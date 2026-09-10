import { Component, HostListener, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { DoctorService, Doctor } from '../../../services/doctor.service';
import { AccessService } from '../../../services/access.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-doctor-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './doctor-registration.html',
  styleUrls: ['./doctor-registration.css']
})
export class DoctorRegistration implements OnInit, OnDestroy {
  isPurchaseMenuOpen = false;
  isSupplierMenuOpen = false;

  doctorForm!: FormGroup;
  isEditing = false;
  doctorId: number | null = null;
  loading = false;
  saving = false;

  // Sidebar state
  isSidebarCollapsed = false;
  isPatientMenuOpen = false;
  isDoctorMenuOpen = true;
  isUserMenuOpen = false;
  isSettingsMenuOpen = false;
  isSalesMenuOpen = false;

  loggedInUser = localStorage.getItem('userName') || 'Admin';
  userRole = (localStorage.getItem('userRole') || localStorage.getItem('role') || 'ADMIN').toUpperCase();
  activeStoreName = localStorage.getItem('companyName') || 'Apollo';
  activeStoreId = localStorage.getItem('companyId') || '1';
  totalPatientsCount = 3;
  draftsCount = 0;
  totalUsersCount = 2;

  currentDateTime = '';
  private clockTimer?: ReturnType<typeof setInterval>;

  // Toast
  toastMessage = '';
  toastType: 'success' | 'danger' | 'info' = 'success';
  showToast = false;

  // Permissions
  canWriteDoctor = true;
  canUpdateDoctor = true;

  // Preset Specializations
  specializations: string[] = [
    'General Medicine',
    'Cardiology',
    'Pediatrics',
    'Orthopedics',
    'Dermatology',
    'ENT (Ear, Nose, Throat)',
    'Gynecology & Obstetrics',
    'Ophthalmology',
    'Neurology',
    'Pulmonology',
    'Gastroenterology',
    'Dental Surgery',
    'Psychiatry',
    'General Surgery',
    'Nephrology'
  ];

  // Days of Week
  daysOfWeek: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  selectedDays: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor(
    private fb: FormBuilder,
    private doctorService: DoctorService,
    private accessService: AccessService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);

    this.canWriteDoctor = this.accessService.canWrite('DOCTORS');
    this.canUpdateDoctor = this.accessService.canUpdate('DOCTORS');

    this.accessService.permissions$.subscribe(() => {
      this.canWriteDoctor = this.accessService.canWrite('DOCTORS');
      this.canUpdateDoctor = this.accessService.canUpdate('DOCTORS');
      this.cdr.detectChanges();
    });

    this.initForm();

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.doctorId = +params['id'];
        this.isEditing = true;
        this.loadDoctorDetails(this.doctorId);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
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

  private initForm(): void {
    this.doctorForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      specialization: ['General Medicine', [Validators.required]],
      qualification: ['MBBS, MD', [Validators.required]],
      registrationNumber: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.email]],
      department: ['General Medicine'],
      roomNumber: ['OPD 101'],
      consultationFee: [500, [Validators.min(0)]],
      experienceYears: [5, [Validators.min(0)]],
      availableTimeStart: ['09:00 AM', [Validators.required]],
      availableTimeEnd: ['01:00 PM', [Validators.required]],
      status: ['ACTIVE', [Validators.required]],
      notes: ['']
    });
  }

  toggleDay(day: string): void {
    const idx = this.selectedDays.indexOf(day);
    if (idx > -1) {
      if (this.selectedDays.length > 1) {
        this.selectedDays.splice(idx, 1);
      }
    } else {
      this.selectedDays.push(day);
    }
    this.cdr.detectChanges();
  }

  isDaySelected(day: string): boolean {
    return this.selectedDays.includes(day);
  }

  loadDoctorDetails(id: number): void {
    this.loading = true;
    this.doctorService.getDoctorById(id).subscribe({
      next: (doctor) => {
        this.loading = false;
        if (doctor) {
          this.doctorForm.patchValue({
            name: doctor.name,
            specialization: doctor.specialization,
            qualification: doctor.qualification || '',
            registrationNumber: doctor.registrationNumber || '',
            phone: doctor.phone,
            email: doctor.email || '',
            department: doctor.department || doctor.specialization,
            roomNumber: doctor.roomNumber || '',
            consultationFee: doctor.consultationFee !== undefined ? doctor.consultationFee : 500,
            experienceYears: doctor.experienceYears !== undefined ? doctor.experienceYears : 0,
            availableTimeStart: doctor.availableTimeStart || '09:00 AM',
            availableTimeEnd: doctor.availableTimeEnd || '01:00 PM',
            status: doctor.status || 'ACTIVE',
            notes: doctor.notes || ''
          });

          if (doctor.availableDays) {
            this.selectedDays = doctor.availableDays.split(',').map(d => d.trim()).filter(Boolean);
          }
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.loading = false;
        this.triggerToast('Failed to load doctor profile details.', 'danger');
        console.error(err);
      }
    });
  }

  onSubmit(): void {
    if (this.isEditing && !this.canUpdateDoctor) {
      this.triggerToast('Permission Denied: Update permission required.', 'danger');
      return;
    }

    if (!this.isEditing && !this.canWriteDoctor) {
      this.triggerToast('Permission Denied: Write permission required to add a doctor.', 'danger');
      return;
    }

    if (this.doctorForm.invalid) {
      this.doctorForm.markAllAsTouched();
      this.triggerToast('Please fill all mandatory fields correctly.', 'danger');
      return;
    }

    this.saving = true;
    const formVal = this.doctorForm.value;
    const payload: Doctor = {
      ...formVal,
      availableDays: this.selectedDays.join(', '),
      consultationFee: Number(formVal.consultationFee) || 0,
      experienceYears: Number(formVal.experienceYears) || 0
    };

    if (this.isEditing && this.doctorId) {
      this.doctorService.updateDoctor(this.doctorId, payload).subscribe({
        next: (res) => {
          this.saving = false;
          this.triggerToast(`Doctor "${res.name}" updated successfully!`, 'success');
          setTimeout(() => {
            this.router.navigate(['/doctors']);
          }, 1200);
        },
        error: (err) => {
          this.saving = false;
          console.error(err);
          this.triggerToast('Failed to update doctor profile.', 'danger');
        }
      });
    } else {
      this.doctorService.createDoctor(payload, this.activeStoreId).subscribe({
        next: (res) => {
          this.saving = false;
          this.triggerToast(`Doctor "${res.name}" registered successfully!`, 'success');
          setTimeout(() => {
            this.router.navigate(['/doctors']);
          }, 1200);
        },
        error: (err) => {
          this.saving = false;
          console.error(err);
          this.triggerToast('Failed to save doctor to database.', 'danger');
        }
      });
    }
  }

  triggerToast(msg: string, type: 'success' | 'danger' | 'info' = 'success'): void {
    this.toastMessage = msg;
    this.toastType = type;
    this.showToast = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 3500);
  }

  // Sidebar toggles
  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    if (!this.isSidebarCollapsed) {
      this.isDoctorMenuOpen = true;
    }
  }

  openDoctorFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isDoctorMenuOpen = true;
    this.cdr.detectChanges();
  }

  openPatientFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isPatientMenuOpen = true;
    this.cdr.detectChanges();
  }

  openUserFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isUserMenuOpen = true;
    this.cdr.detectChanges();
  }

  openSettingsFromCollapsed(): void {
    this.isSidebarCollapsed = false;
    this.isSettingsMenuOpen = true;
    this.cdr.detectChanges();
  }

  toggleDoctorMenu(): void {
    this.isDoctorMenuOpen = !this.isDoctorMenuOpen;
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

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  toggleSettingsMenu(): void {
    this.isSettingsMenuOpen = !this.isSettingsMenuOpen;
  }

  goBack(): void {
    this.router.navigate(['/doctors']);
  }

  logout(): void {
    if (confirm('Are you sure you want to sign out?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
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
