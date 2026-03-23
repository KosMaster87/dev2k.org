/**
 * @fileoverview ScrollService — Smooth scroll navigation
 * @description Provides fragment scroll and back-to-top functionality for One-Pager nav
 * @module core/services
 */

import { Injectable } from '@angular/core';

/**
 * Service for handling smooth scroll navigation in the one-page portfolio layout.
 *
 * @description
 * Since the portfolio is a **single-page application** (no route changes between sections),
 * standard Angular `RouterLink` fragment navigation would cause a page reload.
 * Instead, this service uses the native browser scroll APIs to animate transitions.
 *
 * **Two methods provided:**
 * - `scrollToFragment()` — scrolls to any section by its HTML `id` attribute
 * - `scrollToTop()`    — scrolls back to the very top of the page (for the logo click)
 *
 * @example
 * private scrollService = inject(ScrollService);
 *
 * // Scroll to the <section id="projects"> element:
 * this.scrollService.scrollToFragment('projects');
 *
 * // Scroll back to top (e.g. logo click):
 * this.scrollService.scrollToTop();
 */
@Injectable({ providedIn: 'root' })
export class ScrollService {
  /**
   * Smoothly scrolls the page to the element with the given `id`.
   *
   * Uses `document.getElementById()` to find the target element — this is the
   * standard browser API for finding elements by their `id` attribute.
   *
   * `el.scrollIntoView()` is a native browser method that scrolls the element
   * into the visible area of the viewport.
   * - `behavior: 'smooth'` — animates the scroll instead of jumping instantly
   * - `block: 'start'`     — aligns the top of the element with the viewport top
   *
   * The `if (el)` guard prevents a `TypeError` if the fragment doesn't exist in the DOM.
   *
   * @param fragment - The HTML `id` of the target section (e.g. `'about'`, `'projects'`)
   *
   * @example
   * // Navigates to <section id="contact">...</section>
   * this.scrollService.scrollToFragment('contact');
   */
  scrollToFragment(fragment: string): void {
    const el = document.getElementById(fragment);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Smoothly scrolls the page back to the very top (coordinate `top: 0`).
   *
   * `window.scrollTo()` is the native browser API for programmatic scrolling.
   * Passing an object `{ top: 0, behavior: 'smooth' }` uses the ScrollToOptions API
   * which enables smooth animation. Passing just a number would jump instantly.
   *
   * Typically bound to the logo or a "back to top" button in the header.
   *
   * @example
   * // In a header component — scroll to top when logo is clicked:
   * onLogoClick(): void {
   *   this.scrollService.scrollToTop();
   * }
   */
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
