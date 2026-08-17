/**
 * @file HeroView.ts
 * @description Pure rendering function for the hero landing section.
 */

export function renderHero(scrollTargetId: string): string {
    return `
        <section id="hero" class="hero-section">
            <button id="scroll-btn" class="scroll-btn" data-target="${scrollTargetId}">
                <div class="chevron-container">
                    <svg width="50" height="25" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 2L20 18L38 2" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
            </button>
        </section>
    `;
}
