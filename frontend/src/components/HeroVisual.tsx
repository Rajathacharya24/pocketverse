import React, { useRef, useEffect, useState, useCallback } from 'react';

interface HeroVisualProps {
  reducedMotion: boolean;
}

/**
 * Layer 1 — Duotone microphone illustration with parallax, halo, grain.
 * Layer 2 — Three.js particle sphere (loaded async, degrades gracefully).
 */
export const HeroVisual: React.FC<HeroVisualProps> = ({ reducedMotion }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [webglReady, setWebglReady] = useState(false);

  // ── Parallax mouse tracking ──
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (reducedMotion) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setOffset({ x: dx * 8, y: dy * 6 }); // subtle: ±8px / ±6px
  }, [reducedMotion]);

  const handleMouseLeave = useCallback(() => {
    setOffset({ x: 0, y: 0 });
  }, []);

  // ── Layer 2: Three.js particle sphere (lazy-loaded) ──
  useEffect(() => {
    if (reducedMotion) return;

    let cancelled = false;
    let renderer: any = null;
    let scene: any = null;
    let camera: any = null;
    let particles: any = null;
    let frameId: number = 0;

    const init = async () => {
      try {
        const THREE = await import('three');
        if (cancelled) return;

        const canvas = document.getElementById('hero-particles') as HTMLCanvasElement;
        if (!canvas) return;

        const w = canvas.parentElement?.clientWidth || 420;
        const h = canvas.parentElement?.clientHeight || 420;

        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
        camera.position.z = 3.2;

        // Particle sphere — 600 points on a sphere surface
        const count = 600;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        const redColor = new THREE.Color('#D91E36');
        const amberColor = new THREE.Color('#D97706');
        const tempColor = new THREE.Color();

        for (let i = 0; i < count; i++) {
          // Fibonacci sphere distribution
          const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
          const theta = Math.PI * (1 + Math.sqrt(5)) * i;
          const r = 1.1;

          positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
          positions[i * 3 + 2] = r * Math.cos(phi);

          // Mix red and amber with some randomness
          const t = Math.random();
          tempColor.copy(redColor).lerp(amberColor, t);
          colors[i * 3] = tempColor.r;
          colors[i * 3 + 1] = tempColor.g;
          colors[i * 3 + 2] = tempColor.b;

          sizes[i] = 1.5 + Math.random() * 2.5;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
          size: 0.025,
          vertexColors: true,
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          sizeAttenuation: true,
        });

        particles = new THREE.Points(geometry, material);
        scene.add(particles);

        setWebglReady(true);

        // Animation loop
        const clock = new THREE.Clock();
        const animate = () => {
          if (cancelled) return;
          const t = clock.getElapsedTime();
          particles.rotation.y = t * 0.15;
          particles.rotation.x = Math.sin(t * 0.1) * 0.1;

          // Gentle breathing on individual particles via size attribute
          const sizeAttr = particles.geometry.attributes.size;
          for (let i = 0; i < count; i++) {
            const base = sizes[i];
            sizeAttr.array[i] = base + Math.sin(t * 0.8 + i * 0.1) * 0.5;
          }
          sizeAttr.needsUpdate = true;

          renderer.render(scene, camera);
          frameId = requestAnimationFrame(animate);
        };
        animate();
      } catch {
        // WebGL not available — silent fallback
      }
    };

    // Delay init so it doesn't compete with hero paint
    const timer = setTimeout(init, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (frameId) cancelAnimationFrame(frameId);
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
      }
    };
  }, [reducedMotion]);

  const subjectTransform = reducedMotion
    ? 'none'
    : `translate(${offset.x}px, ${offset.y}px)`;

  const bgTransform = reducedMotion
    ? 'none'
    : `translate(${offset.x * -0.3}px, ${offset.y * -0.3}px)`;

  return (
    <div
      ref={containerRef}
      className="hero-visual"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      role="img"
      aria-label="PocketVerse studio microphone illustration with particle effects"
    >
      {/* Halo glow — breathing animation */}
      <div
        className="hero-halo"
        style={{
          animationPlayState: reducedMotion ? 'paused' : 'running',
          transform: reducedMotion ? 'scale(1)' : undefined,
        }}
      />

      {/* Layer 2 — Three.js particle sphere (behind subject) */}
      <div style={{
        position: 'absolute',
        inset: '-15%',
        zIndex: 1,
        opacity: webglReady ? 1 : 0,
        transition: 'opacity 0.8s ease',
        transform: bgTransform,
        willChange: 'transform',
      }}>
        <canvas
          id="hero-particles"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Layer 1 — Duotone microphone SVG */}
      <div
        className="hero-subject"
        style={{ transform: subjectTransform, willChange: 'transform' }}
      >
        <svg
          width="200"
          height="340"
          viewBox="0 0 200 340"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: 'drop-shadow(0 0 30px rgba(217, 30, 54, 0.3))' }}
        >
          {/* Microphone body — duotone: near-black base, red highlights */}
          <defs>
            <linearGradient id="mic-body" x1="100" y1="0" x2="100" y2="200" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#271D1E" />
              <stop offset="40%" stopColor="#1F1718" />
              <stop offset="100%" stopColor="#0B0708" />
            </linearGradient>
            <linearGradient id="mic-grille" x1="100" y1="20" x2="100" y2="140" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#D91E36" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#D91E36" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#1F1718" stopOpacity="0.8" />
            </linearGradient>
            <radialGradient id="mic-highlight" cx="100" cy="60" r="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#D91E36" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#D91E36" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Stand base */}
          <ellipse cx="100" cy="320" rx="40" ry="8" fill="#1F1718" stroke="#3A2A2C" strokeWidth="1" />
          <rect x="96" y="200" width="8" height="120" rx="4" fill="url(#mic-body)" stroke="#3A2A2C" strokeWidth="0.5" />

          {/* Shock mount ring */}
          <circle cx="100" cy="155" r="48" fill="none" stroke="#3A2A2C" strokeWidth="1.5" />
          <circle cx="100" cy="155" r="44" fill="none" stroke="#D91E36" strokeWidth="0.5" strokeOpacity="0.3" />

          {/* Microphone capsule body */}
          <rect x="68" y="20" width="64" height="120" rx="32" fill="url(#mic-body)" stroke="#3A2A2C" strokeWidth="1" />

          {/* Grille lines — horizontal grooves */}
          {Array.from({ length: 12 }, (_, i) => (
            <line
              key={i}
              x1="72"
              y1={32 + i * 9}
              x2="128"
              y2={32 + i * 9}
              stroke="url(#mic-grille)"
              strokeWidth="1"
              strokeOpacity={0.4 + (i < 6 ? i * 0.08 : (12 - i) * 0.08)}
            />
          ))}

          {/* Red highlight glow on capsule */}
          <rect x="68" y="20" width="64" height="120" rx="32" fill="url(#mic-highlight)" />

          {/* Top cap */}
          <ellipse cx="100" cy="24" rx="32" ry="6" fill="#271D1E" stroke="#3A2A2C" strokeWidth="0.5" />

          {/* Red accent dot — "on air" indicator */}
          <circle cx="100" cy="14" r="4" fill="#D91E36">
            <animate
              attributeName="opacity"
              values="1;0.4;1"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Suspension arms */}
          <line x1="56" y1="155" x2="72" y2="80" stroke="#3A2A2C" strokeWidth="1" />
          <line x1="144" y1="155" x2="128" y2="80" stroke="#3A2A2C" strokeWidth="1" />
          <line x1="56" y1="155" x2="72" y2="130" stroke="#3A2A2C" strokeWidth="1" />
          <line x1="144" y1="155" x2="128" y2="130" stroke="#3A2A2C" strokeWidth="1" />
        </svg>
      </div>

      {/* Grain overlay — cinematic texture */}
      <div className="hero-grain" />
    </div>
  );
};
