/**
 * @fileoverview HeaderComponent — main navigation header
 * @description Fixed top header with logo, nav links, theme toggle, and language switcher
 * @module layout/header
 */
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import { NavStateService } from '../../core/services/nav-state.service';
import { ScrollService } from '../../core/services/scroll.service';
import { ThemeService } from '../../core/services/theme.service';
import { TranslationService } from '../../core/services/translation.service';

interface NavItem {
  key: string;
  fragment: string;
}

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private themeService = inject(ThemeService);
  private navState = inject(NavStateService);
  private translationService = inject(TranslationService);
  private scrollService = inject(ScrollService);

  protected readonly isMenuOpen = this.navState.isMenuOpen;
  protected readonly activeTheme = this.themeService.activeTheme;
  protected readonly currentLang = this.translationService.currentLang;

  protected readonly navItems: NavItem[] = [
    { key: 'nav.about', fragment: 'about' },
    { key: 'nav.skills', fragment: 'skills' },
    { key: 'nav.projects', fragment: 'projects' },
    { key: 'nav.contact', fragment: 'contact' },
  ];

  /**
   * Returns the translated string for the given dot-notation key.
   * @param key - Dot-notation translation key (e.g. 'nav.about')
   * @returns Translated string or key if not found
   */
  translate(key: string): string {
    return this.translationService.instant(key);
  }

  /**
   * Toggles the mobile navigation menu open/close state.
   */
  toggleMenu(): void {
    this.navState.toggleMenu();
  }

  /**
   * Cycles to the next theme (light → dark → auto).
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  /**
   * Switches language between 'de' and 'en'.
   */
  toggleLang(): void {
    const next = this.currentLang() === 'de' ? 'en' : 'de';
    this.translationService.use(next);
  }

  /**
   * Scrolls to a section by fragment ID and closes the mobile menu.
   * @param fragment - The section element ID to scroll to
   */
  scrollTo(fragment: string): void {
    this.scrollService.scrollToFragment(fragment);
    this.navState.closeMenu();
  }

  /**
   * Scrolls back to the top of the page (logo click).
   */
  scrollToTop(): void {
    this.scrollService.scrollToTop();
    this.navState.closeMenu();
  }
}
