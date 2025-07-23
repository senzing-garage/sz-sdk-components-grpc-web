import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SzSearchResultEntityData } from '../../../models/responces/search-results/sz-search-result-entity-data';
import { SzEntityDetailSectionData } from '../../../models/entity-detail-section-data';
import {
  SzEntityData,
  SzResolvedEntity,
  SzEntityRecord,
  SzRelatedEntity,
  SzRecordId,
  SzEntityIdentifier
} from '@senzing/rest-api-client-ng';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SzPrefsService } from '../../../services/sz-prefs.service';
import { SzWhySelectionMode, SzWhySelectionAction, SzWhySelectionModeBehavior, SzWhySelectionActionBehavior } from '../../../models/data-source-record-selection';
import { SzSdkEntityFeature, SzSdkEntityRecord, SzSdkSearchResolvedEntity, SzSdkSearchResult } from '../../../models/grpc/engine';
import {  SzResumeRelatedEntity } from '../../../models/SzResumeEntity';
import { getEntityFeaturesByType, getStringEntityFeatures } from '../../../common/entity-utils';
import { SzGrpcConfigManagerService } from '../../../services/grpc/configManager.service';
import { SzAttrClass, SzFeatureType } from '../../../models/SzFeatureTypes';

/**
 * @internal
 * @export
 */
@Component({
    selector: 'sz-entity-record-card-content-grpc',
    templateUrl: './sz-entity-record-card-content.component.html',
    styleUrls: ['./sz-entity-record-card-content.component.scss'],
    imports: [CommonModule, MatTooltipModule, MatButtonModule, MatIconModule]
})
export class SzEntityRecordCardContentComponentGrpc implements OnInit {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  //@Input() entity: ResolvedEntityData | SearchResultEntityData | EntityDetailSectionData | EntityRecord;
  //_entity: any;
  private _searchResult: SzSdkSearchResult;
  private _relatedEntity: SzResumeRelatedEntity;
  private _record: SzSdkEntityRecord;
  private _truncateOtherDataAt: number = -1;
  private _showOtherData: boolean = false;
  private _showNameData: boolean = true;
  private _showBestNameOnly: boolean = false;
  private _ignorePrefOtherDataChanges = false;
  private _features: Map<string, string[]>;
  private _matchKeys: string[];
  
  @Input() public whySelectionMode: SzWhySelectionModeBehavior = SzWhySelectionMode.NONE;
  @Input() public whySelectionAction: SzWhySelectionActionBehavior = SzWhySelectionAction.NONE;

  @Input() public showWhyUtilities: boolean = false;
  @Input() public showRecordIdWhenNative: boolean = true;
  /** allows records with empty columns to match up with records with non-empty columns. format is [true,false,true,true,true] */
  @Input() public columnsShown: boolean[] = undefined;
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
  @Input() set truncateOtherDataAt(value: number) {
    this._truncateOtherDataAt = value;
  }
  get truncateOtherDataAt(): number {
    return this._truncateOtherDataAt;
  }
  @Input() set showNameData(value: boolean) {
    this._showNameData = value;
  }
  get showNameData(): boolean {
    return this._showNameData;
  }
  @Input() set showBestNameOnly(value: boolean) {
    this._showBestNameOnly = value;
  }
  get showBestNameOnly(): boolean {
    return this._showBestNameOnly;
  }
  @Input() public set relatedEntity(value: SzResumeRelatedEntity) {
    this._relatedEntity = value;
    if(value && value.MATCH_KEY) {
      this._matchKeys = this.getMatchKeysAsArray(value.MATCH_KEY);
    }
  }
  public get relatedEntity() {
    return this._relatedEntity;
  }
  @Input() public set searchResult(value: SzSdkSearchResult) {
    this._searchResult = value;
    if(value && value.MATCH_INFO.MATCH_KEY) {
      this._matchKeys = this.getMatchKeysAsArray(value.MATCH_INFO.MATCH_KEY);
    }
  }
  public get searchResult() {
    return this._searchResult;
  }
  @Input() public set record(value: SzSdkEntityRecord) {
    this._record = value;
  }
  public get record() {
    return this._record;
  }
  public get isMultiSelect(): boolean {
    return this.whySelectionMode === SzWhySelectionMode.MULTIPLE
  }
  public get isSingleSelect(): boolean {
    return this.whySelectionMode === SzWhySelectionMode.SINGLE
  }
  public get isSelectModeActive(): boolean {
    return this.whySelectionMode !== SzWhySelectionMode.NONE
  }

