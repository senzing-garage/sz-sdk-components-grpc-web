import { Inject, Injectable } from '@angular/core';
import { SzGrpcWebEnvironment, SzGrpcWebEnvironmentOptions } from '@senzing/sz-sdk-typescript-grpc-web';

@Injectable({
  providedIn: 'root'
})
export class SzGrpcProductService { 
  getVersion() {
    console.log(`getting version from grpc...`);
    if(this.szEnvironment && this.szEnvironment.product) {
      return this.szEnvironment?.product?.getVersion();
    }
    return undefined;
  }

  getLicense() {
    console.log(`getting license from grpc...`);
    
    if(this.szEnvironment && this.szEnvironment.product) {
      return this.szEnvironment?.product?.getLicense();
    }
    return undefined;
  }

  constructor(
    // Make recaptchaContainerId an injection token
    @Inject('GRPC_ENVIRONMENT') private szEnvironment: SzGrpcWebEnvironment
  ) { 

  }
}
