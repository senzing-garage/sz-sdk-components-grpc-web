import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SzGrpcWebClientAboutComponent } from './sz-grpc-web-client-about.component';

describe('SzGrpcWebClientAboutComponent', () => {
  let component: SzGrpcWebClientAboutComponent;
  let fixture: ComponentFixture<SzGrpcWebClientAboutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SzGrpcWebClientAboutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SzGrpcWebClientAboutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
