/**
 * @file ContentGridView.ts
 * @description Technical minimalist rendering functions for Subjects and Articles (compact horizontal cards).
 */

import { SubjectItem, ContentItem } from '@/models/ContentModel';

/**
 * Returns custom technical SVG icons in the project's light blue accent color (#4D99FF)
 */
function getSubjectIcon(name: string): string {
    const lower = name.toLowerCase();

    if (lower.includes('docker') || lower.includes('cuda') || lower.includes('kernel')) {
        // 4x4 Matrix Grid with highlighted light blue cells
        return `
            <svg class="tech-svg" width="52" height="52" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="10" height="10" rx="2.5" stroke="#33383f" stroke-width="1.5"/>
                <rect x="16" y="2" width="10" height="10" rx="2.5" fill="#4D99FF" stroke="#4D99FF" stroke-width="1.5"/>
                <rect x="30" y="2" width="10" height="10" rx="2.5" stroke="#33383f" stroke-width="1.5"/>
                <rect x="44" y="2" width="10" height="10" rx="2.5" stroke="#33383f" stroke-width="1.5"/>

                <rect x="2" y="16" width="10" height="10" rx="2.5" fill="#122640" stroke="#255280" stroke-width="1.5"/>
                <rect x="16" y="16" width="10" height="10" rx="2.5" stroke="#33383f" stroke-width="1.5"/>
                <rect x="30" y="16" width="10" height="10" rx="2.5" fill="#4D99FF" stroke="#4D99FF" stroke-width="1.5"/>
                <rect x="44" y="16" width="10" height="10" rx="2.5" stroke="#33383f" stroke-width="1.5"/>

                <rect x="2" y="30" width="10" height="10" rx="2.5" stroke="#33383f" stroke-width="1.5"/>
                <rect x="16" y="30" width="10" height="10" rx="2.5" stroke="#33383f" stroke-width="1.5"/>
                <rect x="30" y="30" width="10" height="10" rx="2.5" stroke="#255280" fill="#122640" stroke-width="1.5"/>
                <rect x="44" y="30" width="10" height="10" rx="2.5" stroke="#33383f" stroke-width="1.5"/>

                <rect x="2" y="44" width="10" height="10" rx="2.5" stroke="#33383f" stroke-width="1.5"/>
                <rect x="16" y="44" width="10" height="10" rx="2.5" stroke="#33383f" stroke-width="1.5"/>
                <rect x="30" y="44" width="10" height="10" rx="2.5" fill="#122640" stroke="#255280" stroke-width="1.5"/>
                <rect x="44" y="44" width="10" height="10" rx="2.5" stroke="#33383f" stroke-width="1.5"/>
            </svg>
        `;
    } else if (lower.includes('armonico') || lower.includes('harmonic') || lower.includes('ml') || lower.includes('chart') || lower.includes('plot')) {
        // Scatter / Plot Chart with light blue trendline & points
        return `
            <svg class="tech-svg" width="52" height="52" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6V50H50" stroke="#444b54" stroke-width="2" stroke-linecap="round"/>
                <path d="M10 46L24 32" stroke="#4D99FF" stroke-width="2.5" stroke-linecap="round"/>
                <circle cx="14" cy="20" r="3" fill="#666f7a"/>
                <circle cx="20" cy="30" r="3" fill="#666f7a"/>
                <circle cx="16" cy="40" r="3" fill="#666f7a"/>
                <circle cx="36" cy="14" r="3.5" fill="#4D99FF"/>
                <circle cx="32" cy="26" r="3.5" fill="#4D99FF"/>
                <circle cx="40" cy="32" r="3.5" fill="#4D99FF"/>
            </svg>
        `;
    } else if (lower.includes('power') || lower.includes('digsilent') || lower.includes('flow') || lower.includes('triton')) {
        // Partition Grid with light blue quadrant
        return `
            <svg class="tech-svg" width="52" height="52" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="22" height="22" rx="4" stroke="#33383f" stroke-width="1.5"/>
                <line x1="15" y1="4" x2="15" y2="26" stroke="#33383f" stroke-width="1.5"/>
                <line x1="4" y1="15" x2="26" y2="15" stroke="#33383f" stroke-width="1.5"/>

                <rect x="30" y="4" width="22" height="22" rx="4" stroke="#4D99FF" stroke-width="2" fill="rgba(77,153,255,0.12)"/>
                <line x1="41" y1="4" x2="41" y2="26" stroke="#4D99FF" stroke-width="1.5"/>
                <line x1="30" y1="15" x2="52" y2="15" stroke="#4D99FF" stroke-width="1.5"/>

                <rect x="4" y="30" width="22" height="22" rx="4" stroke="#33383f" stroke-width="1.5"/>

                <rect x="30" y="30" width="22" height="22" rx="4" stroke="#33383f" stroke-width="1.5"/>
                <line x1="41" y1="30" x2="41" y2="52" stroke="#33383f" stroke-width="1.5"/>
                <line x1="30" y1="41" x2="52" y2="41" stroke="#33383f" stroke-width="1.5"/>
            </svg>
        `;
    } else {
        // Generic Technical Blueprint icon
        return `
            <svg class="tech-svg" width="52" height="52" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="6" width="44" height="44" rx="8" stroke="#33383f" stroke-width="1.5"/>
                <circle cx="28" cy="28" r="12" stroke="#4D99FF" stroke-width="2"/>
                <line x1="6" y1="28" x2="50" y2="28" stroke="#33383f" stroke-width="1" stroke-dasharray="3 3"/>
                <line x1="28" y1="6" x2="28" y2="50" stroke="#33383f" stroke-width="1" stroke-dasharray="3 3"/>
                <circle cx="28" cy="16" r="3" fill="#4D99FF"/>
                <circle cx="40" cy="28" r="3" fill="#4D99FF"/>
            </svg>
        `;
    }
}

