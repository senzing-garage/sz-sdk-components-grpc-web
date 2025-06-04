import { Injectable } from '@angular/core';
import { forkJoin, Observable, Subject } from 'rxjs';
import { map, take, takeUntil, tap } from 'rxjs/operators';

import {
  EntityDataService,
  ConfigService,
  SzAttributeSearchResponse,
  SzEntityData,
  SzAttributeTypesResponse,
  SzAttributeType,
  SzAttributeSearchResult,
  SzEntityRecord,
  SzEntityResponse,
  SzRecordResponse,
  SzRecordResponseData,
  SzEntityIdentifiers,
  SzDetailLevel,
  SzEntityIdentifier
} from '@senzing/rest-api-client-ng';
import { SzEntitySearchParams } from '../models/entity-search';
import { SzGrpcEngineService } from './grpc/engine.service';
import { SzGrpcConfigManagerService } from './grpc/configManager.service';
import { SzEngineFlags } from '@senzing/sz-sdk-typescript-grpc-web';
import { SzSdkSearchResolvedEntity, SzSdkSearchResponse } from '../models/grpc/engine';

export interface SzSearchEvent {
  params: SzEntitySearchParams,
  results: SzSdkSearchResolvedEntity[]
}

@Injectable({
  providedIn: 'root'
})
export class SzSearchService {
  private currentSearchParams: SzEntitySearchParams = {};
  private currentSearchResults: SzSdkSearchResolvedEntity[] | null = null;
  public parametersChanged = new Subject<SzEntitySearchParams>();
  public resultsChanged = new Subject<SzSdkSearchResolvedEntity[]>();
  public searchPerformed = new Subject<SzSearchEvent>();

  constructor(
    private configManagerService: SzGrpcConfigManagerService,
    private engineService: SzGrpcEngineService,
    private entityDataService: EntityDataService
    ) {}

  /**
   * perform a search request againt the data source.
   * @link http://editor.swagger.io/?url=https://raw.githubusercontent.com/Senzing/senzing-rest-api/master/senzing-rest-api.yaml | GET /entities
   *
   * @memberof SzSearchService
   */
  public searchByAttributes(searchParms: SzEntitySearchParams): Observable<SzSdkSearchResolvedEntity[]> {
    this.currentSearchParams = searchParms;
    //return this.entityDataService.searchByAttributes(attrs?: string, attr?: Array<string>, withRelationships?: boolean, featureMode?: string, withFeatureStats?: boolean, withDerivedFeatures?: boolean, forceMinimal?: boolean, withRaw?: boolean, observe?: 'body', reportProgress?: boolean): Observable<SzAttributeSearchResponse>;
    return this.engineService.searchByAttributes(JSON.stringify(searchParms), SzEngineFlags.SZ_ENTITY_INCLUDE_ALL_RELATIONS)
    .pipe(
      tap((searchRes) => console.log('SzSearchService.searchByAttributes: ', searchParms, searchRes)),
      map((searchRes) => (JSON.parse(searchRes as string) as SzSdkSearchResponse).RESOLVED_ENTITIES),
      //map((searchRes) => JSON.parse(searchRes).data.searchResults as SzSdkSearchResolvedEntity[]),
      tap((searchRes: SzSdkSearchResolvedEntity[]) => {
        console.warn('SzSearchService.searchByAttributes 1: ', searchRes)
        this.searchPerformed.next({
          params: this.currentSearchParams,
          results: searchRes
        });
        //console.warn('SzSearchService.searchByAttributes 2: ', searchRes)
      })
    );
  }
  /**
   * get the current search params.
   *
   * @memberof SzSearchService
   */
  public getSearchParams(): SzEntitySearchParams {
    return this.currentSearchParams;
  }

  /**
   * set an individual search parameter.
   * @memberof SzSearchService
   */
  public setSearchParam(paramName: any, value: any): void {
    try {
      this.currentSearchParams[paramName] = value;
      this.parametersChanged.next(this.currentSearchParams);
    } catch(err) {}
  }

  /**
   * get the current search results from the last search.
   * @memberof SzSearchService
   */
  public getSearchResults() : SzSdkSearchResolvedEntity[] | null {
    return this.currentSearchResults;
  }

  /**
   * set the current search results from the last search.
   * @memberof SzSearchService
   */
  public setSearchResults(results: SzSdkSearchResolvedEntity[] | null) : void {
    this.currentSearchResults = results ? results : null;
    this.resultsChanged.next( this.currentSearchResults );
  }

