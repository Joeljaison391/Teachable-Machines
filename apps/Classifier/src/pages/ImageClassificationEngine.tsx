import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Button } from '@repo/ui/button';

const CLASS_NAMES = ["Class 1", "Class 2"];
const MOBILE_NET_INPUT_HEIGHT = 224;
const MOBILE_NET_INPUT_WIDTH = 224;
const MOBILE_NET_URL = "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_small_100_224/feature_vector/5/default/1";

const ImageClassificationEngine: React.FC = () => {
  const [status, setStatus] = useState('');
  const [model, setModel] = useState<tf.Sequential | null>(null);
  const [mobilenetModel, setMobileNetModel] = useState<tf.GraphModel | null>(null);
  const [trainingDataInputs, setTrainingDataInputs] = useState<tf.Tensor[]>([]);
  const [trainingDataOutputs, setTrainingDataOutputs] = useState<number[]>([]);
  const [predict, setPredict] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const predictInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadMobileNetFeatureModel = async () => {
      try {
        const mobilenet = await tf.loadGraphModel(MOBILE_NET_URL, { fromTFHub: true });
        setMobileNetModel(mobilenet);
        setStatus('MobileNet v3 loaded successfully!');

        tf.tidy(() => {
          const answer = mobilenet.predict(tf.zeros([1, MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH, 3])) as tf.Tensor;
          console.log(answer.shape);
        });

        console.log("Model warm up complete!");
        initModel();
      } catch (error) {
        console.error('Error loading MobileNet model:', error);
        setStatus('Error loading MobileNet model');
      }
    };

    loadMobileNetFeatureModel();
  }, []);

  const initModel = () => {
    const newModel = tf.sequential();
    newModel.add(tf.layers.dense({ inputShape: [1024], units: 128, activation: "relu" }));
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

  const handleImageUpload = (classId: number) => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    try {
      const images = await Promise.all(Array.from(files).map(loadImage));
      const imageFeatures = await Promise.all(images.map(preprocessImage));

      setTrainingDataInputs(prevInputs => [...prevInputs, ...imageFeatures]);
      setTrainingDataOutputs(prevOutputs => [...prevOutputs, ...Array(files.length).fill(classId)]);
      setStatus(`Added ${files.length} images to Class ${classId + 1}`);
    } catch (error) {
      console.error('Error handling image upload:', error);
      setStatus('Error uploading images');
    }
  };

  const loadImage = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
        img.onload = () => resolve(img);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const preprocessImage = async (img: HTMLImageElement) => {
    return tf.tidy(() => {
      const imageTensor = tf.browser.fromPixels(img);
      const resizedTensorFrame = tf.image.resizeBilinear(imageTensor as tf.Tensor3D, [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH], true);
      const normalizedTensorFrame = resizedTensorFrame.div(255);
      return mobilenetModel!.predict(normalizedTensorFrame.expandDims()) as tf.Tensor;
    });
  };

  const trainAndPredict = async () => {
    if (!model) return;

    setPredict(false);
    tf.util.shuffleCombo(trainingDataInputs, trainingDataOutputs);

    const outputsAsTensor = tf.tensor1d(trainingDataOutputs, "int32");
    const oneHotOutputs = tf.oneHot(outputsAsTensor, CLASS_NAMES.length);
    const inputsAsTensor = tf.concat(trainingDataInputs);

    try {
      // Reshape the input tensor to match the expected shape
      const reshapedInputs = inputsAsTensor.reshape([trainingDataInputs.length, 1024]);

      await model.fit(reshapedInputs, oneHotOutputs, {
        epochs: 10,
        batchSize: 32,
        callbacks: {
          onEpochEnd: (epoch) => {
            console.log(`Epoch ${epoch + 1}/${10}`);
            setStatus(`Training: ${Math.round((epoch + 1) / 10 * 100)}%`);
          }
        },
      });
      setStatus('Training complete! You can now make predictions.');
      setPredict(true);
    } catch (error) {
      console.error('Error during training:', error);
      setStatus('Error during training');
    } finally {
      tf.dispose([outputsAsTensor, oneHotOutputs, inputsAsTensor]);
    }
  };

  const predictImage = async () => {
    if (!predict || !model || !mobilenetModel || !predictInputRef.current?.files?.[0]) return;

    const file = predictInputRef.current.files[0];

    try {
      const img = await loadImage(file);
      const prediction = tf.tidy(() => {
        const imageTensor = tf.browser.fromPixels(img).div(255);
        const resizedTensorFrame = tf.image.resizeBilinear(imageTensor as tf.Tensor3D, [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH], true);
        const imageFeatures = mobilenetModel.predict(resizedTensorFrame.expandDims()) as tf.Tensor;
        return model.predict(imageFeatures.reshape([1, 1024])) as tf.Tensor;
      });

      const predictionArray = await prediction.array() as number[][];
      const highestIndex = predictionArray[0]?.indexOf(Math.max(...predictionArray[0])) ?? -1;
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      const confidence = (predictionArray[0]?.[highestIndex] ?? 0) ? Math.floor(predictionArray[0]?.[highestIndex]! * 100) : 0;

      setStatus(`Prediction: ${CLASS_NAMES[highestIndex]} with ${confidence}% confidence`);
      tf.dispose(prediction);
    } catch (error) {
      console.error('Error during prediction:', error);
      setStatus('Error during prediction');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center mb-8">Teachable Machine-like Image Classifier</h1>
      
      {CLASS_NAMES.map((className, index) => (
        <div key={className} className="mb-4">
          <h2 className="text-xl font-bold text-center mb-2">{className}</h2>
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handleImageUpload(index)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
            ref={index === 0 ? fileInputRef : undefined}
          />
        </div>
      ))}

      <Button type="button" text="Train Model" action={trainAndPredict} />
      
      <div className="mt-4">
        <input 
          type="file" 
          accept="image/*" 
          onChange={predictImage}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
          ref={predictInputRef}
          disabled={!predict}
        />
      </div>

      <Button type="button" text="Predict" action={predictImage} />
      <p className="text-center text-lg mt-4">{status}</p>
    </div>
  );
};

export default ImageClassificationEngine;