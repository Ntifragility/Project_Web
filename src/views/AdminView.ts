/**
 * @file AdminView.ts
 * @description View rendering for the Web-based Folder Uploader & Cloud Synchronizer.
 */

import { isSupabaseConfigured } from '@/services/SupabaseClient';

export function renderAdminView(): string {
    const isConfigured = isSupabaseConfigured();

    return `
        <div class="admin-view-wrapper">
            <div class="admin-panel-card">
                <div class="admin-panel-header">
                    <div class="admin-header-title-row">
                        <div class="admin-badge">
                            <span class="admin-status-dot ${isConfigured ? 'online' : 'offline'}"></span>
                            <span>${isConfigured ? 'Supabase Connected' : 'Supabase Not Configured'}</span>
                        </div>
                        <a href="#content" class="admin-close-btn" title="Back to Vault">
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
                            <p>To enable direct web uploads to your cloud storage, add your Supabase project URL and anon key to <code>.env.local</code>:</p>
                            <pre><code>VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...</code></pre>
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
                    <a href="#content" class="admin-action-btn secondary">
                        Back to Knowledge Vault
                    </a>
                </div>
            </div>
        </div>
    `;
}
