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

    // Earth Mesh (Phong)
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const material = new THREE.MeshPhongMaterial({
        map: loader.load(TEXTURE_URL),
        bumpMap: loader.load(BUMP_URL),
        bumpScale: 0.05,
        specularMap: loader.load(SPECULAR_URL),
        specular: new THREE.Color('grey'),
        shininess: 10
    });
    const earth = new THREE.Mesh(geometry, material);
    scene.add(earth);

    // Cloud Layer (Lambert)
    const cloudGeometry = new THREE.SphereGeometry(1.01, 64, 64);
    const cloudMaterial = new THREE.MeshLambertMaterial({
        map: loader.load(CLOUDS_URL),
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    scene.add(clouds);

    return { earth, clouds };
}
