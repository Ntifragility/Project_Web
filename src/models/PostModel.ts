/**
 * @file PostModel.ts
 * @description Model for individual post detail data. Looks up posts from the vault manifest.
 */

import vaultManifest from '@/data/vault-manifest.json';
import { ContentDetailData, DetailSection } from '@/data/posts/types';

export type { ContentDetailData, DetailSection };

export class PostModel {
    private posts: Record<string, ContentDetailData>;

    constructor() {
        this.posts = {};
        vaultManifest.forEach(entry => {
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

    public isMarkdownPost(id: string): boolean {
        const post = this.posts[id];
        return !!post && post.sourceType === 'markdown' && !!post.markdownPath;
    }
}
