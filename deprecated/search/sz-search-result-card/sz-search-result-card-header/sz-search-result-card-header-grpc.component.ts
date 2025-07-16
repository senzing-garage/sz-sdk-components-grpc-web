import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { SzEntityRecord, SzAttributeSearchResult, SzDataSourceRecordSummary } from '@senzing/rest-api-client-ng';
import { SzPrefsService, SzSearchResultsPrefs } from '../../../../src/lib/services/sz-prefs.service';
import { bestEntityName } from '../../../../src/lib/entity/entity-utils';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SzSdkSearchRecordSummary, SzSdkSearchResult } from '../../../../src/lib/models/grpc/engine';
import { SzEntityMatchPillComponent } from '../../../../src/lib/entity/sz-entity-match-pill/sz-entity-match-pill.component';

/**
 * @internal
 * @export
 */
@Component({
    selector: 'sz-search-result-card-header-grpc',
    templateUrl: './sz-search-result-card-header-grpc.component.html',
    styleUrls: ['./sz-search-result-card-header-grpc.component.scss'],
    imports: [CommonModule, SzEntityMatchPillComponent]
})
export class SzSearchResultCardHeaderGrpcComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  private _searchResult: SzSdkSearchResult;

  @Input() showDataSources: boolean = true;
  @Input() showMatchKey: boolean = false;

  @Input() public set searchResult(value: SzSdkSearchResult) {
    this._searchResult = value;
    //console.log('sz-search-result-card-header.setSearchResult: ', this._searchResult);
  }
  public get searchResult(): SzSdkSearchResult {
    return this._searchResult;
  }

  @Input() public searchValue: string;
  @Input() public hideBackGroundColor: boolean;
  @Input() public entityData: SzEntityRecord;
  alert = false;

  public get recordSummariesExist(): boolean {
    if(this.searchResult && this.searchResult.ENTITY.RESOLVED_ENTITY.RECORD_SUMMARY){
      return this.searchResult.ENTITY.RESOLVED_ENTITY.RECORD_SUMMARY.length > 0;
    }
    return false;
  }

  public get recordSummaries(): SzSdkSearchRecordSummary[] {
    if(this.searchResult && this.searchResult.ENTITY.RESOLVED_ENTITY.RECORD_SUMMARY){
      return this.searchResult.ENTITY.RESOLVED_ENTITY.RECORD_SUMMARY;
    }
    return []
  }

  public get bestName() : string {
    return this.searchResult.ENTITY.RESOLVED_ENTITY.ENTITY_NAME;
    //return bestEntityName(this._searchResult);
  }

  public get entityDetailsLinkName(): string { 
    return this.bestName;
  }

  public get matchPills() : { text: string, ambiguous: boolean, plusMinus: string }[] | undefined {
    let retVal = [];
    if(this.searchResult && this.searchResult.MATCH_INFO.MATCH_KEY) {
      return this.getPillInfo(this.searchResult.MATCH_INFO.MATCH_KEY);
    }

    return undefined;
  };

  private getPillInfo(matchKey): { text: string, ambiguous: boolean, plusMinus: string }[] {
    if(matchKey) {
      const pills = matchKey
      .split(/[-](?=\w)/)
      .filter(i => !!i)
      .map(item => item.startsWith('+') ? item : `-${item}`)
      .map(item => {
        return { text: item.replace('(Ambiguous)', ''), plusMinus: item.startsWith('+') ? 'plus' : 'minus', ambiguous: (item.indexOf('(Ambiguous)') > -1) };
      });
      return pills;
    }
    return undefined;
  }

  public get entityDetailsLink(): string | boolean {
    if (this._searchResult && this._searchResult.ENTITY.RESOLVED_ENTITY.ENTITY_ID) {
      return `/search/details/${this._searchResult.ENTITY.RESOLVED_ENTITY.ENTITY_ID}`;
    //} else if(this._searchResult && this._searchResult.entityId ) {
      //return '/search/by-entity-id/3086';
    //  return `/search/by-entity-id/${this._searchResult.entityId}`;
    }
    return false;
  }

  constructor(
    private cd: ChangeDetectorRef,
    public prefs: SzPrefsService) {}

  ngOnInit() {
    /*
    this.showMatchKey = this.prefs.searchResults.showMatchKeys;
    this.prefs.searchResults.prefsChanged.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( this.onPrefsChange.bind(this) );*/
  }

  /**
   * unsubscribe when component is destroyed
   */
   ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /** proxy handler for when prefs have changed externally */
  private onPrefsChange(prefs: SzSearchResultsPrefs) {
    this.showMatchKey = prefs.showMatchKeys;
    this.cd.detectChanges();
  }

}
