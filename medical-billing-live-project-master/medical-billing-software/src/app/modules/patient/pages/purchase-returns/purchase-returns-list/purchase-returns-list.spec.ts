import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchaseReturnsList } from './purchase-returns-list';

describe('PurchaseReturnsList', () => {
  let component: PurchaseReturnsList;
  let fixture: ComponentFixture<PurchaseReturnsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseReturnsList],
    }).compileComponents();

    fixture = TestBed.createComponent(PurchaseReturnsList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
