import { Component, Inject, inject, OnDestroy, OnInit } from "@angular/core";
import { SzGrpcWebEnvironment, SzGrpcWebEnvironmentOptions } from "@senzing/sz-sdk-typescript-grpc-web";
import { Subject, take } from "rxjs";
import { SzGrpcProductService } from "../../services/grpc/product.service";
import { SzAdminService } from "../../services/sz-admin.service";

@Component({
    selector: 'sz-product-info',
    styleUrl: 'sz-product-info.component.scss',
    templateUrl: 'sz-product-info.component.html',
    providers:[
        { provide: SzGrpcProductService, useClass: SzGrpcProductService}
    ]
})
export class SzProductInfoComponent implements OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    public result: string | undefined;

    getVersion(event: MouseEvent) {
      console.log(`getting version from grpc...`);
      this.productService.getVersion().pipe(take(1)).subscribe((result) => {
        console.log(`got info`, result);
        this.result = JSON.stringify(result, undefined, 4);
      })
    }
    getRestVersion(event: MouseEvent) {
      console.log(`getting version from grpc...`);
      this.adminService.getVersionInfo().pipe(
        take(1)
      ).subscribe((result) => {
        console.log(`got info`, result);
        this.result = JSON.stringify(result, undefined, 4);
      })
    }
  
    getLicense(event: MouseEvent) {
      console.log(`getting license from grpc...`);
      this.productService.getLicense().pipe(take(1)).subscribe((result) => {
        console.log(`got info`, result);
        this.result = JSON.stringify(result, undefined, 4);
      })
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
      private productService: SzGrpcProductService,
      private adminService: SzAdminService
    ) {

    }
    
    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }
}