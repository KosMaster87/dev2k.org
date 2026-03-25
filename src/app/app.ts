import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '@layout/footer/footer.component';
import { HeaderComponent } from '@layout/header/header.component';

@Component({
  selector: 'app-root',
  imports: [HeaderComponent, FooterComponent, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('dev2k-page');
}
