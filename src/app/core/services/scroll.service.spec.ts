/**
 * @fileoverview ScrollService — Unit Tests
 *
 * @description
 * Tests that `scrollToFragment()` and `scrollToTop()` call the correct browser APIs
 * with the correct arguments. DOM methods (`getElementById`, `scrollIntoView`, `scrollTo`)
 * are mocked so no actual scrolling happens during tests.
 *
 * **Pattern used: Spy on browser globals**
 * - `vi.spyOn(document, 'getElementById')` — intercepts DOM queries
 * - `vi.spyOn(window, 'scrollTo')` — intercepts native scroll API
 * - `.mockReturnValue()` — controls what the spy returns when called
 * - `.mockImplementation(() => {})` — makes the spy a no-op
 *
 * @module core/services/tests
 */

import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ScrollService } from './scroll.service';

/** Top-level suite for `ScrollService`. */
describe('ScrollService', () => {
  let service: ScrollService;

  /**
   * Create a fresh service before each test.
   * `TestBed.configureTestingModule({})` creates a minimal Angular test environment.
   * An empty `{}` is sufficient here because ScrollService has no dependencies to inject.
   * `TestBed.inject(ScrollService)` retrieves the service from Angular's DI container.
   */
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScrollService);
  });

  /** Smoke test: verifies the service can be created without errors. */
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /**
   * Tests for `scrollToFragment()` — covers two scenarios:
   * 1. The element IS found → `scrollIntoView` should be called
   * 2. The element is NOT found → nothing should throw
   */
  describe('scrollToFragment()', () => {
    it('should call scrollIntoView on found element', () => {
      // Arrange: create a real DOM element and attach a spy to its scrollIntoView method
      const scrollIntoViewSpy = vi.fn();
      const el = document.createElement('div');
      el.id = 'about';
      el.scrollIntoView = scrollIntoViewSpy; // replace method with spy

      // Arrange: make getElementById return our prepared element instead of querying the real DOM
      vi.spyOn(document, 'getElementById').mockReturnValue(el);

      // Act: call the service method
      service.scrollToFragment('about');

      // Assert: was scrollIntoView called with the correct scroll options?
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    });

    it('should do nothing when element is not found', () => {
      // Arrange: simulate a missing element (getElementById returns null)
      vi.spyOn(document, 'getElementById').mockReturnValue(null);

      // Assert: calling with an unknown fragment should not throw any exception.
      // `expect(() => ...).not.toThrow()` wraps the call in a function and verifies
      // that no exception is thrown when it's executed.
      expect(() => service.scrollToFragment('nonexistent')).not.toThrow();
    });
  });

  /**
   * Tests for `scrollToTop()` — verifies the correct scroll options are passed.
   */
  describe('scrollToTop()', () => {
    it('should call window.scrollTo with top:0 smooth', () => {
      // Arrange: spy on window.scrollTo and make it a no-op (prevents JSDOM warnings)
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

      // Act
      service.scrollToTop();

      // Assert: verify the exact options object passed to window.scrollTo
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });
  });
});
