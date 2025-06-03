import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, Inject, ViewChild, ElementRef } from '@angular/core';
import { Observable, Subject, filter, take, takeUntil } from 'rxjs';
import { SzGrpcProductService } from '../services/grpc/product.service';
import { SzGrpcWebConfig, SzGrpcWebEnvironment } from '@senzing/sz-sdk-typescript-grpc-web';
import { detectLineEndings, isNotNull } from '../common/utils';
import { SzGrpcConfigManagerService } from '../services/grpc/configManager.service';
import { SzGrpcConfig } from '../services/grpc/config';
import { SzSdkDataSource } from '../models/grpc/config';
import { SzGrpcEngineService } from '../services/grpc/engine.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';

export interface SzImportedFilesAnalysisDataSource {
  name: string,
  originalName: string,
  recordCount?: number,
  recordsWithRecordIdCount?: number
  exists: boolean;
  id?: number;
}
export interface SzImportedFilesAnalysis {
  /**
     * The character encoding used to process the bulk data.
     */
  characterEncoding?: string;
  /**
   * The media type of the bulk data.
   */
  mediaType?: string;
  /**
   * The number of records found in the bulk data.  This may not match the number of \"observed entities\" once loaded since some records may be exact duplicates.
   */
  recordCount?: number;
  /**
   * The number of records provided that include a `RECORD_ID` value.
   */
  recordsWithRecordIdCount?: number;
  /**
   * The number of records provided that include a `DATA_SOURCE` value.
   */
  recordsWithDataSourceCount?: number;
  /** json records */
  records: {[key: string]: any}[],
  /** array of analysis elements grouped by datasource */
  dataSources: SzImportedFilesAnalysisDataSource[]
}

export interface SzImportedFilesLoaded {
  loaded: number,
  notLoaded: number,
  failures: number,
  errors?: Error[]
}

/**
 * A component that allows a user to drag and drop, or choose a file
 * to load in to a configuration. The file will be parsed, the datasources
 * scanned from the file, created, new configuration updated. Then each record
 * in the file is added to it's respective datasource.
 *
 * @example 
 * <!-- (Angular) -->
 * <sz-import-file></sz-import-file>
 *
 * @example 
 * <!-- (WC) -->
 * <sz-wc-import-file></sz-wc-import-file>
 */