  public get features(): Map<string, string[]> {
    if(!this._features) {
      let _features: {[key: string]: SzSdkEntityFeature[]}; 
      if(this.searchResult) {
        // search result
        _features = this.searchResult.ENTITY.RESOLVED_ENTITY.FEATURES;
      }
      if(this.relatedEntity) {
        // related entity from resume
        _features = this.relatedEntity.FEATURES;
      }
      if(this.record){
        // record from resume
        _features = this.record.FEATURES;
      }
      if(_features) {
        let _featuresAsStrings = getStringEntityFeatures(_features, true, this.configManager.fTypeToAttrClassMap);
        this._features = _featuresAsStrings;
      }
    }
    return this._features;
  }

  @Input() maxLinesToDisplay = 3;

  @Input() set matchKey( value ) {
    if(value && value.matchKey) {
      this._matchKeys = this.getMatchKeysAsArray(value);
    }
  } // only used for displaying "linked" icons on field data(primarily on entity details relationships)
  
  get matchKeys(): string[] {
    if(this._matchKeys) {
      return this._matchKeys;
    }
    // no match keys, should we retest?
    return undefined;
  }

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
  /** the css classes being applied. layout-wide | layout-medium  | layout-narrow | layout-rail*/
  public _layoutClasses: string[] = [];
  /** setter for _layoutClasses  */
  @Input() public set layoutClasses(value: string[] | string){
    if(value && value !== undefined) {
      if(typeof value == 'string') {
        this._layoutClasses = [value];
      } else {
        this._layoutClasses = value;
      }
    }
  };
  /** getter for _layoutClasses  */
  public get layoutClasses() {
    return this._layoutClasses;
  }
  /** subscription breakpoint changes */
  private layoutChange$ = new BehaviorSubject<number>(this.layout);

  //_parentEntity: any;

  constructor(
    private cd: ChangeDetectorRef, 
    private configManager: SzGrpcConfigManagerService,
    public prefs: SzPrefsService) {}

