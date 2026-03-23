/**
 * @fileoverview ThemeService — Unit Tests
 *
 * @description
 * Tests the ThemeService in isolation using Angular's `TestBed`.
 * All browser APIs (localStorage, matchMedia, DOM attributes) are replaced with
 * Vitest mock functions ("spies") so tests are fast, deterministic, and side-effect-free.
 *
 * **Key testing challenges and how they are solved here:**
 * - `window.matchMedia` does not exist in JSDOM → polyfilled with `Object.defineProperty`
 * - `document.querySelector` (manifest link) mocked to return a real `<link>` element
 * - `localStorage.getItem` intercepted via `vi.spyOn(Storage.prototype, 'getItem')`
 * - Service is re-created per test via `TestBed.inject()` + `TestBed.resetTestingModule()`
 *   because `getInitialTheme()` runs *during construction* — so the mock must be set up
 *   BEFORE `TestBed.inject()` is called.
 *
 * **Vitest vocabulary used here:**
 * - `vi.fn()` — creates a standalone mock function
 * - `vi.spyOn(obj, 'method')` — wraps an existing method with a spy (can observe calls)
 * - `.mockReturnValue(x)` — makes the spy return `x` on the next call(s)
 * - `.mockImplementation(fn)` — replaces the spy's implementation entirely
 * - `vi.restoreAllMocks()` — resets all spies to their original implementations
 *
 * @module core/services/tests
 */

import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ThemeService } from './theme.service';

/**
 * Top-level test suite for `ThemeService`.
 * Each nested `describe()` block maps to one method or logical behavior.
 * Test file structure mirrors the service class structure (same order of methods).
 */
