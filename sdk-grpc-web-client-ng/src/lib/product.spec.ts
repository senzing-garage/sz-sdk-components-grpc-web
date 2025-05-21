import { TestBed } from '@angular/core/testing';

import { SzSdkGrpcWebProductService } from './product.service';

describe('SdkGrpcWebClientNgService', () => {
  let service: SzSdkGrpcWebProductService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SzSdkGrpcWebProductService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
