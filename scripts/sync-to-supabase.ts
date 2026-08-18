/**
 * @file sync-to-supabase.ts
 * @description Syncs local manifest articles into Supabase Database.
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ystpcbeezgsjzupkhfpu.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzdHBjYmVlemdzanp1cGtoZnB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5OTUzMTMsImV4cCI6MjEwMjU3MTMxM30.pqNFCEOac1YvLabHDv50cwdzz-acN3oVM736u4R47UM';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncArticles() {
    console.log('🚀 Starting article sync to Supabase...');
    console.log(`   Target URL: ${SUPABASE_URL}`);

    const manifestPath = path.resolve(process.cwd(), 'src/data/vault-manifest.json');
    if (!fs.existsSync(manifestPath)) {
        console.error('❌ Manifest not found at:', manifestPath);
        process.exit(1);
    }

    const manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    console.log(`📦 Found ${manifestData.length} articles in manifest.`);

    for (const article of manifestData) {
        const row = {
            id: article.id,
            title: article.title,
            subtitle: article.subtitle || '',
            date: article.date,
            image_path: article.image || '',
            markdown_path: article.markdownPath,
            category: article.category || 'General',
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('articles')
            .upsert(row, { onConflict: 'id' });

        if (error) {
            console.error(`❌ Failed to sync "${article.title}":`, error.message);
        } else {
            console.log(`✅ Synced: ${article.title} (${article.id})`);
        }
    }

    // Verify
    const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('date', { ascending: false });

    if (error) {
        console.error('❌ Verification failed:', error.message);
    } else {
        console.log(`\n🎉 Success! Total articles in Supabase database: ${data?.length}`);
    }
}

syncArticles().catch(err => {
    console.error('💥 Fatal error during sync:', err);
    process.exit(1);
});
