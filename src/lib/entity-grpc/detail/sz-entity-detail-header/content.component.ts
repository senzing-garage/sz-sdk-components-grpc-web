import { Component, ElementRef, Input, OnInit, ViewChild, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { SzSearchResultEntityData } from '../../../models/responces/search-results/sz-search-result-entity-data';
import { SzEntityDetailSectionData } from '../../../models/entity-detail-section-data';
import { SzEntityRecord, SzEntityFeature } from '@senzing/rest-api-client-ng';
import { SzPrefsService } from '../../../services/sz-prefs.service';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SzResumeEntity } from '../../../models/SzResumeEntity';
import { getStringEntityFeatures } from '../../../common/entity-utils';
import { SzGrpcConfigManagerService } from '../../../services/grpc/configManager.service';
import { SzSdkEntityRecord } from 'src/lib/models/grpc/engine';

/**
 * @internal
 * @export
 */
@Component({
    selector: 'sz-entity-detail-header-content-grpc',
    templateUrl: './content.component.html',
    styleUrls: ['./content.component.scss'],
    imports: [CommonModule, MatTooltipModule]
})
export class SzEntityDetailHeaderContentComponentGrpc implements OnDestroy, OnInit {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  private _truncateOtherDataAt: number = 3;
  @Input() public showOtherData: boolean = true;
  @Input() public showRecordIdWhenNative: boolean = false;

  //@Input() entity: ResolvedEntityData | SearchResultEntityData | EntityDetailSectionData | EntityRecord;
  @Input() entity: SzResumeEntity; // the strong typing is making it impossible to handle all variations
  @Input() record: SzSdkEntityRecord; // we pass only the record in when the details section is matched records instead of trying to do clever type detection
  @Input() maxLinesToDisplay = 3;
  @Input() truncateOtherDataAt = 3;
  @Input() set parentEntity( value ) {
    this._parentEntity = value;
    if(value && value.matchKey) {
      this._matchKeys = this.getMatchKeysAsArray(value);
    }
  } // only used for displaying "linked" icons on field data(primarily on entity details relationships)

  @Input() truncateResults: boolean = true;
  @Input() truncatedTooltip: string = "Show more..";
  // css class bool
  collapsed: boolean = this.truncateResults;

  @ViewChild('columnOne')
  private columnOne: ElementRef;
  @ViewChild('columnTwo')
  private columnTwo: ElementRef;
  @ViewChild('columnThree')
  private columnThree: ElementRef;
  @ViewChild('columnFour')
  private columnFour: ElementRef;

  /** 0 = wide layout. 1 = narrow layout */
  @Input() public layout = 0;
  @Input() public layoutClasses: string[] = [];

  /** subscription breakpoint changes */
  private layoutChange$ = new BehaviorSubject<number>(this.layout);

  _parentEntity: any;
  _matchKeys: string[];

  private _entityFeatures: Map<string, string[]>;
  public get entityFeatures(): Map<string, string[]> {
    if(!this._entityFeatures && this.entity) {
      let _features = this.entity.FEATURES;
      let _featuresAsStrings = getStringEntityFeatures(_features, true, this.configManager.fTypeToAttrClassMap, true, true);
      this._entityFeatures = _featuresAsStrings;
    }
    return this._entityFeatures;
  }

  constructor(
    public prefs: SzPrefsService,
    private cd: ChangeDetectorRef,
    private configManager: SzGrpcConfigManagerService
  ) {}

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {
    // subscribe to pref changes
    this.prefs.entityDetail.prefsChanged.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( this.onPrefsChange.bind(this) );
  }

  /** proxy handler for when prefs have changed externally */
  private onPrefsChange(prefs: any) {
    this.showOtherData = prefs.showOtherDataInSummary;
    this.showRecordIdWhenNative = prefs.showRecordIdWhenNative;
    this.truncateOtherDataAt = prefs.truncateSummaryAt;
    this.maxLinesToDisplay = prefs.truncateSummaryAt;

    // update view manually (for web components redraw reliability)
    this.cd.detectChanges();
  }

  public get hasRecordId(): boolean {
    if(this.record && this.record.RECORD_ID){
      return (this.record.RECORD_ID !== undefined && this.record.RECORD_ID !== null) ? true: false;
    }
    return false;
  }

  getNameAndAttributeData(nameData: string[], attributeData: string[]): string[] {
    return nameData.concat(attributeData);
  }

  getAddressAndPhoneData(addressData: string[], phoneData: string[]): string[] {
    return addressData.concat(phoneData);
  }

