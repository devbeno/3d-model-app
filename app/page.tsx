'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ModelData } from '@/types/model';
import { loadModelData, saveModelData } from '@/lib/firestore';
import ViewToggle from '@/components/ViewToggle';
import RotationControl from '@/components/RotationControl';

const Scene = dynamic(() => import('@/components/Scene'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full">
      <div className="text-gray-600">Loading 3D Scene...</div>
    </div>
  ),
});

export default function Home() {
  const [models, setModels] = useState<ModelData[]>([]);
  const [is2DView, setIs2DView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const model1 = await loadModelData('model1');
      const model2 = await loadModelData('model2');

      const defaultModels: ModelData[] = [
        model1 || {
          id: 'model1',
          position: { x: -2, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          modelPath: '/models/model1.glb',
        },
        model2 || {
          id: 'model2',
          position: { x: 2, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          modelPath: '/models/model2.glb',
        },
      ];

      setModels(defaultModels);

      if (!model1 || !model2) {
        defaultModels.forEach((model) => saveModelData(model));
      }
    } catch (error) {
      console.error('Error loading models:', error);

      const defaultModels: ModelData[] = [
        {
          id: 'model1',
          position: { x: -2, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          modelPath: '/models/model1.glb',
        },
        {
          id: 'model2',
          position: { x: 2, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          modelPath: '/models/model2.glb',
        },
      ];
      setModels(defaultModels);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePositionChange = (id: string, position: { x: number; y: number; z: number }) => {
    setModels((prev) =>
      prev.map((model) =>
        model.id === id ? { ...model, position } : model
      )
    );
  };

  const handleRotationChange = (id: string, rotation: { x: number; y: number; z: number }) => {
    setModels((prev) =>
      prev.map((model) =>
        model.id === id ? { ...model, rotation } : model
      )
    );
  };

  const toggleView = () => {
    setIs2DView((prev) => !prev);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-gray-100">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <main className="relative w-screen h-screen bg-gray-100">
      <ViewToggle is2DView={is2DView} onToggle={toggleView} />
      <RotationControl models={models} onRotationChange={handleRotationChange} />
      <Scene
        models={models}
        is2DView={is2DView}
        onPositionChange={handlePositionChange}
        onRotationChange={handleRotationChange}
      />
    </main>
  );
}