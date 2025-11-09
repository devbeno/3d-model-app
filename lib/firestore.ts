import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { ModelData } from '@/types/model';

export const saveModelData = async (modelData: ModelData) => {
  try {
    await setDoc(doc(db, 'models', modelData.id), {
      position: modelData.position,
      rotation: modelData.rotation,
      modelPath: modelData.modelPath,
      hidden: modelData.hidden || false,
    });
  } catch (error) {
    console.error('Error saving model data:', error);
  }
};

export const loadModelData = async (modelId: string): Promise<ModelData | null> => {
  try {
    const docRef = doc(db, 'models', modelId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: modelId,
        position: data.position,
        rotation: data.rotation,
        modelPath: data.modelPath,
      };
    }
    return null;
  } catch (error) {
    console.error('Error loading model data:', error);
    return null;
  }
};

export const loadAllModels = async (): Promise<ModelData[]> => {
  try {
    const modelsCol = collection(db, 'models');
    const modelsSnapshot = await getDocs(modelsCol);
    const modelsList: ModelData[] = [];

    modelsSnapshot.forEach((doc) => {
      const data = doc.data();
      modelsList.push({
        id: doc.id,
        position: data.position,
        rotation: data.rotation,
        modelPath: data.modelPath,
        hidden: data.hidden || false,
      });
    });

    return modelsList;
  } catch (error) {
    console.error('Error loading all models:', error);
    return [];
  }
};

export const uploadModelFile = async (file: File): Promise<string | null> => {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `models/${filename}`);

    // Upload file to Firebase Storage
    await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading model file:', error);
    return null;
  }
};

export const createNewModel = async (modelPath: string, existingModels: ModelData[] = []): Promise<string> => {
  try {
    // Generate unique model ID
    const timestamp = Date.now();
    const modelId = `model_${timestamp}`;

    // Find a free position - place new models in a corner or find empty space
    // Start from top-right corner and spiral outward
    let position = { x: 5, y: 0, z: -5 };
    let foundPosition = false;
    let attempts = 0;
    const maxAttempts = 50;
    const stepSize = 2; // Distance between models
    
    // Get all visible models (not hidden)
    const visibleModels = existingModels.filter(m => !m.hidden);
    
    while (!foundPosition && attempts < maxAttempts) {
      // Check if this position is free (no collision with existing models)
      const hasCollision = visibleModels.some(model => {
        const distance = Math.sqrt(
          Math.pow(model.position.x - position.x, 2) +
          Math.pow(model.position.z - position.z, 2)
        );
        return distance < stepSize; // Too close to another model
      });
      
      if (!hasCollision) {
        foundPosition = true;
      } else {
        // Try next position in a spiral pattern
        attempts++;
        const angle = (attempts * 0.5) * Math.PI; // Spiral angle
        const radius = stepSize * (1 + Math.floor(attempts / 8)); // Increase radius every 8 attempts
        position = {
          x: radius * Math.cos(angle),
          y: 0,
          z: radius * Math.sin(angle)
        };
      }
    }

    // Create new model with found position
    const newModel: ModelData = {
      id: modelId,
      position: position,
      rotation: { x: 0, y: 0, z: 0 },
      modelPath: modelPath,
      hidden: false,
    };

    await saveModelData(newModel);
    return modelId;
  } catch (error) {
    console.error('Error creating new model:', error);
    throw error;
  }
};

export const deleteModel = async (modelId: string): Promise<void> => {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'models', modelId));
  } catch (error) {
    console.error('Error deleting model:', error);
    throw error;
  }
};