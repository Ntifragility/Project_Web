/**
 * @file AdminEditorView.ts
 * @description View rendering for the Split-Pane In-Browser Markdown Editor with Live Preview.
 */

import { ArticleRecord } from '@/services/VaultService';

export interface EditorInitialData {
    isNew: boolean;
    article: Partial<ArticleRecord>;
    rawMarkdown: string;
    categories: string[];
    userEmail?: string;
}

export function renderAdminEditorView(data: EditorInitialData): string {
    const { isNew, article, rawMarkdown, categories, userEmail } = data;

    const categoryOptions = categories
        .map(cat => `<option value="${cat}" ${article.category === cat ? 'selected' : ''}>${cat}</option>`)
        .join('');

    const title = article.title || '';
    const subtitle = article.subtitle || '';
    const date = article.date || new Date().toISOString().split('T')[0];
    const image = article.image || '';
    const markdownPath = article.markdownPath || (isNew ? 'New_Notes/Untitled.md' : '');

    return `
        <div class="admin-editor-wrapper">
            <!-- Top Toolbar Navigation -->
            <header class="admin-editor-topbar">
                <div class="admin-editor-topbar-left">
                    <a href="#admin/manage" class="admin-topbar-back-btn" title="Back to Articles Manager">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        <span>Manager</span>
                    </a>
                    <div class="admin-topbar-divider"></div>
                    <span class="admin-editor-mode-badge">${isNew ? 'New Note' : 'Editing Note'}</span>
                    <span class="admin-editor-file-badge" id="editor-display-filename">${escapeHtml(title || 'Untitled')}</span>
                </div>

                <div class="admin-editor-topbar-right">
                    ${userEmail ? `
                        <div class="admin-user-badge" style="display: none; @media(min-width: 900px){ display: inline-flex; }">
                            <span>${userEmail}</span>
                        </div>
                    ` : ''}

                    <button type="button" class="admin-topbar-btn" id="editor-toggle-meta-btn" title="Toggle Metadata Details">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        <span>Metadata</span>
                    </button>

                    ${!isNew && article.id ? `
                        <a href="#content/${article.id}" target="_blank" class="admin-topbar-btn" title="View Public Post">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                            <span>Live Page</span>
                        </a>
                    ` : ''}

                    <button type="button" class="admin-logout-btn" id="admin-logout-btn" title="Sign Out of Admin Portal">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        <span>Log Out</span>
                    </button>

                    <button type="button" class="admin-action-btn primary" id="editor-save-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        <span>Save to Cloud</span>
                        <kbd class="admin-kbd">Ctrl+S</kbd>
                    </button>
                </div>
            </header>

            <!-- Collapsible Article Metadata Bar -->
            <div class="admin-metadata-bar" id="editor-metadata-bar">
                <div class="metadata-grid">
                    <div class="metadata-field">
                        <label for="meta-title">Article Title</label>
                        <input type="text" id="meta-title" class="admin-input" value="${escapeHtml(title)}" placeholder="e.g. Calculation of PF in 3-ph Motor" />
                    </div>
                    <div class="metadata-field">
                        <label for="meta-subtitle">Subtitle / Short Summary</label>
                        <input type="text" id="meta-subtitle" class="admin-input" value="${escapeHtml(subtitle)}" placeholder="e.g. Power Factor Analysis & Calculations" />
                    </div>
                    <div class="metadata-field">
                        <label for="meta-category">Category / Subject</label>
                        <div class="category-input-group">
                            <select id="meta-category-select" class="admin-select">
                                <option value="">Select Existing...</option>
                                ${categoryOptions}
                            </select>
                            <input type="text" id="meta-category-custom" class="admin-input" value="${escapeHtml(article.category || '')}" placeholder="Or Type New Category" />
                        </div>
                    </div>
                    <div class="metadata-field">
                        <label for="meta-date">Date Published</label>
                        <input type="date" id="meta-date" class="admin-input" value="${date}" />
                    </div>
                    <div class="metadata-field">
                        <label for="meta-image">Cover Image URL / Asset</label>
                        <div class="image-input-group">
                            <input type="text" id="meta-image" class="admin-input" value="${escapeHtml(image)}" placeholder="https://images.unsplash.com/... or local /vault/img/..." />
                            <label class="admin-upload-image-label" title="Upload image file to cloud storage">
                                <input type="file" id="meta-image-file" accept="image/*" style="display:none;" />
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21 15 16 10 5 21"></polyline>
                                </svg>
                                <span>Upload</span>
                            </label>
                        </div>
                    </div>
                    <div class="metadata-field">
                        <label for="meta-path">Cloud Storage Markdown Path</label>
                        <input type="text" id="meta-path" class="admin-input" value="${escapeHtml(markdownPath)}" placeholder="Category/Note_Name.md" />
                    </div>
                </div>
            </div>

            <!-- Split-Pane Workspace -->
            <main class="admin-split-workspace">
                <!-- Left: Markdown Raw Editor -->
                <section class="editor-pane raw-editor-pane">
                    <div class="editor-pane-header">
                        <div class="editor-pane-title">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="4 7 4 4 20 4 20 7"></polyline>
                                <line x1="9" y1="20" x2="15" y2="20"></line>
                                <line x1="12" y1="4" x2="12" y2="20"></line>
                            </svg>
                            <span>Markdown Editor</span>
                        </div>
                        <div class="editor-pane-stats">
                            <span id="editor-word-count">0 words</span>
                            <span class="dot-separator">•</span>
                            <span id="editor-char-count">0 characters</span>
                        </div>
                    </div>
                    <div class="editor-textarea-container">
                        <textarea id="admin-raw-textarea" class="admin-raw-textarea" spellcheck="false" placeholder="# Write your markdown content here...&#10;Support for KaTeX math: $$ \omega = 2\pi f $$&#10;Charts and Interactive Simulations">${escapeHtml(rawMarkdown)}</textarea>
                    </div>
                </section>

                <!-- Right: Live Rendered Preview -->
                <section class="editor-pane preview-editor-pane">
                    <div class="editor-pane-header">
                        <div class="editor-pane-title">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            <span>Live Rendered Preview</span>
                        </div>
                        <div class="editor-pane-status">
                            <span class="admin-status-dot online"></span>
                            <span>KaTeX & Charts Active</span>
                        </div>
                    </div>
                    <div class="editor-preview-scroll-container">
                        <article class="markdown-body" id="admin-preview-content">
                            <!-- Live rendered HTML injected here -->
                        </article>
                    </div>
                </section>
            </main>

            <!-- Floating Toast Notification -->
            <div class="admin-toast" id="admin-toast" style="display: none;">
                <div class="admin-toast-icon" id="toast-icon">✓</div>
                <div class="admin-toast-message" id="toast-message">Article saved successfully!</div>
            </div>
        </div>
    `;
}

function escapeHtml(str: string): string {
    return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
