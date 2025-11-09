export interface ModelPosition {
  x: number;
  y: number;
  z: number;
}

export interface ModelRotation {
  x: number;
  y: number;
  z: number;
}

export interface ModelData {
  id: string;
  position: ModelPosition;
  rotation: ModelRotation;
  modelPath: string;
}