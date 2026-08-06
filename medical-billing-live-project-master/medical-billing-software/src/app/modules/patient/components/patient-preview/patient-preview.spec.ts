import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientPreview } from './patient-preview';

describe('PatientPreview', () => {
  let component: PatientPreview;
  let fixture: ComponentFixture<PatientPreview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientPreview],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientPreview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
