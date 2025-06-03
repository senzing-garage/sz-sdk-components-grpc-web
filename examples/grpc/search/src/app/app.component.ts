import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SzSearchGrpcComponent } from 'src/public-api';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SzSearchGrpcComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'search';
}
