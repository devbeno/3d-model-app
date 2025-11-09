'use client';

import { Suspense, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import DraggableModel from './DraggableModel';
import { ModelData } from '@/types/model';
import * as THREE from 'three';

interface SceneProps {
  models: ModelData[];
  is2DView: boolean;
  onPositionChange: (id: string, position: { x: number; y: number; z: number }) => void;
  onRotationChange: (id: string, rotation: { x: number; y: number; z: number }) => void;
  onDelete: (id: string) => void;
  onHide: (id: string, hidden: boolean) => void;
}

function LoadingBox() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#94a3b8" wireframe />
    </mesh>
  );
}

export default function Scene({ models, is2DView, onPositionChange, onRotationChange, onDelete, onHide }: SceneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const modelRefsMap = useRef<Map<string, THREE.Group>>(new Map());
  
  // For collision detection, only use visible models
  // But render all models (hidden ones will show as wireframe)
  const visibleModels = models.filter(m => !m.hidden);

  return (
    <Canvas
      camera={{
        position: is2DView ? [0, 10, 0] : [5, 5, 5],
        fov: 50,
      }}
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      gl={{ antialias: true }}
      onPointerMissed={() => {}}
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
            otherModels={visibleModels}
            modelRefsMap={modelRefsMap}
            onPositionChange={onPositionChange}
            onRotationChange={onRotationChange}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            onDelete={onDelete}
            onHide={onHide}
          />
        ))}
      </Suspense>

      {/* Invisible plane for drag detection - catches all pointer events */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        visible={false}
        renderOrder={1000}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial />
      </mesh>

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
        enabled={!isDragging}
        enableRotate={!is2DView && !isDragging}
        enablePan={!isDragging}
        enableZoom={!isDragging}
        minDistance={2}
        maxDistance={50}
      />
    </Canvas>
  );
}