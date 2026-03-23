/**
 * @fileoverview TranslationService — Unit Tests
 *
 * @description
 * Tests the i18n service which loads JSON files via HTTP and provides dot-notation key lookup.
 * HTTP calls are intercepted using Angular's `HttpTestingController` so no real network
 * requests are made — we control exactly what data is "returned" from the server.
 *
 * **Angular HTTP testing pattern used here:**
 * 1. Provide `provideHttpClient()` (the real HTTP client for the service)
 * 2. Provide `provideHttpClientTesting()` (replaces the transport layer with a mock)
 * 3. Inject `HttpTestingController` to intercept and respond to pending requests
 * 4. After each test, call `httpMock.verify()` to assert no unexpected requests were made
 *
 * **Key concept — flushing constructor requests:**
 * The `TranslationService` constructor calls `loadTranslations('de')` which fires an
 * HTTP GET immediately. In `beforeEach()`, we inject the service AND then immediately
 * flush (respond to) that pending request. This ensures tests start with translations loaded.
 *
 * @module core/services/tests
 */

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TranslationService } from './translation.service';

/** Top-level suite for `TranslationService`. */
describe('TranslationService', () => {
  let service: TranslationService;

  /**
   * `HttpTestingController` is Angular's HTTP mock controller.
   * It allows us to:
   * - `httpMock.expectOne(url)` — assert that exactly one request to `url` is pending
   * - `req.flush(data)` — respond to that request with the provided mock data
   * - `httpMock.verify()` — assert no unexpected or pending requests remain
   */
  let httpMock: HttpTestingController;

  /**
   * Minimal mock translation data used across tests.
   * Structured to match a subset of the real `de.json` and `en.json` files,
   * covering both simple keys (`hero.role`) and nested keys (`nav.about`).
   */
  const mockTranslationsDe = {
    nav: { about: 'Über mich', projects: 'Projekte', contact: 'Kontakt' },
    hero: { greeting: 'Hallo, ich bin', role: 'Software Developer' },
  };

  const mockTranslationsEn = {
    nav: { about: 'About', projects: 'Projects', contact: 'Contact' },
    hero: { greeting: 'Hi, I am', role: 'Software Developer' },
  };

  /**
   * Before each test:
   * 1. Configure the test module with the real `HttpClient` and the testing interceptor
   * 2. Inject the service (this triggers the constructor → fires a GET to `/i18n/de.json`)
   * 3. Flush (respond to) that constructor-triggered request with German mock data
   *
   * After step 3, the service is ready: `isLoaded() === true`, translations are loaded.
   */
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TranslationService, provideHttpClient(), provideHttpClientTesting()],
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(TranslationService);

    /**
     * `httpMock.expectOne('/i18n/de.json')` does two things:
     * 1. Asserts that exactly one GET request to this URL is currently pending
     *    (fails the test if zero or more-than-one requests exist)
     * 2. Returns a `TestRequest` object we can respond to
     *
     * `.flush(mockTranslationsDe)` sends the mock JSON as the successful HTTP response.
     * After this, the `subscribe({ next: ... })` in `loadTranslations()` runs synchronously,
     * setting `translations` signal and `isLoaded` to `true`.
     */
    const req = httpMock.expectOne('/i18n/de.json');
    req.flush(mockTranslationsDe);
  });

  /**
   * `httpMock.verify()` after each test ensures:
   * - No unexpected HTTP requests were made
   * - No pending (un-flushed) requests remain
   * This prevents tests from silently ignoring extra network calls.
   */
  afterEach(() => httpMock.verify());

  /** Smoke test. */
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /** Verifies the default language is German (set in the class field initializer). */
  it('should default to "de" language', () => {
    expect(service.currentLang()).toBe('de');
  });

  /**
   * Verifies that after the constructor HTTP request is flushed (in `beforeEach`),
   * `isLoaded` is set to `true`. This confirms the `next` callback in `subscribe()` ran.
   */
  it('should set isLoaded to true after constructor load', () => {
    expect(service.isLoaded()).toBe(true);
  });

  /**
   * Tests for `instant()` — the synchronous key lookup method.
   * All translations are already loaded from `beforeEach`, so `instant()` reads
   * from the populated signal synchronously.
   */
  describe('instant()', () => {
    it('should return simple translation', () => {
      // 'hero.role' → `translations['hero']['role']` → 'Software Developer'
      expect(service.instant('hero.role')).toBe('Software Developer');
    });

    it('should return nested translation via dot notation', () => {
      // 'nav.about' → `translations['nav']['about']` → 'Über mich'
      expect(service.instant('nav.about')).toBe('Über mich');
    });

    it('should return key as fallback when key is not found', () => {
      // 'unknown.key' does not exist in the mock data → resolveKey() returns the key itself
      expect(service.instant('unknown.key')).toBe('unknown.key');
    });
  });

  /**
   * Tests for `use()` — the language switch method.
   * These tests must handle the HTTP request triggered by `use()` themselves
   * (unlike `beforeEach` which handles the constructor request).
   */
  describe('use()', () => {
    it('should switch to English and load EN translations', () => {
      // Act: switch to English — this fires a GET to /i18n/en.json
      service.use('en');

      // Assert immediate signal updates (synchronous, before HTTP response):
      expect(service.currentLang()).toBe('en'); // language switched immediately
      expect(service.isLoaded()).toBe(false); // loading started → set to false

      // Flush the pending EN request with mock data:
      const req = httpMock.expectOne('/i18n/en.json');
      req.flush(mockTranslationsEn);

      // Assert post-load state:
      expect(service.isLoaded()).toBe(true); // load complete
      expect(service.instant('nav.about')).toBe('About'); // new translations active
    });

    it('should set isLoaded to true even on HTTP error', () => {
      // Act: switch language and simulate a network failure
      service.use('en');

      const req = httpMock.expectOne('/i18n/en.json');
      // `req.error(new ProgressEvent('error'))` simulates a network-level error (not a 4xx/5xx)
      req.error(new ProgressEvent('error'));

      // Assert: the `error` callback in subscribe() must set isLoaded=true
      // so the UI doesn't get stuck in a permanent loading state
      expect(service.isLoaded()).toBe(true);
    });
  });
});
