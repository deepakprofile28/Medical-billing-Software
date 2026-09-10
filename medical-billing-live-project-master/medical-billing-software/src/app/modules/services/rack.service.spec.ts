import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RackService } from './rack.service';

describe('RackService', () => {
  let service: RackService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RackService]
    });
    service = TestBed.inject(RackService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