  ngOnInit() {
    setTimeout(() => {
      this.cd.markForCheck();
    });

    // generate features by type map
    if(this._relatedEntity || this._record || this._searchResult) {
      let _features       = (this._record) ? this._record.FEATURES : this._searchResult ? this._searchResult : this._relatedEntity.FEATURES;
      let _featuresByType = this.featuresByType;
    }

    this.prefs.entityDetail.prefsChanged.pipe(
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
    //console.warn(`SzEntityDetailSectionCollapsibleCardComponent.onPrefsChange: `, prefs.truncateOtherDataInRecordsAt, this.truncateOtherDataAt);
    if( prefs.truncateOtherDataInRecordsAt) {
      this._truncateOtherDataAt = prefs.truncateOtherDataInRecordsAt;
    }
    if( !this.ignorePrefOtherDataChanges && typeof prefs.showOtherData == 'boolean') {
      this._showOtherData = prefs.showOtherDataInRecords;
      //console.warn(`SzEntityRecordCardContentComponent.onPrefsChange: value of this.showOtherData(${this.showOtherData}) is "${prefs.showOtherDataInRecords }" `);
    }
    this.showRecordIdWhenNative = prefs.showRecordIdWhenNative;
    // update view manually (for web components redraw reliability)
    this.cd.detectChanges();
  }

  getNameAndAttributeData(nameData: string[], attributeData: string[]): string[] {
    return nameData.concat(attributeData);
  }

  get isSearchEntity() {
    return this._searchResult ? true : false;
  }
  get isRelatedEntity() {
    return this._relatedEntity ? true : false;
  }
  get isRecord() {
    return this._record ? true : false;
  }

  // ----------------- start total getters -------------------

  get columnOneTotal(): number {
    if(this.isSearchEntity) {

    }
    if(this.addressData){
    //if (this.searchResult.ENTITY.RESOLVED_ENTITY.ENTITY_NAME && this.searchResult.ENTITY.RESOLVED_ENTITY.FEATURES['ADDRESS']) {
      return this.addressData.length;
    }
    return 0;
  }
  get showColumnOne(): boolean {
    let retVal = false;
    if(this.otherData) {
      if(this.showOtherData && this.otherData && this.otherData.length > 0) {
        retVal = true;
      }
    }
    if(this._record && this._record.RECORD_ID) {
      retVal = true;
    }
    // check "columnsShown[0]" for override
    if(this.columnsShown && this.columnsShown[0] === true) {
      retVal = true;
    }
    return retVal;
  }
  get columnTwoTotal(): number {
    return this.nameData && this.attributeData ? (this.nameData.concat(this.attributeData).length) : this.nameData ? this.nameData.length : this.attributeData ? this.attributeData.length : 0;
    //return (this.nameData.concat(this.attributeData).length);
  }
  get showColumnTwo(): boolean {
    const nameAndAttrData = this.nameAndAttributeData;
    let retVal = this._showNameData && nameAndAttrData.length > 0;
    // check "columnsShown[1]" for override
    if(this.columnsShown && this.columnsShown[0] === true) {
      retVal = true;
    }
    return retVal;
  }
  get columnThreeTotal(): number {
    return this.addressData && this.phoneData ? (this.addressData.concat(this.phoneData).length) : this.addressData ? this.addressData.length : this.phoneData ? this.phoneData.length : 0;
    //return (this.addressData.concat(this.phoneData).length);
  }
  get showColumnThree(): boolean {
    const phoneAndAddrData = this.addressAndPhoneData;
    let retVal  = (phoneAndAddrData && phoneAndAddrData.length > 0);
    // check "columnsShown[2]" for override
    if(this.columnsShown && this.columnsShown[2] === true) {
      retVal = true;
    }
    return retVal;
  }
  get columnFourTotal(): number {
    return this.identifierData ? this.identifierData.length : 0;
  }
  public get showColumnFour(): boolean {
    let retVal  = ( this.identifierData && this.identifierData.length > 0);
    // check "columnsShown[3]" for override
    if(this.columnsShown && this.columnsShown[3] === true) {
      retVal = true;
    }
    return retVal;
  }
  /**
   * static method so we can figure out what columns would be displayed for a record outside 
   * of the context of the component itself. This is used to query for all columns displayed for an  
   * individual record, then fed back in to ALL records via "columnsShown" so that columns 
   * are always aligned properly.
   */
  
  public static getColumnsThatWouldBeDisplayedForData(entityOrRecord: SzSdkEntityRecord | SzResumeRelatedEntity, featureToAttrMap: Map<SzFeatureType, SzAttrClass | SzAttrClass[]>): boolean[] {
  //public static getColumnsThatWouldBeDisplayedForData(entity: SzEntityRecord | SzRelatedEntity): boolean[] {
    let retVal = [false,false,false,false];
    let featuresByType: Map<string, SzSdkEntityFeature[]>;
    
    if(entityOrRecord) {
      let _features = ((entityOrRecord as SzSdkEntityRecord).RECORD_ID) ? (entityOrRecord as SzSdkEntityRecord).FEATURES : (entityOrRecord as SzResumeRelatedEntity).FEATURES;
      featuresByType  = getEntityFeaturesByType(_features, featureToAttrMap);
      if(featuresByType) {
        // other data
        if(featuresByType && featuresByType.has('OTHER') &&  featuresByType.get('OTHER').length > 0) {
          retVal[0] = true;
        }
        // name and attr data
        //let nameAndAttrData = SzEntityRecordCardContentComponentGrpc.getNameDataFromEntity(entity).concat(SzEntityRecordCardContentComponentGrpc.getAattributeDataFromEntity(entity));
        if((featuresByType && featuresByType.has('NAME') &&  featuresByType.get('NAME').length > 0)) {
          retVal[1] = true;
        }
        // address and phone data
        //let phoneAndAddrData = SzEntityRecordCardContentComponentGrpc.getAddressDataFromEntity(entity).concat(SzEntityRecordCardContentComponentGrpc.getPhoneDataFromEntity(entity));
        // addressData.concat(phoneData);
        if((featuresByType && featuresByType.has('PHONE') &&  featuresByType.get('PHONE').length > 0)) {
          retVal[2] = true;
        }
        // identifier data
        //let identifierData = SzEntityRecordCardContentComponentGrpc.getIdentifierDataFromEntity(entity); 
        if((featuresByType && featuresByType.has('IDENTIFIER') &&  featuresByType.get('IDENTIFIER').length > 0)) {
          retVal[3] = true;
        }
      }
    }
    return retVal;
  }
  // -----------------  end total getters  -------------------
  private _featuresByType: Map<SzFeatureType, SzSdkEntityFeature[]>;
  public get featuresByType() {
    if(!this._featuresByType) {
      let _fTypeToAttrClassMap = this.configManager.fTypeToAttrClassMap;
      //this._featuresByType = this.configManager.fTypeToAttrClassMap;
      if(this._searchResult && this._searchResult.ENTITY.RESOLVED_ENTITY.FEATURES) {
        let _features = this._searchResult.ENTITY.RESOLVED_ENTITY.FEATURES;
        this._featuresByType = getEntityFeaturesByType(_features, _fTypeToAttrClassMap);
      } else if(this._relatedEntity && this._relatedEntity.FEATURES) {
        let _features = this._relatedEntity.FEATURES;
        this._featuresByType = getEntityFeaturesByType(_features, _fTypeToAttrClassMap);
      } else if(this._record && this._record.FEATURES) {
        let _features = this._record.FEATURES;
        this._featuresByType = getEntityFeaturesByType(_features, _fTypeToAttrClassMap);

      }
    }
    return this._featuresByType;
  }

  public getAttrText(value: SzSdkEntityFeature) {
    let retVal;
    if(value && value.FEAT_DESC) {
      retVal = value.FEAT_DESC;
      if(value.USAGE_TYPE) {
        retVal = `${value.USAGE_TYPE}: ${value.FEAT_DESC}`;
      } else if(value.LABEL) {
        retVal = `${value.LABEL}: ${value.FEAT_DESC}`;
      }
    }
    return retVal;
  }

  get otherData(): SzSdkEntityFeature[] | undefined {
    let _features = this.featuresByType;
    return _features.has(SzFeatureType.OTHER) ? _features.get(SzFeatureType.OTHER) : undefined;
  }

  get nameData(): SzSdkEntityFeature[] | undefined  {
    /*
    if (this.entity) {
      if (this.entity && this.entity.nameData && this.entity.nameData.length > 0 && !this._showBestNameOnly) {
        return this.entity.nameData;
      } else if (this.entity && this.entity.bestName) {
        return [this.entity.bestName];
      } else if (this.entity && this.entity.entityName && !this._showBestNameOnly) {
        return [this.entity.entityName];
      } else {
        return [];
      }
    } else {
      return [];
    }*/
    let _features = this.featuresByType;
    let _names    = _features.has(SzFeatureType.NAME) ? _features.get(SzFeatureType.NAME) : undefined;
    return _names;
  }

  get attributeData(): SzSdkEntityFeature[] | undefined {
    let _features         = this.featuresByType;
    let _attributes       = _features.has(SzFeatureType.ATTRIBUTE)      ? _features.get(SzFeatureType.ATTRIBUTE)      : undefined;
    let _characteristics  = _features.has(SzFeatureType.CHARACTERISTIC) ? _features.get(SzFeatureType.CHARACTERISTIC) : undefined;
    let _retVal: SzSdkEntityFeature[] | undefined = _attributes || _characteristics ? [] : undefined;
    if(_attributes) {
      _retVal  = _retVal.concat(_attributes);
    }
    if(_characteristics) {
      _retVal  = _retVal.concat(_characteristics);
    }
    return _retVal;
  }

  get addressData(): SzSdkEntityFeature[] | undefined {
    let _features   = this.featuresByType;
    let _addresses  = _features.has(SzFeatureType.ADDRESS) ? _features.get(SzFeatureType.ADDRESS) : undefined;
    return _addresses;
  }
  get phoneData(): SzSdkEntityFeature[] | undefined {
    let _features = this.featuresByType;
    let _phones   = _features.has(SzFeatureType.PHONE) ? _features.get(SzFeatureType.PHONE) : undefined;
    return _phones;
  }

  get identifierData(): SzSdkEntityFeature[] | undefined {
    let _features     = this.featuresByType;
    let _identifiers  = _features.has(SzFeatureType.IDENTIFIER) ? _features.get(SzFeatureType.IDENTIFIER) : undefined;
    return _identifiers;
  }

  get nameAndAttributeData(): SzSdkEntityFeature[] | undefined {
    let _names      = this.nameData;
    let _attributes = this.attributeData;
    let _retVal: SzSdkEntityFeature[] | undefined = _names || _attributes ? [] : undefined;
    if(_names)      { _retVal  = _retVal.concat(_names); }
    if(_attributes) { _retVal  = _retVal.concat(_attributes); }
    return _retVal;
  }

  get addressAndPhoneData(): SzSdkEntityFeature[] | undefined {
    let _addresses  = this.addressData;
    let _phones     = this.phoneData;
    let _retVal: SzSdkEntityFeature[] | undefined = _addresses || _phones ? [] : undefined;
    if(_addresses)  { _retVal  = _retVal.concat(_addresses); }
    if(_phones)     { _retVal  = _retVal.concat(_phones); }
    return _retVal;
  }

  getMatchKeysAsArray(matchKey: string): string[] {
    let ret = [];

    if(matchKey) {
      const mkeys = matchKey
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

  isLinkedAttribute(attrValue: SzSdkEntityFeature): boolean {
    const matchArr = this.matchKeys;
    if(attrValue && matchArr && matchArr.length > 0) {

      const keyMatch = matchArr.some( (mkey) => {
        return attrValue.FEAT_DESC.indexOf(mkey+':') >=0 ;
      });

      //console.log(attrValue+ 'MATCHES VALUE IN: ('+keyMatch+')', matchArr);
      return keyMatch;
    } else {
      //console.warn('isLinkedAttribute issue. ', attrValue, matchArr);
    }
    return false;
  }

  @Output('onDataSourceRecordClicked') 
  onRecordCardContentClickedEmitter: EventEmitter<SzSdkEntityRecord> = new EventEmitter<SzSdkEntityRecord>();
  public onRecordCardContentClicked(event: any) {
    //console.log('SzEntityRecordCardContentComponent.onRecordCardContentClicked()', this.entity, this);
    if(this._record) {
      let payload: SzSdkEntityRecord = this._record;
      this.onRecordCardContentClickedEmitter.emit(payload);
    } else {
      console.error('SzEntityRecordCardContentComponent.onRecordCardContentClicked() ERROR: datasource or recordId missing');
    }
  }
  @Output('onDataSourceRecordWhyClicked') 
  onRecordCardWhyClickedEmitter: EventEmitter<SzSdkEntityRecord> = new EventEmitter<SzSdkEntityRecord>();
  public onRecordCardWhyClicked(event: any) {
    //console.log('SzEntityRecordCardContentComponent.onRecordCardWhyClicked()', this.entity, this);
    if(this._record) {
      let payload: SzSdkEntityRecord = this._record;
      this.onRecordCardWhyClickedEmitter.emit(payload);
    } else {
      console.error('SzEntityRecordCardContentComponent.onRecordCardWhyClicked() ERROR: datasource or recordId missing');
    }
  }
  @Output('onWhyNotClicked') 
  onWhyNotClickedEmitter: EventEmitter<SzResumeRelatedEntity> = new EventEmitter<SzResumeRelatedEntity>();
  public onRelatedEntityCardWhyNotClicked(event: any) {
    console.log('SzEntityRecordCardContentComponent.onRelatedEntityCardWhyNotClicked()', this._relatedEntity, this);
    if(this._relatedEntity) {
      this.onWhyNotClickedEmitter.emit(this._relatedEntity)
    } else {
      console.error('SzEntityRecordCardContentComponent.onRelatedEntityCardWhyNotClicked() ERROR: entityId missing');
    }
  }
  // ----------------------- probably deprecated (not sure yet)
  /*
  public static getIdentifierDataFromEntity(entity): string[] {
    if (entity) {
      if (entity.identifierData) {
        return entity.identifierData;
      } else if (entity.identifierData) {
        return entity.identifierData;
      } else {
        return [];
      }
    } else {
      return [];
    }
  }*/
  /*
  public static getPhoneDataFromEntity(entity): string[] {
    if (entity) {
      if (entity.phoneData) {
        return entity.phoneData;
      } else if (entity.phoneData) {
        return entity.phoneData;
      } else {
        return [];
      }
    } else {
      return [];
    }
  }*/
  /*
  public static getAddressDataFromEntity(entity): string[] {
    if (entity) {
      if (entity.addressData) {
        return entity.addressData;
      } else if (entity.addressData) {
        return entity.addressData;
      } else {
        return [];
      }
    } else {
      return [];
    }
  }*/
  /*public getNameDataFromEntity(entity, showBestNameOnly?: boolean): string[] {
    let _featuresByType = this.featuresByType;
    if (entity) {
      if (entity && entity.nameData && entity.nameData.length > 0 && !showBestNameOnly) {
        return entity.nameData;
      } else if (entity && entity.bestName) {
        return [entity.bestName];
      } else if (entity && entity.entityName && !showBestNameOnly) {
        return [entity.entityName];
      } else {
        return [];
      }
    } else {
      return [];
    }
  }
  */
  /*
  public getAattributeDataFromEntity(entity: SzSdkSearchResolvedEntity | SzResumeRelatedEntity): string[] {
    let _featuresByType = this.featuresByType;
    if (entity) {
      if ( entity.characteristicData) {
        return entity.characteristicData;
      } else if ( entity.attributeData) {
        return entity.attributeData;
      } else {
        return [];
      }
    } else {
      return [];
    }
  }*/

}
