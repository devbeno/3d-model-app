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
  modelRefsMap: React.MutableRefObject<Map<string, THREE.Group>>;
  onPositionChange: (id: string, position: { x: number; y: number; z: number }) => void;
  onRotationChange: (id: string, rotation: { x: number; y: number; z: number }) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export default function DraggableModel({
  modelData,
  otherModels,
  modelRefsMap,
  onPositionChange,
  onRotationChange,
  onDragStart,
  onDragEnd
}: DraggableModelProps) {
  const meshRef = useRef<THREE.Group>(null);
  const modelOnlyRef = useRef<THREE.Group>(null); // Reference to just the 3D model (no drag handle)
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const planeRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersectionPoint = useRef<THREE.Vector3>(new THREE.Vector3());

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

    // Register only the model (not the drag handle) in the shared refs map for collision detection
    if (modelOnlyRef.current) {
      modelRefsMap.current.set(modelData.id, modelOnlyRef.current);
    }

    return () => {
      // Cleanup: remove from map when unmounted
      modelRefsMap.current.delete(modelData.id);
    };
  }, [modelData, modelRefsMap]);

  // Global pointer up listener to ensure drag ends even if released outside canvas
  useEffect(() => {
    const handleGlobalPointerUp = async () => {
      if (isDragging) {
        setIsDragging(false);
        onDragEnd();
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

    if (isDragging) {
      document.addEventListener('pointerup', handleGlobalPointerUp);
    }

    return () => {
      document.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [isDragging, modelData, onDragEnd]);

  const checkCollision = (newPosition: THREE.Vector3): boolean => {
    if (!modelOnlyRef.current || !meshRef.current) return false;

    // We need to calculate what the modelOnly position would be at the new parent position
    // Since modelOnlyRef is a child of meshRef, we need to update the parent's world matrix
    const tempPosition = meshRef.current.position.clone();
    meshRef.current.position.copy(newPosition);
    meshRef.current.updateMatrixWorld(true);

    const myBox = new THREE.Box3().setFromObject(modelOnlyRef.current);

    meshRef.current.position.copy(tempPosition);
    meshRef.current.updateMatrixWorld(true);

    // Expand the box for a safety margin
    myBox.expandByScalar(0.5);

    // Check collision with other models using actual bounding boxes
    for (const other of otherModels) {
      if (other.id === modelData.id) continue;

      // Get the other model's mesh reference from the shared map
      const otherModelOnly = modelRefsMap.current.get(other.id);
      if (!otherModelOnly) continue;

      // Create bounding box from the actual other model mesh (just the 3D model, no drag handle)
      const otherBox = new THREE.Box3().setFromObject(otherModelOnly);

      // Expand for safety margin
      otherBox.expandByScalar(0.5);

      // Check if bounding boxes intersect
      if (myBox.intersectsBox(otherBox)) {
        return true; // Collision detected
      }
    }

    return false;
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();

    if (meshRef.current) {
      // Calculate intersection point with ground plane
      e.ray.intersectPlane(planeRef.current, intersectionPoint.current);

      // Store the offset between click point and model position
      dragOffsetRef.current.copy(intersectionPoint.current).sub(meshRef.current.position);
    }

    setIsDragging(true);
    onDragStart();
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (isDragging && meshRef.current) {
      // Calculate intersection with ground plane
      e.ray.intersectPlane(planeRef.current, intersectionPoint.current);

      // Apply the offset so model stays where you grabbed it
      const newPosition = new THREE.Vector3(
        intersectionPoint.current.x - dragOffsetRef.current.x,
        modelData.position.y,
        intersectionPoint.current.z - dragOffsetRef.current.z
      );

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
      onDragEnd();
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
    <group ref={meshRef}>
      {/* The actual 3D model - separate ref for collision detection (excludes drag handle) */}
      <group ref={modelOnlyRef}>
        <primitive object={scene.clone()} />
      </group>

      {/* Drag Handle - visible icon above model */}
      <group position={[0, 3.5, 0]} onPointerMove={handlePointerMove}>
        {/* Background circle */}
        <mesh
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <circleGeometry args={[0.4, 32]} />
          <meshBasicMaterial color={isDragging ? "#22c55e" : "#3b82f6"} opacity={0.9} transparent />
        </mesh>

        {/* Move arrows icon */}
        <group position={[0, 0, 0.01]}>
          {/* Up arrow */}
          <mesh position={[0, 0.15, 0]} rotation={[0, 0, 0]}>
            <coneGeometry args={[0.08, 0.15, 3]} />
            <meshBasicMaterial color="white" />
          </mesh>
          {/* Down arrow */}
          <mesh position={[0, -0.15, 0]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.08, 0.15, 3]} />
            <meshBasicMaterial color="white" />
          </mesh>
          {/* Left arrow */}
          <mesh position={[-0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.08, 0.15, 3]} />
            <meshBasicMaterial color="white" />
          </mesh>
          {/* Right arrow */}
          <mesh position={[0.15, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.08, 0.15, 3]} />
            <meshBasicMaterial color="white" />
          </mesh>
        </group>
      </group>
    </group>
  );
}