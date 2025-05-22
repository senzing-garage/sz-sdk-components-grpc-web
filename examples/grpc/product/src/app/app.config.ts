import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { SzGrpcWebEnvironment } from '@senzing/sz-sdk-typescript-grpc-web';

const grpcSdkEnv = new SzGrpcWebEnvironment({
    connectionString: `http://localhost:8260/grpc`
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    {provide: 'GRPC_ENVIRONMENT', useValue: grpcSdkEnv}
  ]
};
