import { Routes } from '@angular/router';
import { ImprintComponent } from '@layout/legal/imprint/imprint.component';
import { PrivacyComponent } from '@layout/legal/privacy/privacy.component';

export const routes: Routes = [
  { path: 'imprint', component: ImprintComponent },
  { path: 'privacy', component: PrivacyComponent },
  { path: '**', redirectTo: '' },
];
