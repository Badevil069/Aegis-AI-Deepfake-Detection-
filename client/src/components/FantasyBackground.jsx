import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function FantasyBackground() {
  const containerRef = useRef(null);
  const frameRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.015);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ─── Floating Particles ───
    const particleCount = 1500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    const colorChoices = [
      new THREE.Color(0x00f2ff), // Cyan
      new THREE.Color(0x8b5cf6), // Violet
      new THREE.Color(0x3b82f6), // Blue
      new THREE.Color(0xec4899), // Pink
      new THREE.Color(0x10b981)  // Emerald
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60 - 10;

      const c = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Custom shader material for glowing circular particles
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const particleSystem = new THREE.Points(geometry, particleMaterial);
    scene.add(particleSystem);

    // ─── Floating Abstract Geometries ───
    const shapesGroup = new THREE.Group();
    scene.add(shapesGroup);

    // Theme detection for shapes
    const isLight = () => document.documentElement.classList.contains('light-mode');
    
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: isLight() ? 0x0ea5e9 : 0x00f2ff,
      wireframe: true,
      transparent: true,
      opacity: isLight() ? 0.15 : 0.05,
      blending: THREE.AdditiveBlending
    });

    for(let i=0; i<6; i++) {
      const geo = i % 2 === 0 ? new THREE.IcosahedronGeometry(Math.random() * 4 + 2, 1) : new THREE.OctahedronGeometry(Math.random() * 3 + 1, 0);
      const mesh = new THREE.Mesh(geo, wireframeMat);
      mesh.position.set(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 30 - 10
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      
      mesh.userData = {
        rotSpeedX: (Math.random() - 0.5) * 0.005,
        rotSpeedY: (Math.random() - 0.5) * 0.005,
        startY: mesh.position.y,
        yOffsetRate: Math.random() * 0.5 + 0.2
      };
      
      shapesGroup.add(mesh);
    }

    // ─── Connecting Lines (Plexus Effect) ───
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00f2ff,
      transparent: true,
      opacity: 0.03,
      blending: THREE.AdditiveBlending
    });
    // We won't draw all lines, it's too heavy. Just a few moving nodes.
    const nodesCount = 30;
    const nodesGeo = new THREE.BufferGeometry();
    const nodePositions = new Float32Array(nodesCount * 3);
    const nodeVelocities = [];

    for (let i = 0; i < nodesCount; i++) {
      nodePositions[i * 3] = (Math.random() - 0.5) * 40;
      nodePositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      nodePositions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
      nodeVelocities.push(new THREE.Vector3((Math.random()-0.5)*0.02, (Math.random()-0.5)*0.02, (Math.random()-0.5)*0.02));
    }
    nodesGeo.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
    
    // We'll update line geometries in animate loop
    const linesGeo = new THREE.BufferGeometry();
    const linesMesh = new THREE.LineSegments(linesGeo, lineMat);
    scene.add(linesMesh);

    // ─── Mouse Movement ───
    const onMouseMove = (event) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    // ─── Window Resize ───
    const onWindowResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onWindowResize);

    // ─── Animation Loop ───
    const clock = new THREE.Clock();

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Slowly rotate particle system
      particleSystem.rotation.y = elapsedTime * 0.025;
      particleSystem.rotation.x = elapsedTime * 0.015;

      // Animate shapes
      shapesGroup.children.forEach(mesh => {
        mesh.rotation.x += mesh.userData.rotSpeedX;
        mesh.rotation.y += mesh.userData.rotSpeedY;
        mesh.position.y = mesh.userData.startY + Math.sin(elapsedTime * mesh.userData.yOffsetRate) * 2;
      });

      // Animate Plexus Nodes
      const positions = nodesGeo.attributes.position.array;
      const linePositions = [];
      
      for(let i=0; i<nodesCount; i++) {
        positions[i*3] += nodeVelocities[i].x;
        positions[i*3+1] += nodeVelocities[i].y;
        positions[i*3+2] += nodeVelocities[i].z;
        
        // Bounce back
        if(Math.abs(positions[i*3]) > 25) nodeVelocities[i].x *= -1;
        if(Math.abs(positions[i*3+1]) > 25) nodeVelocities[i].y *= -1;
        if(Math.abs(positions[i*3+2] + 5) > 15) nodeVelocities[i].z *= -1;
      }
      nodesGeo.attributes.position.needsUpdate = true;

      // Calculate lines
      for(let i=0; i<nodesCount; i++) {
        for(let j=i+1; j<nodesCount; j++) {
          const dx = positions[i*3] - positions[j*3];
          const dy = positions[i*3+1] - positions[j*3+1];
          const dz = positions[i*3+2] - positions[j*3+2];
          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
          
          if(dist < 12) {
            linePositions.push(
              positions[i*3], positions[i*3+1], positions[i*3+2],
              positions[j*3], positions[j*3+1], positions[j*3+2]
            );
          }
        }
      }
      linesGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

      // Mouse parallax for camera
      camera.position.x += (mouseRef.current.x * 3 - camera.position.x) * 0.02;
      camera.position.y += (mouseRef.current.y * 3 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onWindowResize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-0 pointer-events-none mix-blend-screen"
    />
  );
}
