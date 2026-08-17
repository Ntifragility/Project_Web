/**
 * @file Sun.ts
 * @description Creates the Sun mesh and light source for the 3D Solar Scene.
 */
import * as THREE from 'three';

export function createSun(scene: THREE.Scene, position: THREE.Vector3): THREE.Mesh {
    // 1. Create Sun core geometry and self-illuminated material
    const sunGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xffdd44,
        transparent: true,
        opacity: 0.95
    });
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    sunMesh.position.copy(position);
    scene.add(sunMesh);

    // 2. Point Light radiating from the Sun core to illuminate Earth
    const sunLight = new THREE.PointLight(0xfff5ea, 3.0, 150, 0.5);
    sunLight.position.copy(position);
    scene.add(sunLight);

    // 3. Corona / Atmosphere solar glow shell
    const glowGeometry = new THREE.SphereGeometry(1.6, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.25,
        side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.copy(position);
    scene.add(glowMesh);

    return sunMesh;
}
