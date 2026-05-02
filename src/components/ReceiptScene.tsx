import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import ReceiptMesh from './ReceiptMesh';
import GroundShadow from './GroundShadow';

export default function ReceiptScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 4.2], fov: 42 }}
      shadows
      gl={{ antialias: true }}
      style={{ background: '#ffffff' }}
    >
      {/* Strong ambient so receipt paper looks bright */}
      <ambientLight intensity={1.2} />

      {/* Key light - from front-top-right for subtle depth */}
      <directionalLight
        position={[2, 5, 6]}
        intensity={0.6}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={6}
        shadow-camera-bottom={-4}
      />

      {/* Subtle fill from left */}
      <directionalLight position={[-2, 2, 4]} intensity={0.2} />

      <Suspense fallback={null}>
        <ReceiptMesh />
        <GroundShadow />
      </Suspense>
    </Canvas>
  );
}
