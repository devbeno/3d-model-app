'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import DraggableModel from './DraggableModel';
import { ModelData } from '@/types/model';

interface SceneProps {
  models: ModelData[];
  is2DView: boolean;
  onPositionChange: (id: string, position: { x: number; y: number; z: number }) => void;
  onRotationChange: (id: string, rotation: { x: number; y: number; z: number }) => void;
}

function LoadingBox() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#94a3b8" wireframe />
    </mesh>
  );
}

export default function Scene({ models, is2DView, onPositionChange, onRotationChange }: SceneProps) {
  return (
    <Canvas
      camera={{
        position: is2DView ? [0, 10, 0] : [5, 5, 5],
        fov: 50,
      }}
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#f3f4f6']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.5} />
      <hemisphereLight intensity={0.5} />

      <Suspense fallback={<LoadingBox />}>
        {models.map((model) => (
          <DraggableModel
            key={model.id}
            modelData={model}
            otherModels={models}
            onPositionChange={onPositionChange}
            onRotationChange={onRotationChange}
          />
        ))}
      </Suspense>

      <Grid
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6b7280"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#9ca3af"
        fadeDistance={30}
        fadeStrength={1}
        position={[0, 0, 0]}
      />

      <OrbitControls
        enableRotate={!is2DView}
        enablePan={true}
        enableZoom={true}
        minDistance={2}
        maxDistance={50}
      />
    </Canvas>
  );
}