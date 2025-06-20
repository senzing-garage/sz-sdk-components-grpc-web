import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailsSectionComponentGrpc } from './sz-entity-details-section.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzEntityDetailsSectionComponent', () => {
  let component: SzEntityDetailsSectionComponentGrpc;
  let fixture: ComponentFixture<SzEntityDetailsSectionComponentGrpc>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityDetailsSectionComponentGrpc);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
