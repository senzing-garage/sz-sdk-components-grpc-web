import { Component } from '@angular/core';
import { SzImportFileComponent } from '@senzing/sdk-components-grpc-web';
import { SzGrpcWebEnvironment } from '@senzing/sz-sdk-typescript-grpc-web';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  imports: [SzImportFileComponent, MatIconModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'import-files';
}