describe('ThemeService', () => {
  let service: ThemeService;

  /**
   * Spy references are declared here (suite scope) so they can be:
   * - Configured in `beforeEach()` (set up what value they return)
   * - Used in `it()` assertions (verify they were called correctly)
   *
   * `ReturnType<typeof vi.spyOn>` is the TypeScript type for a Vitest spy.
   * Using `ReturnType<typeof ...>` instead of `any` keeps the code type-safe.
   */
  let localStorageGetSpy: ReturnType<typeof vi.spyOn>;
  let localStorageSetSpy: ReturnType<typeof vi.spyOn>;
  let setAttributeSpy: ReturnType<typeof vi.spyOn>;

  /**
   * Runs BEFORE EVERY SINGLE `it()` in this suite (and all nested `describe` blocks).
   * Sets up the browser API mocks so each test starts in a clean, controlled environment.
   * "Arrange" phase for the whole suite — individual tests may add more setup.
   */
  beforeEach(() => {
    /**
     * JSDOM (the fake browser used by Vitest) does not implement `window.matchMedia`.
     * Without this, the service constructor crashes with "matchMedia is not a function".
     *
     * `Object.defineProperty()` lets us add or override properties on any object.
     * - `writable: true` — allows subsequent tests to override this mock if needed
     * - `value: vi.fn().mockImplementation(...)` — returns an object with `.matches = false`
     *   (simulating: the system prefers light mode, since `matches` for dark-mode is false)
     * - `addEventListener` and `removeEventListener` are mocked as `vi.fn()` (no-op functions)
     *   because `watchSystemTheme()` calls `mq.addEventListener()`
     */
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    /**
     * The `updateManifestLink()` method calls `document.querySelector('link[rel="manifest"]')`.
     * In JSDOM, there is no such element in the document.
     * This mock returns a real `<link>` element so `.href = '...'` doesn't throw.
     * For any other selector, the real `querySelector` behavior is preserved (returns `null`).
     */
    vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
      if (selector === 'link[rel="manifest"]') return document.createElement('link');
      return null;
    });

    /**
     * Spy on `document.documentElement.setAttribute` to prevent real DOM mutations
     * and to allow verifying that `applyThemeToDOM()` was called.
     * `.mockImplementation(() => {})` replaces the implementation with a no-op.
     */
    setAttributeSpy = vi
      .spyOn(document.documentElement, 'setAttribute')
      .mockImplementation(() => {});

    /**
     * Spy on `Storage.prototype.getItem` to intercept ALL localStorage reads.
     * We spy on the *prototype* (not `window.localStorage` directly) because the service
     * uses `localStorage.getItem()` which goes through the prototype chain.
     * Test-specific return values are set in each `it()` or nested `beforeEach()` via `.mockReturnValue()`.
     */
    localStorageGetSpy = vi.spyOn(Storage.prototype, 'getItem');

    /** Spy on `setItem` to verify theme is persisted (used in some assertions). */
    localStorageSetSpy = vi.spyOn(Storage.prototype, 'setItem');
  });

  /**
   * Runs AFTER EVERY `it()` to clean up mocks and the Angular testing environment.
   *
   * `vi.restoreAllMocks()` — resets all spies to their real implementation.
   *   Without this, mock state leaks between tests, causing false positives/negatives.
   *
   * `TestBed.resetTestingModule()` — destroys the current Angular module and all injected
   *   services. Without this, the same `ThemeService` instance would be reused across
   *   tests, making them order-dependent and unreliable.
   */
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  /**
   * Smoke test: verifies that Angular's dependency injection (DI) can successfully
   * instantiate the service without runtime errors.
   * `toBeTruthy()` passes for any non-null, non-undefined, non-zero, non-empty value.
   */
  it('should be created', () => {
    localStorageGetSpy.mockReturnValue(null); // empty storage = default 'auto' theme
    service = TestBed.inject(ThemeService);
    expect(service).toBeTruthy();
  });

  /**
   * Tests for the private `getInitialTheme()` method.
   *
   * This method is called during **field initialization** (before the constructor body),
   * so we must configure the `localStorageGetSpy` BEFORE calling `TestBed.inject()`.
   * That's why there is no shared `service` creation in an outer `beforeEach()` here.
   *
   * Pattern: Arrange (spy setup) → Act (inject service) → Assert (check signal value)
   */
  describe('getInitialTheme()', () => {
    it('should default to "auto" when localStorage is empty', () => {
      // Arrange: simulate empty storage — getItem returns null
      localStorageGetSpy.mockReturnValue(null);
      // Act: inject — constructor runs → getInitialTheme() → reads localStorage
      service = TestBed.inject(ThemeService);
      // Assert: read the signal value by calling it as a function: signal()
      expect(service.currentTheme()).toBe('auto');
    });

    it('should restore "dark" from localStorage', () => {
      // Arrange: simulate a previously saved 'dark' preference
      localStorageGetSpy.mockReturnValue('dark');
      service = TestBed.inject(ThemeService);
      expect(service.currentTheme()).toBe('dark');
    });

    it('should restore "light" from localStorage', () => {
      localStorageGetSpy.mockReturnValue('light');
      service = TestBed.inject(ThemeService);
      expect(service.currentTheme()).toBe('light');
    });

    it('should fall back to "auto" for invalid stored value', () => {
      // 'invalid' is not in the Theme union → isValidTheme() returns false → falls back to 'auto'
      localStorageGetSpy.mockReturnValue('invalid');
      service = TestBed.inject(ThemeService);
      expect(service.currentTheme()).toBe('auto');
    });
  });

  /**
   * Tests for the public `setTheme()` method.
   *
   * Here the service IS pre-created in a nested `beforeEach()` because
   * setTheme() does not depend on constructor-time state — we can create
   * the service once and call methods on it in multiple tests.
   */
  describe('setTheme()', () => {
    beforeEach(() => {
      localStorageGetSpy.mockReturnValue(null);
      service = TestBed.inject(ThemeService);
    });

    it('should update currentTheme signal', () => {
      // Act: call the public method
      service.setTheme('dark');
      // Assert: read the writable signal — should reflect the new value
      expect(service.currentTheme()).toBe('dark');
    });

    it('should update activeTheme computed', () => {
      service.setTheme('dark');
      // `activeTheme` is a computed() signal — it updates synchronously when currentTheme() changes.
      // No async waiting needed: computed() recalculates eagerly on next read.
      expect(service.activeTheme()).toBe('dark');
    });
  });

  /**
   * Tests for the public `toggleTheme()` method.
   * Verifies the toggle logic: light → dark and dark → light.
   */
  describe('toggleTheme()', () => {
    beforeEach(() => {
      localStorageGetSpy.mockReturnValue(null);
      service = TestBed.inject(ThemeService);
    });

    it('should switch from "light" to "dark"', () => {
      service.setTheme('light'); // Arrange: start in light
      service.toggleTheme(); // Act: toggle
      expect(service.activeTheme()).toBe('dark'); // Assert: now dark
    });

    it('should switch from "dark" to "light"', () => {
      service.setTheme('dark');
      service.toggleTheme();
      expect(service.activeTheme()).toBe('light');
    });
  });

  /**
   * Tests for the `activeTheme` computed signal.
   *
   * A `computed()` signal re-evaluates automatically when its dependencies change.
   * These tests verify the resolution logic:
   * - `'auto'` + matchMedia.matches=false → system prefers light → resolves to `'light'`
   * - `'dark'` → passes through unchanged → resolves to `'dark'`
   */
  describe('activeTheme computed', () => {
    it('should resolve "auto" to "light" when system prefers light', () => {
      // Our matchMedia mock has matches=false (set in beforeEach)
      // → getSystemTheme() returns 'light'
      // → resolveTheme('auto') returns 'light'
      localStorageGetSpy.mockReturnValue(null);
      service = TestBed.inject(ThemeService);
      service.setTheme('auto');
      expect(service.activeTheme()).toBe('light');
    });

    it('should return "dark" when theme is set to "dark"', () => {
      // 'dark' is already resolved — no OS lookup needed
      localStorageGetSpy.mockReturnValue('dark');
      service = TestBed.inject(ThemeService);
      expect(service.activeTheme()).toBe('dark');
    });
  });
});