/**
 * Main content section shell
 */
export function renderContentSectionShell(): string {
    return `
        <section id="content" class="grid-section">
            <div id="content-view-container" class="content-view-container"></div>
        </section>
    `;
}

/**
 * Renders the top-level Subject Cards Grid
 */
export function renderSubjectsView(subjects: SubjectItem[]): string {
    const subjectCards = subjects
        .map((subject, index) => renderSubjectCard(subject, index))
        .join('');

    return `
        <div class="grid-section-header">
            <h2 class="grid-section-title">Knowledge Vault</h2>
            <p class="grid-section-subtitle">Select a subject to explore articles and technical notes</p>
        </div>
        <div id="subjects-grid" class="tech-cards-grid">
            ${subjectCards}
        </div>
    `;
}

/**
 * Single Subject Card
 */
export function renderSubjectCard(subject: SubjectItem, index: number): string {
    const delay = (index * 0.05);
    const icon = getSubjectIcon(subject.name);

    return `
        <div class="reveal-item tech-card" role="button" tabindex="0" style="transition-delay: ${delay}s" data-subject="${subject.name}">
            <div class="tech-card-icon-wrap">
                ${icon}
            </div>
            <div class="tech-card-content">
                <h3 class="tech-card-title">${subject.name}</h3>
                <span class="tech-card-meta">${subject.articleCount} ${subject.articleCount === 1 ? 'Note' : 'Notes'}</span>
            </div>
        </div>
    `;
}

/**
 * Renders the Articles List for a selected Subject
 */
export function renderArticlesView(subject: SubjectItem, formatDate: (d: string) => string): string {
    const articleCards = subject.articles
        .map((article, index) => renderArticleCard(article, index, formatDate))
        .join('');

    return `
        <div class="subject-header">
            <button id="back-to-subjects-btn" class="back-to-subjects-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                <span>All Subjects</span>
            </button>
            <div class="subject-header-info">
                <h2 class="selected-subject-title">${subject.name}</h2>
                <span class="selected-subject-count">${subject.articleCount} ${subject.articleCount === 1 ? 'Note' : 'Notes'}</span>
            </div>
        </div>
        <div id="articles-grid" class="tech-cards-grid">
            ${articleCards}
        </div>
    `;
}

/**
 * Single Article Card (semantic anchor linking to 2-column reader)
 */
export function renderArticleCard(item: ContentItem, index: number, formatDate: (d: string) => string): string {
    const delay = (index * 0.05);
    const icon = getSubjectIcon(item.title || item.category);

    return `
        <a href="${item.url}" class="reveal-item tech-card" style="transition-delay: ${delay}s" data-url="${item.url}">
            <div class="tech-card-icon-wrap">
                ${icon}
            </div>
            <div class="tech-card-content">
                <h3 class="tech-card-title">${item.title}</h3>
                <span class="tech-card-meta">${formatDate(item.date)}</span>
            </div>
        </a>
    `;
}
