/**
 * @fileoverview PrivacyComponent unit tests
 * @description Tests for the /datenschutz legal page
 */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrivacyComponent } from './privacy.component';

describe('PrivacyComponent', () => {
  beforeEach(async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    await TestBed.configureTestingModule({
      imports: [PrivacyComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should be created', () => {
    const fixture = TestBed.createComponent(PrivacyComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render a heading', () => {
    const fixture = TestBed.createComponent(PrivacyComponent);
    fixture.detectChanges();
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1).toBeTruthy();
  });

  it('should render a back-link to home', () => {
    const fixture = TestBed.createComponent(PrivacyComponent);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a[routerLink="/"]');
    expect(link).toBeTruthy();
  });
});
