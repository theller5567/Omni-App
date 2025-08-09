import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

type ThreeBillboardParticlesProps = {
  count?: number;              // total number of particles
  baseSizePx?: number;         // base point size in pixels
  maxBoostPx?: number;         // additional size boost near cursor
  interactionRadius?: number;  // world-space radius of mouse influence
  color?: string;              // CSS color
  springStrength?: number;     // how strongly points return to base
  damping?: number;            // velocity damping 0..1
  repelStrength?: number;      // mouse repulsion scalar
  noiseStrength?: number;      // drifting noise scalar
  sizeJitterPx?: number;       // +/- random size jitter added to baseSizePx
  timeScale?: number;          // global speed scale for drift/forces (0.0..1.0)
  respectReducedMotion?: boolean; // if true, do not render when user prefers reduced motion
  pauseOnHidden?: boolean;        // pause the RAF when document is hidden
};

// Billboard particles background inspired by the three.js points billboards example:
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_points_billboards.html
// This renders lightweight circular point sprites that react to the mouse by growing
// slightly and being gently repelled, while drifting back to their base positions.
const ThreeBillboardParticles: React.FC<ThreeBillboardParticlesProps> = ({
  count = 900,
  baseSizePx = 1.7,
  maxBoostPx = 2.6,
  interactionRadius = 1.5,
  color = '#8da6ff',
  springStrength = 0.0002, // more subtle than previous 0.0035
  damping = 0.992,        // more damping than previous 0.985
  repelStrength = 0.02,   // gentler than previous 0.12
  noiseStrength = 0.0005, // softer than previous 0.0008
  sizeJitterPx = 0.35,
  timeScale = 0.4,
  respectReducedMotion = true,
  pauseOnHidden = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const isPausedRef = useRef<boolean>(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Respect reduced motion: bail early and render nothing
    if (respectReducedMotion && typeof window !== 'undefined') {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mql.matches) {
        return;
      }
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    // A subtle vignette via fog can help depth perception
    scene.fog = new THREE.Fog(0x000000, 50, 140);

    // Sizing and camera framing
    const resize = () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    resize();

    // Camera: set back from z=0 plane and look at origin
    camera.position.set(0, 0, 40);
    camera.lookAt(0, 0, 0);

    // Geometry buffers
    const positions = new Float32Array(count * 3);
    const basePositions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const baseSizes = new Float32Array(count);
    // Per-particle noise decorrelation to avoid banding/grid feel
    const noisePhaseX = new Float32Array(count);
    const noisePhaseY = new Float32Array(count);
    const noiseSpeedX = new Float32Array(count);
    const noiseSpeedY = new Float32Array(count);

    const refillParticles = () => {
      // Compute frustum size at z=0 plane
      const distance = Math.abs(camera.position.z - 0);
      const vExtent = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * distance; // half-height
      const hExtent = vExtent * camera.aspect; // half-width
      for (let i = 0; i < count; i++) {
        const ix = i * 3;
        const x = THREE.MathUtils.randFloatSpread(hExtent * 2);
        const y = THREE.MathUtils.randFloatSpread(vExtent * 2);
        const z = (Math.random() * 2 - 1) * 2; // small depth range for parallax
        basePositions[ix] = x;
        basePositions[ix + 1] = y;
        basePositions[ix + 2] = z;
        positions[ix] = x;
        positions[ix + 1] = y;
        positions[ix + 2] = z;
        velocities[ix] = (Math.random() * 2 - 1) * 0.02;
        velocities[ix + 1] = (Math.random() * 2 - 1) * 0.02;
        velocities[ix + 2] = 0;
        const jitter = THREE.MathUtils.randFloatSpread(sizeJitterPx * 2);
        const s = Math.max(0.2, baseSizePx + jitter);
        baseSizes[i] = s;
        sizes[i] = s;
        // Randomize noise phases and speeds (slight range) per particle
        noisePhaseX[i] = Math.random() * Math.PI * 2;
        noisePhaseY[i] = Math.random() * Math.PI * 2;
        noiseSpeedX[i] = 0.4 + Math.random() * 0.6; // 0.4..1.0
        noiseSpeedY[i] = 0.4 + Math.random() * 0.6; // 0.4..1.0
      }
    };
    refillParticles();

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader draws circular sprites without a texture
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float size;
        uniform float uPixelRatio;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          // size is in CSS pixels; multiply by DPR to get device pixels
          gl_PointSize = size * uPixelRatio;
          // Optional perspective attenuation can be enabled if desired:
          // gl_PointSize *= (300.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        precision mediump float;
        uniform vec3 uColor;
        void main() {
          // gl_PointCoord is from 0..1; make a soft circular mask
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          float alpha = smoothstep(0.5, 0.45, d); // soft edge circle
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Mouse → world position on z=0 plane
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const mouseWorld = new THREE.Vector3(9999, 0, 0);

    const handlePointer = (event: MouseEvent | Touch) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const cx = (event.clientX - rect.left) / rect.width;
      const cy = (event.clientY - rect.top) / rect.height;
      ndc.set(cx * 2 - 1, -(cy * 2 - 1));
      raycaster.setFromCamera(ndc, camera);
      raycaster.ray.intersectPlane(plane, mouseWorld);
    };

    const onMouseMove = (e: MouseEvent) => handlePointer(e);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) handlePointer(e.touches[0]);
    };
    const onMouseLeave = () => mouseWorld.set(9999, 0, 0);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('mouseleave', onMouseLeave);

    // Animation loop
    const clock = new THREE.Clock();
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const sizeAttr = geometry.getAttribute('size') as THREE.BufferAttribute;

    const animate = () => {
      if (isPausedRef.current) return; // safety guard
      const dt = clock.getDelta();
      const t = (clock.elapsedTime) * timeScale;
      const dtScale = dt * 60 * timeScale; // normalize to ~60fps base

      const spring = springStrength;      // pull back to base (prop)
      const dampingFactor = damping;      // velocity damping (prop)
      const influenceRadius = interactionRadius;
      const sigma = influenceRadius * 0.45;
      const twoSigmaSq = 2 * sigma * sigma;

      for (let i = 0; i < count; i++) {
        const ix = i * 3;
        const x = positions[ix];
        const y = positions[ix + 1];

        // Cursor repulsion in plane
        const dx = x - mouseWorld.x;
        const dy = y - mouseWorld.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < influenceRadius * influenceRadius) {
          const dist = Math.sqrt(Math.max(distSq, 0.0001));
          const repel = (1 - dist / influenceRadius) * repelStrength; // strength (prop)
          velocities[ix] += (dx / dist) * repel * dtScale;
          velocities[ix + 1] += (dy / dist) * repel * dtScale;
        }

        // Gentle per-particle flow noise
        velocities[ix] += Math.sin(noisePhaseX[i] + t * noiseSpeedX[i]) * (noiseStrength * dtScale);
        velocities[ix + 1] += Math.cos(noisePhaseY[i] - t * noiseSpeedY[i]) * (noiseStrength * dtScale);

        // Spring back to base
        velocities[ix] += (basePositions[ix] - x) * (spring * dtScale);
        velocities[ix + 1] += (basePositions[ix + 1] - y) * (spring * dtScale);

        // Integrate and damp
        positions[ix] += velocities[ix];
        positions[ix + 1] += velocities[ix + 1];
        const damp = Math.pow(dampingFactor, dt * 60);
        velocities[ix] *= damp;
        velocities[ix + 1] *= damp;

        // Size boost with Gaussian falloff around cursor
        const boost = Math.exp(-distSq / twoSigmaSq) * maxBoostPx;
        sizes[i] = baseSizes[i] + boost;
      }

      // Upload updates
      posAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;

      // Delicate rotation for depth and motion
      scene.rotation.z = Math.sin(t * 0.05) * 0.02;

      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      resize();
      // Update DPR uniform
      (material.uniforms.uPixelRatio as { value: number }).value = Math.min(window.devicePixelRatio, 2);
      // Refill particle positions to cover the new frustum
      refillParticles();
      const posAttr2 = geometry.getAttribute('position') as THREE.BufferAttribute;
      const sizeAttr2 = geometry.getAttribute('size') as THREE.BufferAttribute;
      posAttr2.needsUpdate = true;
      sizeAttr2.needsUpdate = true;
    };
    window.addEventListener('resize', onResize);

    // Pause when tab hidden
    const onVisibility = () => {
      if (!pauseOnHidden) return;
      if (document.hidden) {
        if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
        isPausedRef.current = true;
      } else {
        if (!animationIdRef.current) {
          isPausedRef.current = false;
          clock.getDelta(); // reset delta to avoid jump
          animationIdRef.current = requestAnimationFrame(animate);
        }
      }
    };
    if (pauseOnHidden && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility);
    }

    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', onResize);
      if (pauseOnHidden && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [count, baseSizePx, maxBoostPx, interactionRadius, color]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      aria-hidden
    />
  );
};

export default ThreeBillboardParticles;


