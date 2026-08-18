/**
 * @file AdminView.ts
 * @description View rendering for the Admin Dashboard Hub and Vault Folder Uploader.
 */

import { isSupabaseConfigured } from '@/services/SupabaseClient';

/**
 * Renders the Central Admin Dashboard Hub (#admin)
 */
export function renderAdminDashboardHub(articleCount: number = 8): string {
    const isConfigured = isSupabaseConfigured();

    return `
        <div class="admin-view-wrapper">
            <div class="admin-panel-card admin-dashboard-card">
                <div class="admin-panel-header">
                    <div class="admin-header-title-row">
                        <div class="admin-badge">
                            <span class="admin-status-dot ${isConfigured ? 'online' : 'offline'}"></span>
                            <span>${isConfigured ? 'Supabase Connected' : 'Supabase Not Configured'}</span>
                        </div>
                        <a href="#content" class="admin-close-btn" title="Back to Knowledge Vault">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </a>
                    </div>
                    <h2 class="admin-title">Vault Admin Hub</h2>
                    <p class="admin-subtitle">
                        Manage your engineering knowledge base directly from the web, write new markdown notes with live mathematical preview, or synchronize your local Obsidian vault.
                    </p>
                </div>

                ${!isConfigured ? `
                    <div class="admin-alert-banner">
                        <div class="alert-icon">⚠️</div>
                        <div class="alert-text">
                            <strong>Supabase credentials not detected.</strong>
                            <p>Add your Supabase project URL and anon key to <code>.env.local</code> to enable full database persistence.</p>
                        </div>
                    </div>
                ` : ''}

                <!-- Dashboard Action Grid -->
                <div class="admin-hub-grid">
                    <!-- Card 1: Article Management -->
                    <a href="#admin/manage" class="admin-hub-card">
                        <div class="admin-hub-card-icon" style="background: rgba(77, 153, 255, 0.15); color: #4d99ff;">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                        </div>
                        <div class="admin-hub-card-content">
                            <div class="admin-hub-card-header">
                                <h3>Manage Articles</h3>
                                <span class="admin-hub-badge">${articleCount} Articles</span>
                            </div>
                            <p>Browse existing notes, edit markdown in-browser, view public pages, or remove articles from database.</p>
                            <span class="admin-hub-link-text">Open Manager →</span>
                        </div>
                    </a>

                    <!-- Card 2: Create New Article -->
                    <a href="#admin/new" class="admin-hub-card highlight">
                        <div class="admin-hub-card-icon" style="background: rgba(0, 200, 83, 0.15); color: #00c853;">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </div>
                        <div class="admin-hub-card-content">
                            <div class="admin-hub-card-header">
                                <h3>New Article / Note</h3>
                                <span class="admin-hub-badge green">Live Editor</span>
                            </div>
                            <p>Compose an engineering article from scratch with split-pane live KaTeX math, charts, and image upload.</p>
                            <span class="admin-hub-link-text">Create Note →</span>
                        </div>
                    </a>

                    <!-- Card 3: Bulk Obsidian Folder Upload -->
                    <a href="#admin/upload" class="admin-hub-card">
                        <div class="admin-hub-card-icon" style="background: rgba(255, 170, 0, 0.15); color: #ffaa00;">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                <line x1="12" y1="11" x2="12" y2="17"></line>
                                <polyline points="9 14 12 11 15 14"></polyline>
                            </svg>
                        </div>
                        <div class="admin-hub-card-content">
                            <div class="admin-hub-card-header">
                                <h3>Sync Obsidian Vault</h3>
                                <span class="admin-hub-badge amber">Bulk Sync</span>
                            </div>
                            <p>Select your local Obsidian folder or drag-and-drop to batch-upload notes, diagrams, and assets to cloud storage.</p>
                            <span class="admin-hub-link-text">Upload Folder →</span>
                        </div>
                    </a>
                </div>

                <div class="admin-panel-footer">
                    <a href="#content" class="admin-action-btn secondary">
                        Back to Knowledge Vault
                    </a>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renders the Vault Folder Upload Dropzone (#admin/upload)
 */
export function renderAdminUploadView(): string {
    const isConfigured = isSupabaseConfigured();

    return `
        <div class="admin-view-wrapper">
            <div class="admin-panel-card">
                <div class="admin-panel-header">
                    <div class="admin-header-title-row">
                        <div class="admin-nav-breadcrumbs">
                            <a href="#admin" class="admin-breadcrumb-link">Admin Hub</a>
                            <span class="admin-breadcrumb-sep">/</span>
                            <span class="admin-breadcrumb-current">Vault Synchronizer</span>
                        </div>
                        <a href="#admin" class="admin-close-btn" title="Back to Admin Hub">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </a>
                    </div>
                    <h2 class="admin-title">Vault Cloud Synchronizer</h2>
                    <p class="admin-subtitle">
                        Upload your Obsidian folder directly from your browser. Markdown notes, calculations, and images will be stored in Supabase Storage and indexed in real-time.
                    </p>
                </div>

                ${!isConfigured ? `
                    <div class="admin-alert-banner">
                        <div class="alert-icon">⚠️</div>
                        <div class="alert-text">
                            <strong>Supabase credentials not detected.</strong>
                            <p>To enable direct web uploads to your cloud storage, add your Supabase project URL and anon key to <code>.env.local</code>.</p>
                        </div>
                    </div>
                ` : ''}

                <div class="admin-dropzone" id="admin-dropzone">
                    <input type="file" id="admin-folder-input" webkitdirectory directory multiple style="display:none;" />
                    <div class="dropzone-content">
                        <div class="dropzone-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4D99FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                <line x1="12" y1="11" x2="12" y2="17"></line>
                                <polyline points="9 14 12 11 15 14"></polyline>
                            </svg>
                        </div>
                        <h3 class="dropzone-title">Select or Drag & Drop Vault Folder</h3>
                        <p class="dropzone-desc">Choose your local folder containing <code>.md</code> chapters and <code>img/</code> subfolders</p>
                        <button type="button" class="admin-select-btn" id="admin-browse-btn" ${!isConfigured ? 'disabled' : ''}>
                            Choose Folder from Disk
                        </button>
                    </div>
                </div>

                <div class="admin-upload-status" id="admin-upload-status" style="display: none;">
                    <div class="status-header">
                        <span id="status-text">Processing files...</span>
                        <span id="status-percent">0%</span>
                    </div>
                    <div class="status-progress-bar">
                        <div class="status-progress-fill" id="status-progress-fill"></div>
                    </div>
                    <div class="admin-terminal-log" id="admin-terminal-log"></div>
                </div>

                <div class="admin-panel-footer">
                    <button type="button" class="admin-action-btn primary" id="admin-sync-btn" style="display: none;">
                        Upload & Sync to Cloud
                    </button>
                    <a href="#admin" class="admin-action-btn secondary">
                        Back to Admin Hub
                    </a>
                </div>
            </div>
        </div>
    `;
}

// Backwards compatibility alias
export const renderAdminView = renderAdminUploadView;
