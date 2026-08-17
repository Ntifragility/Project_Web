/**
 * @file Earth.ts
 * @description 3D earth globe component with selectable texture modes (night, dark, day).
 */
import * as THREE from 'three';

// =========================================================================
// 🌍 SELECT EARTH TEXTURE MODE:
// Choose between: 'night' | 'dark' | 'day'
export type EarthMode = 'night' | 'dark' | 'day';
export const EARTH_MODE: EarthMode = 'night';
// =========================================================================

const TEXTURE_PRESETS: Record<EarthMode, string> = {
    night: 'https://unpkg.com/three-globe/example/img/earth-night.jpg',
    dark:  'https://unpkg.com/three-globe/example/img/earth-dark.jpg',
    day:   'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
};

export function createEarth(scene: THREE.Group, loadingManager?: THREE.LoadingManager) {
    const loader = new THREE.TextureLoader(loadingManager);

    const BUMP_URL = 'https://unpkg.com/three-globe/example/img/earth-topology.png';
    const SPECULAR_URL = 'https://unpkg.com/three-globe/example/img/earth-water.png';
    const CLOUDS_URL = 'https://unpkg.com/three-globe/example/img/earth-clouds.png';
    const NIGHT_LIGHTS_URL = 'https://unpkg.com/three-globe/example/img/earth-night.jpg';

    const selectedMapUrl = TEXTURE_PRESETS[EARTH_MODE] || TEXTURE_PRESETS.night;

    // Earth Mesh (Configured dynamically based on selected mode)
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const material = new THREE.MeshStandardMaterial({
        map: loader.load(selectedMapUrl),
        bumpMap: loader.load(BUMP_URL),
        bumpScale: 0.05,
        roughnessMap: loader.load(SPECULAR_URL),
        roughness: EARTH_MODE === 'day' ? 0.6 : 0.45,
        metalness: 0.1,
        emissiveMap: loader.load(NIGHT_LIGHTS_URL),
        emissive: new THREE.Color(EARTH_MODE === 'day' ? 0x222222 : 0x555555),
        emissiveIntensity: EARTH_MODE === 'day' ? 0.5 : 0.9
    });
    const earth = new THREE.Mesh(geometry, material);
    scene.add(earth);

    // Cloud Layer
    const cloudGeometry = new THREE.SphereGeometry(1.01, 64, 64);
    const cloudMaterial = new THREE.MeshStandardMaterial({
        map: loader.load(CLOUDS_URL),
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        roughness: 1.0
    });
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    scene.add(clouds);

    return { earth, clouds };
}
