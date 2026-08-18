/**
 * @file Sun.ts
 * @description Brutal Sun with customizable Crown Width (Corona) and 4 Puntas Star Flare.
 */
import * as THREE from 'three';

// =========================================================================
// 🎛️ CONTROLS FOR SUN, CROWN & 4 PUNTAS:
//
// 1. Sun Core Scale:
export const SUN_SCALE = 1.75;

// 2. Sunlight illuminating Earth:
export const EARTH_SUNLIGHT_INTENSITY = 1.2;

// 3. 👑 CROWN WIDTH & GLOW (The glowing outer crown/corona around the sun):
export const CROWN_WIDTH = 2.0;              // Thickness/reach of the outer glowing crown (Try 1.3 for tight, 2.5 for wide, 4.0 for massive)
export const CROWN_OPACITY = 0.85;           // Brightness of the crown glow (Try 0.4 to 1.5)

// 4. 🌟 4 PUNTAS (Star flare points):
export const FLARE_4_PUNTAS_SIZE = 14.0;     // Total length/size of the 4 puntas (Try 8.0 to 22.0)
export const FLARE_4_PUNTAS_BEAM_WIDTH = 25.0;// Width of each punta beam at base (Try 5.0 to 50.0)
export const FLARE_4_PUNTAS_OPACITY = 0.70;  // Glow of the 4 puntas (Try 0.3 to 1.0)
export const FLARE_4_PUNTAS_COLOR = 0xff9922;// Color of the 4 puntas (e.g. 0xff8800, 0xffaa33)
// =========================================================================

export interface RealisticSunInstance {
    group: THREE.Group;
    update: (time: number, camera?: THREE.Camera) => void;
}

