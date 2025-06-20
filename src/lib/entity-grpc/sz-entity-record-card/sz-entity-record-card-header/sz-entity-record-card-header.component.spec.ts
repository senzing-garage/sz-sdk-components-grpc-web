import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityRecordCardHeaderComponentGrpc } from './sz-entity-record-card-header.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzEntityRecordCardHeaderComponentGrpc', () => {
  let component: SzEntityRecordCardHeaderComponentGrpc;
  let fixture: ComponentFixture<SzEntityRecordCardHeaderComponentGrpc>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityRecordCardHeaderComponentGrpc);
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
