import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzRestConfigurationComponent } from './sz-rest-configuration.component';
import { SenzingSdkModule } from '../../sdk.module';

describe('SzRestConfigurationComponent', () => {
  let component: SzRestConfigurationComponent;
  let fixture: ComponentFixture<SzRestConfigurationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzRestConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
