/**
 * @file AdminManageController.ts
 * @description Controller managing the article list table, search, filtering, and delete operations.
 */

import { renderAdminManageView, renderArticleRows } from '@/views/AdminManageView';
import { vaultService, ArticleRecord } from '@/services/VaultService';
import { authService } from '@/services/AuthService';

export class AdminManageController {
    private container: HTMLElement;
    private cleanups: (() => void)[] = [];
    private allArticles: ArticleRecord[] = [];
    private filteredArticles: ArticleRecord[] = [];
    private pendingDeleteId: string | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
    }

    public async render(): Promise<void> {
        this.destroy();
        this.container.innerHTML = `
            <div class="admin-view-wrapper">
                <div class="admin-panel-card">
                    <div class="admin-panel-header">
                        <h2 class="admin-title">Loading Articles...</h2>
                    </div>
                </div>
            </div>
        `;

        try {
            this.allArticles = await vaultService.fetchArticles();
            this.filteredArticles = [...this.allArticles];

            const categories = Array.from(
                new Set(this.allArticles.map(a => a.category).filter(Boolean))
            ).sort();

            this.container.innerHTML = renderAdminManageView(this.allArticles, categories, authService.getUserEmail());
            this.bindEvents();
        } catch (err: any) {
            this.container.innerHTML = `
                <div class="admin-view-wrapper">
                    <div class="admin-panel-card">
                        <div class="admin-alert-banner">
                            <div class="alert-icon">⚠️</div>
                            <div class="alert-text">
                                <strong>Failed to load articles</strong>
                                <p>${err.message}</p>
                            </div>
                        </div>
                        <div class="admin-panel-footer">
                            <a href="#admin" class="admin-action-btn secondary">Back to Hub</a>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    private bindEvents(): void {
        const searchInput = this.container.querySelector<HTMLInputElement>('#admin-search-input');
        const categorySelect = this.container.querySelector<HTMLSelectElement>('#admin-category-select');

        const applyFilter = () => {
            const query = searchInput?.value.toLowerCase().trim() || '';
            const selectedCat = categorySelect?.value || '';

            this.filteredArticles = this.allArticles.filter(a => {
                const matchesQuery = !query ||
                    a.title.toLowerCase().includes(query) ||
                    (a.subtitle && a.subtitle.toLowerCase().includes(query)) ||
                    a.category.toLowerCase().includes(query) ||
                    a.markdownPath.toLowerCase().includes(query);

                const matchesCat = !selectedCat || a.category === selectedCat;

                return matchesQuery && matchesCat;
            });

            const tbody = this.container.querySelector<HTMLElement>('#admin-articles-tbody');
            const countSpan = this.container.querySelector<HTMLElement>('#admin-filtered-count');

            if (tbody) {
                tbody.innerHTML = renderArticleRows(this.filteredArticles);
            }
            if (countSpan) {
                countSpan.textContent = this.filteredArticles.length.toString();
            }
        };

        if (searchInput) {
            searchInput.addEventListener('input', applyFilter);
            this.cleanups.push(() => searchInput.removeEventListener('input', applyFilter));
        }

        if (categorySelect) {
            categorySelect.addEventListener('change', applyFilter);
            this.cleanups.push(() => categorySelect.removeEventListener('change', applyFilter));
        }

        // Delete Modal Event Delegation
        const tableContainer = this.container.querySelector<HTMLElement>('#admin-articles-table');
        const modal = this.container.querySelector<HTMLElement>('#admin-delete-modal');
        const deleteTitleSpan = this.container.querySelector<HTMLElement>('#delete-article-title');
        const cancelBtn = this.container.querySelector<HTMLButtonElement>('#modal-cancel-delete');
        const confirmBtn = this.container.querySelector<HTMLButtonElement>('#modal-confirm-delete');

        if (tableContainer && modal) {
            const handleTableClick = (e: MouseEvent) => {
                const target = (e.target as HTMLElement).closest<HTMLButtonElement>('.btn-delete-article');
                if (target) {
                    const id = target.dataset.id;
                    const title = target.dataset.title || 'this article';
                    if (id) {
                        this.pendingDeleteId = id;
                        if (deleteTitleSpan) deleteTitleSpan.textContent = `"${title}"`;
                        modal.style.display = 'flex';
                    }
                }
            };

            tableContainer.addEventListener('click', handleTableClick);
            this.cleanups.push(() => tableContainer.removeEventListener('click', handleTableClick));
        }

        if (cancelBtn && modal) {
            const handleCancel = () => {
                modal.style.display = 'none';
                this.pendingDeleteId = null;
            };
            cancelBtn.addEventListener('click', handleCancel);
            this.cleanups.push(() => cancelBtn.removeEventListener('click', handleCancel));
        }

        if (confirmBtn && modal) {
            const handleConfirm = async () => {
                if (!this.pendingDeleteId) return;
                const idToDelete = this.pendingDeleteId;
                confirmBtn.disabled = true;
                confirmBtn.textContent = 'Deleting...';

                try {
                    await vaultService.deleteArticle(idToDelete);
                    this.allArticles = this.allArticles.filter(a => a.id !== idToDelete);
                    modal.style.display = 'none';
                    this.pendingDeleteId = null;
                    applyFilter();
                } catch (err: any) {
                    alert(`Failed to delete: ${err.message}`);
                } finally {
                    confirmBtn.disabled = false;
                    confirmBtn.textContent = 'Yes, Delete';
                }
            };

            confirmBtn.addEventListener('click', handleConfirm);
            this.cleanups.push(() => confirmBtn.removeEventListener('click', handleConfirm));
        }

        // Logout Button
        const logoutBtn = this.container.querySelector<HTMLButtonElement>('#admin-logout-btn');
        if (logoutBtn) {
            const handleLogout = async () => {
                await authService.signOut();
                window.location.hash = '#admin';
            };
            logoutBtn.addEventListener('click', handleLogout);
            this.cleanups.push(() => logoutBtn.removeEventListener('click', handleLogout));
        }
    }

    public destroy(): void {
        this.cleanups.forEach(fn => fn());
        this.cleanups = [];
    }
}
