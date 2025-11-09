'use client';

import { useRef, useState, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { ModelData } from '@/types/model';
import { saveModelData } from '@/lib/firestore';
import { Html } from '@react-three/drei';

interface DraggableModelProps {
  modelData: ModelData;
  otherModels: ModelData[];
  modelRefsMap: React.MutableRefObject<Map<string, THREE.Group>>;
  onPositionChange: (id: string, position: { x: number; y: number; z: number }) => void;
  onRotationChange: (id: string, rotation: { x: number; y: number; z: number }) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDelete: (id: string) => void;
  onHide: (id: string, hidden: boolean) => void;
}

export default function DraggableModel({
  modelData,
  otherModels,
  modelRefsMap,
  onPositionChange,
  onRotationChange,
  onDragStart,
  onDragEnd,
  onDelete,
  onHide
}: DraggableModelProps) {
  const meshRef = useRef<THREE.Group>(null);
  const modelOnlyRef = useRef<THREE.Group>(null); // Reference to just the 3D model (no drag handle)
  const [isDragging, setIsDragging] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
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
    
    // Don't check collision if this model is hidden (it shouldn't block others)
    if (modelData.hidden) return false;

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

    // Check collision with other visible models using actual bounding boxes
    for (const other of otherModels) {
      if (other.id === modelData.id) continue;
      if (other.hidden) continue; // Skip hidden models in collision detection

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
  
  const handleMenuButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };
  
  const handleMenuClick = (e: React.MouseEvent, action: 'delete' | 'hide' | 'show') => {
    e.stopPropagation();
    setShowMenu(false);
    
    if (action === 'delete') {
      if (confirm('Da li ste sigurni da želite obrisati ovaj model?')) {
        onDelete(modelData.id);
      }
    } else if (action === 'hide') {
      onHide(modelData.id, true);
    } else if (action === 'show') {
      onHide(modelData.id, false);
    }
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
      {/* Hide model visually if hidden, but keep ref for collision detection */}
      <group ref={modelOnlyRef} visible={!modelData.hidden}>
        <primitive object={scene.clone()} />
      </group>

      {/* Drag Handle - visible icon above model (always visible, even when model is hidden) */}
      <group position={[0, 3.5, 0]} onPointerMove={handlePointerMove}>
        {/* Background circle for drag */}
        <mesh
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <circleGeometry args={[0.4, 32]} />
          <meshBasicMaterial 
            color={modelData.hidden ? "#9ca3af" : (isDragging ? "#22c55e" : "#3b82f6")} 
            opacity={0.9} 
            transparent 
          />
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
        
        {/* Menu button - small button next to drag handle */}
        <Html
          position={[0.6, 0, 0]}
          center
          style={{ pointerEvents: 'auto' }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleMenuButtonClick}
            className="bg-gray-700 hover:bg-gray-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg transition-colors"
            style={{ fontSize: '10px' }}
            title="Opcije"
          >
            ⋮
          </button>
        </Html>
      </group>
      
      {/* Context Menu */}
      {showMenu && (
        <Html
          position={[0.6, -0.5, 0]}
          center
          style={{ pointerEvents: 'auto' }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[120px] z-50">
            {modelData.hidden ? (
              <button
                onClick={(e) => handleMenuClick(e, 'show')}
                className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Prikaži
              </button>
            ) : (
              <button
                onClick={(e) => handleMenuClick(e, 'hide')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                Sakrij
              </button>
            )}
            <button
              onClick={(e) => handleMenuClick(e, 'delete')}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Obriši
            </button>
          </div>
        </Html>
      )}
      
      {/* Click outside to close menu */}
      {showMenu && (
        <mesh
          visible={false}
          onPointerDown={() => setShowMenu(false)}
        >
          <planeGeometry args={[100, 100]} />
        </mesh>
      )}
    </group>
  );
}