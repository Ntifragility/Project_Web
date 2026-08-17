/**
 * @file MarkdownParsing.ts
 * @description Centralized service for advanced Markdown parsing and rendering.
 * Features include:
 * - Obsidian-style Callouts (![!TYPE])
 * - Multi-language syntax highlighting via Highlight.js
 * - Mathematical notation rendering via KaTeX (Inline and Block)
 * - Obsidian ![[wikilinks]] and [[PostLinks]] resolution
 * - Custom Front Matter (YAML) extraction
 * - Premium terminal-style code containers with copy-to-clipboard functionality
 */
import { marked } from 'marked';
import hljs from 'highlight.js';

// CRITICAL: The line numbers plugin requires hljs to be globally available.
// It attaches lineNumbersBlock to the global hljs object.
(window as any).hljs = hljs;
import 'highlightjs-line-numbers.js';

import bash from 'highlight.js/lib/languages/bash';
import python from 'highlight.js/lib/languages/python';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import typescript from 'highlight.js/lib/languages/typescript';
import javascript from 'highlight.js/lib/languages/javascript';
import css from 'highlight.js/lib/languages/css';
import yaml from 'highlight.js/lib/languages/yaml';
import json from 'highlight.js/lib/languages/json';
import sql from 'highlight.js/lib/languages/sql';
import cpp from 'highlight.js/lib/languages/cpp';
import java from 'highlight.js/lib/languages/java';
import matlab from 'highlight.js/lib/languages/matlab';
import katex from 'katex';
import { vaultService } from './VaultService';

// Import Styles
import 'highlight.js/styles/atom-one-dark.css';
import 'katex/dist/katex.min.css';

// Register Languages
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('python', python);
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('css', css);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('json', json);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('java', java);
hljs.registerLanguage('matlab', matlab);

/*
Vertical lateral floating bar (indice)
*/
export interface TableOfContentsEntry {
    id: string;
    text: string;
    level: number;
}


export interface ParsedPost {
    metadata: Record<string, string>;
    html: string; // HTML content
    toc: TableOfContentsEntry[]; // Table of contents
}

export class MarkdownParsing {
    private toc: TableOfContentsEntry[] = [];

    constructor() {
        this.configureMarked();
    }

