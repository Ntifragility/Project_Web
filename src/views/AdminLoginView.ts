/**
 * @file AdminLoginView.ts
 * @description View rendering for the Admin Authentication Login Gateway.
 */

import { isSupabaseConfigured } from '@/services/SupabaseClient';

export function renderAdminLoginView(errorMessage?: string): string {
    const isConfigured = isSupabaseConfigured();

    return `
        <div class="admin-view-wrapper">
            <div class="admin-panel-card admin-login-card">
                <div class="admin-panel-header">
                    <div class="admin-header-title-row">
                        <div class="admin-badge">
                            <span class="admin-status-dot ${isConfigured ? 'online' : 'offline'}"></span>
                            <span>${isConfigured ? 'Supabase Security Active' : 'Supabase Not Configured'}</span>
                        </div>
                        <a href="#content" class="admin-close-btn" title="Back to Knowledge Vault">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </a>
                    </div>
                    <div class="admin-login-icon-box">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4d99ff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </div>
                    <h2 class="admin-title" style="text-align: center;">Admin Portal</h2>
                    <p class="admin-subtitle" style="text-align: center;">
                        Sign in with your administrator credentials to manage, edit, and publish content.
                    </p>
                </div>

                ${!isConfigured ? `
                    <div class="admin-alert-banner">
                        <div class="alert-icon">⚠️</div>
                        <div class="alert-text">
                            <strong>Supabase connection required</strong>
                            <p>Make sure your <code>.env.local</code> contains <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.</p>
                        </div>
                    </div>
                ` : ''}

                <div class="admin-alert-banner error" id="admin-login-error" style="${errorMessage ? 'display: flex;' : 'display: none;'}">
                    <div class="alert-icon">✕</div>
                    <div class="alert-text" id="admin-login-error-text">${errorMessage || ''}</div>
                </div>

                <form id="admin-login-form" class="admin-login-form">
                    <div class="metadata-field">
                        <label for="admin-email-input">Admin Email</label>
                        <div class="admin-input-icon-wrap">
                            <svg class="admin-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            <input type="email" id="admin-email-input" class="admin-input with-icon" placeholder="admin@example.com" required autocomplete="email" />
                        </div>
                    </div>

                    <div class="metadata-field">
                        <label for="admin-password-input">Password</label>
                        <div class="admin-input-icon-wrap">
                            <svg class="admin-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <input type="password" id="admin-password-input" class="admin-input with-icon" placeholder="••••••••••••" required autocomplete="current-password" />
                        </div>
                    </div>

                    <button type="submit" class="admin-action-btn primary full-width" id="admin-login-submit-btn" ${!isConfigured ? 'disabled' : ''}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                            <polyline points="10 17 15 12 10 7"></polyline>
                            <line x1="15" y1="12" x2="3" y2="12"></line>
                        </svg>
                        <span id="admin-login-btn-text">Sign In to Admin Portal</span>
                    </button>
                </form>

                <div class="admin-panel-footer" style="justify-content: center;">
                    <a href="#content" class="admin-action-btn secondary">
                        Back to Knowledge Vault
                    </a>
                </div>
            </div>
        </div>
    `;
}
