/**
 * @fileoverview FooterComponent unit tests
 * @description Tests for footer: copyright text, imprint link, privacy link, back-to-top
 * @module layout/footer
 */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ScrollService } from '../../core/services/scroll.service';
import { TranslationService } from '../../core/services/translation.service';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  let scrollService: ScrollService;
  let translationService: TranslationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    scrollService = TestBed.inject(ScrollService);
    translationService = TestBed.inject(TranslationService);
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should display the current year in the copyright text', () => {
    const copyright: HTMLElement = fixture.nativeElement.querySelector('.footer__copyright');
    expect(copyright.textContent).toContain(new Date().getFullYear().toString());
  });

  it('should display "dev2k" in the copyright text', () => {
    const copyright: HTMLElement = fixture.nativeElement.querySelector('.footer__copyright');
    expect(copyright.textContent).toContain('dev2k');
  });

  it('should render an imprint link', () => {
    const link: HTMLElement = fixture.nativeElement.querySelector('.footer__link--imprint');
    expect(link).toBeTruthy();
  });

  it('should render a privacy link', () => {
    const link: HTMLElement = fixture.nativeElement.querySelector('.footer__link--privacy');
    expect(link).toBeTruthy();
  });

  it('should call scrollService.scrollToTop() when back-to-top button is clicked', () => {
    const scrollSpy = vi.spyOn(scrollService, 'scrollToTop');
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.footer__back-to-top');
    btn.click();
    expect(scrollSpy).toHaveBeenCalledOnce();
  });
});
