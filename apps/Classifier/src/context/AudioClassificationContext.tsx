import React, { createContext, useState, useContext, useEffect, useRef, ReactNode } from "react";
import * as tf from "@tensorflow/tfjs";

const CLASS_NAMES = ["Class 1", "Class 2"];
const MIN_SAMPLES_PER_CLASS = 10;
const SAMPLE_RATE = 16000;
const AUDIO_FEATURES = 128;

interface AudioClassificationContextProps {
  status: string;
  samplesAdded: number[];
  trainingDataInputs: tf.Tensor[];
  trainingDataOutputs: number[];
  predict: boolean;
  audioInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  predictInputRef: React.MutableRefObject<HTMLInputElement | null>;
  predictionResult: { class: string; confidence: number }[];
  handleAudioUpload: (classId: number) => (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  trainAndPredict: () => Promise<void>;
  predictAudio: () => Promise<void>;
  startRecording: (classId: number) => void;
  stopRecording: () => void;
  startRecordingForPrediction: () => void;
  stopRecordingForPrediction: () => void;
  isRecording: boolean;
  isPredicting: boolean;
}

interface AudioClassificationProviderProps {
  children: ReactNode;
}

const AudioClassificationContext = createContext<AudioClassificationContextProps | undefined>(undefined);

export const AudioClassificationProvider: React.FC<AudioClassificationProviderProps> = ({ children }) => {
  const [status, setStatus] = useState('');
  const [model, setModel] = useState<tf.Sequential | null>(null);
  const [trainingDataInputs, setTrainingDataInputs] = useState<tf.Tensor[]>([]);
  const [trainingDataOutputs, setTrainingDataOutputs] = useState<number[]>([]);
  const [predict, setPredict] = useState(false);
  const [samplesAdded, setSamplesAdded] = useState<number[]>(new Array(CLASS_NAMES.length).fill(0));
  const [isRecording, setIsRecording] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const audioInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const predictInputRef = useRef<HTMLInputElement>(null);
  const [predictionResult, setPredictionResult] = useState<{ class: string; confidence: number }[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const initializeTensorFlow = async () => {
      await tf.ready();
      await tf.setBackend('webgl'); // Or 'cpu' if you prefer
      initModel();
    };

    initializeTensorFlow();
  }, []);

  const initModel = () => {
    const newModel = tf.sequential();
    newModel.add(tf.layers.dense({ inputShape: [AUDIO_FEATURES], units: 128, activation: "relu" }));
    newModel.add(tf.layers.dense({ units: CLASS_NAMES.length, activation: "softmax" }));
    newModel.compile({
      optimizer: "adam",
      loss: CLASS_NAMES.length === 2 ? "binaryCrossentropy" : "categoricalCrossentropy",
      metrics: ["accuracy"],
    });
    setModel(newModel);
    setStatus("Model initialized!");
    console.log("Model compiled!");
  };

