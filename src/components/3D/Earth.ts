/**
 * @file Earth.ts
 * @description 3D earth globe component with shaders and textures.
 */
import * as THREE from 'three';

export function createEarth(scene: THREE.Group, loadingManager?: THREE.LoadingManager) {
    const loader = new THREE.TextureLoader(loadingManager);
    const TEXTURE_URL = 'https://unpkg.com/three-globe/example/img/earth-night.jpg';
    const BUMP_URL = 'https://unpkg.com/three-globe/example/img/earth-topology.png';
    const SPECULAR_URL = 'https://unpkg.com/three-globe/example/img/earth-water.png';
    const CLOUDS_URL = 'https://unpkg.com/three-globe/example/img/earth-clouds.png';

    // Earth Mesh (PBR Standard Material - constant reflection area independent of light intensity)
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const material = new THREE.MeshStandardMaterial({
        map: loader.load(TEXTURE_URL),
        bumpMap: loader.load(BUMP_URL),
        bumpScale: 0.04,
        roughnessMap: loader.load(SPECULAR_URL),
        roughness: 0.45,
        metalness: 0.05
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
