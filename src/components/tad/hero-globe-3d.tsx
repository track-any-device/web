'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/* TAD-PAK 3D hero — a dotted globe (Three.js) with brand location pins, great-circle "tracking"
   arcs between Pakistani cities and hubs, orbiting satellites, and an atmosphere rim-glow.
   Auto-rotates; respects prefers-reduced-motion; transparent so the hero gradient shows through. */

const BRAND = 0x01411c;        // Pakistan green
const BRAND_LIGHT = 0x4ea87a;  // lit green for dots
const BRAND_BRIGHT = 0x7ed9a6; // arcs / pin tips

const R = 1.6;

// [lat, lng] — Pakistan cities + regional hubs
const CITIES: Array<[number, number]> = [
  [24.86, 67.0],   // Karachi
  [31.55, 74.34],  // Lahore
  [33.69, 73.06],  // Islamabad
  [25.2, 55.27],   // Dubai
  [41.01, 28.97],  // Istanbul
];
const ARCS: Array<[number, number]> = [
  [0, 3], // Karachi → Dubai
  [1, 4], // Lahore → Istanbul
  [2, 0], // Islamabad → Karachi
];

function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

export function HeroGlobe3D() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = mount.clientWidth || 480;
    let height = mount.clientHeight || 480;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.3, 5.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearAlpha(0);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const dir = new THREE.DirectionalLight(0xffffff, 1.15);
    dir.position.set(4, 3, 5);
    scene.add(dir);

    // Globe group (everything that rotates together)
    const globe = new THREE.Group();
    globe.rotation.z = -0.35; // axial tilt
    scene.add(globe);

    // Solid body
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(R * 0.985, 48, 48),
      new THREE.MeshStandardMaterial({ color: BRAND, roughness: 0.85, metalness: 0.1, transparent: true, opacity: 0.95 }),
    );
    globe.add(body);

    // Lat/long wireframe
    const wire = new THREE.Mesh(
      new THREE.SphereGeometry(R * 0.99, 24, 18),
      new THREE.MeshBasicMaterial({ color: BRAND_LIGHT, wireframe: true, transparent: true, opacity: 0.08 }),
    );
    globe.add(wire);

    // Dotted surface (evenly distributed via Fibonacci sphere)
    const DOTS = 1700;
    const dotPos = new Float32Array(DOTS * 3);
    for (let i = 0; i < DOTS; i++) {
      const y = 1 - (i / (DOTS - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const theta = i * Math.PI * (3 - Math.sqrt(5));
      dotPos[i * 3] = Math.cos(theta) * rad * R * 1.002;
      dotPos[i * 3 + 1] = y * R * 1.002;
      dotPos[i * 3 + 2] = Math.sin(theta) * rad * R * 1.002;
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPos, 3));
    const dots = new THREE.Points(
      dotGeo,
      new THREE.PointsMaterial({ color: BRAND_BRIGHT, size: 0.028, sizeAttenuation: true, transparent: true, opacity: 0.9, depthWrite: false }),
    );
    globe.add(dots);

    // Atmosphere rim-glow (fresnel)
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.22, 48, 48),
      new THREE.ShaderMaterial({
        uniforms: { glowColor: { value: new THREE.Color(BRAND_BRIGHT) } },
        vertexShader: `varying vec3 vNormal;
          void main(){ vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `varying vec3 vNormal; uniform vec3 glowColor;
          void main(){ float i = pow(0.62 - dot(vNormal, vec3(0.0,0.0,1.0)), 3.0);
          gl_FragColor = vec4(glowColor, 1.0) * clamp(i, 0.0, 1.0); }`,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
      }),
    );
    scene.add(atmosphere);

    // Pins + their pulse rings
    const pulses: Array<{ ring: THREE.Mesh; phase: number }> = [];
    const cityVecs = CITIES.map(([lat, lng]) => latLngToVec3(lat, lng, R));
    cityVecs.forEach((v, idx) => {
      const normal = v.clone().normalize();

      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      );
      tip.position.copy(normal.clone().multiplyScalar(R * 1.05));
      globe.add(tip);

      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, R * 0.12, 6),
        new THREE.MeshBasicMaterial({ color: BRAND_BRIGHT, transparent: true, opacity: 0.7 }),
      );
      stem.position.copy(normal.clone().multiplyScalar(R * 1.0));
      stem.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      globe.add(stem);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.05, 0.075, 24),
        new THREE.MeshBasicMaterial({ color: BRAND_BRIGHT, transparent: true, opacity: 0.8, side: THREE.DoubleSide }),
      );
      ring.position.copy(normal.clone().multiplyScalar(R * 1.01));
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      globe.add(ring);
      pulses.push({ ring, phase: idx * 0.7 });
    });

    // Great-circle tracking arcs + travelling pulse dots
    const travellers: Array<{ dot: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; speed: number; t: number }> = [];
    ARCS.forEach(([a, b], i) => {
      const start = cityVecs[a];
      const end = cityVecs[b];
      const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(R * 1.45);
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 48, 0.012, 8, false),
        new THREE.MeshBasicMaterial({ color: BRAND_BRIGHT, transparent: true, opacity: 0.55 }),
      );
      globe.add(tube);

      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      );
      dot.position.copy(curve.getPoint(i * 0.33));
      globe.add(dot);
      travellers.push({ dot, curve, speed: 0.16 + i * 0.04, t: i * 0.33 });
    });

    // Satellites on tilted orbits
    const sats: THREE.Group[] = [];
    const satConfigs = [
      { tilt: 0.5, ry: 0.2, orbit: R * 1.75, speed: 0.45 },
      { tilt: -0.7, ry: 1.4, orbit: R * 2.0, speed: -0.32 },
    ];
    satConfigs.forEach((c) => {
      const orbitGroup = new THREE.Group();
      orbitGroup.rotation.set(c.tilt, c.ry, 0);
      scene.add(orbitGroup);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(c.orbit, 0.004, 6, 120),
        new THREE.MeshBasicMaterial({ color: BRAND_LIGHT, transparent: true, opacity: 0.25 }),
      );
      orbitGroup.add(ring);

      const sat = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.3 });
      const core = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.1), bodyMat);
      sat.add(core);
      const panelMat = new THREE.MeshStandardMaterial({ color: BRAND_BRIGHT, roughness: 0.4, metalness: 0.4, side: THREE.DoubleSide });
      const pL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.005, 0.07), panelMat);
      pL.position.x = -0.13;
      const pR = pL.clone();
      pR.position.x = 0.13;
      sat.add(pL, pR);
      sat.position.set(c.orbit, 0, 0);
      orbitGroup.add(sat);
      orbitGroup.userData = { sat, speed: c.speed, angle: 0, orbit: c.orbit };
      sats.push(orbitGroup);
    });

    // Animation
    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      const dt = clock.getDelta();
      const t = clock.elapsedTime;
      if (!reduceMotion) {
        globe.rotation.y += dt * 0.12;
        pulses.forEach((p) => {
          const s = 1 + (Math.sin(t * 2 + p.phase) * 0.5 + 0.5) * 1.6;
          p.ring.scale.set(s, s, s);
          (p.ring.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - (s - 1) / 1.6);
        });
        travellers.forEach((tr) => {
          tr.t = (tr.t + dt * tr.speed) % 1;
          tr.dot.position.copy(tr.curve.getPoint(tr.t));
        });
        sats.forEach((g) => {
          const ud = g.userData as { sat: THREE.Group; speed: number; angle: number; orbit: number };
          ud.angle += dt * ud.speed;
          ud.sat.position.set(Math.cos(ud.angle) * ud.orbit, Math.sin(ud.angle) * ud.orbit, 0);
          ud.sat.rotation.z = ud.angle;
        });
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    const ro = new ResizeObserver(() => {
      width = mount.clientWidth || width;
      height = mount.clientHeight || height;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = (m as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else if (mat) (mat as THREE.Material).dispose();
      });
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="tad-hero-globe" aria-hidden="true" />;
}
