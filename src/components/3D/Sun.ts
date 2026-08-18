/**
 * @file Sun.ts
 * @description Brutal Sun implementation matching the user's specification.
 */
import * as THREE from 'three';

// =========================================================================
// 🎛️ SINGLE CONTROLS FOR SUN & LIGHTING:
// 1. Brightness on Earth (Default: 1.2):
export const EARTH_SUNLIGHT_INTENSITY = 1.2;

// 2. Sun Visual Size / Scale (Resized to 0.5X -> 1.75):
export const SUN_SCALE = 1.75;
// =========================================================================

export interface RealisticSunInstance {
    group: THREE.Group;
    update: (time: number) => void;
}

export function createRealisticSun(scene: THREE.Scene, position: THREE.Vector3): RealisticSunInstance {
    const sunGroup = new THREE.Group();
    sunGroup.position.copy(position);

    // Scaling factor for distant positioning (0.5X scale)
    sunGroup.scale.set(SUN_SCALE, SUN_SCALE, SUN_SCALE);

    // ─── Sun Surface Shaders ─────────────────────────────────────────────
    const SUN_SURFACE_VERTEX = `
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const SUN_SURFACE_FRAGMENT = `
      precision highp float;
      varying vec2 vUv;
      varying vec3 vNormal;
      uniform float uTime;
      uniform vec3 uColorCore;
      uniform vec3 uColorMid;
      uniform vec3 uColorDark;
      uniform vec3 uColorRim;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      float fbm(vec2 p) {
        float value = 0.0, amplitude = 0.5, frequency = 1.0;
        for (int i = 0; i < 6; i++) {
          value += amplitude * snoise(p * frequency);
          amplitude *= 0.5; frequency *= 2.0;
        }
        return value;
      }

      void main() {
        vec2 uv = vUv * 4.0;
        float t = uTime * 0.05;
        float n1 = fbm(uv + vec2(t, t*0.3));
        float n2 = fbm(uv*2.0 - vec2(t*0.7, t*0.2));
        float n3 = fbm(uv*0.5 + vec2(t*0.1, -t*0.15));
        float spots = smoothstep(0.4, 0.6, n3) * smoothstep(0.2, 0.5, n2);
        float surfacePattern = n1*0.5 + n2*0.3 + n3*0.2;
        float fresnel = 1.0 - max(dot(vNormal, vec3(0.0,0.0,1.0)), 0.0);
        float limbDarkening = 1.0 - fresnel * 0.6;

        vec3 color = mix(uColorDark, uColorMid, surfacePattern*0.5+0.5);
        color = mix(color, uColorCore, n2*0.4+0.3);
        color = mix(color, uColorDark*0.3, spots*0.7);
        color *= limbDarkening;
        color *= (1.2 + n1*0.3);

        // Explicit rim color band so the edge doesn't wash out to white.
        float rimBand = smoothstep(0.35, 1.0, fresnel);
        color = mix(color, uColorRim, rimBand * 0.65);

        color = pow(color, vec3(0.9));
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // ─── Corona Shaders ──────────────────────────────────────────────────
    const CORONA_VERTEX = `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying float vDist;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPosition.xyz);
        vDist = length(mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const CORONA_FRAGMENT = `
      precision highp float;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying float vDist;
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uTime;
      uniform float uRadius;

      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
      }

      void main() {
        float fresnel = 1.0 - abs(dot(vNormal, vViewDir));
        fresnel = pow(fresnel, 2.0);
        float radial = 1.0 - smoothstep(0.0, uRadius, vDist);
        float t = uTime * 0.2;
        float coronaNoise = noise(vNormal.xy*3.0+t)*0.5 +
                           noise(vNormal.xy*7.0-t*0.5)*0.3 +
                           noise(vNormal.xy*15.0+t*0.3)*0.2;
        float corona = pow(fresnel, 1.5) * (0.8 + coronaNoise*0.4);
        float alpha = corona * uOpacity * radial;
        gl_FragColor = vec4(uColor * (1.0+fresnel), alpha);
      }
    `;

    // ─── Procedural Flare Texture ────────────────────────────
    function createProceduralFlareTexture(): THREE.CanvasTexture {
        const size = 1024;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return new THREE.CanvasTexture(canvas);

        const center = size / 2;

        const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
        gradient.addColorStop(0.0, 'rgba(255,255,240,1.0)');
        gradient.addColorStop(0.1, 'rgba(255,240,200,0.8)');
        gradient.addColorStop(0.3, 'rgba(255,200,100,0.35)');
        gradient.addColorStop(0.6, 'rgba(255,100,50,0.08)');
        gradient.addColorStop(1.0, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        ctx.globalCompositeOperation = 'screen';

        function drawRay(angle: number, len: number, width: number, alpha: number) {
            if (!ctx) return;
            const x = center + Math.cos(angle) * len;
            const y = center + Math.sin(angle) * len;
            const rayGrad = ctx.createLinearGradient(center, center, x, y);
            rayGrad.addColorStop(0.0, `rgba(255,255,230,${alpha})`);
            rayGrad.addColorStop(0.4, `rgba(255,190,80,${alpha * 0.35})`);
            rayGrad.addColorStop(1.0, 'rgba(255,100,30,0)');
            ctx.strokeStyle = rayGrad;
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        // 4 dominant spikes at roughly 90° apart, jittered
        const dominantAngles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
        dominantAngles.forEach((baseAngle) => {
            const angle = baseAngle + (Math.random() - 0.5) * 0.12;
            const len = center * (0.85 + Math.random() * 0.15);
            drawRay(angle, len, 3.0 + Math.random() * 1.5, 0.75);
        });

        // Irregular secondary flecks — random count, angle, length, width
        const secondaryCount = 18 + Math.floor(Math.random() * 10);
        for (let i = 0; i < secondaryCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const len = center * (0.2 + Math.random() * 0.45);
            const width = 0.5 + Math.random() * 1.3;
            const alpha = 0.15 + Math.random() * 0.25;
            drawRay(angle, len, width, alpha);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    // ─── Build Sun Components ───────────────────────────────────────────
    // Core
    const sunUniforms = {
        uTime: { value: 0 },
        uColorCore: { value: new THREE.Color(0xfff2df) },
        uColorMid: { value: new THREE.Color(0xffc233) },
        uColorDark: { value: new THREE.Color(0xff5500) },
        uColorRim: { value: new THREE.Color(0xff7a1a) },
    };

    const sunMat = new THREE.ShaderMaterial({
        vertexShader: SUN_SURFACE_VERTEX,
        fragmentShader: SUN_SURFACE_FRAGMENT,
        uniforms: sunUniforms,
    });
    const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(1.2, 128, 128), sunMat);
    sunGroup.add(sunMesh);

    // Sunlight illuminating Earth (Directional parallel rays: covers entire 180° hemisphere without distance falloff)
    const sunLight = new THREE.DirectionalLight(0xfff8f0, EARTH_SUNLIGHT_INTENSITY);
    sunLight.position.copy(position);
    sunLight.target.position.set(0, 0, 0);
    scene.add(sunLight);
    scene.add(sunLight.target);

    // Corona layers
    const coronaConfigs = [
        { r: 1.35, color: 0xffdd88, op: 0.4, speed: 0.15 },
        { r: 1.65, color: 0xffaa44, op: 0.25, speed: 0.10 },
        { r: 2.1, color: 0xff6600, op: 0.12, speed: 0.08 },
        { r: 2.8, color: 0xff3300, op: 0.06, speed: 0.05 },
    ];
    const coronaUniforms: Array<{ uniforms: { uTime: { value: number }; uColor: { value: THREE.Color }; uOpacity: { value: number }; uRadius: { value: number } }; speed: number }> = [];

    coronaConfigs.forEach(cfg => {
        const u = {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(cfg.color) },
            uOpacity: { value: cfg.op },
            uRadius: { value: cfg.r * 2 },
        };
        coronaUniforms.push({ uniforms: u, speed: cfg.speed });
        const mat = new THREE.ShaderMaterial({
            vertexShader: CORONA_VERTEX,
            fragmentShader: CORONA_FRAGMENT,
            uniforms: u,
            transparent: true,
            depthWrite: false,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
        });
        sunGroup.add(new THREE.Mesh(new THREE.SphereGeometry(cfg.r, 64, 64), mat));
    });

    // Flare billboard
    const flareTex = createProceduralFlareTexture();
    const flareMat = new THREE.MeshBasicMaterial({
        map: flareTex,
        transparent: true,
        opacity: 0.15,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: 0xffddaa,
    });
    const flareMesh = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), flareMat);
    sunGroup.add(flareMesh);

    scene.add(sunGroup);

    return {
        group: sunGroup,
        update: (time: number) => {
            sunUniforms.uTime.value = time;
            coronaUniforms.forEach(c => {
                c.uniforms.uTime.value = time * c.speed;
            });

            const camera = scene.children.find(child => (child as any).isPerspectiveCamera || (child as any).isCamera) as THREE.Camera | undefined;
            if (camera) {
                flareMesh.quaternion.copy(camera.quaternion);
            }

            flareMat.opacity = 0.12 + Math.sin(time * 0.5) * 0.03;
        }
    };
}
