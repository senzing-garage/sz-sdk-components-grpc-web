import { Component } from '@angular/core';
import { SzProductInfoComponent } from '@senzing/sdk-components-grpc-web';
import { SzGrpcWebEnvironment } from '@senzing/sz-sdk-typescript-grpc-web';

const grpcSdkEnv = new SzGrpcWebEnvironment({
    connectionString: `http://localhost:8260/grpc`
});

@Component({
  selector: 'app-root',
  imports: [SzProductInfoComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  /*providers: [
    {
      provide: 'GRPC_ENVIRONMENT',
      useValue: grpcSdkEnv
    }
  ]*/
})
export class AppComponent {
  title = 'product';
}
