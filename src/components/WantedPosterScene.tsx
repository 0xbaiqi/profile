import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import WantedPosterMesh from './WantedPosterMesh';

export default function WantedPosterScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.1, 4.0], fov: 46 }}
      shadows
      gl={{ antialias: true }}
      style={{
        background: `url('${import.meta.env.BASE_URL}images/backend.png') center/cover no-repeat`,
      }}
    >
      <ambientLight intensity={1.0} color="#fff5e8" />
      <directionalLight
        position={[2, 5, 5]}
        intensity={1.2}
        color="#fff0d0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={6}
        shadow-camera-bottom={-5}
      />
      <directionalLight position={[-3, 1, 3]} intensity={0.4} color="#ffe8c0" />

      <Suspense fallback={null}>
        <WantedPosterMesh />
      </Suspense>
    </Canvas>
  );
}
