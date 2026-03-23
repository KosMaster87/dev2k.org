/**
 * @fileoverview SeoService — Meta & Open Graph tag management
 * @description Dynamically updates page title and meta tags for SEO
 * @module core/services
 */

import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

/**
 * Data transfer object (DTO) for describing a page's metadata.
 *
 * All properties are **optional** (`?`) — you only provide what needs updating.
 * The `updateMetadata()` method uses conditional checks to only apply provided values,
 * leaving unset tags unchanged.
 *
 * **Standard meta tags** (affect search engine results):
 * - `title`       — the document `<title>` shown in browser tabs and Google results
 * - `description` — the `<meta name="description">` snippet shown in search results
 * - `keywords`    — the `<meta name="keywords">` tag (low SEO weight today, but included)
 *
 * **Open Graph tags** (`og:*`) — used by social media platforms (LinkedIn, Twitter, Facebook)
 * when someone shares a link. These populate the preview card (image, title, description).
 */
export interface PageMetadata {
  /** The document `<title>`, shown in browser tabs and search engine result titles. */
  title?: string;
  /** The `<meta name="description">` content. Shown as the snippet below the link in Google. */
  description?: string;
  /** The `<meta name="keywords">` content. Comma-separated keyword list. */
  keywords?: string;
  /** The Open Graph title (`og:title`). Used by LinkedIn/Twitter link preview cards. */
  ogTitle?: string;
  /** The Open Graph description (`og:description`). Shown in social media link previews. */
  ogDescription?: string;
  /** The Open Graph image URL (`og:image`). The thumbnail shown when a link is shared. */
  ogImage?: string;
  /** The canonical URL of the page (`og:url`). Prevents duplicate content issues. */
  ogUrl?: string;
}

/**
 * Service for dynamically managing SEO meta tags and Open Graph data.
 *
 * @description
 * Wraps Angular's built-in `Title` and `Meta` services to provide a single,
 * convenient entry point for updating all relevant page metadata.
 *
 * Injects Angular's `Title` service (controls `<title>`) and `Meta` service
 * (controls `<meta>` tags). Both are provided by `@angular/platform-browser`.
 *
 * **When to use:**
 * - On route change: call `updateMetadata()` with section-specific data
 * - On app init: call `resetToDefaults()` to set the default portfolio metadata
 *
 * @example
 * private seoService = inject(SeoService);
 *
 * // On navigation to the 'projects' section:
 * this.seoService.updateMetadata({
 *   title: 'Projects — dev2k.org',
 *   description: 'Angular projects built by Konstantin Aksenov.',
 *   ogTitle: 'Projects — dev2k.org',
 * });
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  /**
   * Angular's `Title` service — controls the `<title>` element in the document `<head>`.
   * `inject(Title)` is the modern Angular 14+ way to inject dependencies (replaces constructor injection).
   */
  private titleService = inject(Title);

  /**
   * Angular's `Meta` service — reads and writes `<meta>` tags in the document `<head>`.
   * `updateTag()` updates an existing tag or creates it if it doesn't exist.
   */
  private metaService = inject(Meta);

  /**
   * Updates page metadata based on the provided `PageMetadata` object.
   *
   * Only properties that are present (not `undefined`) in the object are applied.
   * This allows partial updates — e.g. updating only the title without touching other tags.
   *
   * Standard meta tags use `{ name: '...', content: '...' }` format.
   * Open Graph tags use `{ property: 'og:...', content: '...' }` format.
   * This distinction matters because `name` and `property` are different HTML attributes.
   *
   * @param metadata - Partial page metadata. Only provided fields are updated.
   *
   * @example
   * this.seoService.updateMetadata({
   *   title: 'About — dev2k.org',
   *   ogTitle: 'About — dev2k.org',
   *   ogImage: 'https://dev2k.org/assets/og-about.png',
   * });
   */
  updateMetadata(metadata: PageMetadata): void {
    if (metadata.title) this.titleService.setTitle(metadata.title);
    if (metadata.description) this.setDescription(metadata.description);
    if (metadata.keywords) this.setKeywords(metadata.keywords);
    if (metadata.ogTitle)
      this.metaService.updateTag({ property: 'og:title', content: metadata.ogTitle });
    if (metadata.ogDescription)
      this.metaService.updateTag({ property: 'og:description', content: metadata.ogDescription });
    if (metadata.ogImage)
      this.metaService.updateTag({ property: 'og:image', content: metadata.ogImage });
    if (metadata.ogUrl) this.metaService.updateTag({ property: 'og:url', content: metadata.ogUrl });
  }

  /**
   * Resets all metadata to the default portfolio values.
   *
   * Called on app initialization and whenever the user navigates back to the root view.
   * Delegates to `updateMetadata()` so all logic is in one place (DRY principle).
   */
  resetToDefaults(): void {
    this.updateMetadata({
      title: 'dev2k.org – Konstantin Aksenov | Software Developer',
      description:
        'Portfolio von Konstantin Aksenov – Angular Developer, UI/UX Enthusiast und Developer Akademie Absolvent.',
      keywords: 'Angular, TypeScript, Frontend Developer, Portfolio, dev2k',
      ogTitle: 'dev2k.org – Konstantin Aksenov',
      ogDescription:
        'Angular Developer Portfolio – Moderne Web-Applikationen mit Angular & TypeScript.',
      ogUrl: 'https://dev2k.org',
    });
  }

  /**
   * Sets the standard `<meta name="description">` tag.
   *
   * Extracted as a private helper to keep `updateMetadata()` readable.
   * Using `{ name: 'description', content }` — shorthand property syntax where
   * `content` is equivalent to `content: content` when variable and key share the same name.
   *
   * @param content - The description text visible in search engine result snippets
   */
  private setDescription(content: string): void {
    this.metaService.updateTag({ name: 'description', content });
  }

  /**
   * Sets the `<meta name="keywords">` tag.
   *
   * @param content - Comma-separated keywords (e.g. `'Angular, TypeScript, Portfolio'`)
   */
  private setKeywords(content: string): void {
    this.metaService.updateTag({ name: 'keywords', content });
  }
}
