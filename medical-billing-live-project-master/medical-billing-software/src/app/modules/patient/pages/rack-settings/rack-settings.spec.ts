import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RackSettings } from './rack-settings';

describe('RackSettings', () => {
  let component: RackSettings;
  let fixture: ComponentFixture<RackSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RackSettings],
    }).compileComponents();

    fixture = TestBed.createComponent(RackSettings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
