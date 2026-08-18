import { renderAdminEditorView } from '@/views/AdminEditorView';
import { vaultService, ArticleRecord } from '@/services/VaultService';
import { markdownParsing } from '@/services/MarkdownParsing';
import { authService } from '@/services/AuthService';
import { Chart, registerables } from 'chart.js';
import { PlotMathEngine } from '@/services/PlotMathEngine';

Chart.register(...registerables);

export class AdminEditorController {
    private container: HTMLElement;
    private cleanups: (() => void)[] = [];
    private currentArticleId: string | null = null;
    private isNew: boolean = false;
    private currentArticle: Partial<ArticleRecord> = {};
    private rawMarkdown: string = '';
    private debounceTimer: number | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
    }

    public async render(articleId?: string): Promise<void> {
        this.destroy();
        this.currentArticleId = articleId || null;
        this.isNew = !articleId;

        this.container.innerHTML = `
            <div class="admin-view-wrapper">
                <div class="admin-panel-card">
                    <div class="admin-panel-header">
                        <h2 class="admin-title">Loading Editor...</h2>
                    </div>
                </div>
            </div>
        `;

        try {
            const allArticles = await vaultService.fetchArticles();
            const categories = Array.from(
                new Set(allArticles.map(a => a.category).filter(Boolean))
            ).sort();

            if (this.currentArticleId) {
                const found = await vaultService.fetchArticle(this.currentArticleId);
                if (!found) {
                    throw new Error(`Article with ID "${this.currentArticleId}" was not found.`);
                }
                this.currentArticle = { ...found };

                // Load raw markdown content
                try {
                    this.rawMarkdown = await vaultService.fetchMarkdownContent(found.markdownPath);
                } catch (err: any) {
                    this.rawMarkdown = `# ${found.title}\n\n${found.subtitle || ''}\n\n*Failed to fetch original file: ${err.message}*`;
                }
            } else {
                this.currentArticle = {
                    id: '',
                    title: 'New Article',
                    subtitle: '',
                    date: new Date().toISOString().split('T')[0],
                    category: categories[0] || 'General',
                    image: '',
                    markdownPath: 'General/New_Article.md'
                };
                this.rawMarkdown = `---
title: "New Article"
subtitle: "Summary of this engineering note"
date: "${new Date().toISOString().split('T')[0]}"
category: "General"
---

# Introduction

Write your comprehensive notes here with full mathematical formulation:

$$ P = \\sqrt{3} \\cdot V_{LL} \\cdot I_L \\cdot \\cos(\\theta) $$

## Interactive Simulation

\`\`\`plot
title: "Power vs Load Factor"
parameter: [load, 0.2, 1.0, 0.05, 0.8, "Load Factor"]
curve: "cos(load * 1.2)"
xlabel: "Load Ratio"
ylabel: "Efficiency"
\`\`\`
`;
            }

            this.container.innerHTML = renderAdminEditorView({
                isNew: this.isNew,
                article: this.currentArticle,
                rawMarkdown: this.rawMarkdown,
                categories,
                userEmail: authService.getUserEmail()
            });

            this.bindEvents();
            this.updateLivePreview();
        } catch (err: any) {
            this.container.innerHTML = `
                <div class="admin-view-wrapper">
                    <div class="admin-panel-card">
                        <div class="admin-alert-banner">
                            <div class="alert-icon">⚠️</div>
                            <div class="alert-text">
                                <strong>Error Loading Note</strong>
                                <p>${err.message}</p>
                            </div>
                        </div>
                        <div class="admin-panel-footer">
                            <a href="#admin/manage" class="admin-action-btn secondary">Back to Manager</a>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    private bindEvents(): void {
        const textarea = this.container.querySelector<HTMLTextAreaElement>('#admin-raw-textarea');
        const saveBtn = this.container.querySelector<HTMLButtonElement>('#editor-save-btn');
        const metaToggleBtn = this.container.querySelector<HTMLButtonElement>('#editor-toggle-meta-btn');
        const metaBar = this.container.querySelector<HTMLElement>('#editor-metadata-bar');
        const imageFileInput = this.container.querySelector<HTMLInputElement>('#meta-image-file');
        const imageTextInput = this.container.querySelector<HTMLInputElement>('#meta-image');
        const titleInput = this.container.querySelector<HTMLInputElement>('#meta-title');
        const categorySelect = this.container.querySelector<HTMLSelectElement>('#meta-category-select');
        const categoryCustom = this.container.querySelector<HTMLInputElement>('#meta-category-custom');
        const displayFilename = this.container.querySelector<HTMLElement>('#editor-display-filename');

        // Toggle metadata bar
        if (metaToggleBtn && metaBar) {
            const handleToggle = () => {
                metaBar.classList.toggle('collapsed');
                metaToggleBtn.classList.toggle('active');
            };
            metaToggleBtn.addEventListener('click', handleToggle);
            this.cleanups.push(() => metaToggleBtn.removeEventListener('click', handleToggle));
        }

        // Live Title update
        if (titleInput && displayFilename) {
            const handleTitleChange = () => {
                displayFilename.textContent = titleInput.value || 'Untitled';
            };
            titleInput.addEventListener('input', handleTitleChange);
            this.cleanups.push(() => titleInput.removeEventListener('input', handleTitleChange));
        }

        // Category synchronization
        if (categorySelect && categoryCustom) {
            const handleCategorySelect = () => {
                if (categorySelect.value) {
                    categoryCustom.value = categorySelect.value;
                }
            };
            categorySelect.addEventListener('change', handleCategorySelect);
            this.cleanups.push(() => categorySelect.removeEventListener('change', handleCategorySelect));
        }

        // Textarea input & stats
        if (textarea) {
            const handleInput = () => {
                this.rawMarkdown = textarea.value;
                this.updateStats();
                this.scheduleLivePreview();
            };

            // Support Tab key indentation in textarea
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
                    textarea.selectionStart = textarea.selectionEnd = start + 2;
                    handleInput();
                }

                // Ctrl+S or Cmd+S shortcut
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    this.saveArticle();
                }
            };

            textarea.addEventListener('input', handleInput);
            textarea.addEventListener('keydown', handleKeyDown);

            this.cleanups.push(() => {
                textarea.removeEventListener('input', handleInput);
                textarea.removeEventListener('keydown', handleKeyDown);
            });

            // Drag and Drop image file directly onto editor textarea
            const handleDragOver = (e: DragEvent) => e.preventDefault();
            const handleDrop = async (e: DragEvent) => {
                e.preventDefault();
                if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const file = e.dataTransfer.files[0];
                    if (file.type.startsWith('image/')) {
                        await this.uploadAndInsertImage(file, textarea);
                    }
                }
            };

            textarea.addEventListener('dragover', handleDragOver);
            textarea.addEventListener('drop', handleDrop);

            this.cleanups.push(() => {
                textarea.removeEventListener('dragover', handleDragOver);
                textarea.removeEventListener('drop', handleDrop);
            });

            this.updateStats();
        }

        // Image file picker upload
        if (imageFileInput && imageTextInput) {
            const handleImageUpload = async (e: Event) => {
                const files = (e.target as HTMLInputElement).files;
                if (files && files.length > 0) {
                    const file = files[0];
                    this.showToast('Uploading image to cloud...', 'info');
                    try {
                        const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                        const storagePath = `img/${Date.now()}_${cleanName}`;
                        const publicUrl = await vaultService.uploadFile(storagePath, file);
                        imageTextInput.value = publicUrl;
                        this.showToast('Image uploaded!', 'success');
                    } catch (err: any) {
                        this.showToast(`Upload failed: ${err.message}`, 'error');
                    }
                }
            };

            imageFileInput.addEventListener('change', handleImageUpload);
            this.cleanups.push(() => imageFileInput.removeEventListener('change', handleImageUpload));
        }

        // Global Ctrl+S handler
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveArticle();
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        this.cleanups.push(() => window.removeEventListener('keydown', handleGlobalKeyDown));

        // Save Button
        if (saveBtn) {
            const handleSave = () => this.saveArticle();
            saveBtn.addEventListener('click', handleSave);
            this.cleanups.push(() => saveBtn.removeEventListener('click', handleSave));
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

    private updateStats(): void {
        const wordCountSpan = this.container.querySelector<HTMLElement>('#editor-word-count');
        const charCountSpan = this.container.querySelector<HTMLElement>('#editor-char-count');

        const words = this.rawMarkdown.trim() ? this.rawMarkdown.trim().split(/\s+/).length : 0;
        const chars = this.rawMarkdown.length;

        if (wordCountSpan) wordCountSpan.textContent = `${words} words`;
        if (charCountSpan) charCountSpan.textContent = `${chars} characters`;
    }

    private scheduleLivePreview(): void {
        if (this.debounceTimer) {
            window.clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = window.setTimeout(() => {
            this.updateLivePreview();
        }, 200);
    }

    private async updateLivePreview(): Promise<void> {
        const previewContainer = this.container.querySelector<HTMLElement>('#admin-preview-content');
        if (!previewContainer) return;

        try {
            const parsed = await markdownParsing.parse(this.rawMarkdown);
            previewContainer.innerHTML = parsed.html;

            // Initialize charts and simulations in preview
            this.renderPreviewCharts(previewContainer);
            this.renderPreviewDynamicPlots(previewContainer);
        } catch (err: any) {
            previewContainer.innerHTML = `<div class="admin-preview-error">Preview Error: ${err.message}</div>`;
        }
    }

    private renderPreviewCharts(container: HTMLElement): void {
        const canvases = container.querySelectorAll<HTMLCanvasElement>('canvas[data-chart]');
        canvases.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            const dataChart = canvas.getAttribute('data-chart');
            if (ctx && dataChart) {
                try {
                    const config = JSON.parse(dataChart.replace(/&quot;/g, '"'));
                    new Chart(ctx, config);
                } catch (err) {
                    console.error('Preview chart error:', err);
                }
            }
        });
    }

    private renderPreviewDynamicPlots(container: HTMLElement): void {
        const wrappers = container.querySelectorAll<HTMLElement>('.dynamic-chart-wrapper');
        wrappers.forEach(wrapper => {
            const encoded = wrapper.getAttribute('data-code');
            const type = wrapper.getAttribute('data-type') || 'dynamic';
            if (!encoded) return;

            try {
                const raw = decodeURIComponent(escape(atob(encoded)));
                let setup: any;
                if (type === 'blueprint') {
                    setup = PlotMathEngine.parseBlueprint(raw);
                } else {
                    setup = new Function(raw)();
                }

                wrapper.innerHTML = `
                    <div class="dynamic-chart-canvas-container" style="height: 280px;">
                        <canvas id="preview-${wrapper.id}"></canvas>
                    </div>
                `;

                const canvas = wrapper.querySelector('canvas')!;
                const ctx = canvas.getContext('2d')!;
                const params: Record<string, number> = {};
                for (const key in setup.parameters) {
                    params[key] = setup.parameters[key].value;
                }

                const config = setup.init(params);
                config.options = config.options || {};
                config.options.responsive = true;
                config.options.maintainAspectRatio = false;

                new Chart(ctx, config);
            } catch (err: any) {
                wrapper.innerHTML = `<div style="color: #ff6b6b; padding: 10px;">Simulation preview: ${err.message}</div>`;
            }
        });
    }

    private async uploadAndInsertImage(file: File, textarea: HTMLTextAreaElement): Promise<void> {
        this.showToast('Uploading dropped image to cloud...', 'info');
        try {
            const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const storagePath = `img/${Date.now()}_${cleanName}`;
            const publicUrl = await vaultService.uploadFile(storagePath, file);

            // Insert markdown image syntax at cursor
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const insertion = `\n![${cleanName}](${publicUrl})\n`;
            textarea.value = textarea.value.substring(0, start) + insertion + textarea.value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + insertion.length;

            this.rawMarkdown = textarea.value;
            this.updateStats();
            this.updateLivePreview();
            this.showToast('Image inserted!', 'success');
        } catch (err: any) {
            this.showToast(`Image upload failed: ${err.message}`, 'error');
        }
    }

    private async saveArticle(): Promise<void> {
        const saveBtn = this.container.querySelector<HTMLButtonElement>('#editor-save-btn');
        const title = this.container.querySelector<HTMLInputElement>('#meta-title')?.value.trim() || 'Untitled';
        const subtitle = this.container.querySelector<HTMLInputElement>('#meta-subtitle')?.value.trim() || '';
        const date = this.container.querySelector<HTMLInputElement>('#meta-date')?.value || new Date().toISOString().split('T')[0];
        const category = this.container.querySelector<HTMLInputElement>('#meta-category-custom')?.value.trim() || 'General';
        const image = this.container.querySelector<HTMLInputElement>('#meta-image')?.value.trim() || '';
        let markdownPath = this.container.querySelector<HTMLInputElement>('#meta-path')?.value.trim() || '';

        if (!markdownPath) {
            const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');
            markdownPath = `${category}/${safeTitle}.md`;
        }

        const id = this.currentArticleId || markdownPath.replace(/\.md$/, '').replace(/[\/\s]/g, '-').toLowerCase();

        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = `<span>Saving...</span>`;
        }

        try {
            // 1. Upload raw markdown file to Supabase Storage
            const cleanPath = markdownPath.replace(/^\/vault\/ready\//, '').replace(/^\/+/, '');
            const blob = new Blob([this.rawMarkdown], { type: 'text/markdown;charset=utf-8' });
            await vaultService.uploadFile(cleanPath, blob);

            // 2. Upsert metadata to Supabase DB
            const record: ArticleRecord = {
                id,
                title,
                subtitle,
                date,
                category,
                image,
                markdownPath: cleanPath
            };
            await vaultService.upsertArticle(record);

            this.currentArticleId = id;
            this.isNew = false;
            this.currentArticle = record;

            this.showToast('Saved to Cloud Database & Storage!', 'success');

            // Update URL hash smoothly if newly created
            if (window.location.hash !== `#admin/edit/${encodeURIComponent(id)}`) {
                window.history.replaceState(null, '', `#admin/edit/${encodeURIComponent(id)}`);
            }
        } catch (err: any) {
            this.showToast(`Save failed: ${err.message}`, 'error');
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    <span>Save to Cloud</span>
                    <kbd class="admin-kbd">Ctrl+S</kbd>
                `;
            }
        }
    }

    private showToast(message: string, type: 'success' | 'error' | 'info'): void {
        const toast = this.container.querySelector<HTMLElement>('#admin-toast');
        const icon = this.container.querySelector<HTMLElement>('#toast-icon');
        const msg = this.container.querySelector<HTMLElement>('#toast-message');

        if (!toast || !icon || !msg) return;

        toast.className = `admin-toast ${type}`;
        icon.textContent = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
        msg.textContent = message;

        toast.style.display = 'flex';
        toast.classList.add('show');

        window.setTimeout(() => {
            toast.classList.remove('show');
            window.setTimeout(() => {
                toast.style.display = 'none';
            }, 300);
        }, 3500);
    }

    public destroy(): void {
        if (this.debounceTimer) {
            window.clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        this.cleanups.forEach(fn => fn());
        this.cleanups = [];
    }
}
