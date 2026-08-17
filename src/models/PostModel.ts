import { vaultService, ArticleRecord } from '@/services/VaultService';
import vaultManifest from '@/data/vault-manifest.json';
import { ContentDetailData, DetailSection } from '@/data/posts/types';

export type { ContentDetailData, DetailSection };

export class PostModel {
    private posts: Record<string, ContentDetailData>;

    constructor() {
        this.posts = {};
        this.processEntries(vaultManifest as ArticleRecord[]);
    }

    public async init(): Promise<void> {
        try {
            const articles = await vaultService.fetchArticles();
            this.processEntries(articles);
        } catch (err) {
            console.warn('[PostModel] Failed to fetch articles from VaultService:', err);
        }
    }

    private processEntries(entries: ArticleRecord[]): void {
        entries.forEach(entry => {
            this.posts[entry.id] = {
                id: entry.id,
                title: entry.title,
                sourceType: 'markdown',
                markdownPath: entry.markdownPath,
                sections: []
            };
        });
    }

    public getPost(id: string): ContentDetailData | null {
        return this.posts[id] || null;
    }

    public async getPostAsync(id: string): Promise<ContentDetailData | null> {
        if (this.posts[id]) return this.posts[id];
        const article = await vaultService.fetchArticle(id);
        if (article) {
            this.posts[article.id] = {
                id: article.id,
                title: article.title,
                sourceType: 'markdown',
                markdownPath: article.markdownPath,
                sections: []
            };
            return this.posts[article.id];
        }
        return null;
    }

    public isMarkdownPost(id: string): boolean {
        const post = this.posts[id];
        return !!post && post.sourceType === 'markdown' && !!post.markdownPath;
    }
}
