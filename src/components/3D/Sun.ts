/**
 * @file Sun.ts
 * @description Ultra-realistic Sun with convective plasma granulation, limb darkening,
 * dynamic magnetic flux loops (solar prominences), coronal mass ejections (CME), and additive corona.
 * Scaled down to 0.5x baseline size (2x larger than the previous 0.25x scale).
 */
import * as THREE from 'three';

export interface RealisticSunInstance {
    group: THREE.Group;
    update: (time: number) => void;
}

export function createRealisticSun(scene: THREE.Scene, position: THREE.Vector3): RealisticSunInstance {
    const sunGroup = new THREE.Group();
    sunGroup.position.copy(position);

    // Shared Simplex Noise GLSL chunk
    const noiseGLSL = `
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
            const vec2 C = vec2(1.0/6.0, 1.0/3.0);
            const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
            vec3 i  = floor(v + dot(v, C.yyy));
            vec3 x0 = v - i + dot(i, C.xxx);
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min(g.xyz, l.zxy);
            vec3 i2 = max(g.xyz, l.zxy);
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy;
            vec3 x3 = x0 - D.yyy;
            i = mod289(i);
            vec4 p = permute(permute(permute(
                        i.z + vec4(0.0, i1.z, i2.z, 1.0))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
            float n_ = 0.142857142857;
            vec3  ns = n_ * D.wyz - D.xzx;
            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_);
            vec4 x = x_ *ns.x + ns.yyyy;
            vec4 y = y_ *ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
            vec4 b0 = vec4(x.xy, y.xy);
            vec4 b1 = vec4(x.zw, y.zw);
            vec4 s0 = floor(b0)*2.0 + 1.0;
            vec4 s1 = floor(b1)*2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
            vec3 p0 = vec3(a0.xy, h.x);
            vec3 p1 = vec3(a0.zw, h.y);
            vec3 p2 = vec3(a1.xy, h.z);
            vec3 p3 = vec3(a1.zw, h.w);
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
            p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
            vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
            m = m * m;
            return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        float fbm(vec3 p) {
            float v = 0.0;
            float a = 0.5;
            vec3 shift = vec3(100.0);
            for (int i = 0; i < 4; ++i) {
                v += a * snoise(p);
                p = p * 2.0 + shift;
                a *= 0.5;
            }
            return v;
        }
    `;

    // 1. Core Photosphere (Radius 2.0 * 0.5 = 1.0)
    const sunGeometry = new THREE.SphereGeometry(1.0, 64, 64);
    const sunMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uColorCore: { value: new THREE.Color(0xffffff) },
            uColorMid: { value: new THREE.Color(0xffa200) },
            uColorDark: { value: new THREE.Color(0x8a1800) },
            uColorDeep: { value: new THREE.Color(0x220200) }
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec3 vViewPosition;

            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewPosition = -mvPosition.xyz;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform vec3 uColorCore;
            uniform vec3 uColorMid;
            uniform vec3 uColorDark;
            uniform vec3 uColorDeep;

            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec3 vViewPosition;

            ${noiseGLSL}

            void main() {
                // Scale coordinate back to standard noise density (multiplied by 2.0, which is / 0.5)
                vec3 p = (vPosition * 2.0) * 4.0;
                float t = uTime * 0.15;
                
                // Convective solar granules
                float n1 = fbm(p + vec3(0.0, 0.0, t));
                float n2 = fbm(p * 2.0 - vec3(t, 0.0, 0.0));
                float plasma = smoothstep(-0.2, 0.8, n1 + n2 * 0.5);

                // Magnetic activity flare points
                float spotNoise = snoise((vPosition * 2.0) * 1.5 + vec3(0.0, t * 0.05, 0.0));
                float flareMask = smoothstep(0.55, 0.85, spotNoise);

                // Limb Darkening
                vec3 normal = normalize(vNormal);
                vec3 viewDir = normalize(vViewPosition);
                float NdotV = max(dot(normal, viewDir), 0.0);
                float limb = pow(NdotV, 0.7);

                // Color grading & 0.25x brightness multiplier on core photosphere
                vec3 baseColor = mix(uColorDeep, uColorDark, plasma);
                baseColor = mix(baseColor, uColorMid, smoothstep(0.2, 0.9, plasma));
                vec3 litColor = mix(baseColor, uColorCore, limb * 0.85 + flareMask * 1.5) * 0.25;

                gl_FragColor = vec4(litColor, 1.0);
            }
        `
    });
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    sunGroup.add(sunMesh);

    // 2. Solar Prominences (Scaled 0.5x smaller, 0.25x brighter)
    const prominenceMaterials: THREE.ShaderMaterial[] = [];
    const numProminences = 6;
    for (let i = 0; i < numProminences; i++) {
        const torusGeo = new THREE.TorusGeometry(
            (0.6 + Math.random() * 0.4) * 0.5, 
            (0.08 + Math.random() * 0.04) * 0.5, 
            16, 
            64, 
            Math.PI * (0.8 + Math.random() * 0.4)
        );

        const promMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uOffset: { value: Math.random() * 100.0 }
            },
            vertexShader: `
                uniform float uTime;
                uniform float uOffset;
                varying vec2 vUv;
                varying vec3 vPos;
                ${noiseGLSL}

                void main() {
                    vUv = uv;
                    vec3 p = position;
                    // Magnetic loop turbulent displacement scaled 0.5x
                    float disp = snoise((p * 2.0) * 3.0 + vec3(0.0, 0.0, uTime * 0.4 + uOffset)) * 0.15 * 0.5;
                    p += normal * disp;
                    vPos = p;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform float uOffset;
                varying vec2 vUv;
                varying vec3 vPos;
                ${noiseGLSL}

                void main() {
                    float noise = fbm((vPos * 2.0) * 5.0 - vec3(uTime * 0.5 + uOffset, 0.0, 0.0));
                    float alpha = smoothstep(0.0, 0.5, sin(vUv.x * 3.14159)) * (noise * 0.5 + 0.5);
                    
                    vec3 col = mix(vec3(1.0, 0.15, 0.0), vec3(1.0, 0.7, 0.2), noise);
                    col = mix(col, vec3(1.0), smoothstep(0.6, 1.0, noise));
                    
                    // Col multiplied by 0.5 (0.25x brightness of original 2.0)
                    gl_FragColor = vec4(col * 0.5, alpha * 0.85);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        prominenceMaterials.push(promMat);
        const promMesh = new THREE.Mesh(torusGeo, promMat);

        // Position on scaled Sun's surface perimeter (r = 1.95 * 0.5 = 0.975)
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.acos(2 * Math.random() - 1);
        const r = 0.975;
        promMesh.position.set(
            r * Math.sin(theta) * Math.cos(phi),
            r * Math.sin(theta) * Math.sin(phi),
            r * Math.cos(theta)
        );
        promMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), promMesh.position.clone().normalize());
        promMesh.rotateZ(Math.random() * Math.PI);

        sunGroup.add(promMesh);
    }

    // 3. Coronal Mass Ejection (CME) Volumetric Jet Shell (2.8 * 0.5 = 1.4)
    const cmeGeometry = new THREE.SphereGeometry(1.4, 64, 64);
    const cmeMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 }
        },
        vertexShader: `
            uniform float uTime;
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec3 vViewPosition;
            ${noiseGLSL}

            void main() {
                vNormal = normalize(normalMatrix * normal);
                vec3 p = position;
                
                // Pulsing explosive expansion along noise channels scaled 0.5x
                float blast = max(0.0, snoise((position * 2.0) * 1.5 + vec3(uTime * 0.3, 0.0, 0.0)));
                p += normal * (blast * 0.8 * 0.5);
                
                vPosition = p;
                vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
                vViewPosition = -mvPosition.xyz;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform float uTime;
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec3 vViewPosition;
            ${noiseGLSL}

            void main() {
                vec3 viewDir = normalize(vViewPosition);
                vec3 normal = normalize(vNormal);
                float rim = 1.0 - max(dot(viewDir, normal), 0.0);
                
                float dynamicNoise = fbm((vPosition * 2.0) * 2.0 - vec3(0.0, uTime * 0.4, 0.0));
                float cmeIntensity = pow(rim, 3.0) * smoothstep(0.1, 0.7, dynamicNoise);

                vec3 cmeColor = mix(vec3(1.0, 0.2, 0.0), vec3(1.0, 0.8, 0.3), cmeIntensity);
                // Color multiplied by 0.625 (0.25x brightness of original 2.5)
                gl_FragColor = vec4(cmeColor * 0.625, cmeIntensity * 0.7);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide
    });
    const cmeMesh = new THREE.Mesh(cmeGeometry, cmeMaterial);
    sunGroup.add(cmeMesh);

    // 4. Optical Flare Billboard (Camera-facing Corona Glow) (12.0 * 0.5 = 6.0)
    const coronaGeo = new THREE.PlaneGeometry(6.0, 6.0);
    const coronaMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(0xff6600) }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform vec3 uColor;
            varying vec2 vUv;
            ${noiseGLSL}

            void main() {
                vec2 center = vUv - vec2(0.5);
                float dist = length(center) * 2.0;
                float angle = atan(center.y, center.x);

                // Turbulent ray streak modulation
                float rays = fbm(vec3(cos(angle * 6.0), sin(angle * 6.0), uTime * 0.2)) * 0.3;
                float intensity = 0.05 / (dist + rays * 0.1 + 0.02);
                intensity *= smoothstep(1.2, 0.1, dist);

                // Intensity multiplied by 0.5 (0.25x brightness of original 2.0)
                gl_FragColor = vec4(uColor * intensity * 0.5, intensity);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    sunGroup.add(coronaMesh);

    // 5. Directional Light for Illuminating Orbiting Planets (0.25x brightness: 5.0 * 0.25 = 1.25)
    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.25);
    sunLight.position.copy(position);
    sunLight.castShadow = true;
    scene.add(sunLight);

    scene.add(sunGroup);

    return {
        group: sunGroup,
        update: (time: number) => {
            sunMaterial.uniforms.uTime.value = time;
            cmeMaterial.uniforms.uTime.value = time;
            coronaMat.uniforms.uTime.value = time;
            for (let i = 0; i < prominenceMaterials.length; i++) {
                prominenceMaterials[i].uniforms.uTime.value = time;
            }

            // Billboard corona facing active camera
            const camera = scene.getObjectByProperty('type', 'PerspectiveCamera');
            if (camera) {
                coronaMesh.quaternion.copy(camera.quaternion);
            }
        }
    };
}
