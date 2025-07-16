import { Injectable } from '@angular/core';
import { SzGrpcWebConfig } from '@senzing/sz-sdk-typescript-grpc-web';
import { Subject } from 'rxjs';
import { SzSdkConfigAttr, SzSdkConfigFeatureType, SzSdkConfigJson, SzSdkDataSource } from '../../models/grpc/config';
import { SzSdkEntityFeature } from "../../models/grpc/engine";
import { SzAttrClass, SzFeatureType } from "../../models/SzFeatureTypes";

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

    registerDataSource(dataSourceCode: string) {
        let retVal  = new Subject<string>();
        console.log(`adding datasource through grpc...`);

        this.config.registerDataSource(dataSourceCode).then((configResp) => {
            retVal.next(configResp);
        }).catch((err)=>{ retVal.error(err); })
        return retVal;
    }
    registerDataSources(dataSourceCodes: string[]) {
        let retVal  = new Subject<string[]>();
        console.log(`adding datasources through grpc...`);

        this.config.registerDataSources(dataSourceCodes).then((configResp) => {
            retVal.next(configResp);
        }).catch((err)=>{ retVal.error(err); })

        return retVal;
    }
    unregisterDataSource(dataSourceCode: string) {
        let retVal  = new Subject<any>();
        console.log(`delete datasource through grpc...`);

        this.config.unregisterDataSource(dataSourceCode).then((configResp) => {
            retVal.next(configResp);
        }).catch((err)=>{ retVal.error(err); })
        return retVal;
    }
    get featureTypes(): SzSdkConfigFeatureType[] {
        let retVal = [];
        if(this._config && this._config.definition) {
            let cfgJson = (JSON.parse(this._config.definition) as SzSdkConfigJson).G2_CONFIG;
            if(cfgJson.CFG_FTYPE) {
                retVal = cfgJson.CFG_FTYPE;
            }
        }
        return retVal;
    }
    get attributes(): SzSdkConfigAttr[] {
        let retVal = [];
        if(this._config && this._config.definition) {
            let cfgJson = (JSON.parse(this._config.definition) as SzSdkConfigJson).G2_CONFIG;
            if(cfgJson.CFG_ATTR) {
                retVal = cfgJson.CFG_ATTR;
            }
        }
        return retVal;
    }
    get attributeTypesByFeatureType(): Map<SzFeatureType, SzAttrClass | SzAttrClass[]> {
        let retVal: Map<SzFeatureType, SzAttrClass | SzAttrClass[]>;
        if(this._config && this._config.definition) {
            retVal = SzGrpcConfig.getFTypeToAttrClassMap(this.attributes);
        }
        return retVal;
    }
    get dataSources() {
        let retVal  = new Subject<SzSdkDataSource[]>();
        console.log(`get datasources from grpc...`);

        this.config.getDataSourceRegistry().then((configResp) => {
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
            //this.attrs                              = SzGrpcConfigManagerService.getAttrs(this._config);
            //this.featureTypes           = SzGrpcConfigManagerService.getFeatures(this._config);
        }
    }
    private static getFTypeToAttrClassMap(attrs: SzSdkConfigAttr[]): Map<SzFeatureType, SzAttrClass | SzAttrClass[]> {
        let expVal      = new Map<SzFeatureType, SzAttrClass[]>();
        let retVal      = new Map<SzFeatureType, SzAttrClass | SzAttrClass[]>();

        attrs.forEach((attr) => {
            let fTypeCode = attr.FTYPE_CODE ? attr.FTYPE_CODE as SzFeatureType : "OTHER" as SzFeatureType;
            let attrClass = attr.ATTR_CLASS;
            let _v = expVal.has(fTypeCode) ? expVal.get(fTypeCode) : [];
            if(!_v.includes(attrClass)) { _v.push(attr.ATTR_CLASS); }
            expVal.set(fTypeCode, _v);
            if(!attr.FTYPE_CODE){
                // add a separate entry where the "ATTR_CODE" is the key
                expVal.set(attr.ATTR_CODE as SzFeatureType, [attrClass]);
            }
            
        });
        // flatten array
        let entriesIterator = expVal.entries();
        for(const [key, values] of entriesIterator) {
            let _v = values && values.length == 1 ? values[0]: values;
            retVal.set(key, _v);
        }
        return retVal;
    }
}