import { Component, Inject, inject, OnDestroy, OnInit } from "@angular/core";
import { SzGrpcWebEnvironment, SzGrpcWebEnvironmentOptions } from "@senzing/sz-sdk-typescript-grpc-web";
import { Subject } from "rxjs";
import { SzGrpcProductService } from "../../services/grpc/product.service";

@Component({
    selector: 'sz-product-info',
    styleUrl: 'sz-product-info.component.scss',
    templateUrl: 'sz-product-info.component.html',
    providers:[
        { provide: SzGrpcProductService, useClass: SzGrpcProductService}
    ]
})
export class SzProductInfoComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    //private szEnvironment: SzGrpcWebEnvironment | undefined;
    //private szProduct: SzGrpcWebProduct | undefined;
    //private szDiagnostic: SzGrpcWebDiagnostic | undefined;
    //private grpcParameters: SzGrpcWebEnvironmentOptions = {connectionString: `http://localhost:8260/grpc`}
    public result: string | undefined;

    getVersion(event: MouseEvent) {
      console.log(`getting version from grpc...`);
      this.productService.getVersion()?.then((result) => {
        console.log(`got info`, result);
        this.result = JSON.stringify(result, undefined, 4);
      })
      /*this.szEnvironment?.product?.getVersion().then((result) => {
        console.log(`got info`, result);
        this.result = JSON.stringify(result, undefined, 4);
      })*/
    }
  
    getLicense(event: MouseEvent) {
      console.log(`getting license from grpc...`);
      this.productService.getLicense()?.then((result) => {
        console.log(`got info`, result);
        this.result = JSON.stringify(result, undefined, 4);
      })
      /*this.szEnvironment?.product?.getLicense().then((result) => {
        console.log(`got info`, result);
        this.result = JSON.stringify(result, undefined, 4);
      })*/
    }
  
    getDataSources(event: MouseEvent) {
      console.log(`getting license from grpc...`);
      
      this.SdkEnvironment?.configManager.createConfig().then((config) => {
        console.log(`got config`, config.definition);
        config.getDataSources().then((dataSources: {DSRC_ID: number, DSRC_CODE: string}[]) => {
          console.log(`got datasources: `, dataSources);
          this.result = dataSources.map((ds)=> { return JSON.stringify(ds) })?.join('\n');
        })
      })
    }

    constructor(
      @Inject('GRPC_ENVIRONMENT') private SdkEnvironment: SzGrpcWebEnvironment,
      private productService: SzGrpcProductService
    ) {

    }

    ngOnInit(): void {    
        // set up grpc web product
        //this.szProduct    = new SzGrpcWebProduct(this.grpcParameters);
        //this.szDiagnostic = new SzGrpcWebDiagnostic(this.grpcParameters);

    }
    ngAfterInit(): void {

    }
    
    ngOnDestroy(): void {
        
    }
}