/**
 * @file AppState.ts
 * @description Central observable state store for the application.
 * Holds route, theme, and hero visibility. Controllers subscribe to changes.
 */

type Listener = () => void;

export class AppState {
    private static instance: AppState;

    // --- State ---
    private _currentRoute: string = '';
    private _isDark: boolean = true;
    private _isHeroVisible: boolean = true;

    // --- Subscribers ---
    private listeners: Listener[] = [];

    private readonly STORAGE_KEY = 'v-website-theme';

    private constructor() {
        // Restore persisted theme
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            this._isDark = saved === 'dark';
        } else {
            this._isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        // Initialise route from current hash
        this._currentRoute = window.location.hash;
    }

    public static getInstance(): AppState {
        if (!AppState.instance) {
            AppState.instance = new AppState();
        }
        return AppState.instance;
    }

    // --- Subscriptions ---

    /** Register a callback that fires whenever any state property changes. */
    public onChange(listener: Listener): () => void {
        this.listeners.push(listener);
        // Return an unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify(): void {
        this.listeners.forEach(l => l());
    }

    // --- Route ---

    public get currentRoute(): string {
        return this._currentRoute;
    }

    public setRoute(hash: string): void {
        if (this._currentRoute === hash) return;
        this._currentRoute = hash;
        this.notify();
    }

    /** Returns the post ID if the current route is a content detail route, otherwise null. */
    public getContentId(): string | null {
        if (this._currentRoute.startsWith('#content/')) {
            return this._currentRoute.split('/')[1] || null;
        }
        return null;
    }

    // --- Theme ---

    public get isDark(): boolean {
        return this._isDark;
    }

    public get themeClass(): string {
        return this._isDark ? 'dark-theme' : 'light-theme';
    }

    public toggleTheme(): void {
        this._isDark = !this._isDark;
        localStorage.setItem(this.STORAGE_KEY, this._isDark ? 'dark' : 'light');
        this.notify();
    }

    // --- Hero Visibility ---

    public get isHeroVisible(): boolean {
        return this._isHeroVisible;
    }

    public setHeroVisible(visible: boolean): void {
        if (this._isHeroVisible === visible) return;
        this._isHeroVisible = visible;
        this.notify();
    }
}

export const appState = AppState.getInstance();
