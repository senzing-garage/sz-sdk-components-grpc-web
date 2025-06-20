import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityDetailComponentGrpc } from './sz-entity-detail.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzEntityDetailComponent', () => {
  let component: SzEntityDetailComponentGrpc;
  let fixture: ComponentFixture<SzEntityDetailComponentGrpc>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityDetailComponentGrpc);
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
