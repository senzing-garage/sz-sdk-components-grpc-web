import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild, OnDestroy, Output, EventEmitter } from '@angular/core';
import { SzEntityDetailSectionData } from '../../../../src/lib/models/entity-detail-section-data';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SzRelatedEntity, SzEntityRecord, SzAttributeSearchResult, SzEntityIdentifier } from '@senzing/rest-api-client-ng';
import { SzPrefsService } from '../../../../src/lib/services/sz-prefs.service';
import { howClickEvent } from '../../../../src/lib/models/data-how';
import { SzSdkSearchResult } from '../../../../src/lib/models/grpc/engine';
import { getStringEntityFeatures } from '../../../../src/lib/common/entity-utils';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SzGrpcConfigManagerService } from '../../../../src/lib/services/grpc/configManager.service';
/**
 * @internal
 * @export
 */
@Component({
    selector: 'sz-search-result-card-content-grpc',
    templateUrl: './sz-search-result-card-content-grpc.component.html',
    styleUrls: ['./sz-search-result-card-content-grpc.component.scss'],
    imports: [CommonModule, MatIconModule, MatButtonModule]
})
export class SzSearchResultCardContentGrpcComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  //@Input() public entity: SzEntityDetailSectionData | SzSdkSearchResult;
  @Input() public entity: SzSdkSearchResult;
  private _entityFeatures: Map<string, string[]>;
  public get entityFeatures(): Map<string, string[]> {
    if(!this._entityFeatures && this.entity) {
      let _features = (this.entity as SzSdkSearchResult).ENTITY.RESOLVED_ENTITY.FEATURES;
      let _featuresAsStrings = getStringEntityFeatures(_features, true, this.configManager.fTypeToAttrClassMap);
      this._entityFeatures = _featuresAsStrings;
    }
    return this._entityFeatures;
  }
  @Input() public maxLinesToDisplay = 3;
  @Input() public showAllInfo: boolean;
  /** 0 = wide layout. 1 = narrow layout */
  @Input() public layout = 0;
  @Input() public layoutClasses: string[] = [];

  /** subscription breakpoint changes */
  private layoutChange$ = new BehaviorSubject<number>(this.layout);

  @ViewChild('columnOne')
  private columnOne: ElementRef;
  @ViewChild('columnTwo')
  private columnTwo: ElementRef;
  @ViewChild('columnThree')
  private columnThree: ElementRef;
  @ViewChild('columnFour')
  private columnFour: ElementRef;
  @ViewChild('columnFive')
  private columnFive: ElementRef;

  // collapse and expand state
  @Input() truncateResults: boolean = true;
  @Input() truncatedTooltip: string = "Show more..";
  // css class bool
  collapsed: boolean = this.truncateResults;

  private _truncateOtherDataAt: number = 3;
  private _truncateIdentifierDataAt: number = 2;
  private _showOtherData: boolean = true;
  private _showIdentifierData: boolean = true;
  private _ignorePrefOtherDataChanges = false;
  private _showHowButton = false;
  @Input() public showRecordIdWhenNative: boolean = false;
  @Input() public set ignorePrefOtherDataChanges(value: boolean) {
    this._ignorePrefOtherDataChanges = value;
  }
  public get ignorePrefOtherDataChanges() {
    return this._ignorePrefOtherDataChanges;
  }
  @Input() set showOtherData(value: boolean) {
    this._showOtherData = value;
  }
  get showOtherData(): boolean {
    return this._showOtherData;
  }
  @Input() set showIdentifierData(value: boolean) {
    this._showIdentifierData = value;
  }
  get showIdentifierData(): boolean {
    return this._showIdentifierData;
  }
  @Input() set truncateOtherDataAt(value: number) {
    this._truncateOtherDataAt = value;
  }
  get truncateOtherDataAt(): number {
    return this._truncateOtherDataAt;
  }
  @Input() set truncateIdentifierDataAt(value: number) {
    this._truncateIdentifierDataAt = value;
  }
  get truncateIdentifierDataAt(): number {
    return this._truncateIdentifierDataAt;
  }
  @Input() set showHowButton(value: boolean) {
    this._showHowButton = value;
  }
  get showHowButton(): boolean {
    return this._showHowButton;
  }
  /** (Event Emitter) when the user clicks on the "How" button */
  @Output() howButtonClick = new EventEmitter<howClickEvent>();

  constructor(
    private cd: ChangeDetectorRef,
    public prefs: SzPrefsService,
    private configManager: SzGrpcConfigManagerService
  ) {}

  ngOnInit() {
    // get and listen for prefs change
    this._showHowButton                 = this.prefs.searchResults.showHowButton;
    this._showOtherData                 = this.prefs.searchResults.showOtherData;
    this._showIdentifierData            = this.prefs.searchResults.showIdentifierData;
    this._showCharacteristicData        = this.prefs.searchResults.showCharacteristicData;
    this._truncateOtherDataAt           = this.prefs.searchResults.truncateOtherDataAt;
    this._truncateCharacteristicDataAt  = this.prefs.searchResults.truncateCharacteristicDataAt;

    setTimeout(() => {
      this.cd.markForCheck();
    });
    this.prefs.searchResults.prefsChanged.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( this.onPrefsChange.bind(this) );
  }

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /** proxy handler for when prefs have changed externally */
  private onPrefsChange(prefs: any) {
    this._showOtherData                 = prefs.showOtherData;
    this._showIdentifierData            = prefs.showIdentifierData;
    this._showCharacteristicData        = prefs.showCharacteristicData;
    this._truncateOtherDataAt           = prefs.truncateOtherDataAt;
    this._truncateCharacteristicDataAt  = prefs.truncateCharacteristicDataAt;
    this._truncateIdentifierDataAt      = prefs.truncateIdentifierDataAt;
    this._showHowButton                 = prefs.showHowButton;
    // update view manually (for web components redraw reliability)
    this.cd.detectChanges();
  }

  // ----------------- start total getters -------------------
  get columnOneTotal(): number {
    const totalData = this.otherData;
    return totalData && totalData.length ? totalData.length : 0;
  }
  get columnTwoTotal(): number {
    const totalData = this.getNameAndCharacteristicData(this.nameData, this.characteristicData);
    return totalData && totalData.length ? totalData.length : 0;
  }
  get showColumnTwo(): boolean {
    return (this.columnTwoTotal > 0);
  }
  get columnThreeTotal(): number {
    const totalData = this.getAddressAndPhoneData(this.addressData, this.phoneData);
    return totalData && totalData.length ? totalData.length : 0;
  }
  get showColumnThree(): boolean {
    return (this.columnThreeTotal > 0);
  }
  get columnFourTotal(): number {
    return this.identifierData ? this.identifierData.length : 0;
  }
  public get showColumnFour(): boolean {
    return (this.columnFourTotal > 0 && this._showIdentifierData);
  }
  get columnFiveTotal(): number {
    return this.otherData ? this.otherData.length : 0;
  }
  get showColumnFive(): boolean {
    return (this.columnFiveTotal > 0 && this._showOtherData);
  }
  get showColumnOne(): boolean {
    let retVal = false;
    if(this.entity) {
      if(this._showOtherData && this.otherData.length > 0) {
        retVal = true;
      }
    }
    return retVal;
  }
  public _showCharacteristicData = true;
  public _truncateCharacteristicDataAt = 2;

  // -----------------  end total getters  -------------------

  getNameAndCharacteristicData(nameData: string[], characteristicData: string[]): string[] {
    if(nameData && nameData.concat && characteristicData) {
      return (this._truncateCharacteristicDataAt > 0) ? nameData.concat(characteristicData.slice(0, this._truncateCharacteristicDataAt)) : nameData.concat(characteristicData);
    } else if(nameData) {
      return nameData;
    } else if(characteristicData) {
      return (this._truncateCharacteristicDataAt > 0) ? characteristicData.slice(0, this._truncateCharacteristicDataAt) : characteristicData;
    }
    return [];
  }

  getAddressAndPhoneData(addressData: string[], phoneData: string[]): string[] {
    if(addressData && addressData.concat && phoneData) {
      return addressData.concat(phoneData);
    } else if(addressData) {
      return addressData;
    } else if(phoneData) {
      return phoneData;
    }
    return [];
  }

  get nameData(): string[] | undefined {
        return this.entityFeatures && this.entityFeatures.has('NAME') ? this.entityFeatures.get('NAME') : undefined;
  }

  get characteristicData(): string[] | undefined {
        return this.entityFeatures && this.entityFeatures.has('ATTRIBUTE') && this._showCharacteristicData ? this.entityFeatures.get('ATTRIBUTE') : undefined;
  }

  get addressData(): string[] | undefined {
        return this.entityFeatures && this.entityFeatures.has('ADDRESS') ? this.entityFeatures.get('ADDRESS') : undefined;
  }

  get phoneData(): string[] | undefined {
        return this.entityFeatures && this.entityFeatures.has('PHONE') ? this.entityFeatures.get('PHONE') : undefined;
  }

  get identifierData(): string[] | undefined {
        return this.entityFeatures && this.entityFeatures.has('IDENTIFIER') ? this.entityFeatures.get('IDENTIFIER') : undefined;
  }

  get otherData(): string[] {
    let _otherData = [];
    if(this.entityFeatures) {
      let featIter = this.entityFeatures.entries()
      for(const [fTypeCode, featValue] of featIter) {
        if(!['NAME','ATTRIBUTE','ADDRESS','PHONE','IDENTIFIER'].includes(fTypeCode)) {
          // other data
          _otherData.push(featValue);
        }
      }
    }
    // check to see if records has "otherData"
    /*
    let _eData = this.getEntityRecord(this.entity);
    if(_eData && _eData.otherData) {
      _otherData = _eData.otherData;
    }*/
    return _otherData;
  }

  public onHowButtonClick(event: MouseEvent) {
    if(event.preventDefault) {
      event.preventDefault();
    }
    if(event.stopPropagation) {
      event.stopPropagation();
    }
    let _payload: howClickEvent = Object.assign(event, {
      entityId: (this.entity as SzSdkSearchResult).ENTITY.RESOLVED_ENTITY.ENTITY_ID
    });
    this.howButtonClick.emit(_payload);
  }

  private getEntityRecord(obj: any): SzEntityRecord {
    if (obj && obj.otherData !== undefined) {
      return {...obj} as SzEntityRecord;
    } else {
      return {} as SzEntityRecord;
    }
  }
}
