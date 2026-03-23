/**
 * @fileoverview ThemeService — Dark/Light/Auto mode management
 * @description Manages theme with localStorage persistence and manifest switching
 * @module core/services
 */

import { computed, effect, Injectable, signal } from '@angular/core';

/**
 * The three possible user-facing theme selections.
 * - `'light'` — always light, regardless of OS setting
 * - `'dark'`  — always dark, regardless of OS setting
 * - `'auto'`  — follows the OS `prefers-color-scheme` media query
 */
export type Theme = 'light' | 'dark' | 'auto';

/**
 * The resolved (actual) theme after `'auto'` has been evaluated against the OS setting.
 * Always strictly `'light'` or `'dark'` — never `'auto'`.
 * This is the value used for DOM attributes, CSS variables, and manifest URLs.
 */
export type ResolvedTheme = 'light' | 'dark';

/**
 * The localStorage key used to persist the user's theme choice.
 * Defined as a module-level `const` so it is never accidentally changed at runtime
 * and is easy to update in one place if the key ever needs to change.
 */
const THEME_STORAGE_KEY = 'dev2k-theme';

/**
 * Service responsible for managing the application's visual theme.
 *
 * @description
 * Handles three theme modes:
 * - `light` — always light
 * - `dark`  — always dark
 * - `auto`  — follows the OS `prefers-color-scheme` media query in real time
 *
 * On every theme change, the service performs three side effects via Angular's `effect()`:
 * 1. Sets `data-theme="light|dark"` on `<html>` (SCSS uses this for CSS custom property switching)
 * 2. Saves the raw user preference to `localStorage` (persists across browser sessions)
 * 3. Switches `<link rel="manifest">` to the correct themed PWA manifest file
 *
 * **Angular Signals used:**
 * - `currentTheme` — `WritableSignal<Theme>`: the raw user selection (can be 'auto')
 * - `activeTheme`  — `ComputedSignal<ResolvedTheme>`: derived, always 'light' or 'dark'
 *
 * `providedIn: 'root'` tells Angular to create exactly one instance for the whole app
 * (singleton). All components share the same service and therefore the same state.
 *
 * @example
 * // Inject the service anywhere in the app:
 * private themeService = inject(ThemeService);
 *
 * // Read the resolved theme (call signal like a function):
 * const theme = this.themeService.activeTheme(); // 'light' | 'dark'
 *
 * // Toggle between light and dark:
 * this.themeService.toggleTheme();
 *
 * // Explicitly set a theme:
 * this.themeService.setTheme('auto');
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  /**
   * The raw theme preference selected by the user.
   *
   * `signal<T>(initialValue)` creates a reactive value container (a "signal").
   * - Reading: `this.currentTheme()` — note the call syntax `()`
   * - Writing: `this.currentTheme.set('dark')` or `this.currentTheme.update(v => ...)`
   *
   * Initialized by `getInitialTheme()` which reads localStorage before the constructor runs.
   * This stores what the USER explicitly chose — `'auto'` is valid here.
   * Use `activeTheme()` when you need the actual theme to apply to the UI.
   */
  readonly currentTheme = signal<Theme>(this.getInitialTheme());

  /**
   * The actual resolved theme applied to the UI.
   *
   * `computed<T>(() => ...)` creates a derived, read-only signal that automatically
   * recalculates whenever any signals it reads inside change.
   * There is no `.set()` method — it is always derived from `currentTheme()`.
   *
   * Behavior:
   * - `currentTheme()` is `'light'` or `'dark'` → returns it directly
   * - `currentTheme()` is `'auto'` → calls `getSystemTheme()` and returns `'light'` or `'dark'`
   */
  readonly activeTheme = computed<ResolvedTheme>(() => this.resolveTheme(this.currentTheme()));

  /**
   * Angular calls the constructor once when the service is first injected anywhere.
   * At this point `currentTheme` is already initialized (field initializer runs first).
   *
   * The constructor delegates setup to private methods to keep it clean and testable:
   * 1. `setupSideEffects()` — registers the reactive `effect()` for DOM/storage/manifest updates
   * 2. `watchSystemTheme()` — attaches an OS theme change listener for `'auto'` mode
   */
  constructor() {
    this.setupSideEffects();
    this.watchSystemTheme();
  }

  /**
   * Sets the theme to a specific value.
   *
   * Calling `signal.set()` updates the signal value and synchronously notifies
   * all `computed()` and `effect()` dependencies.
   *
   * @param theme - The desired theme: `'light'`, `'dark'`, or `'auto'`
   *
   * @example
   * this.themeService.setTheme('dark');
   * // → currentTheme() === 'dark'
   * // → activeTheme() === 'dark'
   * // → <html data-theme="dark"> (via effect)
   */
  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
  }

  /**
   * Toggles between `'light'` and `'dark'` themes.
   *
   * Reads `activeTheme()` (the resolved value, never `'auto'`) so that when the
   * user is in `'auto'` mode and clicks the toggle, the OS-resolved theme is used
   * to determine the next state. After toggling, a concrete value is set — so
   * `'auto'` mode ends and the user's explicit choice takes precedence.
   *
   * @example
   * // OS is dark, user chose 'auto' → activeTheme() === 'dark'
   * this.themeService.toggleTheme(); // → sets 'light'
   */
  toggleTheme(): void {
    const next: Theme = this.activeTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(next);
  }

  /**
   * Registers an Angular `effect()` that re-runs whenever `activeTheme()` changes.
   *
   * **What is `effect()`?**
   * `effect()` is Angular's mechanism for reactive side effects — code that should
   * run as a consequence of signal changes (like updating the DOM, calling an API,
   * or writing to storage). It automatically tracks which signals are read inside it.
   * This is conceptually similar to `useEffect` in React or `watchEffect` in Vue.
   *
   * **Why a private method instead of inline in the constructor?**
   * Separation of concerns: the constructor shows *what* is set up, private methods
   * show *how*. This makes the class easier to read, test, and extend.
   */
  private setupSideEffects(): void {
    effect(() => {
      const resolved = this.activeTheme();
      this.applyThemeToDOM(resolved);
      this.saveToStorage(this.currentTheme());
      this.updateManifestLink(resolved);
    });
  }

  /**
   * Reads the persisted theme preference from `localStorage` on app startup.
   * This is called during **field initialization** (before the constructor body runs)
   * as the initial value for the `currentTheme` signal.
   *
   * **SSR Guard:** `typeof localStorage === 'undefined'` prevents a crash in
   * server-side rendering environments where the `localStorage` API does not exist.
   *
   * **Validation:** Uses `isValidTheme()` to reject corrupted or outdated stored values.
   * Falls back to `'auto'` as the safest default.
   *
   * @returns The previously saved `Theme`, or `'auto'` if nothing valid is stored
   */
  private getInitialTheme(): Theme {
    if (typeof localStorage === 'undefined') return 'auto';
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return this.isValidTheme(stored) ? stored : 'auto';
  }

  /**
   * TypeScript **type guard** that narrows `string | null` to the `Theme` union type.
   *
   * **What is a type guard?**
   * A function with the return type `value is Theme` tells TypeScript:
   * "if this function returns `true`, treat `value` as type `Theme` from this point on."
   * Without this, `getInitialTheme()` could not assign the localStorage string to a
   * `Theme` variable without an unsafe `as Theme` cast.
   *
   * @param value - Any raw string from localStorage (may be `null` or an unexpected value)
   * @returns `true` if `value` is exactly `'light'`, `'dark'`, or `'auto'`
   */
  private isValidTheme(value: string | null): value is Theme {
    return value === 'light' || value === 'dark' || value === 'auto';
  }

  /**
   * Resolves a raw `Theme` to the actual `ResolvedTheme` to be applied.
   * This is the core logic called inside the `activeTheme` computed signal.
   *
   * @param theme - The raw theme value to resolve
   * @returns `'light'` or `'dark'` — never `'auto'`
   */
  private resolveTheme(theme: Theme): ResolvedTheme {
    return theme === 'auto' ? this.getSystemTheme() : theme;
  }

  /**
   * Reads the operating system's preferred color scheme using the CSS Media Queries API:
   * `window.matchMedia('(prefers-color-scheme: dark)').
   *
   * `.matches` returns `true` if the OS is currently in dark mode.
   *
   * **Guards against:**
   * - SSR: `typeof window === 'undefined'` → returns `'light'` as safe server default
   * - JSDOM in unit tests: `!window.matchMedia` → returns `'light'` unless polyfilled
   *
   * @returns `'dark'` if the OS prefers dark mode, `'light'` otherwise
   */
  private getSystemTheme(): ResolvedTheme {
    if (typeof window === 'undefined' || !window.matchMedia) return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * Applies the resolved theme to the DOM by setting the `data-theme` HTML attribute
   * on the root `<html>` element (`document.documentElement`).
   *
   * Our `styles.scss` uses `[data-theme="dark"]` CSS attribute selectors to switch
   * CSS custom property values (color tokens), affecting the entire page.
   * Example: `[data-theme="dark"] { --color-bg: #1a1a2e; }`
   *
   * @param theme - The resolved theme to write to the DOM attribute
   */
  private applyThemeToDOM(theme: ResolvedTheme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }

  /**
   * Persists the raw (user-selected) theme to `localStorage`.
   *
   * Saves the **raw** `Theme` (not the resolved `ResolvedTheme`) so that the
   * `'auto'` preference is correctly preserved — if we saved `'dark'` (the
   * resolved value) instead, the user would lose their `'auto'` setting.
   *
   * @param theme - The raw theme value to save (`'light'`, `'dark'`, or `'auto'`)
   */
  private saveToStorage(theme: Theme): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }

  /**
   * Updates the `<link rel="manifest">` element's `href` to select the correct
   * themed PWA Web App Manifest file.
   *
   * Two manifest files exist in `/public/`:
   * - `/manifest-dark.webmanifest`  — dark background color for the install banner
   * - `/manifest-light.webmanifest` — light background color for the install banner
   *
   * `document.querySelector<HTMLLinkElement>()` uses a TypeScript generic to tell
   * the compiler the result is an `HTMLLinkElement`, enabling type-safe `.href` access.
   *
   * @param theme - The resolved theme to select the appropriate manifest file
   */
  private updateManifestLink(theme: ResolvedTheme): void {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (link) {
      link.href = theme === 'dark' ? '/manifest-dark.webmanifest' : '/manifest-light.webmanifest';
    }
  }

  /**
   * Attaches a listener to the `(prefers-color-scheme: dark)` media query event
   * so the app responds immediately when the user switches OS theme (no reload needed).
   *
   * Only runs in browser environments where `matchMedia` is available.
   * In SSR or JSDOM (without polyfill), this method returns early.
   */
  private watchSystemTheme(): void {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', this.onSystemThemeChange);
  }

  /**
   * Handles OS theme change events. Stored as an **arrow function class field**
   * instead of a regular method to preserve the correct `this` context.
   *
   * **Why arrow function instead of a regular method?**
   * When you pass a regular method as a callback to `addEventListener`, the browser
   * invokes it without the class context — `this` becomes `undefined` in strict mode.
   * Arrow functions capture `this` lexically (from where they are *defined*, the class
   * instance), ensuring `this.currentTheme()` and `this.applyThemeToDOM()` work correctly.
   *
   * Only triggers a DOM update when `currentTheme()` is `'auto'` to ensure explicit
   * user preferences (`'light'` / `'dark'`) are never silently overridden by OS changes.
   */
  private onSystemThemeChange = (): void => {
    if (this.currentTheme() === 'auto') {
      this.applyThemeToDOM(this.getSystemTheme());
    }
  };
}
