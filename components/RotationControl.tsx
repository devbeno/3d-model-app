'use client';

import { ModelData } from '@/types/model';
import { saveModelData } from '@/lib/firestore';

interface RotationControlProps {
  models: ModelData[];
  onRotationChange: (id: string, rotation: { x: number; y: number; z: number }) => void;
}

export default function RotationControl({ models, onRotationChange }: RotationControlProps) {
  const handleRotationChange = async (
    modelId: string,
    axis: 'x' | 'y' | 'z',
    value: number
  ) => {
    const model = models.find((m) => m.id === modelId);
    if (!model) return;

    const newRotation = { ...model.rotation, [axis]: value };
    onRotationChange(modelId, newRotation);

    await saveModelData({
      ...model,
      rotation: newRotation,
    });
  };

  return (
    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg z-50">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Rotation Controls</h3>
      {models.map((model) => (
        <div key={model.id} className="mb-4 last:mb-0">
          <h4 className="text-sm font-medium mb-2 text-gray-700">
            Model {model.id}
          </h4>
          <div className="space-y-2">
            {['x', 'y', 'z'].map((axis) => (
              <div key={axis} className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-600 w-8">
                  {axis.toUpperCase()}:
                </label>
                <input
                  type="range"
                  min="0"
                  max={Math.PI * 2}
                  step="0.01"
                  value={model.rotation[axis as 'x' | 'y' | 'z']}
                  onChange={(e) =>
                    handleRotationChange(
                      model.id,
                      axis as 'x' | 'y' | 'z',
                      parseFloat(e.target.value)
                    )
                  }
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-600 w-12 text-right">
                  {((model.rotation[axis as 'x' | 'y' | 'z'] * 180) / Math.PI).toFixed(0)}°
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}