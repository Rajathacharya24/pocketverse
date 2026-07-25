import React, { useRef, useEffect, useState, useCallback } from 'react';

interface HeroVisualProps {
  reducedMotion: boolean;
}

export const HeroVisual: React.FC<HeroVisualProps> = ({ reducedMotion }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [webglReady, setWebglReady] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (reducedMotion) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setOffset({ x: dx * 10, y: dy * 8 });
  }, [reducedMotion]);

  const handleMouseLeave = useCallback(() => {
    setOffset({ x: 0, y: 0 });
  }, []);

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

        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
        camera.position.z = 3.5;

        const count = 500;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        const violetColor = new THREE.Color('#8B5CF6');
        const cyanColor = new THREE.Color('#06B6D4');
        const indigoColor = new THREE.Color('#6366F1');
        const tempColor = new THREE.Color();

        for (let i = 0; i < count; i++) {
          const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
          const theta = Math.PI * (1 + Math.sqrt(5)) * i;

          const wobble = 0.9 + Math.random() * 0.4;
          const r = wobble;

          positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
          positions[i * 3 + 2] = r * Math.cos(phi);

          const t = Math.random();
          if (t < 0.4) {
            tempColor.copy(violetColor);
          } else if (t < 0.7) {
            tempColor.copy(cyanColor).lerp(violetColor, 0.5);
          } else {
            tempColor.copy(indigoColor).lerp(cyanColor, t);
          }
          colors[i * 3] = tempColor.r;
          colors[i * 3 + 1] = tempColor.g;
          colors[i * 3 + 2] = tempColor.b;

          sizes[i] = 1.0 + Math.random() * 2.0;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
          size: 0.02,
          vertexColors: true,
          transparent: true,
          opacity: 0.6,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          sizeAttenuation: true,
        });

        particles = new THREE.Points(geometry, material);
        scene.add(particles);

        setWebglReady(true);

        const clock = new THREE.Clock();
        const animate = () => {
          if (cancelled) return;
          const t = clock.getElapsedTime();
          particles.rotation.y = t * 0.12;
          particles.rotation.x = Math.sin(t * 0.08) * 0.08;

          const sizeAttr = particles.geometry.attributes.size;
          for (let i = 0; i < count; i++) {
            const base = sizes[i];
            sizeAttr.array[i] = base + Math.sin(t * 0.6 + i * 0.12) * 0.4;
          }
          sizeAttr.needsUpdate = true;

          renderer.render(scene, camera);
          frameId = requestAnimationFrame(animate);
        };
        animate();
      } catch {
        // WebGL not available
      }
    };

    const timer = setTimeout(init, 200);

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

  const subjectTransform = reducedMotion ? 'none' : `translate(${offset.x}px, ${offset.y}px)`;
  const bgTransform = reducedMotion ? 'none' : `translate(${offset.x * -0.3}px, ${offset.y * -0.3}px)`;

  return (
    <div
      ref={containerRef}
      className="hero-visual"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      role="img"
      aria-label="PocketVerse audio production studio with headphones and sound wave visualization"
    >
      <div
        className="hero-halo"
        style={{
          animationPlayState: reducedMotion ? 'paused' : 'running',
          transform: reducedMotion ? 'scale(1)' : undefined,
        }}
      />

      {/* Three.js Particle Sphere */}
      <div style={{
        position: 'absolute',
        inset: '-20%',
        zIndex: 1,
        opacity: webglReady ? 1 : 0,
        transition: 'opacity 1s ease',
        transform: bgTransform,
        willChange: 'transform',
      }}>
        <canvas id="hero-particles" style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Headphones + Sound Waves SVG */}
      <div
        className="hero-subject"
        style={{ transform: subjectTransform, willChange: 'transform' }}
      >
        <svg
          width="280"
          height="320"
          viewBox="0 0 280 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: 'drop-shadow(0 0 40px rgba(139, 92, 246, 0.25))' }}
        >
          <defs>
            {/* Headband gradient */}
            <linearGradient id="headband-grad" x1="140" y1="20" x2="140" y2="130" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1C1C28" />
              <stop offset="100%" stopColor="#0E0E14" />
            </linearGradient>

            {/* Ear cup gradient */}
            <linearGradient id="earcup-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22222E" />
              <stop offset="60%" stopColor="#16161F" />
              <stop offset="100%" stopColor="#0E0E14" />
            </linearGradient>

            {/* Accent glow */}
            <radialGradient id="cup-glow-l" cx="60" cy="195" r="50" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="cup-glow-r" cx="220" cy="195" r="50" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
            </radialGradient>

            {/* Sound wave gradient */}
            <linearGradient id="wave-grad-1" x1="0" y1="0" x2="280" y2="0">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0" />
              <stop offset="30%" stopColor="#8B5CF6" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#06B6D4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="wave-grad-2" x1="0" y1="0" x2="280" y2="0">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0" />
              <stop offset="30%" stopColor="#6366F1" stopOpacity="0.3" />
              <stop offset="70%" stopColor="#8B5CF6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </linearGradient>

            <clipPath id="left-ear-clip">
              <circle cx="60" cy="195" r="52" />
            </clipPath>
            <clipPath id="right-ear-clip">
              <circle cx="220" cy="195" r="52" />
            </clipPath>
          </defs>

          {/* === Sound Waves — equalizer bars inside ear cups === */}
          <g clipPath="url(#left-ear-clip)">
            {[0,1,2,3,4,5,6,7,8].map((i) => (
              <rect
                key={`lbar-${i}`}
                x={32 + i * 6}
                y={195 - (10 + Math.sin(i * 0.9) * 8 + (i % 3) * 4)}
                width="3"
                rx="1.5"
                height={20 + Math.sin(i * 0.9) * 16 + (i % 3) * 8}
                fill="#8B5CF6"
                opacity="0.35"
              >
                {!reducedMotion && (
                  <animate
                    attributeName="height"
                    values={`${20 + Math.sin(i * 0.9) * 16 + (i % 3) * 8};${10 + Math.cos(i * 1.2) * 6};${20 + Math.sin(i * 0.9) * 16 + (i % 3) * 8}`}
                    dur={`${1.2 + i * 0.15}s`}
                    repeatCount="indefinite"
                  />
                )}
                {!reducedMotion && (
                  <animate
                    attributeName="y"
                    values={`${195 - (10 + Math.sin(i * 0.9) * 8 + (i % 3) * 4)};${195 - 5};${195 - (10 + Math.sin(i * 0.9) * 8 + (i % 3) * 4)}`}
                    dur={`${1.2 + i * 0.15}s`}
                    repeatCount="indefinite"
                  />
                )}
              </rect>
            ))}
          </g>

          <g clipPath="url(#right-ear-clip)">
            {[0,1,2,3,4,5,6,7,8].map((i) => (
              <rect
                key={`rbar-${i}`}
                x={192 + i * 6}
                y={195 - (10 + Math.cos(i * 0.7) * 8 + (i % 3) * 4)}
                width="3"
                rx="1.5"
                height={20 + Math.cos(i * 0.7) * 16 + (i % 3) * 8}
                fill="#06B6D4"
                opacity="0.35"
              >
                {!reducedMotion && (
                  <animate
                    attributeName="height"
                    values={`${20 + Math.cos(i * 0.7) * 16 + (i % 3) * 8};${10 + Math.sin(i * 1.1) * 6};${20 + Math.cos(i * 0.7) * 16 + (i % 3) * 8}`}
                    dur={`${1.0 + i * 0.12}s`}
                    repeatCount="indefinite"
                  />
                )}
                {!reducedMotion && (
                  <animate
                    attributeName="y"
                    values={`${195 - (10 + Math.cos(i * 0.7) * 8 + (i % 3) * 4)};${195 - 5};${195 - (10 + Math.cos(i * 0.7) * 8 + (i % 3) * 4)}`}
                    dur={`${1.0 + i * 0.12}s`}
                    repeatCount="indefinite"
                  />
                )}
              </rect>
            ))}
          </g>

          {/* === Headband === */}
          <path
            d="M 60 140 Q 60 50, 140 35 Q 220 50, 220 140"
            fill="none"
            stroke="url(#headband-grad)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Headband highlight */}
          <path
            d="M 65 138 Q 65 58, 140 44 Q 215 58, 215 138"
            fill="none"
            stroke="rgba(139, 92, 246, 0.12)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Headband inner padding */}
          <path
            d="M 95 100 Q 95 60, 140 50 Q 185 60, 185 100"
            fill="none"
            stroke="#22222E"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* === Left Ear Cup === */}
          <circle cx="60" cy="195" r="56" fill="#0E0E14" stroke="#1C1C28" strokeWidth="2" />
          <circle cx="60" cy="195" r="48" fill="url(#earcup-grad)" stroke="#2A2A38" strokeWidth="1" />
          <circle cx="60" cy="195" r="42" fill="none" stroke="rgba(139, 92, 246, 0.15)" strokeWidth="0.5" />
          <circle cx="60" cy="195" fill="url(#cup-glow-l)" r="48" />

          {/* Left cup accent ring */}
          <circle cx="60" cy="195" r="48" fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeOpacity="0.2">
            {!reducedMotion && (
              <animate attributeName="stroke-opacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite" />
            )}
          </circle>

          {/* === Right Ear Cup === */}
          <circle cx="220" cy="195" r="56" fill="#0E0E14" stroke="#1C1C28" strokeWidth="2" />
          <circle cx="220" cy="195" r="48" fill="url(#earcup-grad)" stroke="#2A2A38" strokeWidth="1" />
          <circle cx="220" cy="195" r="42" fill="none" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="0.5" />
          <circle cx="220" cy="195" fill="url(#cup-glow-r)" r="48" />

          {/* Right cup accent ring */}
          <circle cx="220" cy="195" r="48" fill="none" stroke="#06B6D4" strokeWidth="1.5" strokeOpacity="0.2">
            {!reducedMotion && (
              <animate attributeName="stroke-opacity" values="0.2;0.5;0.2" dur="3.5s" repeatCount="indefinite" />
            )}
          </circle>

          {/* === Connector Arms === */}
          <path d="M 70 140 L 65 155" stroke="#2A2A38" strokeWidth="3" strokeLinecap="round" />
          <path d="M 210 140 L 215 155" stroke="#2A2A38" strokeWidth="3" strokeLinecap="round" />

          {/* === Sound Wave Rings (radiating from cups) === */}
          {[1, 2, 3].map((i) => (
            <circle
              key={`ring-l-${i}`}
              cx="60"
              cy="195"
              r={60 + i * 14}
              fill="none"
              stroke="url(#wave-grad-1)"
              strokeWidth="1"
              strokeOpacity={0}
            >
              {!reducedMotion && (
                <>
                  <animate attributeName="r" values={`${60 + i * 10};${68 + i * 14};${60 + i * 10}`} dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values={`${0.3 - i * 0.08};${0.1};${0.3 - i * 0.08}`} dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
                </>
              )}
            </circle>
          ))}
          {[1, 2, 3].map((i) => (
            <circle
              key={`ring-r-${i}`}
              cx="220"
              cy="195"
              r={60 + i * 14}
              fill="none"
              stroke="url(#wave-grad-2)"
              strokeWidth="1"
              strokeOpacity={0}
            >
              {!reducedMotion && (
                <>
                  <animate attributeName="r" values={`${60 + i * 10};${68 + i * 14};${60 + i * 10}`} dur={`${2.2 + i * 0.5}s`} repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values={`${0.3 - i * 0.08};${0.1};${0.3 - i * 0.08}`} dur={`${2.2 + i * 0.5}s`} repeatCount="indefinite" />
                </>
              )}
            </circle>
          ))}

          {/* === Floating Music Notes === */}
          {[
            { x: 28, y: 140, delay: '0s', color: '#8B5CF6' },
            { x: 252, y: 130, delay: '1.5s', color: '#06B6D4' },
            { x: 140, y: 270, delay: '0.8s', color: '#6366F1' },
            { x: 15, y: 260, delay: '2s', color: '#A78BFA' },
            { x: 265, y: 250, delay: '1s', color: '#22D3EE' },
          ].map((note, i) => (
            <g key={`note-${i}`} opacity="0">
              <circle cx={note.x} cy={note.y} r="2.5" fill={note.color} />
              <line x1={note.x} y1={note.y} x2={note.x} y2={note.y - 12} stroke={note.color} strokeWidth="1" />
              <path
                d={`M ${note.x} ${note.y - 12} Q ${note.x + 6} ${note.y - 16}, ${note.x + 4} ${note.y - 10}`}
                fill={note.color}
                opacity="0.6"
              />
              {!reducedMotion && (
                <animate
                  attributeName="opacity"
                  values="0;0.6;0"
                  dur="3s"
                  begin={note.delay}
                  repeatCount="indefinite"
                />
              )}
            </g>
          ))}

          {/* Center glow dot */}
          <circle cx="140" cy="35" r="3" fill="#8B5CF6" opacity="0.5">
            {!reducedMotion && (
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.5s" repeatCount="indefinite" />
            )}
          </circle>
        </svg>
      </div>

      <div className="hero-grain" />
    </div>
  );
};
