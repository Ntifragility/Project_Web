/**
 * @file ContentModel.ts
 * @description Model for grouped subjects and blog articles.
 * Manages category grouping, selected subject state, and article filtering.
 */

import vaultManifest from '@/data/vault-manifest.json';

export type ContentType = 'video' | 'podcast' | 'blog' | 'talk';

export interface ContentItem {
    id: string;
    type: ContentType;
    title: string;
    subtitle?: string;
    date: string;
    thumbnail: string;
    url: string;
    category: string;
}

export interface SubjectItem {
    name: string;
    slug: string;
    articleCount: number;
    latestDate: string;
    thumbnail: string;
    articles: ContentItem[];
}

export class ContentModel {
    public readonly items: ContentItem[];
    public readonly subjects: SubjectItem[];
    private _selectedSubject: string | null = null;

    constructor() {
        this.items = vaultManifest.map(entry => ({
            id: entry.id,
            type: 'blog' as ContentType,
            title: entry.title,
            subtitle: entry.subtitle || '',
            date: entry.date,
            thumbnail: entry.image,
            url: `#content/${entry.id}`,
            category: entry.category || 'General'
        }));

        // Group articles by Category / Subject
        const subjectMap = new Map<string, ContentItem[]>();
        this.items.forEach(item => {
            const cat = item.category;
            if (!subjectMap.has(cat)) {
                subjectMap.set(cat, []);
            }
            subjectMap.get(cat)!.push(item);
        });

        this.subjects = Array.from(subjectMap.entries()).map(([name, articles]) => {
            // Sort articles by date descending
            articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return {
                name,
                slug: name.toLowerCase().replace(/[\s&/]+/g, '-'),
                articleCount: articles.length,
                latestDate: articles[0]?.date || '',
                thumbnail: articles[0]?.thumbnail || '',
                articles
            };
        });
    }

    public get selectedSubject(): string | null {
        return this._selectedSubject;
    }

    public setSelectedSubject(subjectName: string | null): void {
        this._selectedSubject = subjectName;
    }

    public getSelectedSubjectItem(): SubjectItem | null {
        if (!this._selectedSubject) return null;
        return this.subjects.find(s => s.name === this._selectedSubject || s.slug === this._selectedSubject) || null;
    }

    public formatDate(dateStr: string): string {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
}
