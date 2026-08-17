/**
 * @file ContentController.ts
 * @description Controller connecting ContentModel and ContentGridView.
 * Coordinates drilldown from Subject Overview -> Subject Articles -> 2-Column Reader.
 */

import { ContentModel } from '@/models/ContentModel';
import {
    renderContentSectionShell,
    renderSubjectsView,
    renderArticlesView
} from '@/views/ContentGridView';

export class ContentController {
    private model: ContentModel;
    private container: HTMLElement;
    private observer: IntersectionObserver | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
        this.model = new ContentModel();
    }

    public async init(): Promise<void> {
        this.container.innerHTML = renderContentSectionShell();
        this.renderCurrentView();

        // Refresh from remote Supabase if connected
        await this.model.init();
        this.renderCurrentView();
    }

    public renderCurrentView(): void {
        const viewContainer = this.container.querySelector<HTMLElement>('#content-view-container');
        if (!viewContainer) return;

        const selectedSubject = this.model.getSelectedSubjectItem();

        if (selectedSubject) {
            // Render Articles inside selected subject
            viewContainer.innerHTML = renderArticlesView(selectedSubject, (d) => this.model.formatDate(d));
            this.bindArticleViewEvents();
        } else {
            // Render Subjects Overview
            viewContainer.innerHTML = renderSubjectsView(this.model.subjects);
            this.bindSubjectViewEvents();
        }

        this.setupScrollReveal();
    }

    private bindSubjectViewEvents(): void {
        const subjectCards = this.container.querySelectorAll<HTMLElement>('.tech-card[data-subject]');
        subjectCards.forEach(card => {
            const handleSelect = () => {
                const subjectName = card.dataset.subject;
                if (subjectName) {
                    this.model.setSelectedSubject(subjectName);
                    this.renderCurrentView();
                    // Scroll to top of content section cleanly
                    document.getElementById('content')?.scrollIntoView({ behavior: 'smooth' });
                }
            };

            card.addEventListener('click', handleSelect);
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect();
                }
            });
        });
    }

    private bindArticleViewEvents(): void {
        // Back to All Subjects button
        const backBtn = this.container.querySelector<HTMLButtonElement>('#back-to-subjects-btn');
        backBtn?.addEventListener('click', () => {
            this.model.setSelectedSubject(null);
            this.renderCurrentView();
            document.getElementById('content')?.scrollIntoView({ behavior: 'smooth' });
        });

        // Article Card Clicks -> open 2-column reader
        const articleCards = this.container.querySelectorAll<HTMLElement>('.tech-card[data-url]');
        articleCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const url = card.dataset.url;
                if (url) {
                    window.location.hash = url;
                }
            });
        });
    }

    private setupScrollReveal(): void {
        if (this.observer) {
            this.observer.disconnect();
        }

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    this.observer?.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        const cards = this.container.querySelectorAll('.reveal-item');
        cards.forEach(card => this.observer?.observe(card));
    }

    public destroy(): void {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
}
