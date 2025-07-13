import { Component, EventEmitter, Input, OnInit, Output, ViewChild, OnDestroy } from '@angular/core';
import { SzEntityDetailSectionData } from '../../models/entity-detail-section-data';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { Subject, BehaviorSubject } from 'rxjs';
import { SzAttributeSearchResult, SzEntityIdentifier } from '@senzing/rest-api-client-ng';
import { howClickEvent } from '../../models/data-how';
import { SzSdkSearchResolvedEntity, SzSdkSearchResult } from '../../models/grpc/engine';
import { CommonModule } from '@angular/common';
import { SzSearchResultCardHeaderGrpcComponent } from './sz-search-result-card-header/sz-search-result-card-header-grpc.component';
import { SzSearchResultCardContentGrpcComponent } from './sz-search-result-card-content/sz-search-result-card-content-grpc.component';
/**
 * @internal
 * @export
 */
@Component({
    selector: 'sz-search-result-card-grpc',
    templateUrl: './sz-search-result-card.component.html',
    styleUrls: ['./sz-search-result-card.component.scss'],
    imports: [CommonModule, SzSearchResultCardHeaderGrpcComponent, SzSearchResultCardContentGrpcComponent]
})
export class SzSearchResultCardGrpcComponent implements OnInit, OnDestroy {
  //@Input()searchResult: SzEntityDetailSectionData | SzSdkSearchResult;
  @Input()searchResult: SzSdkSearchResult;
  @Input()searchValue: string;
  @Input()cardTitle: string;
  @Input()index: number;
  @Input()isOpen: boolean[];
  @Input()isPrinting: boolean;
  @Input()showDataSources: boolean;
  @Input()showMatchKey: boolean;
  /** (Event Emitter) when the user clicks on the "How" button */
  @Output() howClick = new EventEmitter<howClickEvent>();

  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  showRecordId: boolean[] = [];

  constructor(public breakpointObserver: BreakpointObserver) { }

  ngOnInit() {
    if(this.searchResult) {
      if((this.searchResult as SzSdkSearchResult).ENTITY.RESOLVED_ENTITY.RECORDS) {
        this.showRecordId.fill(false, (this.searchResult as SzSdkSearchResult).ENTITY.RESOLVED_ENTITY.RECORDS.length);
      } else {
        // assume it's passing in a entity relationship result
        //this.showRecordId.fill(false, this.searchResult.length);
      }
    }
  }
  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  toggleShowRecordId(index: number): void {
    this.showRecordId[index] = !this.showRecordId[index];
  }

  get cardOpened(): boolean {
    return this.isOpen && this.isOpen[this.index] !== undefined ? this.isOpen[this.index] : false;
  }

  public get showAllInfo(): boolean {
    let retVal = true;
    if(this.isOpen && this.isOpen.every) {
      retVal = true;
    }
    return retVal;
  }

  get moreThanOneSource(): boolean {
    //if((this.searchResult as SzSdkSearchResult).ENTITY.RESOLVED_ENTITY.RECORDS) {
        return (this.searchResult as SzSdkSearchResult).ENTITY.RESOLVED_ENTITY.RECORDS.length > 1;
    //}
    //return this.searchResult.records.length > 1;
  }

  get entityDetailsLink(): string {
    //if((this.searchResult as SzSdkSearchResult).ENTITY.RESOLVED_ENTITY.ENTITY_ID) {
      return `/search/by-entity-id/${(this.searchResult as SzSdkSearchResult).ENTITY.RESOLVED_ENTITY.ENTITY_ID}`;
    //}
    //return `/search/details/${this.searchResult.entityId}`;
  }

  public onHowButtonClick(event: howClickEvent) {
    this.howClick.emit(event);
  }

}
