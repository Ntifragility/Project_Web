/**
 * @file AdminLoginView.ts
 * @description Technical Minimalist View rendering for the Admin Authentication Portal.
 */

export function renderAdminLoginView(errorMessage?: string): string {
    return `
        <div class="admin-view-wrapper">
            <div class="admin-minimal-login-card">
                <div class="admin-minimal-header">
                    <div class="admin-minimal-header-top">
                        <span class="admin-minimal-tag">ADMIN</span>
                        <a href="#content" class="admin-minimal-close" title="Return to Knowledge Vault">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </a>
                    </div>
                    <h2 class="admin-minimal-title">Sign In</h2>
                </div>

                <div class="admin-minimal-error" id="admin-login-error" style="${errorMessage ? 'display: block;' : 'display: none;'}">
                    <span id="admin-login-error-text">${errorMessage || ''}</span>
                </div>

                <form id="admin-login-form" class="admin-minimal-form">
                    <div class="admin-minimal-field">
                        <label for="admin-email-input">Email</label>
                        <input type="email" id="admin-email-input" class="admin-minimal-input" placeholder="admin@domain.com" required autocomplete="email" />
                    </div>

                    <div class="admin-minimal-field">
                        <label for="admin-password-input">Password</label>
                        <input type="password" id="admin-password-input" class="admin-minimal-input" placeholder="••••••••••••" required autocomplete="current-password" />
                    </div>

                    <button type="submit" class="admin-minimal-btn" id="admin-login-submit-btn">
                        <span id="admin-login-btn-text">Sign In</span>
                    </button>
                </form>

                <div class="admin-minimal-footer">
                    <a href="#content" class="admin-minimal-back-link">
                        <span>← Return to Knowledge Vault</span>
                    </a>
                </div>
            </div>
        </div>
    `;
}
