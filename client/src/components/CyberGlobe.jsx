import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * CyberGlobe — Interactive 3D wireframe globe with glowing detection nodes
 * and animated connection arcs, representing a global threat detection network.
 * Rotates slowly and tilts in response to mouse movement.
 * Adapts colors for dark and light themes.
 */
export default function CyberGlobe({ className = '' }) {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // ─── Detect theme ───
    const isLight = () => document.documentElement.classList.contains('light-mode');

    // Theme-adaptive color palette
    const getColors = () => {
      if (isLight()) {
        return {
          primary: 0x0891b2,     // teal-600 — very visible on white
          secondary: 0x0e7490,   // teal-700
          inner: 0x0284c7,       // sky-700
          wireOpacity: 0.18,
          ringOpacity: 0.14,
          nodeGlowOpacity: 0.5,
          arcOpacity: 0.45,
          particleOpacity: 0.6,
          particleSize: 0.018,
          outerRingOpacity: 0.3,
          latRingOpacity: 0.12,
          innerOpacity: 0.06,
        };
      }
      return {
        primary: 0x00f2ff,       // cyan neon
        secondary: 0x00f2ff,
        inner: 0x0080ff,
        wireOpacity: 0.08,
        ringOpacity: 0.12,
        nodeGlowOpacity: 0.3,
        arcOpacity: 0.25,
        particleOpacity: 0.4,
        particleSize: 0.012,
        outerRingOpacity: 0.15,
        latRingOpacity: 0.06,
        innerOpacity: 0.03,
      };
    };

    // ─── Scene setup ───
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ─── Globe group ───
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    let colors = getColors();

    // ─── Wireframe sphere ───
    const sphereGeo = new THREE.SphereGeometry(1.5, 36, 24);
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: colors.primary,
      wireframe: true,
      transparent: true,
      opacity: colors.wireOpacity,
    });
    const wireframe = new THREE.Mesh(sphereGeo, wireframeMat);
    globeGroup.add(wireframe);

    // ─── Inner glow sphere ───
    const innerGeo = new THREE.SphereGeometry(1.48, 32, 20);
    const innerMat = new THREE.MeshBasicMaterial({
      color: colors.inner,
      transparent: true,
      opacity: colors.innerOpacity,
      side: THREE.BackSide,
    });
    globeGroup.add(new THREE.Mesh(innerGeo, innerMat));

    // ─── Latitude / Longitude rings ───
    const latRings = [];
    for (let i = 1; i < 6; i++) {
      const lat = (i / 6) * Math.PI;
      const r = Math.sin(lat) * 1.51;
      const y = Math.cos(lat) * 1.51;
      const ringGeo = new THREE.RingGeometry(r - 0.002, r + 0.002, 64);
      const ringMatInst = new THREE.MeshBasicMaterial({ color: colors.primary, transparent: true, opacity: colors.latRingOpacity, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMatInst);
      ring.position.y = y;
      ring.rotation.x = Math.PI / 2;
      globeGroup.add(ring);
      latRings.push(ringMatInst);
    }

    // ─── Detection nodes ───
    const nodePositions = [];
    const nodeMat = new THREE.MeshBasicMaterial({ color: colors.primary });
    const nodeGlowMats = [];

    const nodeCoords = [
      { lat: 40.7, lng: -74 },    // New York
      { lat: 51.5, lng: -0.1 },   // London
      { lat: 35.7, lng: 139.7 },  // Tokyo
      { lat: -33.9, lng: 151.2 }, // Sydney
      { lat: 1.3, lng: 103.8 },   // Singapore
      { lat: 55.8, lng: 37.6 },   // Moscow
      { lat: 19.4, lng: -99.1 },  // Mexico City
      { lat: -23.5, lng: -46.6 }, // São Paulo
      { lat: 28.6, lng: 77.2 },   // Delhi
      { lat: 37.6, lng: 127 },    // Seoul
      { lat: 48.9, lng: 2.35 },   // Paris
      { lat: 25.2, lng: 55.3 },   // Dubai
    ];

    nodeCoords.forEach(({ lat, lng }) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      const x = -1.52 * Math.sin(phi) * Math.cos(theta);
      const y = 1.52 * Math.cos(phi);
      const z = 1.52 * Math.sin(phi) * Math.sin(theta);

      // Dot
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), nodeMat);
      dot.position.set(x, y, z);
      globeGroup.add(dot);

      // Glow halo
      const glowMat = new THREE.MeshBasicMaterial({ color: colors.primary, transparent: true, opacity: colors.nodeGlowOpacity });
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), glowMat);
      glow.position.set(x, y, z);
      globeGroup.add(glow);
      nodeGlowMats.push(glowMat);

      nodePositions.push(new THREE.Vector3(x, y, z));
    });

    // ─── Connection arcs ───
    const arcMat = new THREE.LineBasicMaterial({ color: colors.primary, transparent: true, opacity: colors.arcOpacity });
    const connections = [
      [0, 1], [1, 5], [2, 9], [3, 4], [0, 7], [1, 10],
      [8, 4], [11, 8], [6, 0], [10, 11], [5, 2], [3, 2],
    ];

    connections.forEach(([a, b]) => {
      const start = nodePositions[a];
      const end = nodePositions[b];
      if (!start || !end) return;

      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      const dist = start.distanceTo(end);
      mid.normalize().multiplyScalar(1.52 + dist * 0.3);

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(40);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      globeGroup.add(new THREE.Line(lineGeo, arcMat));
    });

    // ─── Particle ring ───
    const particleCount = 800;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.7 + Math.random() * 0.8;
      const ySpread = (Math.random() - 0.5) * 1.2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = ySpread;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({ color: colors.primary, size: colors.particleSize, transparent: true, opacity: colors.particleOpacity });
    const particles = new THREE.Points(particleGeo, particleMat);
    globeGroup.add(particles);

    // ─── Outer ring ───
    const outerRingGeo = new THREE.RingGeometry(1.95, 1.96, 128);
    const outerRingMat = new THREE.MeshBasicMaterial({ color: colors.primary, transparent: true, opacity: colors.outerRingOpacity, side: THREE.DoubleSide });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = Math.PI / 2.2;
    globeGroup.add(outerRing);

    // ─── Theme change observer ───
    const updateThemeColors = () => {
      colors = getColors();
      const c = new THREE.Color(colors.primary);
      const cInner = new THREE.Color(colors.inner);

      wireframeMat.color.copy(c);
      wireframeMat.opacity = colors.wireOpacity;
      innerMat.color.copy(cInner);
      innerMat.opacity = colors.innerOpacity;
      nodeMat.color.copy(c);
      arcMat.color.copy(c);
      arcMat.opacity = colors.arcOpacity;
      particleMat.color.copy(c);
      particleMat.size = colors.particleSize;
      particleMat.opacity = colors.particleOpacity;
      outerRingMat.color.copy(c);
      outerRingMat.opacity = colors.outerRingOpacity;
      latRings.forEach((m) => { m.color.copy(c); m.opacity = colors.latRingOpacity; });
      nodeGlowMats.forEach((m) => { m.color.copy(c); });
    };

    // Watch for class changes on <html> to detect theme toggle
    const observer = new MutationObserver(() => updateThemeColors());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // ─── Mouse handler ───
    const handleMouse = (e) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseRef.current.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouse);

    // ─── Animation loop ───
    const clock = new THREE.Clock();

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Slow auto-rotation
      globeGroup.rotation.y = elapsed * 0.15;

      // Mouse-driven tilt
      const targetRotX = mouseRef.current.y * 0.3;
      const targetRotZ = -mouseRef.current.x * 0.15;
      globeGroup.rotation.x += (targetRotX - globeGroup.rotation.x) * 0.05;
      globeGroup.rotation.z += (targetRotZ - globeGroup.rotation.z) * 0.05;

      // Pulse node glows
      const baseGlow = isLight() ? 0.35 : 0.2;
      const glowAmp = isLight() ? 0.2 : 0.15;
      nodeGlowMats.forEach((mat, idx) => {
        mat.opacity = baseGlow + Math.sin(elapsed * 2 + idx * 1.5) * glowAmp;
      });

      // Rotate particles slowly
      particles.rotation.y = elapsed * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    // ─── Resize handler ───
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ─── Cleanup ───
    return () => {
      observer.disconnect();
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full ${className}`}
      style={{ minHeight: '400px' }}
    />
  );
}
