/**
 * @file Galaxy.ts
 * @description Clustered 3-layer realistic starfield background with stellar color temperatures.
 */
import * as THREE from 'three';

interface StarLayerConfig {
    count: number;
    spread: number;
    size: number;
    color: number | string;
}

function makeStarLayer({ count, spread, size, color }: StarLayerConfig): THREE.Points {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const baseColor = new THREE.Color(color);
    const tint = new THREE.Color();
    const clusterCount = Math.max(1, Math.floor(count / 400));
    const clusters: THREE.Vector3[] = [];

    for (let c = 0; c < clusterCount; c++) {
        clusters.push(
            new THREE.Vector3(
                (Math.random() - 0.5) * spread,
                (Math.random() - 0.5) * spread,
                (Math.random() - 0.5) * spread
            )
        );
    }

    for (let i = 0; i < count; i++) {
        let x: number, y: number, z: number;
        if (Math.random() < 0.55 && clusters.length) {
            const c = clusters[Math.floor(Math.random() * clusters.length)];
            const r = spread * 0.12;
            x = c.x + (Math.random() - 0.5) * r;
            y = c.y + (Math.random() - 0.5) * r;
            z = c.z + (Math.random() - 0.5) * r;
        } else {
            x = (Math.random() - 0.5) * spread;
            y = (Math.random() - 0.5) * spread;
            z = (Math.random() - 0.5) * spread;
        }

        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;

        const roll = Math.random();
        if (roll < 0.7) {
            tint.copy(baseColor);
        } else if (roll < 0.85) {
            tint.setHex(0xbfd7ff); // Blue-white stars
        } else {
            tint.setHex(0xffd9a8); // Warm amber/gold stars
        }

        colors[i * 3] = tint.r;
        colors[i * 3 + 1] = tint.g;
        colors[i * 3 + 2] = tint.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
        size,
        vertexColors: true,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.9,
    });

    return new THREE.Points(geo, mat);
}

export function createGalaxy(scene: THREE.Scene): THREE.Group {
    const starfieldGroup = new THREE.Group();

    // ─── 3 Clustered Star Layers ──────────────────────────────────────────
    // Layer 1: Dense micro-star backdrop (6,000 stars)
    starfieldGroup.add(makeStarLayer({ count: 6000, spread: 400, size: 0.09, color: 0xffffff }));

    // Layer 2: Mid-sized stars (900 stars)
    starfieldGroup.add(makeStarLayer({ count: 900, spread: 380, size: 0.18, color: 0xffffff }));

    // Layer 3: Prominent bright foreground stars (60 stars)
    starfieldGroup.add(makeStarLayer({ count: 60, spread: 350, size: 0.34, color: 0xffffff }));

    scene.add(starfieldGroup);
    return starfieldGroup;
}
