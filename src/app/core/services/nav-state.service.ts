/**
 * @fileoverview NavStateService — Mobile navigation menu state
 * @description Manages mobile menu open/close state via Signals
 * @module core/services
 */

import { computed, Injectable, signal } from '@angular/core';

/**
 * Service for managing the mobile navigation menu's open/closed state.
 *
 * @description
 * On mobile viewports, the navigation links are hidden behind a hamburger button.
 * This service holds and controls the boolean state of that menu.
 *
 * **Signal design pattern used here:**
 * - `menuOpen` is `private` — only this service can change the state (encapsulation).
 * - `isMenuOpen` is `public readonly` — components can *read* the state but not mutate it directly.
 * - Public methods (`openMenu`, `closeMenu`, `toggleMenu`) are the only way to change state.
 *
 * This is the same concept as **encapsulation** in OOP: hide the internal data,
 * expose controlled operations. Signals make this pattern particularly clean.
 *
 * @example
 * private navState = inject(NavStateService);
 *
 * // In the template — read the computed signal:
 * // [class.is-open]="navState.isMenuOpen()"
 *
 * // On hamburger button click:
 * this.navState.toggleMenu();
 *
 * // Close menu when a nav link is clicked:
 * this.navState.closeMenu();
 */
@Injectable({ providedIn: 'root' })
export class NavStateService {
  /**
   * The internal state of the mobile menu.
   *
   * Declared as `private readonly` to enforce that only this service can mutate
   * the menu state — no component can call `menuOpen.set()` from outside.
   * `readonly` means the signal *reference* cannot be reassigned, but its *value*
   * can still be updated via `.set()` or `.update()`.
   *
   * Initialized to `false` — menu is closed by default on page load.
   */
  private readonly menuOpen = signal<boolean>(false);

  /**
   * Public read-only view of the menu state.
   *
   * A `computed()` signal that mirrors `menuOpen()`. Exposing a `computed()` instead
   * of the raw writable signal ensures consumers can only *read*, never *write* the value.
   *
   * Components bind to this in templates:
   * `@if (navState.isMenuOpen()) { ... }` or `[class.open]="navState.isMenuOpen()"`
   */
  readonly isMenuOpen = computed(() => this.menuOpen());

  /**
   * Opens the mobile navigation menu.
   *
   * `signal.set(value)` replaces the current signal value unconditionally.
   * Use this when you already know the exact new value.
   */
  openMenu(): void {
    this.menuOpen.set(true);
  }

  /**
   * Closes the mobile navigation menu.
   *
   * Called when: a navigation link is clicked, the overlay/backdrop is tapped,
   * or the user presses the Escape key.
   */
  closeMenu(): void {
    this.menuOpen.set(false);
  }

  /**
   * Toggles the menu between open and closed.
   *
   * `signal.update(fn)` is used instead of `signal.set()` when the new value depends
   * on the current value. The callback receives the current value (`open`) and returns
   * the next value. Equivalent to `this.menuOpen.set(!this.menuOpen())` but more idiomatic.
   *
   * Bound to the hamburger button click event in the header component.
   */
  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }
}
