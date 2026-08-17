/**
 * @file PostDetailView.ts
 * @description Pure rendering functions for the post detail view shell, navigation, theme toggle, and static sections.
 */

import { DetailSection } from '@/models/PostModel';

export function renderPostShell(themeClass: string): string {
    return `
        <div class="content-detail-view ${themeClass}">
            ${renderMobileMenu()}
            ${renderBackToHomeButton()}
            ${renderThemeToggle()}
            <div id="post-content-area" class="post-content-area"></div>
        </div>
    `;
}

export function renderBackToHomeButton(): string {
    return `
        <button id="back-to-home-btn" class="back-to-home-btn" aria-label="Back to Content">
            <svg class="chevron-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m15 18-6-6 6-6"/>
            </svg>
            <span class="btn-text">Back to Content</span>
        </button>
    `;
}

export function renderThemeToggle(): string {
    return `
        <div class="theme-toggle-wrap">
            <div class="theme-toggle-btn" id="theme-toggle" role="button" aria-label="Toggle theme">
                <div class="circle">
                    <svg class="moon-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path></svg>
                    <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                </div>
            </div>
        </div>
    `;
}

export function renderMobileMenu(): string {
    return `
        <button id="mobile-menu-hamburger" class="mobile-menu-hamburger" aria-label="Open menu">
            <span></span>
            <span></span>
            <span></span>
        </button>
        <div id="mobile-menu-overlay" class="mobile-menu-overlay">
            <div class="mobile-menu-content">
                <button id="mobile-home-btn" class="mobile-menu-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    <span>Content</span>
                </button>
                <button id="mobile-contents-btn" class="mobile-menu-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                    <span>Contents</span>
                </button>
                <div id="mobile-theme-container" class="mobile-menu-item mobile-theme-item">
                    <div class="theme-toggle-btn" id="mobile-theme-toggle">
                        <div class="circle">
                            <svg class="moon-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path></svg>
                            <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function renderStaticPostSections(sections: DetailSection[]): string {
    return sections.map(section => {
        if (section.type === 'hero') {
            return `
                <section class="static-post-hero" style="background-image: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${section.content.bgImage});">
                    <h1 class="static-post-hero-title">${section.content.title}</h1>
                    <p class="static-post-hero-subtitle">${section.content.subtitle}</p>
                </section>
            `;
        } else if (section.type === 'text') {
            return `
                <section class="static-post-section">
                    <p class="static-post-text">${section.content}</p>
                </section>
            `;
        } else if (section.type === 'grid') {
            const itemsHtml = section.content.map((item: any) => `
                <div class="static-post-card">
                    <h3 class="static-post-card-title">${item.title}</h3>
                    <p class="static-post-card-desc">${item.desc}</p>
                </div>
            `).join('');
            return `
                <section class="static-post-section">
                    <div class="static-post-grid">
                        ${itemsHtml}
                    </div>
                </section>
            `;
        }
        return '';
    }).join('');
}

export function renderNotFound(): string {
    return '<div class="post-not-found"><h1>Content Not Found</h1></div>';
}
