/**
 * @file main.ts
 * @description Application entry point.
 * Initializes the Three.js 3D Earth scene and starts the AppController (MVC router & orchestrator).
 */
import '@/styles/index.css';
import '@/styles/markdown.css';
import '@/styles/admin.css';
import { SceneManager } from '@/SceneManager';
import { AppController } from '@/controllers/AppController';

// 1. Initialize 3D Scene
const canvasContainer = document.getElementById('canvas-container') as HTMLElement;
const sceneManager = new SceneManager(canvasContainer);
sceneManager.animate();

// 2. Initialize MVC Application Controller
new AppController();