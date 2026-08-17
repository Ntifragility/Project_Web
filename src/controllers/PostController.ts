/**
 * @file PostController.ts
 * @description Controller managing the lifecycle and interactions of post detail pages.
 * Handles markdown rendering, theme toggles, mobile drawer gestures, TOC highlighting, and charts.
 */

import { PostModel } from '@/models/PostModel';
import { appState } from '@/models/AppState';
import { markdownParsing } from '@/services/MarkdownParsing';
import { PlotMathEngine } from '@/services/PlotMathEngine';
import {
    renderPostShell,
    renderNotFound,
    renderStaticPostSections
} from '@/views/PostDetailView';
import {
    renderStickyNav,
    renderBreadcrumbs,
    renderToc,
    renderMarkdownLayout,
    renderMarkdownLoading,
    renderMarkdownError
} from '@/views/MarkdownView';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export class PostController {
    private container: HTMLElement;
    private model: PostModel;
    private cleanups: (() => void)[] = [];

    constructor(container: HTMLElement) {
        this.container = container;
        this.model = new PostModel();
    }

    public async render(postId: string): Promise<void> {
        this.destroy(); // Clean up previous listeners if any

        const post = this.model.getPost(postId);
        if (!post) {
            this.container.innerHTML = renderNotFound();
            return;
        }

        // Render the shell
        this.container.innerHTML = renderPostShell(appState.themeClass);
        this.bindShellEvents();

        const contentArea = this.container.querySelector<HTMLElement>('#post-content-area');
        if (!contentArea) return;

        if (this.model.isMarkdownPost(postId) && post.markdownPath) {
            await this.renderMarkdownPost(contentArea, post.markdownPath);
        } else if (post.sections && post.sections.length > 0) {
            contentArea.innerHTML = renderStaticPostSections(post.sections);
        }
    }

    private bindShellEvents(): void {
        const shell = this.container.querySelector('.content-detail-view');
        if (!shell) return;

        // Back to Content
        const backBtn = this.container.querySelector('#back-to-home-btn');
        if (backBtn) {
            const handleBack = () => { window.location.hash = '#content'; };
            backBtn.addEventListener('click', handleBack);
            this.cleanups.push(() => backBtn.removeEventListener('click', handleBack));
        }

        // Theme Toggle (Desktop)
        const themeToggle = this.container.querySelector('#theme-toggle');
        if (themeToggle) {
            const handleToggle = () => {
                appState.toggleTheme();
                this.updateThemeClasses();
            };
            themeToggle.addEventListener('click', handleToggle);
            this.cleanups.push(() => themeToggle.removeEventListener('click', handleToggle));
        }

        // Mobile Menu Interactions
        this.setupMobileMenu();
    }

    private updateThemeClasses(): void {
        const shell = this.container.querySelector('.content-detail-view');
        if (shell) {
            shell.classList.remove('dark-theme', 'light-theme');
            shell.classList.add(appState.themeClass);
        }
    }

    private setupMobileMenu(): void {
        const hamburger = this.container.querySelector<HTMLElement>('#mobile-menu-hamburger');
        const overlay = this.container.querySelector<HTMLElement>('#mobile-menu-overlay');
        const homeBtn = this.container.querySelector<HTMLElement>('#mobile-home-btn');
        const contentsBtn = this.container.querySelector<HTMLElement>('#mobile-contents-btn');
        const themeBtn = this.container.querySelector<HTMLElement>('#mobile-theme-toggle');

        if (!hamburger || !overlay) return;

        const closeMenu = () => {
            hamburger.classList.remove('active');
            overlay.classList.remove('active');
        };

        const toggleMenu = (e: Event) => {
            e.stopPropagation();
            hamburger.classList.toggle('active');
            overlay.classList.toggle('active');
        };

        hamburger.addEventListener('click', toggleMenu);
        this.cleanups.push(() => hamburger.removeEventListener('click', toggleMenu));

        if (homeBtn) {
            const handleHome = () => {
                closeMenu();
                window.location.hash = '#content';
            };
            homeBtn.addEventListener('click', handleHome);
            this.cleanups.push(() => homeBtn.removeEventListener('click', handleHome));
        }

        if (contentsBtn) {
            const handleContents = () => {
                closeMenu();
                const sidebarToggle = this.container.querySelector<HTMLButtonElement>('#sidebar-toggle');
                sidebarToggle?.click();
            };
            contentsBtn.addEventListener('click', handleContents);
            this.cleanups.push(() => contentsBtn.removeEventListener('click', handleContents));
        }

        if (themeBtn) {
            const handleTheme = () => {
                closeMenu();
                appState.toggleTheme();
                this.updateThemeClasses();
            };
            themeBtn.addEventListener('click', handleTheme);
            this.cleanups.push(() => themeBtn.removeEventListener('click', handleTheme));
        }

        const handleOverlayClick = (e: MouseEvent) => {
            if (e.target === overlay) closeMenu();
        };
        overlay.addEventListener('click', handleOverlayClick);
        this.cleanups.push(() => overlay.removeEventListener('click', handleOverlayClick));
    }

    private async renderMarkdownPost(contentArea: HTMLElement, markdownPath: string): Promise<void> {
        contentArea.innerHTML = renderMarkdownLoading();

        try {
            const { html, metadata, toc } = await markdownParsing.fetchAndParse(markdownPath);

            const title = metadata.title || 'Untitled';
            const stickyNavHtml = renderStickyNav(title);
            const tocHtml = renderToc(toc);
            const breadcrumbsHtml = renderBreadcrumbs(metadata, markdownPath);

            contentArea.innerHTML = renderMarkdownLayout(
                stickyNavHtml,
                tocHtml,
                breadcrumbsHtml,
                title,
                html
            );

            // Post-render attachments
            this.setupStickyHeader();
            this.setupTocHighlighting();
            this.setupTocSmoothScroll();
            this.setupMobileSidebar();
            this.renderCharts();
            this.renderDynamicCharts();

        } catch (err: any) {
            console.error('Markdown Render Error:', err);
            contentArea.innerHTML = renderMarkdownError(err.message || 'Unknown error');
        }
    }

    private setupStickyHeader(): void {
        const stickyNav = this.container.querySelector('#sticky-nav-header');
        const sidebarToggle = this.container.querySelector('#sidebar-toggle');
        const detailView = this.container.querySelector('.content-detail-view');

        if (!stickyNav) return;

        const onScroll = () => {
            const scrollTop = detailView ? detailView.scrollTop : window.scrollY;
            if (scrollTop > 80) {
                stickyNav.classList.add('is-sticky');
                sidebarToggle?.classList.add('is-visible');
            } else {
                stickyNav.classList.remove('is-sticky');
                sidebarToggle?.classList.remove('is-visible');
            }
        };

        if (detailView) {
            detailView.addEventListener('scroll', onScroll, { passive: true });
            this.cleanups.push(() => detailView.removeEventListener('scroll', onScroll));
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        this.cleanups.push(() => window.removeEventListener('scroll', onScroll));
    }

    private setupTocHighlighting(): void {
        const headings = Array.from(this.container.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3'));
        const tocItems = Array.from(this.container.querySelectorAll('.toc-item'));

        if (headings.length === 0 || tocItems.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    tocItems.forEach(item => {
                        item.classList.remove('active');
                        if (item.getAttribute('data-id') === id) {
                            item.classList.add('active');
                        }
                    });
                }
            });
        }, {
            rootMargin: '0px 0px -80% 0px',
            threshold: 0.1
        });

        headings.forEach(h => observer.observe(h));
        this.cleanups.push(() => observer.disconnect());
    }

    private setupTocSmoothScroll(): void {
        const links = this.container.querySelectorAll<HTMLAnchorElement>('a[data-toc-target]');
        const detailView = this.container.querySelector<HTMLElement>('.content-detail-view');

        links.forEach(link => {
            const handler = (e: MouseEvent) => {
                e.preventDefault();
                const targetId = link.dataset.tocTarget;
                if (targetId) {
                    const el = document.getElementById(targetId);
                    if (el) {
                        if (detailView) {
                            const headerOffset = 90; // Generous space below fixed top banner
                            const elementTop = el.getBoundingClientRect().top;
                            const containerTop = detailView.getBoundingClientRect().top;
                            const offsetPosition = elementTop - containerTop + detailView.scrollTop - headerOffset;

                            detailView.scrollTo({
                                top: offsetPosition,
                                behavior: 'smooth'
                            });
                        } else {
                            el.scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                }
            };
            link.addEventListener('click', handler);
            this.cleanups.push(() => link.removeEventListener('click', handler));
        });
    }

    private setupMobileSidebar(): void {
        const toggleBtn = this.container.querySelector('#sidebar-toggle');
        const closeBtn = this.container.querySelector('#sidebar-close');
        const overlay = this.container.querySelector<HTMLElement>('#sidebar-overlay');
        const sidebar = this.container.querySelector<HTMLElement>('#sidebar-container');
        const tocLinks = this.container.querySelectorAll('.toc-item a');

        if (!toggleBtn || !sidebar || !overlay) return;

        const toggle = () => {
            sidebar.classList.toggle('is-mobile-open');
            overlay.classList.toggle('is-visible');
            document.body.style.overflow = sidebar.classList.contains('is-mobile-open') ? 'hidden' : '';
        };

        const close = () => {
            sidebar.classList.remove('is-mobile-open');
            overlay.classList.remove('is-visible');
            document.body.style.overflow = '';
        };

        toggleBtn.addEventListener('click', toggle);
        this.cleanups.push(() => toggleBtn.removeEventListener('click', toggle));

        if (closeBtn) {
            closeBtn.addEventListener('click', close);
            this.cleanups.push(() => closeBtn.removeEventListener('click', close));
        }

        overlay.addEventListener('click', close);
        this.cleanups.push(() => overlay.removeEventListener('click', close));

        tocLinks.forEach(link => {
            const linkHandler = () => {
                if (window.innerWidth <= 1100) close();
            };
            link.addEventListener('click', linkHandler);
            this.cleanups.push(() => link.removeEventListener('click', linkHandler));
        });
    }

    private renderCharts(): void {
        const canvases = this.container.querySelectorAll<HTMLCanvasElement>('canvas[data-chart]');
        canvases.forEach((canvas) => {
            const ctx = canvas.getContext('2d');
            const dataChart = canvas.getAttribute('data-chart');
            if (ctx && dataChart) {
                try {
                    const configStr = dataChart.replace(/&quot;/g, '"');
                    const config = JSON.parse(configStr);
                    new Chart(ctx, config);
                } catch (err) {
                    console.error('Failed to render chart:', err);
                    const errorMsg = document.createElement('div');
                    errorMsg.style.color = 'red';
                    errorMsg.textContent = `Chart Error: ${err}`;
                    canvas.replaceWith(errorMsg);
                }
            }
        });
    }

    private renderDynamicCharts(): void {
        const containers = this.container.querySelectorAll<HTMLElement>('.dynamic-chart-wrapper');

        containers.forEach((wrapper) => {
            const encodedData = wrapper.getAttribute('data-code');
            const type = wrapper.getAttribute('data-type') || 'dynamic';
            if (!encodedData) return;

            try {
                const rawData = decodeURIComponent(escape(atob(encodedData)));
                let setup: any;

                if (type === 'blueprint') {
                    setup = PlotMathEngine.parseBlueprint(rawData);
                } else {
                    const setupFn = new Function(rawData);
                    setup = setupFn();
                }

                if (!setup || typeof setup !== 'object') {
                    throw new Error('Dynamic chart script must return an object structure.');
                }

                const paramKeys = Object.keys(setup.parameters || {});
                const hasParams = paramKeys.length > 0;

                if (hasParams) {
                    wrapper.classList.remove('no-controls');
                    wrapper.innerHTML = `
                        <div class="dynamic-chart-canvas-container">
                            <canvas id="canvas-${wrapper.id}"></canvas>
                        </div>
                        <div class="dynamic-chart-controls">
                            <h4>${setup.title || 'Parameters'}</h4>
                            <div class="sliders-list"></div>
                        </div>
                    `;
                } else {
                    wrapper.classList.add('no-controls');
                    wrapper.innerHTML = `
                        <div class="dynamic-chart-canvas-container">
                            <canvas id="canvas-${wrapper.id}"></canvas>
                        </div>
                    `;
                }

                const canvas = wrapper.querySelector('canvas') as HTMLCanvasElement;
                const slidersList = wrapper.querySelector('.sliders-list') as HTMLElement | null;
                const ctx = canvas.getContext('2d')!;

                const params: Record<string, number> = {};
                for (const key in setup.parameters) {
                    params[key] = setup.parameters[key].value;
                }

                for (const key in setup.parameters) {
                    const p = setup.parameters[key];
                    const sliderId = `slider-${wrapper.id}-${key}`;
                    const valueId = `value-${wrapper.id}-${key}`;

                    const sliderGroup = document.createElement('div');
                    sliderGroup.className = 'dynamic-chart-slider-group';
                    sliderGroup.innerHTML = `
                        <div class="dynamic-chart-label-row">
                            <span class="dynamic-chart-label">${p.label || key}</span>
                            <span class="dynamic-chart-value" id="${valueId}">${p.value}</span>
                        </div>
                        <input type="range" class="dynamic-chart-slider" id="${sliderId}" 
                            min="${p.min}" max="${p.max}" step="${p.step || 1}" value="${p.value}">
                    `;

                    const input = sliderGroup.querySelector('input')!;
                    const valueSpan = sliderGroup.querySelector(`#${valueId}`)!;

                    input.addEventListener('input', () => {
                        const newVal = parseFloat(input.value);
                        params[key] = newVal;
                        valueSpan.textContent = newVal.toString();

                        if (setup.update) {
                            setup.update(chart, params);
                        } else {
                            const newConfig = setup.init(params);
                            chart.data = newConfig.data;
                            chart.update('none');
                        }
                    });

                    slidersList?.appendChild(sliderGroup);
                }

                const chartConfig = setup.init(params);
                if (chartConfig.options) {
                    chartConfig.options.responsive = true;
                    chartConfig.options.maintainAspectRatio = false;
                }

                const chart = new Chart(ctx, chartConfig);

                const resizeHandler = () => chart.resize();
                window.addEventListener('resize', resizeHandler);
                this.cleanups.push(() => window.removeEventListener('resize', resizeHandler));

            } catch (err: any) {
                console.error('Plot Runtime Error:', err);
                wrapper.innerHTML = `
                    <div class="dynamic-chart-error">
                        <strong>Simulation Error</strong>
                        <span>${err.message}</span>
                    </div>
                `;
            }
        });
    }

    public hide(): void {
        this.destroy();
        this.container.innerHTML = '';
    }

    public destroy(): void {
        this.cleanups.forEach(fn => fn());
        this.cleanups = [];
        document.body.style.overflow = '';
    }
}
