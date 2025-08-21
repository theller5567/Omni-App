import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// A minimal Three.js playground: sets up a renderer, scene, and camera.
// Starts with a blank canvas so we can add objects step-by-step later.
const LearningThree: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1) Scene and camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.set(0, 0, 3);
    camera.lookAt(0, 0, 0);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00, roughness: 0.6, metalness: 0.5 });
    const cube = new THREE.Mesh(geometry, material);
    const velocity = new THREE.Vector3(0, 0, 0);
    const gravity = new THREE.Vector3(0, -9.8, 0); // downwards m/s^2
    const horizontalAcceleration = 40;  // m/s^2
    const horizontalDrag = 12;          // 1/s (simple air drag)
    const restitution = 0.2;           // bounce 0..1
    const groundY = -1;                // matches your GridHelper height
    const halfSize = 0.5;              // cube is 1 unit tall
    const jumpImpulse = 3;             // upward velocity for a jump
    const runSpeed = 1.5;
    let onGround = false;              // updated each frame
    // Jump reliability helpers
    let coyoteTime = 0;                // seconds since last grounded
    const COYOTE_TIME_MAX = 0.1;       // allow jump shortly after leaving ground
    let jumpBufferTime = 0;            // seconds since last jump press
    const JUMP_BUFFER_MAX = 0.15;      // buffer quick taps
    const GROUND_EPS = 1e-4;           // tolerance for ground contact
    cube.position.set(0, groundY + halfSize, 0); // start on ground
    scene.add(cube);

    // 2) Renderer (alpha: true so background can be transparent)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setClearColor(0x000000, 1); // opaque black to make the canvas visible
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);
    const keysDown = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      keysDown.add(e.key);
      if (!e.repeat && (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.code === 'Space')) {
        jumpBufferTime = JUMP_BUFFER_MAX; // register intent to jump
      }
    };
    const onKeyUp = (e: KeyboardEvent) => keysDown.delete(e.key);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const clock = new THREE.Clock();

    const raycaster = new THREE.Raycaster();
    const pointNDC = new THREE.Vector2();
    let isHovered = false;

    const onPointerMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      pointNDC.set(x, y);
      
      raycaster.setFromCamera(pointNDC, camera);
      const hits = raycaster.intersectObject(cube, false);

      if (hits.length > 0) {
        if (!isHovered) {
          isHovered = true;
          (cube.material as THREE.MeshStandardMaterial).color.set(0xff4444);
          renderer.domElement.style.cursor = 'pointer';
        }
      } else {
        if (isHovered) {
          isHovered = false;
          (cube.material as THREE.MeshStandardMaterial).color.set(0x00ff00);
          renderer.domElement.style.cursor = 'default';
        }
      }
    }

    renderer.domElement.addEventListener('pointermove', onPointerMove);


    // 3) Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lights for standard/physical materials
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(3, 5, 2);
    scene.add(directionalLight);

    // Scene helpers
    const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    grid.position.y = -1;
    scene.add(grid);
    const axes = new THREE.AxesHelper(1.5);
    scene.add(axes);

    // 3) Handle sizing and DPR
    const resize = () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    resize();

    // 4) Animation loop (currently renders an empty scene)
    const animate = () => {
      const dt = clock.getDelta();

      // Input axes
      const right = keysDown.has('ArrowRight') || keysDown.has('d') || keysDown.has('D');
      const left  = keysDown.has('ArrowLeft')  || keysDown.has('a') || keysDown.has('A');
      // Note: up/down are handled as jump via keydown; no continuous vertical input applied here

      // Accelerate from input (horizontal only), add gravity, then drag
      const inputX = (right ? 1 : 0) - (left ? 1 : 0);
      const speedScale = onGround ? runSpeed : 1; // boost only when on ground

      velocity.x += inputX * horizontalAcceleration * speedScale * dt;
      velocity.addScaledVector(gravity, dt);

      // Simple air drag on horizontal motion
      velocity.x -= velocity.x * horizontalDrag * dt;

      // Integrate position
      cube.position.addScaledVector(velocity, dt);

      // Ground collision (bounce + friction)
      const bottom = cube.position.y - halfSize;
      if (bottom < groundY) {
        cube.position.y = groundY + halfSize;
        if (velocity.y < 0) velocity.y = -velocity.y * restitution; // bounce
        velocity.x *= 0.8; // ground friction
        if (Math.abs(velocity.y) < 0.01) velocity.y = 0;
      }

      // Optional clamps
      if (Math.abs(velocity.x) < 0.001) velocity.x = 0;

      // Update on-ground state and timers
      onGround = (cube.position.y - halfSize) <= groundY + GROUND_EPS;
      if (onGround) {
        coyoteTime = COYOTE_TIME_MAX;
        if (Math.abs(velocity.y) < 0.0001) velocity.y = 0; // kill tiny jitter
      } else {
        coyoteTime = Math.max(0, coyoteTime - dt);
      }
      if (jumpBufferTime > 0) jumpBufferTime = Math.max(0, jumpBufferTime - dt);

      // Perform buffered jump if within coyote window
      if (jumpBufferTime > 0 && coyoteTime > 0) {
        velocity.y = jumpImpulse;
        jumpBufferTime = 0;
        coyoteTime = 0;
      }

      // Render and schedule next frame
      controls.update();
      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    // 5) Events and cleanup
    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', onResize);
      // Remove objects and dispose resources
      scene.remove(cube);
      geometry.dispose();
      material.dispose();
      scene.remove(grid);
      scene.remove(axes);
      // Helper disposal
      const disposeMaterial = (mat: THREE.Material | THREE.Material[]) => {
        if (Array.isArray(mat)) {
          mat.forEach(m => m.dispose());
        } else {
          mat.dispose();
        }
      };
      (grid.geometry as THREE.BufferGeometry).dispose();
      disposeMaterial(grid.material as unknown as THREE.Material | THREE.Material[]);
      (axes.geometry as THREE.BufferGeometry).dispose();
      disposeMaterial(axes.material as unknown as THREE.Material | THREE.Material[]);
      // Lights
      scene.remove(ambientLight);
      scene.remove(directionalLight);
      controls.dispose();
      renderer.dispose();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'stretch' }}>
      <div ref={containerRef} style={{ flex: 1, minHeight: 400 }} />
    </div>
  );
};

export default LearningThree;


