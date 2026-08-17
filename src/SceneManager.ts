// pretty usuful channel
// https://www.youtube.com/watch?v=1UTqFAjYx1k

/**
 * @file SceneManager.ts
 * @description Core engine for the 3D Earth visualization. 
 * Manages the Three.js lifecycle: Scene, Camera, Renderer, and Animation Loop.
 * Handles responsive window scaling and component orchestration.
 */

import * as THREE from 'three'; // the 3D library three.js
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'; // the camera controls
import { createGalaxy } from '@/components/3D/Galaxy'; // the galaxy component
import { createEarth } from '@/components/3D/Earth'; // the earth component
import { createAtmosphere } from '@/components/3D/Atmosphere'; // the atmosphere component
import { createSun } from '@/components/3D/Sun'; // the sun component

/**
 * SceneManager orchestrates the 3D environment.
 * It serves as the main entry point for all Three.js logic.
 */
export class SceneManager {
    // --- Properties (State) ---
    private scene: THREE.Scene; // the main scene
    private camera: THREE.PerspectiveCamera; // the camera
    private renderer: THREE.WebGLRenderer; // the renderer
    private controls: OrbitControls; // the controls
    private earthGroup: THREE.Group; // the earth group
    private earth: THREE.Mesh; // the earth
    private clouds: THREE.Mesh; // the clouds

    /**
     * Initializes the 3D world.
     * @param canvasContainer The HTML element where the 3D canvas will be injected.
     */
    constructor(canvasContainer: HTMLElement) {
        // 1. Initialize Core Components
        this.scene = new THREE.Scene();

        const isMobile = window.innerWidth < 768;
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = isMobile ? 6.0 : 2.5;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        canvasContainer.appendChild(this.renderer.domElement);

        // 2. Setup Loading Manager
        const loadingManager = new THREE.LoadingManager();
        const loaderElement = document.getElementById('loader');
        const barElement = document.querySelector('.loader-bar') as HTMLElement;

        loadingManager.onProgress = (_url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            if (barElement) barElement.style.width = `${progress}%`;
        };

        loadingManager.onLoad = () => {
            if (loaderElement) {
                setTimeout(() => {
                    loaderElement.classList.add('hidden');
                }, 500);
            }
        };

        // 3. Setup Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 0.5;
        this.controls.minDistance = isMobile ? 4.0 : 2.0;
        this.controls.maxDistance = isMobile ? 6.0 : 5.0;
        this.controls.enablePan = false;
        this.controls.target.set(0, 0, 0);

        // 4. Build Universe
        createGalaxy(this.scene);

        // Add the Sun representing the light source in the background
        const sunPosition = new THREE.Vector3(12, 7, 12);
        createSun(this.scene, sunPosition);

        this.earthGroup = new THREE.Group();
        this.earthGroup.rotation.z = 23.5 * Math.PI / 180;
        this.scene.add(this.earthGroup);

        const earthObj = createEarth(this.earthGroup, loadingManager);
        this.earth = earthObj.earth;
        this.clouds = earthObj.clouds;

        const atmosphere = createAtmosphere();
        this.scene.add(atmosphere);

        // 5. Setup Lighting
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
        sunLight.position.copy(sunPosition); // Align light direction with Sun mesh visual position
        this.scene.add(sunLight);

        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        // 6. Events
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    onWindowResize() { // handles window resize
        const isMobile = window.innerWidth < 768;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        // Update distance on resize
        this.camera.position.z = isMobile ? 6.0 : 2.5;
        this.camera.updateProjectionMatrix();

        // Update zoom limits (on resize)
        this.controls.minDistance = isMobile ? 4.0 : 2.0;
        this.controls.maxDistance = isMobile ? 6.0 : 5.0;

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() { // handles animation
        requestAnimationFrame(this.animate.bind(this));

        this.earth.rotation.y += 0.001;
        this.clouds.rotation.y += 0.0013;

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
