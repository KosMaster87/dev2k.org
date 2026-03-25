/**
 * @fileoverview ImprintComponent — Impressum-Pflichtseite (/impressum)
 * @description Standalone legal page, kein Layout-Wrapper nötig
 */
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-imprint',
  imports: [RouterLink],
  templateUrl: './imprint.component.html',
  styleUrl: './imprint.component.scss',
})
export class ImprintComponent {}