  // ----------------- start total getters -------------------
  get columnOneTotal(): number {
    if (this.entityFeatures.has('OTHER')) {
      return this.entityFeatures.get('OTHER').length;
    }
    return 0;
  }
  get showColumnOne(): boolean {
    return this.hasRecordId || (this.entity && this.entityFeatures.has('OTHER') && this.entityFeatures.get('OTHER').length > 0) && this.showOtherData;
  }
  get columnTwoTotal(): number {
    return (this.nameData.concat(this.attributeData).length);
  }
  get columnThreeTotal(): number {
    return (this.addressData.concat(this.phoneData).length);
  }
  get columnFourTotal(): number {
    return this.identifierData.length;
  }
  public get showColumnFour(): boolean {
    try {
      const ret = (this.identifierData.length > 0);
      return ret;
    } catch(err){}
    return false;
  }
  // -----------------  end total getters  -------------------

  get nameData(): string[] {
    if (this.entityFeatures) {
      if (this.entityFeatures && this.entityFeatures.has('NAME')) {
        return this.entityFeatures.get('NAME');
      } else {
        return [];
      }
    } else {
      return [];
    }
  }

  get attributeData(): string[] {
    if (this.entityFeatures) {
      if ( this.entityFeatures.has('CHARACTERISTIC') ) {
        return this.entityFeatures.get('CHARACTERISTIC');
      } else if ( this.entityFeatures.has('ATTRIBUTE')) {
        return this.entityFeatures.get('ATTRIBUTE');
      } else {
        return [];
      }
    } else {
      return [];
    }
  }

  get addressData(): string[] {
    if (this.entityFeatures) {
      if (this.entityFeatures.has('ADDRESS')) {
        return this.entityFeatures.get('ADDRESS');
      } else {
        return [];
      }
    } else {
      return [];
    }
  }

  get phoneData(): string[] {
    if (this.entityFeatures) {
      if (this.entityFeatures.has('PHONE')) {
        return this.entityFeatures.get('PHONE');
      } else {
        return [];
      }
    } else {
      return [];
    }
  }

  get otherData(): string[] {
    if (this.entityFeatures) {
      if (this.entityFeatures.has('OTHER')) {
        return this.entityFeatures.get('OTHER');
      } else {
        return [];
      }
    } else {
      return [];
    }
  }
  
  get identifierData(): string[] {
    try{
      if (this.entityFeatures) {
        if (this.entityFeatures.has('IDENTIFIER') && this.entityFeatures.get('IDENTIFIER').length > 0) {
          return this.entityFeatures.get('IDENTIFIER');
        } else {
          return [];
        }
      } else {
        return [];
      }
    }catch(err){
      console.warn('\tSzEntityDetailHeaderContentComponent.identifierData error', err.message);
    }
    return [];
  }

  getMatchKeysAsArray(pEntity: any): string[] {
    let ret = [];
    if(pEntity && pEntity.matchKey) {
      const mkeys = pEntity.matchKey
      .split(/[-](?=\w)/)
      .filter(i => !!i)
      .filter( val => val.indexOf('+') >= 0 )
      .forEach( val=> {
        val.split('+').forEach( key => {
          if(key !== '+' && key !== '') { ret.push(key); }
        });
      });
      // for address, also add other text keys
      if(ret.indexOf('ADDRESS') >= 0) {
        ret = ret.concat(['BILLING', 'MAILING']);
      }

      return ret;
    }
    return ret;
  }

  get matchKeys(): string[] {
    if(this._matchKeys) {
      return this._matchKeys;
    }
    // no match keys, should we retest?
    return [];
  }

  isLinkedAttribute(attrValue: string): boolean {
    const matchArr = this.matchKeys;
    if(attrValue && matchArr && matchArr.some && matchArr.length > 0) {

      const keyMatch = matchArr.some( (mkey) => {
        return attrValue.indexOf(mkey+':') >=0 ;
      });

      //console.log(attrValue+ 'MATCHES VALUE IN: ('+keyMatch+')', matchArr);
      return keyMatch;
    } else {
      //console.warn('isLinkedAttribute issue. ', attrValue, matchArr);
    }
    return false;
  }
  /**
   * toggle the truncated expand/collapse
   * state of the content element
   */
  public toggleTruncation(event: any) {
    if(window && window.getSelection){
      var selection = window.getSelection();
      if(selection.toString().length === 0) {
        // evt proxy
        this.truncateResults=!this.truncateResults;
      }
    } else {
      this.truncateResults=!this.truncateResults;
    }
  }

  /**
   * @deprecated
   */
  private isEntityRecord(data: SzSearchResultEntityData | SzEntityDetailSectionData | SzEntityRecord): data is SzEntityRecord {
    if (data) {
      return (<SzEntityRecord>data).relationshipData !== undefined && (<SzEntityRecord>data).relationshipData.length > 0;
    }
    return false;
  }
  /**
   * @deprecated
   */
  private isEntityDetailData(data: SzSearchResultEntityData | SzEntityDetailSectionData | SzEntityRecord): data is SzEntityDetailSectionData {
    if (data) {
      return (<SzEntityDetailSectionData>data).matchLevel !== undefined;
    }
    return false;
  }
}
