import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SzEntityRecordCardContentComponentGrpc } from './sz-entity-record-card-content.component';
import { SenzingSdkModule } from 'src/lib/sdk.module';

describe('SzEntityRecordCardContentComponent', () => {
  let component: SzEntityRecordCardContentComponentGrpc;
  let fixture: ComponentFixture<SzEntityRecordCardContentComponentGrpc>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SenzingSdkModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SzEntityRecordCardContentComponentGrpc);
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