  const handleAudioUpload = (classId: number) => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    try {
      const audioBuffers = await Promise.all(Array.from(files).map(loadAudio));
      const audioFeatures = await Promise.all(audioBuffers.map(preprocessAudio));

      setTrainingDataInputs((prevInputs) => [...prevInputs, ...audioFeatures]);
      setTrainingDataOutputs((prevOutputs) => [...prevOutputs, ...Array(files.length).fill(classId)]);

      setSamplesAdded((prev) => {
        const newSamplesAdded = [...prev];
        if (newSamplesAdded[classId] !== undefined) {
          newSamplesAdded[classId] += files.length;
        }
        return newSamplesAdded;
      });

      setStatus(`Added ${files.length} audio samples to ${CLASS_NAMES[classId]}`);
    } catch (error) {
      console.error("Error handling audio upload:", error);
      setStatus("Error uploading audio samples");
    }
  };

  const loadAudio = (file: File): Promise<AudioBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
        audioContext.decodeAudioData(reader.result as ArrayBuffer, resolve, reject);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const preprocessAudio = async (audioBuffer: AudioBuffer) => {
    return tf.tidy(() => {
      const audioData = audioBuffer.getChannelData(0);
      const audioTensor = tf.tensor1d(audioData);
      const resizedTensor = tf.image.resizeBilinear(tf.expandDims(tf.expandDims(audioTensor, 0), -1) as tf.Tensor3D, [AUDIO_FEATURES, 1]);
      return resizedTensor;
    });
  };

  const trainAndPredict = async () => {
    // Check if each class has at least the minimum number of samples
    if (samplesAdded.some(count => count < MIN_SAMPLES_PER_CLASS)) {
      setStatus(`Each class must have at least ${MIN_SAMPLES_PER_CLASS} samples for training.`);
      return;
    }

    if (!model) return;

    setPredict(false);
    tf.util.shuffleCombo(trainingDataInputs, trainingDataOutputs);

    const outputsAsTensor = tf.tensor1d(trainingDataOutputs, "int32");
    const oneHotOutputs = tf.oneHot(outputsAsTensor, CLASS_NAMES.length);
    const inputsAsTensor = tf.concat(trainingDataInputs);

    try {
      const reshapedInputs = inputsAsTensor.reshape([trainingDataInputs.length, AUDIO_FEATURES]);

      await model.fit(reshapedInputs, oneHotOutputs, {
        epochs: 10,
        batchSize: 32,
        callbacks: {
          onEpochEnd: (epoch) => {
            console.log(`Epoch ${epoch + 1}/${10}`);
            setStatus(`Training: ${Math.round(((epoch + 1) / 10) * 100)}%`);
          },
        },
      });
      setStatus("Training complete! You can now make predictions.");
      setPredict(true);
    } catch (error) {
      console.error("Error during training:", error);
      setStatus("Error during training");
    } finally {
      tf.dispose([outputsAsTensor, oneHotOutputs, inputsAsTensor]);
    }
  };

  const startRecording = async (classId: number) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your browser does not support audio recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current);
        audioChunksRef.current = [];
        const audioBuffer = await loadAudioFromBlob(audioBlob);
        const audioFeature = await preprocessAudio(audioBuffer);

        setTrainingDataInputs((prevInputs) => [...prevInputs, audioFeature]);
        setTrainingDataOutputs((prevOutputs) => [...prevOutputs, classId]);
        setSamplesAdded((prev) => {
          const newSamplesAdded = [...prev];
          if (newSamplesAdded[classId] !== undefined) {
            newSamplesAdded[classId] += 1;
          }
          return newSamplesAdded;
        });

        setStatus(`Recorded and added audio sample to ${CLASS_NAMES[classId]}`);
        setIsRecording(false);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting audio recording:", error);
      alert("Error starting audio recording");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  const loadAudioFromBlob = (blob: Blob): Promise<AudioBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
        audioContext.decodeAudioData(reader.result as ArrayBuffer, resolve, reject);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  };

  const startRecordingForPrediction = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your browser does not support audio recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current);
        audioChunksRef.current = [];
        const audioBuffer = await loadAudioFromBlob(audioBlob);
        const audioFeature = await preprocessAudio(audioBuffer);

        await makePrediction(audioFeature);
        setIsPredicting(false);
      };
      mediaRecorderRef.current.start();
      setIsPredicting(true);
    } catch (error) {
      console.error("Error starting audio recording for prediction:", error);
      alert("Error starting audio recording for prediction");
    }
  };

  const stopRecordingForPrediction = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  const makePrediction = async (input: tf.Tensor) => {
    if (!model) return;

    try {
      const reshapedInput = input.reshape([1, AUDIO_FEATURES]);
      const prediction = model.predict(reshapedInput) as tf.Tensor;
      const predictionArray = prediction.dataSync() as Float32Array;
      
      const result = CLASS_NAMES.map((className, index) => ({
        class: className,
        confidence: predictionArray[index] ? predictionArray[index] * 100 : 0,
      }));

      setPredictionResult(result);
      console.log("Prediction result:", result);
      setStatus("Prediction complete!");
    } catch (error) {
      console.error("Error making prediction:", error);
      setStatus("Error making prediction");
    }
  };

  const predictAudio = async () => {
    const file = predictInputRef.current?.files?.[0];
    if (!file) return;

    try {
      const audioBuffer = await loadAudio(file);
      const audioFeature = await preprocessAudio(audioBuffer);
      await makePrediction(audioFeature);
    } catch (error) {
      console.error("Error predicting audio:", error);
      setStatus("Error predicting audio");
    }
  };

  return (
    <AudioClassificationContext.Provider
      value={{
        status,
        samplesAdded,
        trainingDataInputs,
        trainingDataOutputs,
        predict,
        audioInputRefs,
        predictInputRef,
        predictionResult,
        handleAudioUpload,
        trainAndPredict,
        predictAudio,
        startRecording,
        stopRecording,
        startRecordingForPrediction,
        stopRecordingForPrediction,
        isRecording,
        isPredicting,
      }}
    >
      {children}
    </AudioClassificationContext.Provider>
  );
};

export const useAudioClassification = () => {
  const context = useContext(AudioClassificationContext);
  if (!context) {
    throw new Error("useAudioClassification must be used within an AudioClassificationProvider");
  }
  return context;
};
