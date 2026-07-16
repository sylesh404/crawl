import React, { useRef, useState, useEffect, useMemo } from 'react';

export default function Globe() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const parallaxRef = useRef({ currentX: 0, currentY: 0, targetX: 0, targetY: 0 });

  // Generate sphere dots once
  const dots = useMemo(() => {
    const list = [];
    const numLat = 38;
    const numLon = 76;
    const radius = 120; // Slightly smaller to ensure generous margins around the 6 cards

    for (let i = 0; i < numLat; i++) {
      const phi = (i / numLat) * Math.PI; // 0 to PI
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      for (let j = 0; j < numLon; j++) {
        const theta = (j / numLon) * 2 * Math.PI; // 0 to 2*PI
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        // Spherical landmass check using multiple sine/cosine harmonics
        const noiseVal = 
          Math.sin(theta * 3.5) * Math.sin(phi * 2.2) * 0.45 +
          Math.sin(theta * 1.8 - 0.8) * Math.cos(phi * 3.2) * 0.35 +
          Math.cos(theta * 4.5 + 1.5) * Math.sin(phi * 1.5) * 0.2;
        
        let isLand = noiseVal > -0.12;
        
        // Remove polar cap oceans, keep Antarctica
        if (phi < 0.25 || phi > Math.PI - 0.25) {
          isLand = false;
        }
        if (phi > Math.PI - 0.35 && phi < Math.PI - 0.26) {
          isLand = true; // Antarctica
        }

        // Base 3D coordinates
        const x = radius * sinPhi * cosTheta;
        const y = radius * cosPhi; // Y is vertical axis
        const z = radius * sinPhi * sinTheta;

        list.push({ x, y, z, isLand });
      }
    }
    return list;
  }, []);

  // Ambient space depth particles (limited count)
  const spaceParticles = useMemo(() => {
    const list = [];
    for (let i = 0; i < 18; i++) {
      list.push({
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 400,
        z: (Math.random() - 0.5) * 150,
        size: Math.random() * 1.5 + 0.8,
        speedX: (Math.random() - 0.5) * 0.08,
        speedY: (Math.random() - 0.5) * 0.08,
      });
    }
    return list;
  }, []);

  // Track parallax cursor movement
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      parallaxRef.current.targetX = x * 0.25; // Subtle parallax effect
      parallaxRef.current.targetY = y * 0.25;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Canvas render & animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const resizeCanvas = () => {
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Coordinate rotation helpers
    const rotateX = (y, z, angle) => {
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      return [y * cosA - z * sinA, y * sinA + z * cosA];
    };

    const rotateY = (x, z, angle) => {
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      return [x * cosA + z * sinA, -x * sinA + z * cosA];
    };

    const render = () => {
      time += 0.0006; // Slow rotation speed (approx 15-20s per revolution)

      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Smooth parallax interpolation
      const pr = parallaxRef.current;
      pr.currentX += (pr.targetX - pr.currentX) * 0.06;
      pr.currentY += (pr.targetY - pr.currentY) * 0.06;

      const rotationY = time * 2.5 + pr.currentX; 
      const rotationX = 0.22 + pr.currentY;

      // 1. Draw Subtle Ambient Blue Glow beneath the globe (breathing intensity)
      const breath = Math.sin(Date.now() * 0.001) * 0.03 + 0.14;
      const ambientGlow = ctx.createRadialGradient(
        centerX, centerY, 30,
        centerX, centerY, 190
      );
      ambientGlow.addColorStop(0, `rgba(59, 130, 246, ${breath})`);
      ambientGlow.addColorStop(0.5, `rgba(96, 165, 250, ${breath * 0.4})`);
      ambientGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = ambientGlow;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw space drifting background particles (very minimal)
      spaceParticles.forEach((sp) => {
        sp.x += sp.speedX;
        sp.y += sp.speedY;

        if (Math.abs(sp.x) > 200) sp.x = -sp.x;
        if (Math.abs(sp.y) > 200) sp.y = -sp.y;

        const [spX, spZ] = rotateY(sp.x, sp.z, pr.currentX * 0.05);
        const [spY, spFinalZ] = rotateX(sp.y, spZ, pr.currentY * 0.05);

        const scale = 550 / (550 + spFinalZ);
        const screenX = spX * scale + centerX;
        const screenY = spY * scale + centerY;

        ctx.fillStyle = `rgba(59, 130, 246, ${Math.max(0.015, 0.09 * (1 - spFinalZ / 150))})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, sp.size * scale, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Project globe dots and sort based on depth (Z)
      const projectedDots = dots.map((dot) => {
        const [x1, z1] = rotateY(dot.x, dot.z, rotationY);
        const [y2, z2] = rotateX(dot.y, z1, rotationX);

        const cameraDist = 600;
        const scale = cameraDist / (cameraDist + z2);
        const screenX = x1 * scale + centerX;
        const screenY = y2 * scale + centerY;

        return {
          screenX,
          screenY,
          z: z2,
          isLand: dot.isLand,
        };
      });

      // Render Back-Side Globe Dots (occluded layers for depth visualization)
      projectedDots.forEach((dot) => {
        if (dot.z > 0) return; 
        
        ctx.fillStyle = dot.isLand
          ? 'rgba(59, 130, 246, 0.035)' 
          : 'rgba(59, 130, 246, 0.012)';
        
        ctx.beginPath();
        ctx.arc(dot.screenX, dot.screenY, dot.isLand ? 0.85 : 0.45, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Draw Front-Side Globe Dots
      projectedDots.forEach((dot) => {
        if (dot.z <= 0) return; 

        const depthFactor = (120 - dot.z) / 240; 
        const opacity = dot.isLand 
          ? Math.max(0.1, 0.85 - depthFactor * 0.7)
          : Math.max(0.02, 0.08 - depthFactor * 0.06);
        
        ctx.fillStyle = dot.isLand
          ? `rgba(59, 130, 246, ${opacity})`
          : `rgba(96, 165, 250, ${opacity * 0.35})`;

        const dotSize = dot.isLand 
          ? (1.8 * (1 - depthFactor * 0.3)) 
          : 0.75;

        ctx.beginPath();
        ctx.arc(dot.screenX, dot.screenY, dotSize, 0, Math.PI * 2);
        ctx.fill();
      });

      // 5. Atmospheric Edge Glow overlay (clean, minimal boundary)
      const atmosphereGlow = ctx.createRadialGradient(
        centerX, centerY, 112,
        centerX, centerY, 122
      );
      atmosphereGlow.addColorStop(0, 'rgba(255, 255, 255, 0)');
      atmosphereGlow.addColorStop(0.4, 'rgba(59, 130, 246, 0.06)');
      atmosphereGlow.addColorStop(0.8, 'rgba(96, 165, 250, 0.12)');
      atmosphereGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = atmosphereGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 125, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [dots, spaceParticles]);

  return (
    <div ref={containerRef} className="three-globe-container" style={{ pointerEvents: 'none' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}
