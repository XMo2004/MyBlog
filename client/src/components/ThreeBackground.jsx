import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, Stars } from '@react-three/drei';
import * as THREE from 'three';

const FloatingShape = ({ position, color, speed, rotationIntensity, scale, type = 'torus' }) => {
  const meshRef = useRef();
  const [clicked, setClicked] = useState(false);

  useFrame((state, delta) => {
    if (clicked) {
        meshRef.current.scale.lerp(new THREE.Vector3(scale * 1.5, scale * 1.5, scale * 1.5), delta * 5);
        meshRef.current.rotation.x += delta * 2;
        meshRef.current.rotation.y += delta * 2;
    } else {
        meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), delta * 2);
    }
  });

  const handleClick = () => {
      setClicked(true);
      setTimeout(() => setClicked(false), 200);
  };

  return (
    <Float
      speed={speed} // Animation speed
      rotationIntensity={rotationIntensity} // XYZ rotation intensity
      floatIntensity={1} // Up/down float intensity
    >
      <mesh 
        ref={meshRef}
        position={position} 
        scale={scale}
        onClick={handleClick}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'auto'}
      >
        {type === 'dodecahedron' && <dodecahedronGeometry args={[1, 0]} />}
        {type === 'icosahedron' && <icosahedronGeometry args={[1, 0]} />}
        {type === 'octahedron' && <octahedronGeometry args={[1, 0]} />}
        
        {/* Wireframe Material for a "Blueprint" / Technical look */}
        <meshBasicMaterial 
          color={clicked ? "white" : color} 
          wireframe={true} 
          transparent 
          opacity={clicked ? 0.8 : 0.15} 
        />
      </mesh>
    </Float>
  );
};

const ThreeBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <Canvas 
        camera={{ position: [0, 0, 15], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        
        {/* Subtle Background Stars */}
        <Stars 
            radius={100} 
            depth={50} 
            count={5000} 
            factor={4} 
            saturation={0} 
            fade 
            speed={1} 
        />
        
        {/* Dynamic Sparkles (Floating dust) */}
        <Sparkles 
            count={200} 
            scale={20} 
            size={4} 
            speed={0.4} 
            opacity={0.5} 
            color="#a855f7" 
        />

        {/* Floating Geometric Shapes (Abstract / Tech feel) */}
        <group>
            {/* Main large shape right-ish */}
            <FloatingShape 
                type="dodecahedron"
                position={[6, 2, -5]} 
                scale={2.5} 
                color="#a855f7" 
                speed={1.5} 
                rotationIntensity={1} 
            />

            {/* Secondary shape left-ish */}
            <FloatingShape 
                type="icosahedron"
                position={[-6, -3, -2]} 
                scale={2} 
                color="#6366f1" // Indigo
                speed={1.5} 
                rotationIntensity={1.5} 
            />
            
            {/* Distant shape top-center */}
            <FloatingShape 
                type="octahedron"
                position={[0, 5, -8]} 
                scale={1.5} 
                color="#ec4899" // Pink
                speed={1} 
                rotationIntensity={0.5} 
            />
        </group>
      </Canvas>
    </div>
  );
};

export default ThreeBackground;
