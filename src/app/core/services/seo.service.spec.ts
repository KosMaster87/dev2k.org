/**
 * @fileoverview SeoService — Unit Tests
 *
 * @description
 * Tests the SeoService in isolation by replacing Angular's real `Title` and `Meta`
 * services with simple mock objects containing Vitest mock functions (`vi.fn()`).
 *
 * **Why mock `Title` and `Meta` instead of using the real ones?**
 * The real services manipulate `document.head` in the DOM. In tests, we don't care
 * about actual DOM changes — we only care that SeoService calls the right methods
 * with the right arguments. Mocks let us verify *behavior* without side effects.
 *
 * **Dependency injection in tests:**
 * `TestBed.configureTestingModule({ providers: [...] })` creates a mini Angular
 * module for the test. By providing `{ provide: Title, useValue: { setTitle: vi.fn() } }`,
 * we tell Angular: "whenever something asks for `Title`, give it this mock object instead."
 *
 * @module core/services/tests
 */

import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { vi } from 'vitest';
import { SeoService } from './seo.service';

/** Top-level suite for `SeoService`. */
describe('SeoService', () => {
  let service: SeoService;

  /**
   * `vi.fn()` creates a mock function — a function that:
   * - Does nothing by default (returns `undefined`)
   * - Records every call: how many times, with what arguments
   * - Can be queried in assertions: `expect(spy).toHaveBeenCalledWith(...)`
   *
   * Declared at suite scope so assertions inside `it()` can reference them.
   */
  let setTitleSpy: ReturnType<typeof vi.fn>;
  let updateTagSpy: ReturnType<typeof vi.fn>;

  /**
   * Before each test: create fresh mock functions and configure TestBed.
   *
   * Creating new mocks in `beforeEach` (rather than sharing one across all tests)
   * ensures call counts from previous tests don't pollute current test assertions.
   */
  beforeEach(() => {
    setTitleSpy = vi.fn();
    updateTagSpy = vi.fn();

    /**
     * `TestBed.configureTestingModule()` sets up a test-only Angular DI environment.
     *
     * `providers` array entries:
     * - `SeoService` — the class under test (registered normally)
     * - `{ provide: Title, useValue: { setTitle: setTitleSpy, getTitle: vi.fn() } }`
     *   — replaces Angular's Title service with a plain object containing mock functions.
     *   SeoService injects `Title` and calls `.setTitle()` — that call hits our spy.
     * - `{ provide: Meta, useValue: { updateTag: updateTagSpy, ... } }`
     *   — same pattern for the Meta service.
     */
    TestBed.configureTestingModule({
      providers: [
        SeoService,
        { provide: Title, useValue: { setTitle: setTitleSpy, getTitle: vi.fn() } },
        { provide: Meta, useValue: { updateTag: updateTagSpy, addTag: vi.fn(), getTag: vi.fn() } },
      ],
    });

    service = TestBed.inject(SeoService);
  });

  /** Smoke test: ensures the service can be constructed with its mocked dependencies. */
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /**
   * Tests for `updateMetadata()` — the main public method.
   * Each test passes one property at a time to verify isolation:
   * that only the right method is called for that specific property.
   */
  describe('updateMetadata()', () => {
    it('should update title when provided', () => {
      // Act: provide only the `title` field
      service.updateMetadata({ title: 'Test Page' });
      // Assert: titleService.setTitle() was called with exactly 'Test Page'
      expect(setTitleSpy).toHaveBeenCalledWith('Test Page');
    });

    it('should not update title when not provided', () => {
      // Only `description` is provided — `title` is undefined — the `if (metadata.title)` guard skips it
      service.updateMetadata({ description: 'Test' });
      // `not.toHaveBeenCalled()` asserts the spy was never invoked
      expect(setTitleSpy).not.toHaveBeenCalled();
    });

    it('should update description meta tag', () => {
      service.updateMetadata({ description: 'Test description' });
      // `toHaveBeenCalledWith()` checks both the method was called AND the exact argument
      // The `{ name: 'description', content: '...' }` format is the standard meta tag format
      expect(updateTagSpy).toHaveBeenCalledWith({
        name: 'description',
        content: 'Test description',
      });
    });

    it('should update og:title tag', () => {
      service.updateMetadata({ ogTitle: 'OG Title' });
      // Open Graph tags use `property` (not `name`) as the HTML attribute key
      expect(updateTagSpy).toHaveBeenCalledWith({
        property: 'og:title',
        content: 'OG Title',
      });
    });

    it('should update og:description tag', () => {
      service.updateMetadata({ ogDescription: 'OG Desc' });
      expect(updateTagSpy).toHaveBeenCalledWith({
        property: 'og:description',
        content: 'OG Desc',
      });
    });

    it('should update og:image tag', () => {
      service.updateMetadata({ ogImage: 'https://dev2k.org/og.png' });
      expect(updateTagSpy).toHaveBeenCalledWith({
        property: 'og:image',
        content: 'https://dev2k.org/og.png',
      });
    });

    it('should update og:url tag', () => {
      service.updateMetadata({ ogUrl: 'https://dev2k.org' });
      expect(updateTagSpy).toHaveBeenCalledWith({
        property: 'og:url',
        content: 'https://dev2k.org',
      });
    });
  });

  /**
   * Tests for `resetToDefaults()` — verifies the hardcoded default values.
   * Uses `expect.objectContaining()` in the second test — a partial matcher that passes
   * as long as the provided keys match, regardless of other keys in the argument.
   */
  describe('resetToDefaults()', () => {
    it('should set default title', () => {
      service.resetToDefaults();
      expect(setTitleSpy).toHaveBeenCalledWith(
        'dev2k.org – Konstantin Aksenov | Software Developer',
      );
    });

    it('should set default description meta tag', () => {
      service.resetToDefaults();
      // `expect.objectContaining({ name: 'description' })` — a partial matcher.
      // It passes if the argument object has AT LEAST `name: 'description'`,
      // without requiring us to hardcode the exact description string here.
      expect(updateTagSpy).toHaveBeenCalledWith(expect.objectContaining({ name: 'description' }));
    });
  });
});
