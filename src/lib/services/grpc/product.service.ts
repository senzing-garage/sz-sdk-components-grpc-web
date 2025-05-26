import { Inject, Injectable, signal } from '@angular/core';
import { SzGrpcWebEnvironment, SzGrpcWebEnvironmentOptions } from '@senzing/sz-sdk-typescript-grpc-web';
import { Observable, Subject } from 'rxjs';
import { SzProductLicenseResponse, SzProductVersionResponse } from 'src/lib/models/grpc/product';

@Injectable({
  providedIn: 'root'
})
export class SzGrpcProductService {
  public "PRODUCT_NAME" = signal(undefined);
  public "VERSION" = signal(undefined)
  public "BUILD_VERSION" = signal(undefined)
  public "BUILD_DATE" = signal(undefined)
  public "BUILD_NUMBER" = signal(undefined)
  public "COMPATIBILITY_VERSION" = signal<{
    "CONFIG_VERSION": string
  }>(undefined);
  public "SCHEMA_VERSION" = signal<{
    "ENGINE_SCHEMA_VERSION": string,
    "MINIMUM_REQUIRED_SCHEMA_VERSION": string,
    "MAXIMUM_REQUIRED_SCHEMA_VERSION": string
  }>(undefined);
  public "LICENSE" = signal<{
    "customer"?: string,
    "contract"?: string,
    "issueDate"?: string,
    "licenseType"?: string,
    "licenseLevel"?: string,
    "billing"?: string,
    "expireDate"?: string,
    "recordLimit"?: string
  }>({});

  /**
   * Returns JSON document containing metadata about the Senzing Engine version being used.
   */
  getVersion() {
    let retVal = new Subject<SzProductVersionResponse>();
    console.log(`getting version from grpc...`);
    if(this.szEnvironment && this.szEnvironment.product) {
      this.szEnvironment?.product?.getVersion().then((resp) => {
        if(resp && resp['PRODUCT_NAME']) this.PRODUCT_NAME.set(resp['PRODUCT_NAME']);
        if(resp && resp['VERSION']) this.VERSION.set(resp['VERSION']);
        if(resp && resp['BUILD_VERSION']) this.BUILD_VERSION.set(resp['BUILD_VERSION']);
        if(resp && resp['BUILD_DATE']) this.BUILD_DATE.set(resp['BUILD_DATE']);
        if(resp && resp['BUILD_NUMBER']) this.BUILD_NUMBER.set(resp['BUILD_NUMBER']);
        if(resp && resp['COMPATIBILITY_VERSION']) this.COMPATIBILITY_VERSION.set({CONFIG_VERSION: resp['COMPATIBILITY_VERSION']});
        if(resp && resp['SCHEMA_VERSION']){
          if(!this.SCHEMA_VERSION) this.SCHEMA_VERSION.set({
            ENGINE_SCHEMA_VERSION: resp['SCHEMA_VERSION']['ENGINE_SCHEMA_VERSION'],
            MINIMUM_REQUIRED_SCHEMA_VERSION: resp['SCHEMA_VERSION']['MINIMUM_REQUIRED_SCHEMA_VERSION'],
            MAXIMUM_REQUIRED_SCHEMA_VERSION: resp['SCHEMA_VERSION']['MAXIMUM_REQUIRED_SCHEMA_VERSION']
          });
        }
        retVal.next(resp as SzProductVersionResponse);
      }).catch((err)=>{ retVal.error(err); })
    } else {
      retVal.error(`could not access product class`)
    }
    return retVal;
  }

  /**
   * Returns JSON document containing Senzing license metadata.
   */
  getLicense() {
    let retVal = new Subject<SzProductLicenseResponse>();
    console.log(`getting license from grpc...`);
    if(this.szEnvironment && this.szEnvironment.product) {
      this.szEnvironment?.product?.getLicense().then((resp) => {
        let _LICENSE: { [key: string]: any; } = {};
        if(resp && resp['customer']) _LICENSE['customer'] = resp['customer'];
        if(resp && resp['contract']) _LICENSE['contract'] = resp['contract'];
        if(resp && resp['issueDate']) _LICENSE['issueDate'] = resp['issueDate'];
        if(resp && resp['licenseType']) _LICENSE['licenseType'] = resp['licenseType'];
        if(resp && resp['licenseLevel']) _LICENSE['licenseLevel'] = resp['licenseLevel'];
        if(resp && resp['billing']) _LICENSE['billing'] = resp['billing'];
        if(resp && resp['expireDate']) _LICENSE['expireDate'] = resp['expireDate'];
        if(_LICENSE && Object.keys(_LICENSE).length > 0) {
          this.LICENSE.set(_LICENSE);
        }
        retVal.next(resp as SzProductLicenseResponse);
      }).catch((err)=>{ retVal.error(err); })
    } else {
      retVal.error(`could not access product class`)
    }
    return retVal;
  }

  constructor(
    // Make recaptchaContainerId an injection token
    @Inject('GRPC_ENVIRONMENT') private szEnvironment: SzGrpcWebEnvironment
  ) { 

  }
}