    private configureMarked() {
        // 1. KaTeX Tokenizers (Pre-parsing protection)
        const mathBlock = {
            name: 'math',
            level: 'block',
            start(src: string) { return src.match(/\$\$/)?.index; },
            tokenizer(src: string) {
                const match = /^\$\$([\s\S]*?)\$\$/.exec(src);
                if (match) {
                    return {
                        type: 'math',
                        raw: match[0],
                        text: match[1].trim(),
                        displayMode: true
                    };
                }
                return;
            },
            renderer(token: any) {
                try {
                    return katex.renderToString(token.text, { displayMode: true });
                } catch (err: any) {
                    return `<div style="color:red">${err.message}</div>`;
                }
            }
        };

        const mathInline = {
            name: 'mathInline',
            level: 'inline',
            start(src: string) { return src.match(/\$/)?.index; },
            tokenizer(src: string) {
                const match = /^\$([^$\n]+?)\$/.exec(src);
                if (match) {
                    return {
                        type: 'mathInline',
                        raw: match[0],
                        text: match[1].trim(),
                        displayMode: false
                    };
                }
                return;
            },
            renderer(token: any) {
                try {
                    return katex.renderToString(token.text, { displayMode: false });
                } catch (err: any) {
                    return `<span style="color:red">${err.message}</span>`;
                }
            }
        };


        const calloutExtension = {
            name: 'callout',
            level: 'block',
            start(src: string) { return src.match(/^> \[!/)?.index; },
            tokenizer(src: string) {
                const match = /^> \[!(\w+)\](.*?)\n((?:>.*\n?)*)/.exec(src);
                if (match) {
                    return {
                        type: 'callout',
                        raw: match[0],
                        calloutType: match[1].toLowerCase(),
                        title: match[2].trim(),
                        content: match[3].replace(/^>/gm, '').trim()
                    };
                }
                return;
            },
            renderer(token: any) {
                const icons: Record<string, string> = {
                    info: 'ℹ️',
                    note: '📝',
                    tip: '💡',
                    hint: '💡',
                    important: '❗',
                    warning: '⚠️',
                    caution: '🔥',
                    error: '❌',
                    danger: '☢️',
                    question: '❓',
                    todo: '✅',
                    abstract: '📋',
                    summary: '📋',
                    success: '✔️',
                    failure: '❌'
                };
                const icon = icons[token.calloutType] || '🗒️';
                const title = token.title || token.calloutType.toUpperCase();
                return `
                    <div class="callout callout-${token.calloutType}">
                        <div class="callout-header">
                            <span class="callout-icon">${icon}</span>
                            <span class="callout-title">${title}</span>
                        </div>
                        <div class="callout-content">${marked.parse(token.content)}</div>
                    </div>
                `;
            }
        };

        marked.use({ extensions: [mathBlock as any, mathInline as any, calloutExtension as any] });

        // 2. Custom Renderer (Code Blocks & Images)
        const renderer = new marked.Renderer();

        renderer.code = (code, language) => {
            const validLang = language && hljs.getLanguage(language) ? language : 'plaintext';

            // Chart.js Integration
            if (language === 'chart' || language === 'chart:dynamic' || language === 'blueprint:plot') {
                const chartId = `chart-${Math.random().toString(36).substr(2, 9)}`;

                if (language === 'chart:dynamic' || language === 'blueprint:plot') {
                    // For dynamic/blueprint charts, we store the raw configuration in a base64 string
                    const encodedCode = btoa(unescape(encodeURIComponent(code)));
                    const type = language === 'blueprint:plot' ? 'blueprint' : 'dynamic';
                    return `
                        <div class="dynamic-chart-wrapper" id="${chartId}" data-code="${encodedCode}" data-type="${type}">
                            <div class="dynamic-chart-loading">Initializing Interactive Plot...</div>
                        </div>
                    `;
                }

                // Static JSON chart
                const safeConfig = code.replace(/"/g, '&quot;');
                return `
                    <div class="chart-container" style="position: relative; height:40vh; width:100%; margin: 2rem 0;">
                        <canvas id="${chartId}" data-chart="${safeConfig}"></canvas>
                    </div>
                `;
            }

            const highlighted = hljs.highlight(code, { language: validLang }).value;

            // Split into lines for numbering (trim to avoid empty rows at the bottom)
            const lines = highlighted.trimEnd().split('\n');
            const linesHtml = lines.map((line, index) => {
                const lineNumber = index + 1;
                return `<tr><td class="hljs-ln-numbers" data-line-number="${lineNumber}">${lineNumber}</td><td class="hljs-ln-code">${line}</td></tr>`;
            }).join('');

            const displayLang = validLang === 'plaintext' ? '' : validLang.charAt(0).toUpperCase() + validLang.slice(1);

            return `
                <div class="code-wrapper">
                    <span class="code-lang">${displayLang}</span>
                    <button class="copy-btn" onclick="navigator.clipboard.writeText(this.parentElement.querySelector('code').innerText).then(() => { const icon = this.innerHTML; setTimeout(() => this.innerHTML = icon, 2000); })" title="Copy code">
                        <svg width="15" height="15" viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                    <pre><code class="hljs language-${validLang}"><table class="hljs-ln">${linesHtml}</table></code></pre>
                </div>
            `;
        };


        // Heading Renderer for the Vertical lateral floating bar (indice)
        renderer.heading = (text, level) => {
            // Strip HTML tags to make the ID clean and short
            const plainText = text.replace(/<[^>]*>/g, '');
            const id = plainText.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');
            // 2. Add the ID to the Table Of Contents (storing: id, text and level)
            this.toc.push({ id, text, level });
            // 3. Return the HTML version with the ID included so links work
            return `<h${level} id="${id}">${text}</h${level}>`;
        };

        // Obsidian Image Renderer is handled via Regex Pre-processing, 
        // but standard markdown images should also be caught if needed.
        // For now, we rely on the pre-processing step for ![[wikilinks]].

        marked.setOptions({
            renderer,
            highlight: (code, _lang) => code // We handle highlighting in renderer.code
        });
    }

    public async fetchAndParse(url: string): Promise<ParsedPost> {
        const resolvedUrl = vaultService.getFileUrl(url);
        const response = await fetch(resolvedUrl);
        if (!response.ok) throw new Error(`Failed to fetch post: ${response.statusText}`);
        const text = await response.text();
        return this.parse(text, resolvedUrl);
    }

    public parse(rawMarkdown: string, url: string = ''): ParsedPost {
        this.toc = []; // Reset ToC count for each parse
        // 1. Front Matter Extraction (Lenient with CRLF and spaces)
        const frontMatterRegex = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*/;
        const match = rawMarkdown.match(frontMatterRegex);

        let metadata: Record<string, string> = {};
        let body = rawMarkdown;

        if (match) {
            const yamlBlock = match[1];
            yamlBlock.split(/\r?\n/).forEach(line => {
                const [key, ...valueParts] = line.split(':');
                if (key && valueParts) {
                    metadata[key.trim()] = valueParts.join(':').trim();
                }
            });
            body = rawMarkdown.replace(frontMatterRegex, '').trim();
        }

        // 2. Obsidian Image Pre-processing
        // Transforms ![[image.png | 300x200]] to <img src="..." width="300" />
        body = body.replace(/!\[\[(.*?)(?:\|\s*(.*?))?\]\]/g, (_match, filename, size) => {
            const cleanName = filename.trim();
            // Obsidian sizes can be "300" or "300x200". We take the first part.
            const width = size ? size.split('x')[0].trim() : '';
            const widthAttr = width ? `width="${width}"` : '';

            // 1. If it's already an absolute or external link, use it
            if (cleanName.startsWith('/') || cleanName.startsWith('http://') || cleanName.startsWith('https://')) {
                return `<img src="${cleanName}" ${widthAttr} alt="${cleanName}" />`;
            }

            // 2. Determine base path from the post URL
            const basePath = url.substring(0, url.lastIndexOf('/') + 1);

            // 3. Image Resolution Strategy:
            let filenameEncoded = encodeURIComponent(cleanName);
            let src = `${basePath}img/${filenameEncoded}`;

            return `<img src="${src}" ${widthAttr} alt="${cleanName}" onerror="if(!this.dataset.retry){this.dataset.retry='1';this.src='${basePath}${filenameEncoded}';}" />`;
        });

        // 3. WikiLink Pre-processing
        // Transforms [[PostID]] to <a href="#content/PostID">PostID</a>
        body = body.replace(/(?<!!)\[\[(.*?)(?:\|\s*(.*?))?\]\]/g, (_match, linkTarget, linkAlias) => {
            const cleanTarget = linkTarget.trim();
            const display = linkAlias ? linkAlias.trim() : cleanTarget;
            return `<a href="#content/${cleanTarget}" class="wiki-link">${display}</a>`;
        });

        // 4. Mark Parsing
        const html = marked.parse(body);

        return { metadata, html, toc: [...this.toc] };
    }
}

export const markdownParsing = new MarkdownParsing();
