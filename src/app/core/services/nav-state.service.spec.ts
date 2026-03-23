/**
 * @fileoverview NavStateService — Unit Tests
 *
 * @description
 * Tests the mobile navigation menu state managed by Angular Signals.
 * These tests are the **simplest** in the codebase: no browser API mocking needed,
 * no HTTP requests, no DOM interaction — just pure signal state manipulation.
 *
 * **This is TDD at its cleanest:**
 * The service has a single boolean state with three mutating operations.
 * The tests are self-documenting — they read almost like plain English specifications.
 *
 * **What you'll see used here:**
 * - `signal.set()` called indirectly via public methods
 * - `computed()` signal read via `isMenuOpen()`
 * - State verification: `toBe(true)` / `toBe(false)`
 * - State sequencing: call multiple methods and verify intermediate states
 *
 * @module core/services/tests
 */

import { TestBed } from '@angular/core/testing';
import { NavStateService } from './nav-state.service';

/** Top-level suite for `NavStateService`. */
describe('NavStateService', () => {
  let service: NavStateService;

  /**
   * Create a fresh service before every test.
   * This ensures each test starts with `menuOpen = false` (the initial signal value).
   * Without `beforeEach`, tests would share state and become order-dependent.
   */
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NavStateService);
  });

  /** Smoke test. */
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /**
   * Verifies the initial state of the service.
   * `isMenuOpen()` reads the computed signal — note the `()` call syntax.
   * The computed value mirrors the private `menuOpen` signal initialized to `false`.
   */
  it('should initialize with menu closed', () => {
    expect(service.isMenuOpen()).toBe(false);
  });

  /**
   * Tests `openMenu()` — sets the menu state to open.
   */
  describe('openMenu()', () => {
    it('should set menu to open', () => {
      service.openMenu(); // Act
      expect(service.isMenuOpen()).toBe(true); // Assert
    });
  });

  /**
   * Tests `closeMenu()` — sets the menu state to closed.
   * The Arrange step explicitly opens the menu first to make the test meaningful:
   * closing a menu that never opened would pass trivially (it was already false).
   */
  describe('closeMenu()', () => {
    it('should set menu to closed', () => {
      service.openMenu(); // Arrange: start in open state
      service.closeMenu(); // Act
      expect(service.isMenuOpen()).toBe(false); // Assert
    });
  });

  /**
   * Tests `toggleMenu()` — the most important method to test thoroughly.
   * An incorrect implementation (e.g. always setting to `true`) would pass
   * the first test but fail the second. Testing both directions catches this.
   * The third test (triple-toggle) also catches off-by-one errors.
   */
  describe('toggleMenu()', () => {
    it('should open menu when closed', () => {
      // Initial state is closed (from beforeEach)
      service.toggleMenu();
      expect(service.isMenuOpen()).toBe(true);
    });

    it('should close menu when open', () => {
      service.openMenu(); // Arrange: pre-open
      service.toggleMenu();
      expect(service.isMenuOpen()).toBe(false);
    });

    it('should toggle multiple times correctly', () => {
      // Three toggles from closed: false → true → false → true
      service.toggleMenu(); // → true
      service.toggleMenu(); // → false
      service.toggleMenu(); // → true
      expect(service.isMenuOpen()).toBe(true);
    });
  });
});
