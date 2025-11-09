'use client';

import { useRef, useState, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { ModelData } from '@/types/model';
import { saveModelData } from '@/lib/firestore';

interface DraggableModelProps {
  modelData: ModelData;
  otherModels: ModelData[];
  onPositionChange: (id: string, position: { x: number; y: number; z: number }) => void;
  onRotationChange: (id: string, rotation: { x: number; y: number; z: number }) => void;
}

export default function DraggableModel({
  modelData,
  otherModels,
  onPositionChange,
  onRotationChange
}: DraggableModelProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Load GLB model
  const { scene } = useGLTF(modelData.modelPath);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(
        modelData.position.x,
        modelData.position.y,
        modelData.position.z
      );
      meshRef.current.rotation.set(
        modelData.rotation.x,
        modelData.rotation.y,
        modelData.rotation.z
      );
    }
  }, [modelData]);

  const checkCollision = (newPosition: THREE.Vector3): boolean => {
    const boundingBox = new THREE.Box3();
    if (meshRef.current) {
      const tempPosition = meshRef.current.position.clone();
      meshRef.current.position.copy(newPosition);
      boundingBox.setFromObject(meshRef.current);
      meshRef.current.position.copy(tempPosition);

      for (const other of otherModels) {
        if (other.id === modelData.id) continue;

        const otherBox = new THREE.Box3(
          new THREE.Vector3(other.position.x - 1, other.position.y - 1, other.position.z - 1),
          new THREE.Vector3(other.position.x + 1, other.position.y + 1, other.position.z + 1)
        );

        if (boundingBox.intersectsBox(otherBox)) {
          return true;
        }
      }
    }
    return false;
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (isDragging && meshRef.current) {
      const newPosition = new THREE.Vector3(e.point.x, modelData.position.y, e.point.z);

      if (!checkCollision(newPosition)) {
        meshRef.current.position.copy(newPosition);
        onPositionChange(modelData.id, {
          x: newPosition.x,
          y: newPosition.y,
          z: newPosition.z,
        });
      }
    }
  };

  const handlePointerUp = async () => {
    if (isDragging) {
      setIsDragging(false);
      await saveModelData({
        ...modelData,
        position: {
          x: meshRef.current?.position.x || modelData.position.x,
          y: meshRef.current?.position.y || modelData.position.y,
          z: meshRef.current?.position.z || modelData.position.z,
        },
      });
    }
  };

  return (
    <group
      ref={meshRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <primitive object={scene.clone()} />
    </group>
  );
}