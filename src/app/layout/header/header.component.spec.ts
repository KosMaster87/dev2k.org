/**
 * @fileoverview HeaderComponent unit tests
 * @description Tests for header navigation: logo, nav links, menu toggle, theme toggle, language switch, scroll
 * @module layout/header
 */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NavStateService } from '../../core/services/nav-state.service';
import { ScrollService } from '../../core/services/scroll.service';
import { ThemeService } from '../../core/services/theme.service';
import { TranslationService } from '../../core/services/translation.service';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let themeService: ThemeService;
  let navStateService: NavStateService;
  let translationService: TranslationService;
  let scrollService: ScrollService;

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
      imports: [HeaderComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    themeService = TestBed.inject(ThemeService);
    navStateService = TestBed.inject(NavStateService);
    translationService = TestBed.inject(TranslationService);
    scrollService = TestBed.inject(ScrollService);
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should render logo with text "dev2k"', () => {
    const logo: HTMLElement = fixture.nativeElement.querySelector('.header__logo');
    expect(logo).toBeTruthy();
    expect(logo.textContent).toContain('dev2k');
  });

  it('should render 4 nav items', () => {
    const navLinks: NodeList = fixture.nativeElement.querySelectorAll('.header__nav-link');
    expect(navLinks.length).toBe(4);
  });

  it('should call navState.toggleMenu() when hamburger button is clicked', () => {
    const toggleSpy = vi.spyOn(navStateService, 'toggleMenu');
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.header__hamburger');
    btn.click();
    expect(toggleSpy).toHaveBeenCalledOnce();
  });

  it('should add open modifier class when menu is open', () => {
    navStateService.openMenu();
    fixture.detectChanges();
    const nav: HTMLElement = fixture.nativeElement.querySelector('.header__nav');
    expect(nav.classList.contains('header__nav--open')).toBe(true);
  });

  it('should call themeService.toggleTheme() when theme button is clicked', () => {
    const toggleSpy = vi.spyOn(themeService, 'toggleTheme');
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.header__theme-btn');
    btn.click();
    expect(toggleSpy).toHaveBeenCalledOnce();
  });

  it('should call translationService.use("en") when lang button is clicked and currentLang is "de"', () => {
    const useSpy = vi.spyOn(translationService, 'use');
    translationService.currentLang.set('de');
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.header__lang-btn');
    btn.click();
    expect(useSpy).toHaveBeenCalledWith('en');
  });

  it('should call scrollService.scrollToFragment("about") when first nav link is clicked', () => {
    const scrollSpy = vi.spyOn(scrollService, 'scrollToFragment');
    const firstLink: HTMLButtonElement =
      fixture.nativeElement.querySelectorAll('.header__nav-link')[0];
    firstLink.click();
    expect(scrollSpy).toHaveBeenCalledWith('about');
  });

  it('should call navState.closeMenu() when nav link is clicked', () => {
    navStateService.openMenu();
    fixture.detectChanges();
    const closeSpy = vi.spyOn(navStateService, 'closeMenu');
    const firstLink: HTMLButtonElement =
      fixture.nativeElement.querySelectorAll('.header__nav-link')[0];
    firstLink.click();
    expect(closeSpy).toHaveBeenCalledOnce();
  });
});
