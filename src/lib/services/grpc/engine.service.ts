import { Inject, Injectable, signal } from '@angular/core';
import { SzEngineFlags, SzError, SzGrpcWebConfig, SzGrpcWebEnvironment, SzGrpcWebEnvironmentOptions } from '@senzing/sz-sdk-typescript-grpc-web';
import { Observable, Subject, take, takeUntil } from 'rxjs';
import { SzProductLicenseResponse, SzProductVersionResponse } from '../../models/grpc/product';
import { SzGrpcConfig } from './config.service';
import { isNotNull } from '../../common/utils';

@Injectable({
  providedIn: 'root'
})
export class SzGrpcEngineService {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    
    public addRecords(recordsAsJson: Array<{[key: string]: any}>) {
        let retVal      = new Subject();
        let requests    = [];
        let ignoredRecs = [];
        let errors      = [];
        recordsAsJson.forEach((record)=>{
            let dsCode      = record['DATA_SOURCE'];
            let recordId    = record['RECORD_ID'];
            if(isNotNull(dsCode)) {
                let _p = new Promise((resolve, reject)=>{
                    try{
                        this.addRecord(dsCode, recordId, record).then((result)=>{
                            resolve(result);
                        }).catch((err)=>{
                            errors.push(err);
                        })
                    } catch(err) {
                        errors.push(err);
                    }
                })
                requests.push( _p );
            } else {
                ignoredRecs.push(record);
            }
        });
        Promise.all(requests).then((p)=> {
            console.log(`SzGrpcEngineService.addRecords: `, p, errors);
            retVal.next(p)
        })
        return retVal.asObservable();
    }

    /**
     * data_as_json = '{"ADDR_LINE1":"123 Main Street, Las Vegas NV 89132","ADDR_TYPE":"MAILING","AMOUNT":"100","DATE":"1/2/18","DATE_OF_BIRTH":"12/11/1978","EMAIL_ADDRESS":"bsmith@work.com","PHONE_NUMBER":"702-919-1300","PHONE_TYPE":"HOME","PRIMARY_NAME_FIRST":"Robert","PRIMARY_NAME_LAST":"Smith","RECORD_TYPE":"PERSON","STATUS":"Active","DATA_SOURCE":"CUSTOMERS"}'
     */
    public addRecord(dataSourceCode: string, recordId: string | number, recordDefinition: any) {
        return this.szEnvironment.engine.addRecord(dataSourceCode, recordId, recordDefinition)
    }

