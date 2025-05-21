import { Component } from "@angular/core";
import { SzGrpcWebClientAboutComponent } from "@senzing/sdk-grpc-web-client-ng";

@Component({
    selector: 'sz-product-info',
    styleUrl: 'sz-product-info.component.scss',
    templateUrl: 'sz-product-info.component.html',
    imports: [
        SzGrpcWebClientAboutComponent
    ]
})
export class SzProductInfoComponent {
      constructor() {

      }

}