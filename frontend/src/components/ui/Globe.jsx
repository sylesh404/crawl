import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Custom shaders for the premium glass-like globe with dotted continents and edge glow
const GlobeShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vNormal = normalize(normalMatrix * normal);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform sampler2D uTexture;
    uniform vec3 uBaseColor;
    uniform vec3 uGlowColor;
    uniform float uLoaded;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      // 1. Fresnel Edge Glow (volumetric atmosphere effect)
      float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);
      vec3 edgeGlow = uGlowColor * fresnel * 1.6;

      // 2. Base Ocean styling (semi-transparent light Persian Blue)
      vec3 oceanColor = uBaseColor;
      float alpha = 0.22; // Low alpha for glass-like transparency

      // 3. Grid-like Dotted Continents pattern
      float dotDensityX = 260.0;
      float dotDensityY = 130.0;
      vec2 dotUv = vUv * vec2(dotDensityX, dotDensityY);
      vec2 localGrid = fract(dotUv) - 0.5;
      float distToCenter = length(localGrid);

      // Smoothstep for anti-aliasing the dots
      float dotMask = smoothstep(0.38, 0.22, distToCenter);

      // 4. Continent land mask sampling
      float landMask = 0.0;
      if (uLoaded > 0.5) {
        vec4 texColor = texture2D(uTexture, vUv);
        // earth-dark texture has land in red/white channels
        landMask = texColor.r;
      } else {
        // Procedural continent fallback for offline compatibility
        float n = sin(vUv.x * 12.0) * cos(vUv.y * 8.0) + sin(vUv.x * 6.0) * sin(vUv.y * 14.0);
        landMask = step(0.12, n);
      }

      // Soft white land mass dots
      vec3 landColor = vec3(0.98, 0.98, 0.98);

      // Blend ocean and land
      vec3 finalColor = mix(oceanColor, landColor, landMask * dotMask * 0.95);

      // Add edge glow
      finalColor += edgeGlow;

      // Volumetric transparency combination
      float finalAlpha = mix(alpha, 1.0, fresnel * 0.9 + landMask * dotMask * 0.65);

      gl_FragColor = vec4(finalColor, finalAlpha);
    }
  `
};

const GlobeInner = ({ texture, loaded }) => {
  const meshRef = useRef();
  const materialRef = useRef();

  // Slow continuous rotation (3-4 minutes per revolution)
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0006;
    }
  });

  return (
    <mesh ref={meshRef} scale={2.3}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={GlobeShader.vertexShader}
        fragmentShader={GlobeShader.fragmentShader}
        transparent={true}
        depthWrite={false}
        uniforms={{
          uTexture: { value: texture || new THREE.Texture() },
          uLoaded: { value: loaded ? 1.0 : 0.0 },
          uBaseColor: { value: new THREE.Color('#B6D4F9') }, // Very light Persian Blue
          uGlowColor: { value: new THREE.Color('#3B82F6') }, // Persian Blue glow
        }}
      />
    </mesh>
  );
};

export default function Globe() {
  const [texture, setTexture] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      'https://unpkg.com/three-globe/example/img/earth-dark.jpg',
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        setTexture(tex);
        setLoaded(true);
      },
      undefined,
      (err) => {
        console.warn('Failed to load earth texture from CDN. Rendering fallback procedural map.', err);
      }
    );

    return () => {
      if (texture) texture.dispose();
    };
  }, []);

  return (
    <div className="three-globe-container">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.6} />
        <hemisphereLight intensity={0.4} color="#ffffff" groundColor="#3B82F6" />
        <directionalLight position={[5, 3, 5]} intensity={0.8} />
        <GlobeInner texture={texture} loaded={loaded} />
      </Canvas>
    </div>
  );
}
