import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

type ThreePixelBackgroundProps = {
  gridCount?: number; // number of pixels per axis
  spacing?: number;   // spacing between pixels
  maxHeight?: number; // maximum height scale influenced by mouse
};

// Lightweight Three.js background with an instanced voxel grid that reacts to mouse movement.
// The canvas is transparent and should be placed absolutely behind foreground UI.
const ThreePixelBackground: React.FC<ThreePixelBackgroundProps> = ({
  gridCount = 48,
  spacing = 0.9,
  maxHeight = 1.6,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setClearColor(0x000000, 0); // transparent
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    (renderer.domElement.style as any).imageRendering = 'pixelated';
    container.appendChild(renderer.domElement);

    // Sizing
    const resize = () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      // Lower internal resolution slightly for a subtle pixelated look and perf
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(1.0, window.devicePixelRatio * 0.8));
    };
    resize();

    // Camera positioning to frame the grid nicely
    const half = (gridCount - 1) * spacing * 0.5;
    camera.position.set(0, half * 1.2, half * 1.8);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(1, 2, 1);
    scene.add(dir);

    // Ground plane (invisible) for raycasting reference at y = 0
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // Instanced voxel grid
    const total = gridCount * gridCount;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: new THREE.Color('#5bbcff'), roughness: 0.9, metalness: 0.0 });
    const voxels = new THREE.InstancedMesh(geometry, material, total);
    scene.add(voxels);

    const dummy = new THREE.Object3D();

    // Precompute base positions
    const basePositions: Array<{ x: number; z: number }> = [];
    for (let gx = 0; gx < gridCount; gx++) {
      for (let gz = 0; gz < gridCount; gz++) {
        const x = (gx - (gridCount - 1) / 2) * spacing;
        const z = (gz - (gridCount - 1) / 2) * spacing;
        basePositions.push({ x, z });
      }
    }

    // Mouse handling using raycasting to ground plane
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const mouseWorld = new THREE.Vector3(9999, 0, 9999); // far away initially

    const onMouseMove = (event: MouseEvent) => {
      // Use viewport coordinates for background; auth form might be centered and overlayed
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      ndc.set(x, y);
      raycaster.setFromCamera(ndc, camera);
      raycaster.ray.intersectPlane(groundPlane, mouseWorld);
    };
    const onMouseLeave = () => {
      mouseWorld.set(9999, 0, 9999);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    // Animation loop
    const clock = new THREE.Clock();

    const animate = () => {
      const t = clock.getElapsedTime();

      const influenceRadius = spacing * Math.max(6, gridCount * 0.18);
      const sigma = influenceRadius * 0.45;
      const twoSigmaSq = 2 * sigma * sigma;

      for (let i = 0; i < total; i++) {
        const p = basePositions[i];
        const dx = p.x - mouseWorld.x;
        const dz = p.z - mouseWorld.z;
        const distSq = dx * dx + dz * dz;

        // Gaussian falloff centered at mouse + subtle time-based wave
        const mouseBoost = Math.exp(-distSq / twoSigmaSq) * maxHeight;
        const wave = Math.sin((p.x + p.z) * 0.8 + t * 1.8) * 0.3;
        const h = 0.6 + mouseBoost + wave;

        // Scale Y to height and adjust Y position so it grows upward from y=0
        dummy.position.set(p.x, h * 0.5, p.z);
        dummy.scale.set(0.85, Math.max(0.2, h), 0.85);
        dummy.updateMatrix();
        voxels.setMatrixAt(i, dummy.matrix);
      }

      voxels.instanceMatrix.needsUpdate = true;

      // Gentle scene rotation for depth
      scene.rotation.y = Math.sin(t * 0.2) * 0.1;

      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      scene.remove(voxels);
      geometry.dispose();
      material.dispose();
      voxels.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [gridCount, spacing, maxHeight]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none', // allow interacting with the form above
      }}
      aria-hidden
    />
  );
};

export default ThreePixelBackground;