@Component({
    selector: 'sz-import-files',
    templateUrl: './sz-import-files.component.html',
    imports: [CommonModule, MatBadgeModule, MatButtonModule, MatIconModule, MatInputModule, MatTableModule],
    styleUrls: ['./sz-import-files.component.scss','../scss/import-datagrid.scss']
})
export class SzImportFileComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$   = new Subject<void>();
  private _dataSources: SzSdkDataSource[];
  public defaultConfigId: number;
  public configDefinition: string;
  public isInProgress = false;
  private _results;
  public analysis: SzImportedFilesAnalysis;
  public dataSourcesToRemap = new Map<string, string>;
  public results;
  public currentError: Error;
  
  private _jsonTypes  = [
    'application/json',
    'application/ld+json'
  ];
  private _csvTypes   = [
    'text/csv'
  ]

  @ViewChild('fileInput') public _fileInputElement: ElementRef;
  
  private get fileInputElement(): HTMLInputElement {
    return this._fileInputElement.nativeElement as HTMLInputElement;
  }
  public get displayedColumns(): string[] {
    const retVal = [];
    if( this.hasBlankDataSource) {
      retVal.push('name');
    }
    retVal.push('recordCount', 'recordsWithRecordIdCount','originalName');
    return retVal;
  }
  public get hasBlankDataSource() {
    let retVal =  false;
    if(this.analysis && this.analysis) {
      retVal = this.analysis.recordsWithDataSourceCount < this.analysis.recordCount;
    }
    return retVal;
  }
  public get showAnalysis() : boolean {
    return this.analysis !== undefined && this.analysis.dataSources.length && !this.showResults;
  }
  public get showResults() : boolean {
    return this.results !== undefined;
  }
  public get dataSourcesForPulldown() {
    let retVal = this._dataSources;
    return retVal;
  }
  private get dataSourcesAsMap() : Map<string, number> {
    let retVal = new Map<string, number>();
    this._dataSources?.forEach((dsItem) => {
      retVal.set(dsItem.DSRC_CODE, dsItem.DSRC_ID);
    })
    return retVal;
  }
  public get dataCanBeLoaded(): boolean {
    let retVal = !this.isInProgress && (this.analysis ? true : false);
    if(this.hasBlankDataSource) {
      retVal = retVal && this.dataSourcesToRemap.has('NONE');
    }
    return retVal;
  }

  

  constructor(
    @Inject('GRPC_ENVIRONMENT') private SdkEnvironment: SzGrpcWebEnvironment,
    private productService: SzGrpcProductService,
    private engineService: SzGrpcEngineService,
    private configManagerService: SzGrpcConfigManagerService
  ) {}

  private getDataSources() {
    let retVal = new Subject<SzSdkDataSource[]>();
    this.configManagerService.config.then((conf)=> {
      conf.getDataSources().pipe(
        takeUntil(this.unsubscribe$),
        take(1)
      ).subscribe((dsResp: SzSdkDataSource[]) =>{
        retVal.next(dsResp);
      })
    });
    return retVal;
  }

  public getDataSourceInputName(index: number): string {
    return 'ds-name-' + index;
  }
  /*
  public getEntityTypeInputName(index: number): string {
    return 'et-name-' + index;
  }*/
  public getIsNew(value: boolean): boolean | undefined {
    return (value === true) ? value : false;
  }
  public isNewDataSource(value: string): boolean {
    //return true;
    return value && (value.trim().length > 0) && !(this.dataSourcesAsMap.has(value));
  }

  public reinitEngine() {
    this.engineService.reinitialize(this.defaultConfigId)
  }
  public reinitEnvironment() {
    this.SdkEnvironment.reinitialize(this.defaultConfigId);
  }

  public addRecords(records: Array<{[key: string]: any}>){
    let retVal = new Subject<any>()
    this.engineService.addRecords(records).pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((result)=> {
      retVal.next(result);
    });
    return retVal.asObservable();
  }

  /** when user changes the destination for a datasource */
  public handleDataSourceChange(fromDataSource: string, toDataSource: string) {
    console.log(`handleDataSourceChange: "${fromDataSource}" => ${toDataSource}`);
    let _srcKey   = fromDataSource && fromDataSource.trim() !== '' ? fromDataSource : 'NONE';
    let _destKey  = toDataSource;
    this.dataSourcesToRemap.set(_srcKey, _destKey);
    //this.adminBulkDataService.changeDataSourceName(fromDataSource, toDataSource);
  }

  public onFilesChanged(event) {
    this.analyzeFiles().pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((response)=> {
      this.analysis    = response;
    })
  }

  public loadRecords(): Observable<SzImportedFilesLoaded> {
    let retVal = new Subject<SzImportedFilesLoaded>()
    if(this.analysis){
      const dataSourcesToCreate = this.analysis.dataSources.filter((ds)=> { return !ds.exists; });
      let recordsToLoad = this.analysis.records;

      console.log(`loadRecords: `, this.analysis);
      if(this.hasBlankDataSource) {
        // update records with no DATA_SOURCE value to mapped value
        let newDsName     = this.dataSourcesToRemap.get('NONE');
        let blankDsIndex  = dataSourcesToCreate.findIndex((ds)=> {
          return ds.originalName === '';
        });
        if(blankDsIndex > -1 && dataSourcesToCreate[blankDsIndex]) {
          dataSourcesToCreate[blankDsIndex].name = newDsName;
        }
      }
      if(dataSourcesToCreate && dataSourcesToCreate.length > 0) {
        // first create datasources
        console.log('creating datasources..', dataSourcesToCreate)
        this.addDataSources(dataSourcesToCreate).pipe(
          takeUntil(this.unsubscribe$)
        ).subscribe((dataSources)=>{
          this.addRecords(recordsToLoad).pipe(
            takeUntil(this.unsubscribe$)
          ).subscribe((resp)=> {
            console.log('added records: ', resp);
          });
        });
      } else {
        // first create datasources
        console.log('loading records..')
        this.addRecords(recordsToLoad).pipe(
          takeUntil(this.unsubscribe$)
        ).subscribe((resp)=> {
          console.log('added records: ', resp);
          this.results = resp;
        });
      }

      let report = {
        loaded: 0,
        notLoaded: 0,
        failures: 0
      }
    }
    return retVal.asObservable();
  }

  public reset() {
    this.isInProgress = false;
    this.analysis     = undefined;
    this.results      = undefined;
  }

  public addDataSources(dataSources: SzImportedFilesAnalysisDataSource[]) {
    let retVal = new Subject<string[]>();
    let _dataSourcesToAdd = dataSources.filter((dsItem) => {
      return !dsItem.exists && isNotNull(dsItem.name);
    }).map((dsItem) => {
      return dsItem.name;
    });
    

    if(_dataSourcesToAdd.length > 0) {
      this.configManagerService.config.then((conf)=>{
        conf.addDataSources(_dataSourcesToAdd).pipe(
          takeUntil(this.unsubscribe$)
        ).subscribe((resp) => {
          console.log(`added datasources: `, resp);
          console.log(`conf: `, conf.definition);
          this.configManagerService.setDefaultConfig(conf.definition).pipe(
            takeUntil(this.unsubscribe$)
          ).subscribe((newConfigId)=>{
            console.log(`new config Id: #${newConfigId}`);
            this.SdkEnvironment.reinitialize(newConfigId);
            this.configDefinition = conf.definition;
            retVal.next(resp);
          });
        });
      })
      
    }
    return retVal.asObservable();
  }

  public analyzeFiles(): Observable<SzImportedFilesAnalysis> {
    let _fArr             = this.fileInputElement.files;
    let _dataSources      = new Map<string, {recordCount: number, recordsWithRecordIdCount: number}>();
    let _defaultConfigId: number;
    let retVal            = new Subject<SzImportedFilesAnalysis>();
    let topLevelStats     = {
      recordCount: 0,
      recordsWithRecordIdCount: 0,
      recordsWithDataSourceCount: 0
    }
    console.log(`parseFile: `, event, _fArr, this.fileInputElement);
    for(let i=0; i <= (_fArr.length - 1); i++) {
      let _file         = _fArr[i];
      let _fileContents = "";
      let isJSON    = this._jsonTypes.includes(_file.type);
      let isCSV     = this._csvTypes.includes(_file.type);
      if(!isJSON || isCSV) {
        // try and figure out if it's "text/plain" if it's actually 
        // a csv or json file masquerading as a plain text file
      }

      const reader  = new FileReader();
      reader.onload = () => {
        _fileContents += reader.result;
        //convert text to json here
        //var json = this.csvJSON(text);
      };
      reader.onloadend = () => {
        const lineEndingStyle = detectLineEndings(_fileContents);
        const lines           = _fileContents.split(detectLineEndings(_fileContents));
        if(lines && lines.length <= 1) {
          // assume it's one line ???
          console.warn(`whut? `, lineEndingStyle);
          return;
        }
        //console.log(`parseFile: on read end.`, lineEndingStyle, lines);

        if(isJSON) {

        } else if(isCSV) {
          // get column headers indexes
          let columns     = (lines.shift()).split(',');
          let dsIndex     = columns.indexOf('DATA_SOURCE');
          let linesAsJSON = [];
          
          lines.filter((_l, index)=>{
            return isNotNull(_l);
          }).forEach((_l, index) => {
            let _dsName   = _l.split(',')[dsIndex];
            let _existingDataSource = _dataSources.has(_dsName) ? _dataSources.get(_dsName) : undefined;
            let _recordCount      = _existingDataSource ? _existingDataSource.recordCount : 0;
            let _recordsWithRecId  = _existingDataSource ? _existingDataSource.recordsWithRecordIdCount : 0;
            
            let _values   = _l.split(',');
            let _rec      = {};
            columns.forEach((colName: string, colIndex: number) => {
              if(isNotNull(_values[colIndex])) _rec[colName] = _values[colIndex];
            });
            // update ds stats
            _dataSources.set(_dsName, {
              recordCount: _recordCount+1,
              recordsWithRecordIdCount: _recordsWithRecId + (_rec['RECORD_ID'] ? 1 : 0)
            });
            // update top lvl stats
            topLevelStats.recordCount                 = topLevelStats.recordCount +1;
            topLevelStats.recordsWithDataSourceCount  = topLevelStats.recordsWithDataSourceCount + (_rec['DATA_SOURCE'] ? 1 : 0)
            topLevelStats.recordsWithRecordIdCount    = topLevelStats.recordsWithRecordIdCount + (_rec['RECORD_ID'] ? 1 : 0);
            
            // add json record
            linesAsJSON.push(_rec);
          });

          let analysisDataSources = [];
          _dataSources.forEach((value: {recordCount: number, recordsWithRecordIdCount: number}, key: string) => {
            let _existingDataSource = this.dataSourcesAsMap.has(key) ? this.dataSourcesAsMap.get(key) : undefined;
            let _analysisDs:SzImportedFilesAnalysisDataSource = {
              name: key,
              originalName: key,
              recordCount: value.recordCount,
              recordsWithRecordIdCount: value.recordsWithRecordIdCount,
              exists: _existingDataSource ? true : false
            };

            if(_existingDataSource !== undefined) {
              _analysisDs.id = _existingDataSource;
            }
            analysisDataSources.push(_analysisDs)
          })

          let retAnalysis: SzImportedFilesAnalysis = { 
            recordCount: topLevelStats.recordCount,
            recordsWithRecordIdCount: topLevelStats.recordsWithDataSourceCount,
            recordsWithDataSourceCount: topLevelStats.recordsWithRecordIdCount,
            records: linesAsJSON,
            dataSources: analysisDataSources
          }
          
          retVal.next(retAnalysis)


          /*
          lines.forEach((_l, index) => {
            _dataSources.set(_l.split(',')[dsIndex], -1);
            let _values   = _l.split(',');
            let _rec      = {};
            columns.forEach((colName: string, colIndex: number) => {
              if(isNotNull(_values[colIndex])) _rec[colName] = _values[colIndex];
            });
            linesAsJSON.push(_rec);
          });
          let _dataSourcesToAdd = [..._dataSources.keys()].filter((dsName) => {
            //console.log(`[${[...this.dataSourcesAsMap.keys()]}] includes "${dsName}"? ${this.dataSourcesAsMap.has(dsName)}`);
            return isNotNull(dsName) && !this.dataSourcesAsMap.has(dsName);
          });

          console.log(`parseFile: `, columns, [..._dataSources.keys()], _dataSourcesToAdd);
          if(_dataSourcesToAdd.length > 0) {
            this.configManagerService.config.then((conf)=>{
              conf.addDataSources(_dataSourcesToAdd).pipe(
                takeUntil(this.unsubscribe$)
              ).subscribe((resp) => {
                console.log(`added datasources: `, resp);
                console.log(`conf: `, conf.definition);
                this.configManagerService.setDefaultConfig(conf.definition).pipe(
                  takeUntil(this.unsubscribe$)
                ).subscribe((newConfigId)=>{
                  console.log(`old config Id: #${_defaultConfigId}`);
                  console.log(`new config Id: #${newConfigId}`);
                  
                  this.SdkEnvironment.reinitialize(newConfigId);
                  this.configDefinition = conf.definition;
                  addJSONRecords(linesAsJSON);
                  //this.configManagerService.setDefaultConfig(conf.definition)
                })
  
                //addJSONRecords(linesAsJSON);
              });
            })
            
          } else {
            addJSONRecords(linesAsJSON)
          }
          */
        }
      }
      console.log(`parseFile: "${_file.type}"`, isJSON, isCSV);
      // first get default id
      this.configManagerService.getDefaultConfigId().pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe((configId)=>{
        _defaultConfigId = configId;
        console.log(`DEFAULT CONFIG ID: ${_defaultConfigId}`);
        // read file
        reader.readAsText(_file);
      });
    };
    return retVal.asObservable();
  }

  ngOnInit() {
    this.getDataSources().pipe(
      takeUntil(this.unsubscribe$),
      take(1)
    ).subscribe((dataSources)=>{
      this._dataSources = dataSources;
      console.log(`got datasources: `, this._dataSources);
    });
    // get default config id
    this.configManagerService.getDefaultConfigId().pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((configId)=>{
      this.defaultConfigId = configId;
      console.log(`DEFAULT CONFIG ID: ${this.defaultConfigId}`);
    });
    this.configManagerService.config.then((config)=>{
      this.configDefinition = config.definition;
    });
    
    /**
     * 2894936149
     * 535304206
     */
  }

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}