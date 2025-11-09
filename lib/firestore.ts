import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ModelData } from '@/types/model';

export const saveModelData = async (modelData: ModelData) => {
  try {
    await setDoc(doc(db, 'models', modelData.id), {
      position: modelData.position,
      rotation: modelData.rotation,
      modelPath: modelData.modelPath,
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