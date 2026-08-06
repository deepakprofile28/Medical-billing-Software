import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientRegistration } from './patient-registration';

describe('PatientRegistration', () => {
  let component: PatientRegistration;
  let fixture: ComponentFixture<PatientRegistration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientRegistration],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientRegistration);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
