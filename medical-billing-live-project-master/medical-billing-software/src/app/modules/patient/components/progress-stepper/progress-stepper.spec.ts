import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressStepper } from './progress-stepper';

describe('ProgressStepper', () => {
  let component: ProgressStepper;
  let fixture: ComponentFixture<ProgressStepper>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressStepper],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressStepper);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