export function createRealisticSun(scene: THREE.Scene, position: THREE.Vector3): RealisticSunInstance {
    const sunGroup = new THREE.Group();
    sunGroup.position.copy(position);

    // Scaling factor for distant positioning
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

        float rimBand = smoothstep(0.25, 1.0, fresnel);
        color = mix(color, uColorRim, rimBand * 0.75);

        color = pow(color, vec3(0.9));
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // ─── Corona Shaders ──────────────────────────────────────────────────
    const CORONA_VERTEX = `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const CORONA_FRAGMENT = `
      precision highp float;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uTime;

      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
      }

      void main() {
        float fresnel = 1.0 - abs(dot(vNormal, vViewDir));
        fresnel = pow(fresnel, 1.5);
        float t = uTime * 0.2;
        float coronaNoise = noise(vNormal.xy*3.0+t)*0.5 +
                           noise(vNormal.xy*7.0-t*0.5)*0.3 +
                           noise(vNormal.xy*15.0+t*0.3)*0.2;
        float corona = pow(fresnel, 1.5) * (0.8 + coronaNoise*0.4);
        float alpha = corona * uOpacity;
        gl_FragColor = vec4(uColor * (1.2 + fresnel), alpha);
      }
    `;

    // ─── 4 Puntas Star Flare Generator ───────────────────────────────────
    function create4PointStarTexture(): THREE.CanvasTexture {
        const size = 1024;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return new THREE.CanvasTexture(canvas);

        const center = size / 2;

        // Central Radial Glow
        const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
        gradient.addColorStop(0.0, 'rgba(255,255,245,1.0)');
        gradient.addColorStop(0.12, 'rgba(255,210,80,0.85)');
        gradient.addColorStop(0.32, 'rgba(255,140,30,0.40)');
        gradient.addColorStop(0.65, 'rgba(255,70,15,0.10)');
        gradient.addColorStop(1.0, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        ctx.globalCompositeOperation = 'screen';

        function drawTaperedSpike(angle: number, length: number, baseWidth: number, alpha: number) {
            if (!ctx) return;
            ctx.save();
            ctx.translate(center, center);
            ctx.rotate(angle);

            ctx.beginPath();
            ctx.moveTo(0, -baseWidth / 2);
            ctx.lineTo(length, 0);
            ctx.lineTo(0, baseWidth / 2);
            ctx.lineTo(-baseWidth * 0.3, 0);
            ctx.closePath();

            const rayGrad = ctx.createLinearGradient(0, 0, length, 0);
            rayGrad.addColorStop(0.0, `rgba(255,255,240,${alpha})`);
            rayGrad.addColorStop(0.20, `rgba(255,190,60,${alpha * 0.85})`);
            rayGrad.addColorStop(0.60, `rgba(255,100,20,${alpha * 0.40})`);
            rayGrad.addColorStop(1.0, 'rgba(255,40,10,0)');
            ctx.fillStyle = rayGrad;
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(length * 0.95, 0);
            ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.9})`;
            ctx.lineWidth = Math.max(1, baseWidth * 0.12);
            ctx.stroke();

            ctx.restore();
        }

        // 🌟 4 Puntas (0°, 90°, 180°, 270°)
        const dominantAngles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
        const spikeLength = center * 0.95;

        dominantAngles.forEach((angle) => {
            drawTaperedSpike(angle, spikeLength, FLARE_4_PUNTAS_BEAM_WIDTH, 0.95);
            drawTaperedSpike(angle, spikeLength * 0.8, FLARE_4_PUNTAS_BEAM_WIDTH * 2.0, 0.40);
        });

        // Subtle micro-rays
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.1;
            const len = center * (0.25 + Math.random() * 0.35);
            drawTaperedSpike(angle, len, 4.0, 0.25);
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

    // Sunlight illuminating Earth
    const sunLight = new THREE.DirectionalLight(0xfff8f0, EARTH_SUNLIGHT_INTENSITY);
    sunLight.position.copy(position);
    sunLight.target.position.set(0, 0, 0);
    scene.add(sunLight);
    scene.add(sunLight.target);

    // 👑 4 Layered Corona Crown Shells scaling with CROWN_WIDTH
    const coronaConfigs = [
        { r: 1.2 + (CROWN_WIDTH - 1.0) * 0.20, color: 0xffdd88, op: 0.60 * CROWN_OPACITY, speed: 0.15 },
        { r: 1.2 + (CROWN_WIDTH - 1.0) * 0.50, color: 0xffaa44, op: 0.45 * CROWN_OPACITY, speed: 0.10 },
        { r: 1.2 + (CROWN_WIDTH - 1.0) * 0.90, color: 0xff6600, op: 0.30 * CROWN_OPACITY, speed: 0.08 },
        { r: 1.2 + (CROWN_WIDTH - 1.0) * 1.40, color: 0xff3300, op: 0.15 * CROWN_OPACITY, speed: 0.05 },
    ];
    const coronaUniforms: Array<{ uniforms: { uTime: { value: number }; uColor: { value: THREE.Color }; uOpacity: { value: number } }; speed: number }> = [];

    coronaConfigs.forEach(cfg => {
        const u = {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(cfg.color) },
            uOpacity: { value: cfg.op },
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

    // 🌟 4 Puntas Star Flare Billboard
    const starTex = create4PointStarTexture();
    const starMat = new THREE.MeshBasicMaterial({
        map: starTex,
        transparent: true,
        opacity: FLARE_4_PUNTAS_OPACITY,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: FLARE_4_PUNTAS_COLOR,
    });
    const starMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(FLARE_4_PUNTAS_SIZE, FLARE_4_PUNTAS_SIZE),
        starMat
    );
    sunGroup.add(starMesh);

    scene.add(sunGroup);

    return {
        group: sunGroup,
        update: (time: number, camera?: THREE.Camera) => {
            sunUniforms.uTime.value = time;
            coronaUniforms.forEach(c => {
                c.uniforms.uTime.value = time * c.speed;
            });

            if (camera) {
                starMesh.lookAt(camera.position);
            }

            starMat.opacity = FLARE_4_PUNTAS_OPACITY + Math.sin(time * 0.6) * 0.05;
        }
    };
}
