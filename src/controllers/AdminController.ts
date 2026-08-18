/**
 * @file AdminController.ts
 * @description Master router and controller for the Admin Suite (#admin, #admin/manage, #admin/edit/:id, #admin/new, #admin/upload).
 */

import { renderAdminDashboardHub, renderAdminUploadView } from '@/views/AdminView';
import { renderAdminLoginView } from '@/views/AdminLoginView';
import { AdminManageController } from './AdminManageController';
import { AdminEditorController } from './AdminEditorController';
import { vaultService, ArticleRecord } from '@/services/VaultService';
import { authService } from '@/services/AuthService';
import { isSupabaseConfigured } from '@/services/SupabaseClient';

interface DetectedFile {
    file: File;
    relativePath: string;
    isMarkdown: boolean;
    category: string;
}

export class AdminController {
    private container: HTMLElement;
    private cleanups: (() => void)[] = [];
    private manageController: AdminManageController;
    private editorController: AdminEditorController;
    private detectedFiles: DetectedFile[] = [];

    constructor(container: HTMLElement) {
        this.container = container;
        this.manageController = new AdminManageController(this.container);
        this.editorController = new AdminEditorController(this.container);
    }

    public async render(subRoute: string = ''): Promise<void> {
        this.destroy();

        // Check Admin Authentication Guard
        const isAuthenticated = await authService.isAuthenticated();

        if (!isAuthenticated) {
            this.container.innerHTML = renderAdminLoginView();
            this.bindLoginEvents(subRoute);
            return;
        }

        // Authenticated: Route Dispatcher
        if (subRoute === 'manage' || subRoute.startsWith('manage/')) {
            await this.manageController.render();
            return;
        }

        if (subRoute === 'new') {
            await this.editorController.render();
            return;
        }

        if (subRoute.startsWith('edit/')) {
            const articleId = decodeURIComponent(subRoute.replace(/^edit\//, ''));
            await this.editorController.render(articleId);
            return;
        }

        if (subRoute === 'upload') {
            this.container.innerHTML = renderAdminUploadView(authService.getUserEmail());
            this.bindUploadEvents();
            this.bindLogoutEvent();
            return;
        }

        // Default: Admin Dashboard Hub (#admin)
        try {
            const articles = await vaultService.fetchArticles();
            this.container.innerHTML = renderAdminDashboardHub(articles.length, authService.getUserEmail());
            this.bindLogoutEvent();
        } catch {
            this.container.innerHTML = renderAdminDashboardHub(0, authService.getUserEmail());
            this.bindLogoutEvent();
        }
    }

    private bindLoginEvents(intendedSubRoute: string): void {
        const form = this.container.querySelector<HTMLFormElement>('#admin-login-form');
        const emailInput = this.container.querySelector<HTMLInputElement>('#admin-email-input');
        const passwordInput = this.container.querySelector<HTMLInputElement>('#admin-password-input');
        const submitBtn = this.container.querySelector<HTMLButtonElement>('#admin-login-submit-btn');
        const btnText = this.container.querySelector<HTMLElement>('#admin-login-btn-text');
        const errorBox = this.container.querySelector<HTMLElement>('#admin-login-error');
        const errorText = this.container.querySelector<HTMLElement>('#admin-login-error-text');

        if (!form || !emailInput || !passwordInput) return;

        const handleSubmit = async (e: Event) => {
            e.preventDefault();
            if (submitBtn && btnText) {
                submitBtn.disabled = true;
                btnText.textContent = 'Verifying Credentials...';
            }
            if (errorBox) errorBox.style.display = 'none';

            const res = await authService.signIn(emailInput.value, passwordInput.value);

            if (res.success) {
                this.render(intendedSubRoute);
            } else {
                if (errorBox && errorText) {
                    errorText.textContent = res.error || 'Invalid email or password.';
                    errorBox.style.display = 'flex';
                }
                if (submitBtn && btnText) {
                    submitBtn.disabled = false;
                    btnText.textContent = 'Sign In to Admin Portal';
                }
            }
        };

        form.addEventListener('submit', handleSubmit);
        this.cleanups.push(() => form.removeEventListener('submit', handleSubmit));
    }

    private bindLogoutEvent(): void {
        const logoutBtn = this.container.querySelector<HTMLButtonElement>('#admin-logout-btn');
        if (logoutBtn) {
            const handleLogout = async () => {
                await authService.signOut();
                this.render('');
            };
            logoutBtn.addEventListener('click', handleLogout);
            this.cleanups.push(() => logoutBtn.removeEventListener('click', handleLogout));
        }
    }

    private bindUploadEvents(): void {
        const browseBtn = this.container.querySelector<HTMLButtonElement>('#admin-browse-btn');
        const folderInput = this.container.querySelector<HTMLInputElement>('#admin-folder-input');
        const dropzone = this.container.querySelector<HTMLElement>('#admin-dropzone');
        const syncBtn = this.container.querySelector<HTMLButtonElement>('#admin-sync-btn');

        if (browseBtn && folderInput) {
            const handleBrowse = () => folderInput.click();
            browseBtn.addEventListener('click', handleBrowse);
            this.cleanups.push(() => browseBtn.removeEventListener('click', handleBrowse));
        }

        if (folderInput) {
            const handleFileChange = (e: Event) => {
                const files = (e.target as HTMLInputElement).files;
                if (files && files.length > 0) {
                    this.handleFilesSelected(Array.from(files));
                }
            };
            folderInput.addEventListener('change', handleFileChange);
            this.cleanups.push(() => folderInput.removeEventListener('change', handleFileChange));
        }

        if (dropzone) {
            const handleDragOver = (e: DragEvent) => {
                e.preventDefault();
                dropzone.classList.add('drag-over');
            };
            const handleDragLeave = (e: DragEvent) => {
                e.preventDefault();
                dropzone.classList.remove('drag-over');
            };
            const handleDrop = async (e: DragEvent) => {
                e.preventDefault();
                dropzone.classList.remove('drag-over');
                if (e.dataTransfer && e.dataTransfer.items) {
                    const files = await this.readAllFilesFromDataTransfer(e.dataTransfer.items);
                    if (files.length > 0) {
                        this.handleFilesSelected(files);
                    }
                }
            };

            dropzone.addEventListener('dragover', handleDragOver);
            dropzone.addEventListener('dragleave', handleDragLeave);
            dropzone.addEventListener('drop', handleDrop);

            this.cleanups.push(() => {
                dropzone.removeEventListener('dragover', handleDragOver);
                dropzone.removeEventListener('dragleave', handleDragLeave);
                dropzone.removeEventListener('drop', handleDrop);
            });
        }

        if (syncBtn) {
            const handleSync = () => this.startCloudSync();
            syncBtn.addEventListener('click', handleSync);
            this.cleanups.push(() => syncBtn.removeEventListener('click', handleSync));
        }
    }

    private async readAllFilesFromDataTransfer(items: DataTransferItemList): Promise<File[]> {
        const fileList: File[] = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file) fileList.push(file);
            }
        }
        return fileList;
    }

    private handleFilesSelected(files: File[]): void {
        this.detectedFiles = [];

        for (const file of files) {
            let relativePath = file.webkitRelativePath || file.name;

            if (relativePath.startsWith('ready/')) {
                relativePath = relativePath.substring(6);
            }

            if (relativePath.includes('/.obsidian/') || relativePath.includes('/.git/')) {
                continue;
            }

            const parts = relativePath.split('/');
            const category = parts.length > 1 ? parts[0] : 'General';
            const isMarkdown = file.name.endsWith('.md');

            this.detectedFiles.push({
                file,
                relativePath,
                isMarkdown,
                category
            });
        }

        const mdCount = this.detectedFiles.filter(f => f.isMarkdown).length;
        const assetCount = this.detectedFiles.length - mdCount;

        const statusContainer = this.container.querySelector<HTMLElement>('#admin-upload-status');
        const syncBtn = this.container.querySelector<HTMLButtonElement>('#admin-sync-btn');
        const terminal = this.container.querySelector<HTMLElement>('#admin-terminal-log');

        if (statusContainer && terminal && syncBtn) {
            statusContainer.style.display = 'block';
            syncBtn.style.display = 'inline-flex';
            terminal.innerHTML = `
                <div class="log-entry info">📂 Found <strong>${this.detectedFiles.length}</strong> total files.</div>
                <div class="log-entry info">📄 <strong>${mdCount}</strong> Markdown notes & chapters.</div>
                <div class="log-entry info">🖼️ <strong>${assetCount}</strong> Images & attachment assets.</div>
                <div class="log-entry prompt">Ready to sync to Supabase Storage & Database. Click "Upload & Sync to Cloud" below.</div>
            `;
        }
    }

    private async startCloudSync(): Promise<void> {
        if (!isSupabaseConfigured()) {
            alert('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.');
            return;
        }

        const syncBtn = this.container.querySelector<HTMLButtonElement>('#admin-sync-btn');
        const statusText = this.container.querySelector<HTMLElement>('#status-text');
        const statusPercent = this.container.querySelector<HTMLElement>('#status-percent');
        const progressFill = this.container.querySelector<HTMLElement>('#status-progress-fill');
        const terminal = this.container.querySelector<HTMLElement>('#admin-terminal-log');

        if (syncBtn) syncBtn.disabled = true;

        const total = this.detectedFiles.length;
        let completed = 0;

        const log = (msg: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
            if (terminal) {
                const entry = document.createElement('div');
                entry.className = `log-entry ${type}`;
                entry.innerHTML = msg;
                terminal.appendChild(entry);
                terminal.scrollTop = terminal.scrollHeight;
            }
        };

        log('🚀 Starting Cloud Synchronizer...', 'info');

        for (const item of this.detectedFiles) {
            try {
                log(`Uploading <code>${item.relativePath}</code>...`, 'info');
                await vaultService.uploadFile(item.relativePath, item.file);

                if (item.isMarkdown) {
                    const text = await item.file.text();
                    const article = this.extractMetadata(item.relativePath, text, item.category);
                    await vaultService.upsertArticle(article);
                    log(`✅ Indexed article: <strong>${article.title}</strong> (${article.category})`, 'success');
                }

                completed++;
                const percent = Math.round((completed / total) * 100);
                if (statusPercent) statusPercent.textContent = `${percent}%`;
                if (statusText) statusText.textContent = `Syncing [${completed}/${total}] files...`;
                if (progressFill) progressFill.style.width = `${percent}%`;

            } catch (err: any) {
                log(`❌ Failed ${item.relativePath}: ${err.message}`, 'error');
            }
        }

        log(`🎉 <strong>Synchronization Complete!</strong> Successfully processed ${completed}/${total} files.`, 'success');
        if (statusText) statusText.textContent = 'Sync Finished!';
        if (syncBtn) {
            syncBtn.style.display = 'none';
        }
    }

    private extractMetadata(relativePath: string, rawMarkdown: string, category: string): ArticleRecord {
        const frontMatterRegex = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*/;
        const match = rawMarkdown.match(frontMatterRegex);

        const frontMatter: Record<string, string> = {};
        let body = rawMarkdown;

        if (match) {
            const yamlBlock = match[1];
            yamlBlock.split(/\r?\n/).forEach(line => {
                const [key, ...val] = line.split(':');
                if (key && val) {
                    frontMatter[key.trim()] = val.join(':').trim();
                }
            });
            body = rawMarkdown.replace(frontMatterRegex, '').trim();
        }

        const filename = relativePath.split('/').pop()?.replace(/\.md$/, '') || 'Untitled';
        const title = frontMatter.title || filename;
        const subtitle = frontMatter.subtitle || '';
        const date = frontMatter.date || new Date().toISOString().split('T')[0];

        let image = frontMatter.image || '';
        if (!image) {
            const imgMatch = body.match(/!\[\[([^\]|]+)/);
            if (imgMatch) {
                const imgName = imgMatch[1].trim();
                const folder = relativePath.substring(0, relativePath.lastIndexOf('/'));
                image = `${folder}/img/${imgName}`;
            }
        }

        const id = relativePath.replace(/\.md$/, '').replace(/[\/\s]/g, '-').toLowerCase();

        return {
            id,
            title,
            subtitle,
            date,
            image,
            markdownPath: relativePath,
            category
        };
    }

    public destroy(): void {
        this.cleanups.forEach(fn => fn());
        this.cleanups = [];
        this.manageController.destroy();
        this.editorController.destroy();
    }
}
