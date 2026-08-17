/**
 * @file IntroView.ts
 * @description Pure rendering function for the intro/bio section.
 */

export interface IntroViewData {
    title: string;
    bio: string;
    buttons: { label: string; primary: boolean }[];
}

export function renderIntro(data: IntroViewData): string {
    const buttonsHTML = data.buttons.map((btn, index) => `
        <button class="intro-btn ${btn.primary ? 'intro-btn-primary' : 'intro-btn-secondary'}" data-index="${index}">
            ${btn.label}
        </button>
    `).join('');

    return `
        <section id="about" class="intro-section glass intro-card">
            <h2 class="intro-title">${data.title}</h2>
            <p class="intro-bio">${data.bio}</p>
            <div class="intro-buttons">${buttonsHTML}</div>
        </section>
    `;
}
