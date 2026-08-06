import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppModal } from './app-modal';

describe('AppModal', () => {
  let component: AppModal;
  let fixture: ComponentFixture<AppModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppModal],
    }).compileComponents();

    fixture = TestBed.createComponent(AppModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
