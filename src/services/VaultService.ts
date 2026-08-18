/**
 * @file VaultService.ts
 * @description Data access and storage service for the Knowledge Vault.
 * Manages Supabase DB querying, Storage bucket operations, and seamless offline local fallback.
 */

import { supabase, isSupabaseConfigured } from './SupabaseClient';
import localManifest from '@/data/vault-manifest.json';

export interface ArticleRecord {
    id: string;
    title: string;
    subtitle: string;
    date: string;
    image: string;
    markdownPath: string;
    category: string;
}

export class VaultService {
    /**
     * Fetch all articles.
     * Tries Supabase database first; falls back to local manifest if Supabase is offline or unconfigured.
     */
    public async fetchArticles(): Promise<ArticleRecord[]> {
        if (isSupabaseConfigured()) {
            try {
                const { data, error } = await supabase
                    .from('articles')
                    .select('*')
                    .order('date', { ascending: false });

                if (!error && data && data.length > 0) {
                    return data.map(row => ({
                        id: row.id,
                        title: row.title,
                        subtitle: row.subtitle || '',
                        date: row.date,
                        image: row.image || row.image_path || '',
                        markdownPath: row.markdown_path || row.markdownPath,
                        category: row.category || 'General'
                    }));
                }
                if (error) {
                    console.warn('[VaultService] Supabase query error, falling back to local manifest:', error.message);
                }
            } catch (err) {
                console.warn('[VaultService] Supabase connection failed, using local manifest:', err);
            }
        }

        // Fallback to local manifest
        return (localManifest as any[]).map(entry => ({
            id: entry.id,
            title: entry.title,
            subtitle: entry.subtitle || '',
            date: entry.date,
            image: entry.image || '',
            markdownPath: entry.markdownPath,
            category: entry.category || 'General'
        }));
    }

    /**
     * Fetch a single article by its unique identifier.
     */
    public async fetchArticle(id: string): Promise<ArticleRecord | null> {
        const articles = await this.fetchArticles();
        return articles.find(a => a.id === id) || null;
    }

    /**
     * Fetch raw markdown content for an article from Supabase Storage or local vault fallback.
     */
    public async fetchMarkdownContent(markdownPath: string): Promise<string> {
        if (!markdownPath) return '';

        // If path is a full URL
        if (markdownPath.startsWith('http://') || markdownPath.startsWith('https://')) {
            const resp = await fetch(markdownPath);
            if (resp.ok) return await resp.text();
            throw new Error(`Failed to fetch markdown from ${markdownPath} (${resp.status})`);
        }

        // If Supabase is configured and it's a storage path
        if (isSupabaseConfigured() && !markdownPath.startsWith('/vault/ready/')) {
            const cleanPath = markdownPath.replace(/^\/+/, '');
            const { data, error } = await supabase.storage.from('vault').download(cleanPath);
            if (!error && data) {
                return await data.text();
            }
        }

        // Try standard local fetch
        const targetUrl = markdownPath.startsWith('/') ? markdownPath : `/vault/ready/${markdownPath.replace(/^\/+/, '')}`;
        const localResp = await fetch(targetUrl);
        if (localResp.ok) {
            return await localResp.text();
        }

        // If still not found and Supabase is configured, try storage public URL
        if (isSupabaseConfigured()) {
            const cleanPath = markdownPath.replace(/^\/vault\/ready\//, '').replace(/^\/+/, '');
            const { data, error } = await supabase.storage.from('vault').download(cleanPath);
            if (!error && data) {
                return await data.text();
            }
        }

        throw new Error(`Could not load markdown content for: ${markdownPath}`);
    }

    /**
     * Resolves the accessible URL for a markdown or media file.
     * If the path is already a full URL or absolute local path, returns as is.
     * If Supabase is configured and path is relative, resolves via Supabase Storage.
     */
    public getFileUrl(storagePath: string): string {
        if (!storagePath) return '';
        if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
            return storagePath;
        }

        // Check if path is an absolute local path (e.g. /vault/ready/...)
        if (storagePath.startsWith('/')) {
            return storagePath;
        }

        if (isSupabaseConfigured()) {
            const cleanPath = storagePath.replace(/^\/+/, '');
            const { data } = supabase.storage.from('vault').getPublicUrl(cleanPath);
            return data.publicUrl;
        }

        // Local fallback
        return `/vault/ready/${storagePath.replace(/^\/+/, '')}`;
    }

    /**
     * Upload a single file (markdown, image, code asset) to Supabase Storage.
     */
    public async uploadFile(storagePath: string, file: Blob | File): Promise<string> {
        if (!isSupabaseConfigured()) {
            throw new Error('Supabase credentials are not configured in environment variables.');
        }

        const cleanPath = storagePath.replace(/^\/+/, '');
        const { error } = await supabase.storage
            .from('vault')
            .upload(cleanPath, file, {
                upsert: true,
                cacheControl: '3600'
            });

        if (error) {
            throw new Error(`Storage upload failed for ${cleanPath}: ${error.message}`);
        }

        return this.getFileUrl(cleanPath);
    }

    /**
     * Upsert article metadata row in Supabase database.
     */
    public async upsertArticle(article: ArticleRecord): Promise<void> {
        if (!isSupabaseConfigured()) {
            throw new Error('Supabase credentials are not configured in environment variables.');
        }

        const row = {
            id: article.id,
            title: article.title,
            subtitle: article.subtitle,
            date: article.date,
            image_path: article.image,
            markdown_path: article.markdownPath,
            category: article.category,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('articles')
            .upsert(row, { onConflict: 'id' });

        if (error) {
            throw new Error(`Database upsert failed for ${article.id}: ${error.message}`);
        }
    }

    /**
     * Delete an article from Supabase Database.
     */
    public async deleteArticle(id: string): Promise<void> {
        if (!isSupabaseConfigured()) {
            throw new Error('Supabase credentials are not configured.');
        }

        const { error } = await supabase
            .from('articles')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to delete article ${id}: ${error.message}`);
        }
    }
}

export const vaultService = new VaultService();
