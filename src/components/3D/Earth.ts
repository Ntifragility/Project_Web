/**
 * @file Earth.ts
 * @description 3D earth globe component with selectable texture modes and tunable surface ruggedness.
 */
import * as THREE from 'three';

// =========================================================================
// 🌍 SELECT EARTH TEXTURE MODE:
// Choose between: 'night' | 'dark' | 'day'
export type EarthMode = 'night' | 'dark' | 'day';
export const EARTH_MODE: EarthMode = 'day';

// ⛰️ SURFACE RUGGEDNESS (Topography 3D Relief Depth):
// Increase this number for more pronounced mountains, ridges, and valleys.
// (Default was 0.05. Try 0.15, 0.20, 0.28 to dial in the ruggedness!)
export const EARTH_RUGGEDNESS = 0.05;
// =========================================================================

const TEXTURE_PRESETS: Record<EarthMode, string> = {
    night: 'https://unpkg.com/three-globe/example/img/earth-night.jpg',
    dark: 'https://unpkg.com/three-globe/example/img/earth-dark.jpg',
    day: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
};

export function createEarth(scene: THREE.Group, loadingManager?: THREE.LoadingManager) {
    const loader = new THREE.TextureLoader(loadingManager);

    const BUMP_URL = 'https://unpkg.com/three-globe/example/img/earth-topology.png';
    const SPECULAR_URL = 'https://unpkg.com/three-globe/example/img/earth-water.png';
    const CLOUDS_URL = 'https://unpkg.com/three-globe/example/img/earth-clouds.png';
    const NIGHT_LIGHTS_URL = 'https://unpkg.com/three-globe/example/img/earth-night.jpg';

    const selectedMapUrl = TEXTURE_PRESETS[EARTH_MODE] || TEXTURE_PRESETS.day;

    // Earth Mesh (Enhanced 3D topographic relief with high subdivision geometry)
    const geometry = new THREE.SphereGeometry(1, 128, 128);
    const material = new THREE.MeshStandardMaterial({
        map: loader.load(selectedMapUrl),
        bumpMap: loader.load(BUMP_URL),
        bumpScale: EARTH_RUGGEDNESS,
        roughnessMap: loader.load(SPECULAR_URL),
        roughness: EARTH_MODE === 'day' ? 0.75 : 0.55,
        metalness: 0.05,
        emissiveMap: loader.load(NIGHT_LIGHTS_URL),
        emissive: new THREE.Color(EARTH_MODE === 'day' ? 0x222222 : 0x555555),
        emissiveIntensity: EARTH_MODE === 'day' ? 0.5 : 0.9
    });
    const earth = new THREE.Mesh(geometry, material);
    scene.add(earth);

    // Cloud Layer (Positioned just above the rugged topography)
    const cloudGeometry = new THREE.SphereGeometry(1.015, 64, 64);
    const cloudMaterial = new THREE.MeshStandardMaterial({
        map: loader.load(CLOUDS_URL),
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        roughness: 1.0
    });
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    scene.add(clouds);

    return { earth, clouds };
}
