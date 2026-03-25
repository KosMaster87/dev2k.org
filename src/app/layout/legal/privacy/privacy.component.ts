/**
 * @fileoverview PrivacyComponent — Datenschutz-Pflichtseite (/datenschutz)
 * @description Standalone legal page, kein Layout-Wrapper nötig
 */
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy',
  imports: [RouterLink],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss',
})
export class PrivacyComponent {}
