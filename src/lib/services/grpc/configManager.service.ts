import { Inject, Injectable, signal } from '@angular/core';
import { SzGrpcWebConfig, SzGrpcWebEnvironment, SzGrpcWebEnvironmentOptions } from '@senzing/sz-sdk-typescript-grpc-web';
import { Observable, Subject, take, takeUntil } from 'rxjs';
import { SzProductLicenseResponse, SzProductVersionResponse } from '../../../lib/models/grpc/product';
import { SzGrpcConfig } from './config';

@Injectable({
  providedIn: 'root'
})
export class SzGrpcConfigManagerService {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    public defaultConfigId  = signal<number>(undefined);
    private _config: SzGrpcConfig;

    get config(): Promise<SzGrpcConfig> {
        let retVal = new Promise<SzGrpcConfig>((resolve, reject)=>{
            if(!this._config) {
                this.szEnvironment?.configManager?.getDefaultConfigId().then((resp: number) => {
                    this.defaultConfigId.set(resp);
                    this.createConfig(this.defaultConfigId()).pipe(
                        take(1),
                        takeUntil(this.unsubscribe$)
                    ).subscribe((conf)=>{
                        this._config = conf;
                        resolve(this._config);
                    });
                });
            } else {
                resolve(this._config);
            }
        })
        return retVal;
    }

    public getDefaultConfigId(): Subject<number> {
        let retVal = new Subject<number>();
        console.log(`getting default configid from grpc...`);
        if(this.szEnvironment && this.szEnvironment.configManager) {
          this.szEnvironment?.configManager?.getDefaultConfigId().then((resp: number) => {
            this.defaultConfigId.set(resp);
            retVal.next(resp);
          }).catch((err)=>{ retVal.error(err); })
        } else {
          retVal.error(`could not access configManager class`)
        }
        return retVal;
    }
    public createConfig();
    public createConfig(configId: number)
    public createConfig(configId?: number) {
        let retVal = new Subject<SzGrpcConfig>();
        if(this.szEnvironment && this.szEnvironment.configManager) {
            this.szEnvironment?.configManager?.createConfig(configId).then((conf) => {
                this._config = new SzGrpcConfig(conf);
                retVal.next(this._config);
            }).catch((err)=>{ retVal.error(err); })
        } else {
          retVal.error(`could not access configManager class`)
        }
        return retVal;
    }
    public registerConfig(configDefinition: string, comment?: string) {
        let retVal = new Subject<number>();
        if(this.szEnvironment && this.szEnvironment.configManager) {
            this.szEnvironment?.configManager.registerConfig(configDefinition, comment).then((resp) => {
                retVal.next(resp);
            }).catch((err)=>{ retVal.error(err); })
        } else {
          retVal.error(`could not access configManager class`)
        }
        return retVal;
    }
    public setDefaultConfig(configDefinition: string);
    public setDefaultConfig(configDefinition: string, comment: string);
    public setDefaultConfig(configDefinition: string, comment?: string) {
        let retVal = new Subject<number>();
        if(this.szEnvironment && this.szEnvironment.configManager) {
            this.szEnvironment?.configManager.setDefaultConfig(configDefinition, comment).then((resp) => {
                retVal.next(resp);
            }).catch((err)=>{ retVal.error(err); })
        } else {
          retVal.error(`could not access configManager class`)
        }
        return retVal;
    }
    public replaceDefaultConfigId(currentDefaultConfigId: number, newDefaultConfigId: number) {
        let retVal = new Subject<string>();
        if(this.szEnvironment && this.szEnvironment.configManager) {
            this.szEnvironment?.configManager.replaceDefaultConfigId(currentDefaultConfigId, newDefaultConfigId).then((resp) => {
                retVal.next(resp);
            }).catch((err)=>{ retVal.error(err); })
        } else {
          retVal.error(`could not access configManager class`)
        }
        return retVal;
    }
    constructor(
        // Make GRPC Environment an injection token
        @Inject('GRPC_ENVIRONMENT') private szEnvironment: SzGrpcWebEnvironment
    ) {

    }
}