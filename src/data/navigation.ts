/**
 * @file navigation.ts
 * @description Configuration for navigation links and structure.
 */

export interface NavLink {
    label: string;
    href: string;
}

export const navigationData = {
    logo: 'Marco',
    links: [
        // { label: 'About', href: '#about' },
        // { label: 'Tools', href: '#tools' },
        { label: 'Content', href: '#content' }
    ] as NavLink[]
};
