/**
 * @file AdminManageView.ts
 * @description View rendering for the Article Management Table and Actions.
 */

import { ArticleRecord } from '@/services/VaultService';

export function renderAdminManageView(articles: ArticleRecord[], categories: string[], userEmail?: string): string {
    const categoryOptions = categories
        .map(cat => `<option value="${cat}">${cat}</option>`)
        .join('');

    return `
        <div class="admin-view-wrapper">
            <div class="admin-panel-card admin-manage-card">
                <div class="admin-panel-header">
                    <div class="admin-header-title-row">
                        <div class="admin-nav-breadcrumbs">
                            <a href="#admin" class="admin-breadcrumb-link">Admin Hub</a>
                            <span class="admin-breadcrumb-sep">/</span>
                            <span class="admin-breadcrumb-current">Articles Manager</span>
                        </div>
                        <div class="admin-header-actions">
                            ${userEmail ? `
                                <div class="admin-user-badge">
                                    <span>${userEmail}</span>
                                </div>
                            ` : ''}
                            <button type="button" class="admin-logout-btn" id="admin-logout-btn" title="Sign Out of Admin Portal">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                                <span>Log Out</span>
                            </button>
                            <a href="#content" class="admin-close-btn" title="Back to Knowledge Vault">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </a>
                        </div>
                    </div>
                    <div class="admin-manage-header-flex">
                        <div>
                            <h2 class="admin-title">Article Management</h2>
                            <p class="admin-subtitle">
                                Browse, edit in browser, or delete articles from your cloud database.
                            </p>
                        </div>
                        <div class="admin-manage-actions">
                            <a href="#admin/new" class="admin-action-btn primary">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                <span>Create New Article</span>
                            </a>
                        </div>
                    </div>
                </div>

                <div class="admin-filters-bar">
                    <div class="admin-search-wrapper">
                        <svg class="admin-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input type="text" id="admin-search-input" class="admin-search-input" placeholder="Search by title, subject or path..." />
                    </div>
                    <div class="admin-category-filter">
                        <select id="admin-category-select" class="admin-select">
                            <option value="">All Categories</option>
                            ${categoryOptions}
                        </select>
                    </div>
                    <div class="admin-article-count">
                        <span id="admin-filtered-count">${articles.length}</span> articles
                    </div>
                </div>

                <div class="admin-table-container">
                    <table class="admin-articles-table" id="admin-articles-table">
                        <thead>
                            <tr>
                                <th style="width: 45%;">Article</th>
                                <th style="width: 20%;">Category</th>
                                <th style="width: 15%;">Date</th>
                                <th style="width: 20%; text-align: right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="admin-articles-tbody">
                            ${renderArticleRows(articles)}
                        </tbody>
                    </table>
                </div>

                <div class="admin-panel-footer admin-manage-footer">
                    <a href="#admin" class="admin-action-btn secondary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        <span>Back to Hub</span>
                    </a>
                    <a href="#admin/upload" class="admin-action-btn secondary">
                        <span>Bulk Upload Vault Folder</span>
                    </a>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <div class="admin-modal-overlay" id="admin-delete-modal" style="display: none;">
            <div class="admin-modal-card">
                <div class="admin-modal-header">
                    <div class="admin-modal-icon warning">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                    </div>
                    <h3>Delete Article?</h3>
                </div>
                <p class="admin-modal-body">
                    Are you sure you want to delete <strong id="delete-article-title"></strong>? This will remove the article metadata from the database.
                </p>
                <div class="admin-modal-actions">
                    <button type="button" class="admin-action-btn secondary" id="modal-cancel-delete">Cancel</button>
                    <button type="button" class="admin-action-btn danger" id="modal-confirm-delete">Yes, Delete</button>
                </div>
            </div>
        </div>
    `;
}

export function renderArticleRows(articles: ArticleRecord[]): string {
    if (articles.length === 0) {
        return `
            <tr>
                <td colspan="4" class="admin-table-empty">
                    <div class="empty-state-box">
                        <p>No articles found matching your query.</p>
                    </div>
                </td>
            </tr>
        `;
    }

    return articles
        .map(article => `
            <tr data-id="${article.id}" class="admin-table-row">
                <td class="admin-cell-title">
                    <div class="admin-title-group">
                        <span class="admin-article-name">${article.title}</span>
                        ${article.subtitle ? `<span class="admin-article-sub">${article.subtitle}</span>` : ''}
                        <code class="admin-article-path">${article.markdownPath}</code>
                    </div>
                </td>
                <td class="admin-cell-category">
                    <span class="admin-category-badge">${article.category}</span>
                </td>
                <td class="admin-cell-date">
                    <span class="admin-date-text">${article.date}</span>
                </td>
                <td class="admin-cell-actions">
                    <div class="admin-actions-group">
                        <a href="#content/${article.id}" class="admin-btn-icon view" title="View Public Article" target="_blank">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </a>
                        <a href="#admin/edit/${encodeURIComponent(article.id)}" class="admin-btn-icon edit" title="Edit in Browser">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </a>
                        <button type="button" class="admin-btn-icon delete btn-delete-article" data-id="${article.id}" data-title="${escapeHtml(article.title)}" title="Delete Article">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `)
        .join('');
}

function escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
