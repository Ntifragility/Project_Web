/**
 * @file MarkdownView.ts
 * @description Pure rendering functions for parsed Markdown post layouts (minimalist 2-column view).
 */

import { TableOfContentsEntry } from '@/services/MarkdownParsing';

export function renderStickyNav(title: string): string {
    return `
        <div id="sticky-nav-header" class="sticky-nav-header">
            <div class="sticky-nav-content">
                <div class="sticky-nav-left"></div>
                <div class="sticky-nav-title">${title}</div>
                <div class="sticky-nav-right"></div>
            </div>
        </div>
    `;
}

export function renderBreadcrumbs(metadata: Record<string, string>, path: string): string {
    const category = metadata.category || (path.includes('ready/') ? path.split('ready/')[1].split('/')[0] : 'General');
    const title = metadata.title || path.split('/').pop()?.replace('.md', '') || 'Untitled';

    return `
        <div class="markdown-breadcrumbs">
            <a href="#content" class="breadcrumb-home">Content</a>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-category">${category}</span>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-title">${title}</span>
        </div>
    `;
}

export function renderToc(toc: TableOfContentsEntry[]): string {
    if (!toc || toc.length === 0) return '';

    const tocItems = toc.map(item => `
        <div class="toc-item level-${item.level}" data-id="${item.id}">
            <a href="javascript:void(0)" class="toc-link" data-toc-target="${item.id}">
                ${item.text}
            </a>
        </div>
    `).join('');

    return `
        <div class="toc-container">
            <div class="toc-label">Contents</div>
            <nav class="toc-nav">
                ${tocItems}
            </nav>
        </div>
    `;
}

export function renderMarkdownLayout(
    stickyNavHtml: string,
    tocHtml: string,
    breadcrumbsHtml: string,
    chaptersHtml: string,
    title: string,
    bodyHtml: string
): string {
    return `
        <div id="article-top-sentinel" class="article-top-sentinel"></div>
        ${stickyNavHtml}
        <button id="sidebar-toggle" class="sidebar-toggle" aria-label="Toggle Table of Contents">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
        </button>
        <div class="markdown-layout">
            <div id="sidebar-overlay" class="sidebar-overlay"></div>
            
            <!-- Left Column: Chapters / Articles Navigation -->
            <div id="left-sidebar-container" class="markdown-left-sidebar-container">
                <div class="left-sidebar-brand-wrapper">
                    <span class="left-sidebar-brand">Vault Chapters</span>
                </div>
                <nav class="markdown-left-sidebar">
                    ${chaptersHtml}
                </nav>
            </div>

            <!-- Middle Column: Main Content -->
            <main class="markdown-content">
                <div class="markdown-container">
                    <h1 class="article-main-h1">${title}</h1>
                    <div class="markdown-body">${bodyHtml}</div>
                </div>
            </main>

            <!-- Right Column: Table of Contents for Current Article -->
            <div id="right-sidebar-container" class="markdown-right-sidebar-container">
                <div class="sidebar-header-mobile">
                    <span>Contents</span>
                    <button id="sidebar-close" class="sidebar-close">&times;</button>
                </div>
                <div class="sidebar-breadcrumbs-wrapper">
                    ${breadcrumbsHtml}
                </div>
                <div class="right-sidebar-header">
                    <span>Contents</span>
                </div>
                <aside class="markdown-right-sidebar">
                    ${tocHtml}
                </aside>
            </div>
        </div>
    `;
}

export function renderMarkdownLoading(): string {
    return '<div class="markdown-loading">Loading content...</div>';
}

export function renderMarkdownError(message: string): string {
    return `
        <div class="markdown-error-container">
            <h1>Failed to load content</h1>
            <p>${message}</p>
        </div>
    `;
}
