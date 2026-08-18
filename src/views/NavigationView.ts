/**
 * @file NavigationView.ts
 * @description Pure rendering functions for the navigation bar (desktop + mobile).
 */

import { NavLink } from '@/data/navigation';

export interface NavViewData {
    logo: string;
    links: NavLink[];
}

export function renderNavigation(data: NavViewData): string {
    const desktopLinks = data.links
        .map(link => `<li><a href="${link.href}" class="nav-link-item">${link.label}</a></li>`)
        .join('');

    const mobileLinks = data.links
        .map(link => `<li><a href="${link.href}" class="mobile-nav-link">${link.label}</a></li>`)
        .join('');

    return `
        <nav class="main-nav">
            <a href="#hero" class="logo" style="text-decoration: none; color: inherit; cursor: pointer;">${data.logo}</a>
            <ul class="nav-links-desktop">${desktopLinks}</ul>
            <button id="hamburger-btn" class="hamburger-btn" aria-label="Toggle menu">
                <span></span><span></span><span></span>
            </button>
        </nav>
        <div id="mobile-menu" class="mobile-menu">
            <ul>${mobileLinks}</ul>
        </div>
    `;
}