    public getActiveConfigId() {
        let retVal = new Subject<number | SzError>();
        console.log(`getting license from grpc...`);
        if(this.szEnvironment && this.szEnvironment.engine) {
          this.szEnvironment?.engine?.getActiveConfigId().then((resp) => {
            retVal.next(resp);
          })
        }
        return retVal;
    }
    public getEntityByEntityId(entityId: number, flags: BigInt | number = SzEngineFlags.SZ_ENTITY_DEFAULT_FLAGS): Observable<any | SzError> {
        let retVal = new Subject<string | SzError>();
        console.log(`getting entity by id from grpc...`);
        if(this.szEnvironment && this.szEnvironment.engine) {
          this.szEnvironment?.engine?.getEntityByEntityId(entityId, flags).then((resp) => {
            retVal.next(JSON.parse(resp as string));
          })
        }
        return retVal.asObservable();
    }
    public searchByAttributes(attributes: string | Map<any, any> | {[key: string] : any}, flags: BigInt | number = SzEngineFlags.SZ_SEARCH_BY_ATTRIBUTES_DEFAULT_FLAGS, searchProfile: string = ""): Observable<any | SzError> {
        let retVal = new Subject<string | SzError>();
        let flagss: BigInt = SzEngineFlags.SZ_SEARCH_BY_ATTRIBUTES_DEFAULT_FLAGS | 
        SzEngineFlags.SZ_SEARCH_BY_ATTRIBUTES_STRONG | 
        SzEngineFlags.SZ_INCLUDE_FEATURE_SCORES | 
        SzEngineFlags.SZ_INCLUDE_MATCH_KEY_DETAILS | 
        SzEngineFlags.SZ_ENTITY_INCLUDE_ENTITY_NAME | 
        SzEngineFlags.SZ_ENTITY_INCLUDE_RECORD_DATA;
        
        console.log(`getting search results from grpc...`, flagss);


        if(this.szEnvironment && this.szEnvironment.engine) {
          this.szEnvironment?.engine?.searchByAttributes(attributes, flagss, searchProfile).then((resp) => {
            retVal.next(JSON.parse(resp as string));
          })
        }
        return retVal.asObservable();
    }
    public getEntityByRecordId(dataSourceCode: string, recordId: string, flags: BigInt | number = SzEngineFlags.SZ_ENTITY_DEFAULT_FLAGS): Observable<any | SzError> {
      let retVal = new Subject<string | SzError>();
      console.log(`getting entity by record id from grpc...`);
      if(this.szEnvironment && this.szEnvironment.engine) {
        this.szEnvironment?.engine?.getEntityByRecordId(dataSourceCode, recordId, flags).then((resp) => {
          retVal.next(JSON.parse(resp as string));
        })
      }
      return retVal.asObservable();
    }
    public getRecord(dataSourceCode: string, recordId: string, flags: BigInt | number = SzEngineFlags.SZ_RECORD_DEFAULT_FLAGS): Observable<any | SzError> {
      let retVal = new Subject<string | SzError>();
      console.log(`getting record from grpc...`);
      if(this.szEnvironment && this.szEnvironment.engine) {
        this.szEnvironment?.engine?.getEntityByRecordId(dataSourceCode, recordId, flags).then((resp) => {
          retVal.next(JSON.parse(resp as string));
        })
      }
      return retVal.asObservable();
    }
    public findNetworkByEntityId(entityId: number, maxDegrees?: number, buildOutDegrees?: number, buildOutMaxEntities?: number, flags: BigInt | number = SzEngineFlags.SZ_ENTITY_DEFAULT_FLAGS): Observable<any | SzError> {
      let retVal = new Subject<string | SzError>();
      console.log(`find network by id from grpc...`);
      if(this.szEnvironment && this.szEnvironment.engine) {
        this.szEnvironment?.engine?.findNetworkByEntityId([entityId], maxDegrees, buildOutDegrees, buildOutMaxEntities, flags).then((resp) => {
          retVal.next(JSON.parse(resp as string));
        })
      }
      return retVal.asObservable();
    }
    public reinitialize(configId: number) {
        let retVal = new Subject<unknown>();
        console.log(`reinitialize engine with #${configId}...`);
        if(this.szEnvironment && this.szEnvironment.engine) {
          this.szEnvironment?.engine?.reinitialize(configId).then((resp) => {
            retVal.next(resp);
          })
        }
        return retVal.asObservable();
    }
    public reevaluateEntity(entityId: number, flags: BigInt | number = 0): Observable<any | SzError> {
      let retVal = new Subject<any | SzError>();
      console.log(`reevaluate entity by id from grpc...`);
      if(this.szEnvironment && this.szEnvironment.engine) {
        this.szEnvironment?.engine?.reevaluateEntity(entityId, flags).then((resp) => {
          retVal.next(JSON.parse(resp as string));
        })
      }
      return retVal.asObservable();
    }
    public reevaluateRecord(dataSourceCode: string, recordId: string, flags?: BigInt | number): Observable<any | SzError> {
      let retVal = new Subject<any | SzError>();
      console.log(`reevaluate entity by id from grpc...`);
      if(this.szEnvironment && this.szEnvironment.engine) {
        this.szEnvironment?.engine?.reevaluateRecord(dataSourceCode, recordId, flags).then((resp) => {
          retVal.next(JSON.parse(resp as string));
        })
      }
      return retVal.asObservable();
    }

    public howEntityByEntityId(entityId: number, flags?: BigInt | number): Observable<any | SzError> {
      let retVal = new Subject<any | SzError>();
      console.log(`how report by id from grpc...`);
      if(this.szEnvironment && this.szEnvironment.engine) {
        this.szEnvironment?.engine?.howEntityByEntityId(entityId, flags).then((resp) => {
          retVal.next(JSON.parse(resp as string));
        })
      }
      return retVal.asObservable();
    }
    
    constructor(
        // Make GRPC Environment an injection token
        @Inject('GRPC_ENVIRONMENT') private szEnvironment: SzGrpcWebEnvironment
    ) {

    }
}