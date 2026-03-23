/**
 * @fileoverview TranslationService — i18n wrapper
 * @description Loads JSON translation files and provides instant() lookup via Signals
 * @module core/services
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';

/**
 * The supported languages of the application.
 * Expressed as a union type of string literals — TypeScript will flag
 * any typo like `'de'` vs. `'deu'` at compile time.
 */
export type Language = 'de' | 'en';

/**
 * A single translation value is either a plain string (leaf node)
 * or a nested object with more translations (branch node).
 * This recursive definition allows arbitrary nesting in JSON translation files.
 */
type TranslationValue = string | TranslationObject;

/**
 * Represents the structure of a translation JSON file.
 * An index signature `[key: string]: TranslationValue` means the object
 * can have any string key, mapped to either a string or another nested object.
 *
 * Example structure matching `de.json`:
 * ```json
 * { "nav": { "about": "Über mich" }, "hero": { "greeting": "Hallo" } }
 * ```
 */
interface TranslationObject {
  [key: string]: TranslationValue;
}

/**
 * Service for loading and accessing i18n (internationalization) translations.
 *
 * @description
 * Translations are stored as JSON files in `/public/i18n/` (e.g. `de.json`, `en.json`).
 * On initialization, German is loaded automatically. Calling `use('en')` switches language.
 *
 * **Dot-notation key lookup:**
 * Translations are accessed via dot-notation strings like `'nav.about'` or `'hero.greeting'`.
 * The `instant()` method walks the nested translation object to find the value.
 *
 * **Signals used:**
 * - `translations` (private) — the raw loaded JSON object
 * - `currentLang`  (public)  — the currently active language code
 * - `isLoaded`     (public)  — indicates whether the JSON file has been fetched
 *
 * @example
 * private t = inject(TranslationService);
 *
 * // Switch to English:
 * this.t.use('en');
 *
 * // Get a translation string:
 * const label = this.t.instant('nav.about'); // 'About' or 'Über mich'
 *
 * // Check if translations are ready:
 * if (this.t.isLoaded()) { ... }
 */
@Injectable({ providedIn: 'root' })
export class TranslationService {
  /**
   * Angular's `HttpClient` service for making HTTP GET requests.
   * Injected with the modern `inject()` function instead of constructor parameter syntax.
   * Used to fetch `/i18n/de.json` or `/i18n/en.json` from the public folder.
   */
  private http = inject(HttpClient);

  /**
   * The loaded translation data — the parsed content of the active language's JSON file.
   * Private because components should only access translations via `instant()`, not the raw object.
   * Initialized as an empty object `{}` until the first HTTP request completes.
   */
  private translations = signal<TranslationObject>({});

  /**
   * The currently selected language code.
   * Public so components can read it (e.g. to mark the active language button).
   * Use `use(lang)` to change it — do not call `.set()` externally.
   */
  readonly currentLang = signal<Language>('de');

  /**
   * Indicates whether the translation JSON has finished loading.
   * Set to `false` at the start of each `use()` call, then `true` when the HTTP
   * request completes (or fails). Use this to show loading indicators or delay rendering.
   */
  readonly isLoaded = signal<boolean>(false);

  /**
   * Triggers the initial German translation load on service creation.
   * The constructor runs once when the service is first injected.
   * German is the default language — the HTTP request fires asynchronously.
   */
  constructor() {
    this.loadTranslations('de');
  }

  /**
   * Switches the active language and loads the corresponding translation file.
   *
   * Steps:
   * 1. Updates `currentLang` signal immediately (UI can react)
   * 2. Sets `isLoaded` to `false` (signals a loading state to consumers)
   * 3. Triggers an HTTP GET for the new language's JSON file
   *
   * @param lang - The target language to switch to (`'de'` or `'en'`)
   *
   * @example
   * // On user clicking the language toggle button:
   * this.translationService.use('en');
   */
  use(lang: Language): void {
    this.currentLang.set(lang);
    this.isLoaded.set(false);
    this.loadTranslations(lang);
  }

  /**
   * Returns the translated string for the given dot-notation key.
   *
   * "instant" means synchronous — it reads from the already-loaded `translations` signal.
   * If the key is not found (missing translation or typo), the key itself is returned
   * as a fallback so broken UI is immediately visible during development.
   *
   * @param key - A dot-notation path into the translation object (e.g. `'nav.about'`)
   * @returns The translated string, or the key itself as a fallback
   *
   * @example
   * this.instant('hero.greeting') // → 'Hallo, ich bin' (de) or 'Hi, I am' (en)
   * this.instant('unknown.key')   // → 'unknown.key' (fallback)
   */
  instant(key: string): string {
    return this.resolveKey(this.translations(), key);
  }

  /**
   * Fetches the translation JSON file for the given language via HTTP GET.
   *
   * The template literal `` `/i18n/${lang}.json` `` builds the URL dynamically.
   * `HttpClient.get<T>()` returns an `Observable<T>` — a lazy, asynchronous data stream.
   * `.subscribe()` starts the request and handles the two outcomes:
   * - `next(data)` — request succeeded: store the translations and mark as loaded
   * - `error()`    — request failed (e.g. network error): still mark as loaded so the
   *                  UI doesn't stay stuck in a loading state
   *
   * @param lang - The language whose JSON file should be fetched
   */
  private loadTranslations(lang: Language): void {
    this.http.get<TranslationObject>(`/i18n/${lang}.json`).subscribe({
      next: (data) => {
        this.translations.set(data);
        this.isLoaded.set(true);
      },
      error: () => this.isLoaded.set(true),
    });
  }

  /**
   * Recursively walks a translation object using a dot-notation key to find the value.
   *
   * Algorithm:
   * 1. `key.split('.')` splits `'nav.about'` into `['nav', 'about']`
   * 2. Iterates through the parts, drilling into nested objects at each step
   * 3. If any step hits a non-object or missing key, returns the original key as fallback
   * 4. Returns the value only if it ends up as a `string` (not an intermediate object)
   *
   * @param obj - The translation object (or sub-object) to search in
   * @param key - The dot-notation key to resolve (e.g. `'nav.about'`)
   * @returns The translated string, or the original `key` if not found
   */
  private resolveKey(obj: TranslationObject, key: string): string {
    const parts = key.split('.');
    let current: TranslationValue = obj;

    for (const part of parts) {
      if (typeof current !== 'object' || current === null) return key;
      current = (current as TranslationObject)[part];
    }

    return typeof current === 'string' ? current : key;
  }
}
