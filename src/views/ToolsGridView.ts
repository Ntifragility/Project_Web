/**
 * @file ToolsGridView.ts
 * @description Pure rendering functions for the tools/tech-stack grid section.
 */

import { ToolItem } from '@/models/ToolsModel';

export function renderToolsSection(
    items: ToolItem[],
    filters: { id: string; label: string }[],
    activeFilter: string
): string {
    const filterButtons = filters
        .map(f => renderFilterButton(f.id, f.label, f.id === activeFilter, 'tool-filter-btn'))
        .join('');

    const cards = items
        .map((item, index) => renderToolCard(item, index))
        .join('');

    return `
        <section id="tools" class="grid-section">
            <div class="grid-section-header">
                <h2 class="grid-section-title">Tools</h2>
                <div id="tool-filter-container" class="filter-container">
                    ${filterButtons}
                </div>
            </div>
            <div id="tools-grid" class="tools-grid">
                ${cards}
            </div>
        </section>
    `;
}

export function renderToolCard(item: ToolItem, index: number): string {
    const rowIndex = Math.floor(index / 3);
    const colIndex = index % 3;
    const delay = (rowIndex * 0.25) + (colIndex * 0.1);

    return `
        <article class="glass reveal-item tool-card" style="transition-delay: ${delay}s" data-url="${item.url}">
            <div class="card-inner">
                <div class="card-image-wrap tool-card-icon">
                    <img src="${item.icon}" alt="${item.title}">
                </div>
                <h3 class="tool-card-title">${item.title}</h3>
                <p class="tool-card-desc">${item.description}</p>
            </div>
        </article>
    `;
}

export function renderFilterButton(type: string, label: string, isActive: boolean, className: string): string {
    return `<button data-filter="${type}" class="${className} filter-btn ${isActive ? 'active' : ''}">${label}</button>`;
}
