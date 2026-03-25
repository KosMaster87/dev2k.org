/**
 * @fileoverview FooterComponent — site footer
 * @description Displays copyright, legal links, and back-to-top button
 * @module layout/footer
 */
import { Component, inject } from '@angular/core';

import { ScrollService } from '../../core/services/scroll.service';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  private scrollService = inject(ScrollService);
  private translationService = inject(TranslationService);

  protected readonly currentYear = new Date().getFullYear();

  /**
   * Returns the translated string for the given dot-notation key.
   * @param key - Dot-notation translation key (e.g. 'footer.imprint')
   * @returns Translated string or key if not found
   */
  translate(key: string): string {
    return this.translationService.instant(key);
  }

  /**
   * Scrolls back to the top of the page.
   */
  scrollToTop(): void {
    this.scrollService.scrollToTop();
  }
}
