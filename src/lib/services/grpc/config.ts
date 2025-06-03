import { Injectable } from '@angular/core';
import { SzGrpcWebConfig } from '@senzing/sz-sdk-typescript-grpc-web';
import { Subject } from 'rxjs';
import { SzSdkDataSource } from '../../models/grpc/config';
//import { SzProductLicenseResponse, SzProductVersionResponse } from 'src/lib/models/grpc/product';

@Injectable({
  providedIn: 'root'
})
export class SzGrpcConfig {
    private _config: SzGrpcWebConfig;

    public set config(config: SzGrpcWebConfig) {
        this._config = config;
    }
    public get config() {
        return this._config;
    }

    public get definition() {
        return this._config.definition;
    }

    addDataSource(dataSourceCode: string) {
        let retVal  = new Subject<string>();
        console.log(`adding datasource through grpc...`);

        this.config.addDataSource(dataSourceCode).then((configResp) => {
            retVal.next(configResp);
        }).catch((err)=>{ retVal.error(err); })
        return retVal;
    }
    addDataSources(dataSourceCodes: string[]) {
        let retVal  = new Subject<string[]>();
        console.log(`adding datasources through grpc...`);

        this.config.addDataSources(dataSourceCodes).then((configResp) => {
            retVal.next(configResp);
        }).catch((err)=>{ retVal.error(err); })

        return retVal;
    }
    deleteDataSource(dataSourceCode: string) {
        let retVal  = new Subject<any>();
        console.log(`delete datasource through grpc...`);

        this.config.deleteDataSource(dataSourceCode).then((configResp) => {
            retVal.next(configResp);
        }).catch((err)=>{ retVal.error(err); })
        return retVal;
    }
    getAttributeTypes() {
        let retVal  = new Subject<any>();
        return retVal.asObservable();
    }
    getDataSources() {
        let retVal  = new Subject<SzSdkDataSource[]>();
        console.log(`get datasources from grpc...`);

        this.config.getDataSources().then((configResp) => {
            retVal.next(configResp);
        }).catch((err)=>{ retVal.error(err); })
        return retVal;
    }
    verifyConfig() {
        let retVal  = new Subject<any>();
        console.log(`verifying througb grpc...`);

        this.config.verifyConfig().then((configResp) => {
            retVal.next(configResp);
        }).catch((err)=>{ retVal.error(err); })
        return retVal;
    }
    constructor(grpcWebConfig: SzGrpcWebConfig) {
        if(grpcWebConfig){
            this._config = grpcWebConfig;
        }
    }
}