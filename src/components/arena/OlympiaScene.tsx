import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sparkles, Stars, Center } from '@react-three/drei';
import * as THREE from 'three';

const OlympiaRing = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { mouse, viewport } = useThree();

  useFrame((state) => {
    if (meshRef.current) {
      // Rotate based on mouse
      const targetRotationX = (mouse.y * viewport.height) / 10;
      const targetRotationY = (mouse.x * viewport.width) / 10;

      meshRef.current.rotation.x += 0.05 * (targetRotationX - meshRef.current.rotation.x);
      meshRef.current.rotation.y += 0.05 * (targetRotationY - meshRef.current.rotation.y);
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef}>
        <torusGeometry args={[2, 0.4, 64, 128]} />
        <MeshDistortMaterial 
          color="#FFD700" 
          envMapIntensity={1} 
          clearcoat={1} 
          clearcoatRoughness={0.1} 
          metalness={0.8} 
          roughness={0.2} 
          distort={0.3} 
          speed={2} 
        />
      </mesh>
    </Float>
  );
};

const ParticleField = () => {
  return (
    <>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={500} scale={12} size={2} speed={0.4} color="#FFD700" opacity={0.5} />
      <Sparkles count={500} scale={15} size={1} speed={0.2} color="#00BFFF" opacity={0.5} />
    </>
  );
};

export const OlympiaScene = () => {
  return (
    <div className="absolute inset-0 z-0 bg-slate-950">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <color attach="background" args={['#020617']} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#FFD700" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#00BFFF" />
        
        <Center>
          <OlympiaRing />
        </Center>
        
        <ParticleField />
      </Canvas>
    </div>
  );
};

export default OlympiaScene;
