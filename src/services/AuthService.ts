/**
 * @file AuthService.ts
 * @description Authentication service wrapping Supabase Auth for Admin security.
 */

import { supabase, isSupabaseConfigured } from './SupabaseClient';
import type { User, Session } from '@supabase/supabase-js';

export class AuthService {
    private currentUser: User | null = null;
    private currentSession: Session | null = null;
    private listeners: ((user: User | null) => void)[] = [];

    constructor() {
        if (isSupabaseConfigured()) {
            // Check initial session
            supabase.auth.getSession().then(({ data }) => {
                this.currentSession = data.session;
                this.currentUser = data.session?.user || null;
                this.notifyListeners();
            });

            // Subscribe to real-time auth changes
            supabase.auth.onAuthStateChange((_event, session) => {
                this.currentSession = session;
                this.currentUser = session?.user || null;
                this.notifyListeners();
            });
        }
    }

    public async isAuthenticated(): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;
        if (this.currentUser) return true;

        try {
            const { data, error } = await supabase.auth.getSession();
            if (error || !data.session) return false;
            this.currentSession = data.session;
            this.currentUser = data.session.user;
            return !!this.currentUser;
        } catch {
            return false;
        }
    }

    public getUser(): User | null {
        return this.currentUser;
    }

    public getSession(): Session | null {
        return this.currentSession;
    }

    public getUserEmail(): string {
        return this.currentUser?.email || '';
    }

    public async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
        if (!isSupabaseConfigured()) {
            return { success: false, error: 'Supabase credentials are not configured in .env.local.' };
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password.trim()
            });

            if (error) {
                return { success: false, error: error.message };
            }

            this.currentSession = data.session;
            this.currentUser = data.user;
            this.notifyListeners();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message || 'Login failed unexpectedly.' };
        }
    }

    public async signOut(): Promise<void> {
        if (!isSupabaseConfigured()) return;
        try {
            await supabase.auth.signOut();
        } finally {
            this.currentSession = null;
            this.currentUser = null;
            this.notifyListeners();
        }
    }

    public onAuthStateChange(callback: (user: User | null) => void): () => void {
        this.listeners.push(callback);
        callback(this.currentUser);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    private notifyListeners(): void {
        this.listeners.forEach(cb => cb(this.currentUser));
    }
}

export const authService = new AuthService();
