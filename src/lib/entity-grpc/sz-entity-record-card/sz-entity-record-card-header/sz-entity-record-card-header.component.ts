import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { SzSearchResultEntityData } from '../../../models/responces/search-results/sz-search-result-entity-data';
import { SzResolvedEntity, SzDataSourceRecordSummary } from '@senzing/rest-api-client-ng';
import { SzPrefsService } from '../../../services/sz-prefs.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { bestEntityName } from '../../../common/entity-utils';
import { CommonModule } from '@angular/common';
import { SzResumeEntity, SzResumeRelatedEntity } from '../../../models/SzResumeEntity';
import { SzSdkEntityRecordSummary, SzSdkSearchResolvedEntity, SzSdkSearchResult } from '../../../models/grpc/engine';

/**
 * @internal
 * @export
 */
@Component({
    selector: 'sz-entity-record-card-header-grpc',
    templateUrl: './sz-entity-record-card-header.component.html',
    styleUrls: ['./sz-entity-record-card-header.component.scss'],
    imports: [CommonModule]
})
export class SzEntityRecordCardHeaderComponentGrpc implements OnInit, OnDestroy {
  @Input() searchResult: SzSdkSearchResult;
  @Input() searchValue: string;
  @Input() hideBackGroundColor: boolean;
  @Input() entity: SzResumeRelatedEntity;
  @Input() showRecordIdWhenSingleRecord: boolean = false;
  @Input() public layoutClasses: string[] = [];
  
  private _bestName : string = null;
  private _bestNameEntity: SzResumeEntity | SzSdkSearchResolvedEntity = null;

  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  alert = false;

  @Output()
  public entityRecordClick: EventEmitter<number> = new EventEmitter<number>();

  /** listen for click even on entire header */
  @HostListener('click', ['$event.target']) public onHeaderNameClick(event: MouseEvent) {
    if(this.entityDetailsId) { this.onEntityDetailLinkClick( this.entityDetailsId ); }
  }

  constructor(
    public prefs: SzPrefsService,
    private cd: ChangeDetectorRef
  ) {}

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {
    this.prefs.entityDetail.prefsChanged.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe( this.onPrefsChange.bind(this) );
  }

  get bestName(): string {
    const resolvedEntity = (this.searchResult && this.searchResult.ENTITY.RESOLVED_ENTITY)
      ? this.searchResult.ENTITY.RESOLVED_ENTITY : this.entity;

    if (this._bestName && this._bestNameEntity === resolvedEntity) {
      return this._bestName;
    }
    if (!this.searchResult && !this.entity) {
      return bestEntityName(null);
    }

    this._bestName = bestEntityName(resolvedEntity);
    this._bestNameEntity = resolvedEntity;
    return this._bestName;
  }

  get breakDownInfoExist(): boolean {
    if (this.searchResult && this.searchResult.ENTITY.RESOLVED_ENTITY) {
      return this.searchResult.ENTITY.RESOLVED_ENTITY.RECORD_SUMMARY.length > 0;
    } else if(this.entity) {
      return this.entity.RECORD_SUMMARY.length > 0;
    } else {
      return false;
    }
  }

  get breakDownInfo(): SzSdkEntityRecordSummary[] {
    if (this.searchResult && this.searchResult.ENTITY.RESOLVED_ENTITY.RECORD_SUMMARY) {
      return this.searchResult.ENTITY.RESOLVED_ENTITY.RECORD_SUMMARY;
    } else if(this.entity && this.entity.RECORD_SUMMARY) {
      return this.entity.RECORD_SUMMARY;
    }
    return undefined;
  }

  get entityDetailsLinkName(): string {
    if (this.searchResult && this.searchResult.ENTITY.RESOLVED_ENTITY) {
      return this.searchResult.ENTITY.RESOLVED_ENTITY.ENTITY_NAME;
    } else if(this.entity && this.entity.ENTITY_NAME) {
      return this.entity.ENTITY_NAME;
    }
    return undefined;
  }

  get entityDetailsLink(): string | boolean {
    if (this.searchResult && this.searchResult.ENTITY.RESOLVED_ENTITY) {
      return `/search/details/${this.searchResult.ENTITY.RESOLVED_ENTITY}`;
    } else if(this.entity && this.entity.ENTITY_ID ) {
      //return '/search/by-entity-id/3086';
      return `/search/by-entity-id/${this.entity.ENTITY_ID}`;
    }
    return false;
  }

  get entityDetailsId(): number | boolean {
    if (this.searchResult && this.searchResult.ENTITY.RESOLVED_ENTITY) {
      return this.searchResult.ENTITY.RESOLVED_ENTITY.ENTITY_ID;
    } else if(this.entity && this.entity.ENTITY_ID ) {
      //return '/search/by-entity-id/3086';
      return this.entity.ENTITY_ID;
    }
    return false;
  }

  public onEntityDetailLinkClick(entityId: number | boolean): void {
    if(entityId && typeof entityId == 'number' && entityId > 0) {
      console.log('onEntityDetailLinkClick: "'+ entityId +'"');
      this.entityRecordClick.emit(entityId);
    }
  }

  /** proxy handler for when prefs have changed externally */
  private onPrefsChange(prefs: any) {
    //console.warn('@senzing/sdk-components-grpc-web/sz-entity-record-card-header.onPrefsChange(): ', prefs);
    this.showRecordIdWhenSingleRecord = prefs.showTopEntityRecordIdsWhenSingular;
    // update view manually (for web components redraw reliability)
    this.cd.detectChanges();
  }
}