  /**
   * clears out current search parameters and search results.
   * @memberof SzSearchService
   */
  public clearCurrentSearchState() : void {
    this.currentSearchParams  = {};
    this.currentSearchResults = null;
  }

  /**
   * @alias getAttributeTypes
  */
  public getMappingAttributes(): Observable<SzAttributeType[]> {
    return this.getAttributeTypes();
  }
  /**
   * get list of characteristics as attribute types
   *
   * @memberof SzSearchService
   */
  public getAttributeTypes(): Observable<SzAttributeType[]> {
    let _retSubject = new Subject<SzAttributeType[]>();
    let _retVal     = _retSubject.asObservable();

    // get attributes
    this.configManagerService.config.then((conf) => {
      conf.getAttributeTypes().pipe(
        take(0)
      ).subscribe((attrs)=>{
        _retSubject.next(attrs);
      })
    })
    return _retVal;
  }

  /**
   * get an SzEntityData model by providing an entityId.
   *
   * @memberof SzSearchService
   */
  public getEntityById(entityId: SzEntityIdentifier, withRelated = false, detailLevel = SzDetailLevel.VERBOSE): Observable<SzEntityData> {
    console.log('@senzing/sdk/services/sz-search[getEntityById('+ entityId +', '+ withRelated +')] ');
    const withRelatedStr = withRelated ? 'FULL' : 'NONE';
    //return this.engineService.getEntityByEntityId((entityId as number), detailLevel, undefined, undefined, undefined, undefined, withRelatedStr)
    return this.engineService.getEntityByEntityId((entityId as number))
    .pipe(
      //tap((res: SzEntityResponse) => console.log('SzSearchService.getEntityById: ' + entityId, res.data)),
      map((res) => res)
    );
  }
  /** get the SzEntityData[] responses for multiple entities 
   * @memberof SzSearchService
   */
  public getEntitiesByIds(entityIds: SzEntityIdentifiers, withRelated = false, detailLevel = SzDetailLevel.VERBOSE): Observable<SzEntityData[]> {
    console.log('@senzing/sdk/services/sz-search[getEntitiesByIds('+ entityIds +', '+ withRelated +')] ');
    const withRelatedStr = withRelated ? 'FULL' : 'NONE';
    let _retSubject = new Subject<SzEntityData[]>();
    let _retVal     = _retSubject.asObservable();

    let _listOfObserveables = entityIds.map((eId) => {
      //return this.engineService.getEntityByEntityId(eId, detailLevel, undefined, undefined, undefined, undefined, withRelatedStr)
      return this.engineService.getEntityByEntityId(eId)
    })

    forkJoin(_listOfObserveables).pipe(
      map((res: SzEntityResponse[]) => {
        return res.map((res: SzEntityResponse) => (res.data as SzEntityData))
      })
    )
    .subscribe((results: SzEntityData[]) => {
      console.warn('@senzing/sdk/services/sz-search[getEntitiesByIds RESULT: ', results);
      _retSubject.next(results);
    })

    return _retVal;
  }

  /**
   * get an SzEntityRecord model by providing an datasource and record id.
   *
   * @memberof SzSearchService
   */
  public getRecordById(dsName: string, recordId: string | number, withRelated = false): Observable<SzEntityRecord> {
    //console.log('@senzing/sdk/services/sz-search[getRecordById('+ dsName +', '+ recordId +')] ', dsName, recordId);
    const _recordId: string = recordId.toString();

    return this.engineService.getRecord(dsName, _recordId)
    .pipe(
      tap((res: SzRecordResponse) => console.log('SzSearchService.getRecordById: ' + dsName, res)),
      map((res: SzRecordResponse) => (res.data as SzRecordResponseData).record )
    );
  }

  /**
   * get an SzEntityData model by providing an datasource and record id.
   *
   * @memberof SzSearchService
   */
   public getEntityByRecordId(dsName: string, recordId: string | number, withRelated = false, detailLevel = SzDetailLevel.SUMMARY): Observable<SzEntityData> {
    console.log('@senzing/sdk/services/sz-search[getEntityByRecordId('+ dsName +', '+ recordId +')] ', dsName, recordId, detailLevel);
    const _recordId: string = recordId.toString();

    return this.engineService.getEntityByRecordId(dsName, _recordId)
    .pipe(
      map( (res: SzEntityResponse) => {
        return res.data
      })
    );
  }

}
