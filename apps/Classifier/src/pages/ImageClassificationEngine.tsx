import React, { useState, useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import { Camera, Image, Brain, ArrowRight, Check } from "lucide-react";
// import { Button } from '@repo/ui/button';

const Button = ({
  text,
  action,
  icon,
  disabled = false,
}: {
  text: string;
  action: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
}) => (
  <button
    onClick={action}
    disabled={disabled}
    className={`flex items-center justify-center space-x-2 ${disabled ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"} text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105`}
  >
    {icon}
    <span>{text}</span>
  </button>
);

const Step = ({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
    <h2 className="text-2xl font-bold mb-4 text-blue-600">
      Step {number}: {title}
    </h2>
    {children}
  </div>
);

const CLASS_NAMES = ["Class 1", "Class 2"];
const MOBILE_NET_INPUT_HEIGHT = 224;
const MOBILE_NET_INPUT_WIDTH = 224;
const MOBILE_NET_URL =
  "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_small_100_224/feature_vector/5/default/1";

const ImageClassificationEngine: React.FC = () => {
  const [status, setStatus] = useState('');
  const [model, setModel] = useState<tf.Sequential | null>(null);
  const [mobilenetModel, setMobileNetModel] = useState<tf.GraphModel | null>(null);
  const [trainingDataInputs, setTrainingDataInputs] = useState<tf.Tensor[]>([]);
  const [trainingDataOutputs, setTrainingDataOutputs] = useState<number[]>([]);
  const [predict, setPredict] = useState(false);
  const [imagesAdded, setImagesAdded] = useState<number[]>(new Array(CLASS_NAMES.length).fill(0));
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const predictInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadMobileNetFeatureModel = async () => {
      try {
        const mobilenet = await tf.loadGraphModel(MOBILE_NET_URL, {
          fromTFHub: true,
        });
        setMobileNetModel(mobilenet);
        setStatus("Magic Picture Sorter is ready!");
        initModel();
      } catch (error) {
        console.error("Error loading MobileNet model:", error);
        setStatus(
          "Oops! There was a problem getting the Magic Picture Sorter ready."
        );
      }
    };

    loadMobileNetFeatureModel();
  }, []);

  const initModel = () => {
    const newModel = tf.sequential();
    newModel.add(
      tf.layers.dense({ inputShape: [1024], units: 128, activation: "relu" })
    );
    newModel.add(
      tf.layers.dense({ units: CLASS_NAMES.length, activation: "softmax" })
    );
    newModel.compile({
      optimizer: "adam",
      loss:
        CLASS_NAMES.length === 2
          ? "binaryCrossentropy"
          : "categoricalCrossentropy",
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

      setTrainingDataInputs((prevInputs) => [
        ...prevInputs,
        ...imageFeatures,
      ]);
      setTrainingDataOutputs((prevOutputs) => [
        ...prevOutputs,
        ...Array(files.length).fill(classId),
      ]);

      setImagesAdded((prev) => {
        const newImagesAdded = [...prev];
        newImagesAdded[classId] += files.length;
        return newImagesAdded;
      });

      setStatus(`Added ${files.length} images to ${CLASS_NAMES[classId]}`);
    } catch (error) {
      console.error("Error handling image upload:", error);
      setStatus("Error uploading images");
    }
  };

  const loadImage = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
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
      const resizedTensorFrame = tf.image.resizeBilinear(
        imageTensor as tf.Tensor3D,
        [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH],
        true
      );
      const normalizedTensorFrame = resizedTensorFrame.div(255);
      return mobilenetModel!.predict(
        normalizedTensorFrame.expandDims()
      ) as tf.Tensor;
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
      const reshapedInputs = inputsAsTensor.reshape([
        trainingDataInputs.length,
        1024,
      ]);

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

  const predictImage = async () => {
    if (!predict || !model || !mobilenetModel || !predictInputRef.current?.files?.[0]) return;

    const file = predictInputRef.current.files[0];

    try {
      const img = await loadImage(file);
      const prediction = tf.tidy(() => {
        const imageTensor = tf.browser.fromPixels(img).div(255);
        const resizedTensorFrame = tf.image.resizeBilinear(
          imageTensor as tf.Tensor3D,
          [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH],
          true
        );
        const imageFeatures = mobilenetModel.predict(
          resizedTensorFrame.expandDims()
        ) as tf.Tensor;
        return model.predict(imageFeatures.reshape([1, 1024])) as tf.Tensor;
      });

      const predictionArray = (await prediction.array()) as number[][];
      const highestIndex =
        predictionArray[0]?.indexOf(Math.max(...predictionArray[0])) ?? -1;
      const confidence =
        predictionArray[0]?.[highestIndex] ?? 0
          ? Math.floor(predictionArray[0]?.[highestIndex]! * 100)
          : 0;

      setStatus(
        `Prediction: ${CLASS_NAMES[highestIndex]} with ${confidence}% confidence`
      );
      tf.dispose(prediction);
    } catch (error) {
      console.error("Error during prediction:", error);
      setStatus("Error during prediction");
    }
  };

  return (
    <div className="container mx-auto p-4 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-8 text-purple-600">
        Magic Picture Sorter!
      </h1>

      <div className="max-w-3xl mx-auto space-y-8">
        <Step number={1} title="Collect Your Pictures">
          <p className="mb-4">
            For each group, choose some pictures that look alike. For example,
            if you're sorting animals, you might have groups for dogs and cats.
          </p>
          {CLASS_NAMES.map((className, index) => (
            <div key={className} className="mb-4">
              <h3 className="text-xl font-semibold mb-2 text-green-600">
                {className}
              </h3>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="border rounded-md p-2"
                  ref={(el) => (fileInputRefs.current[index] = el)}
                  onChange={handleImageUpload(index)}
                />
                <Button
                  text="Upload"
                  action={() => fileInputRefs.current[index]?.click()}
                  icon={<Camera size={16} />}
                />
                <span className="text-gray-600">
                  {imagesAdded[index]} images added
                </span>
              </div>
            </div>
          ))}
        </Step>

        <Step number={2} title="Train the Model">
          <p className="mb-4">
            Now let's train your model. This will take a few minutes. Once it's
            done, you'll be able to sort new pictures!
          </p>
          <Button
            text="Train"
            action={trainAndPredict}
            icon={<Brain size={16} />}
            disabled={trainingDataInputs.length === 0}
          />
        </Step>

        <Step number={3} title="Test the Model">
          <p className="mb-4">
            Try out your model! Upload a new picture, and the model will try to
            classify it based on what it learned.
          </p>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept="image/*"
              className="border rounded-md p-2"
              ref={predictInputRef}
            />
            <Button
              text="Predict"
              action={predictImage}
              icon={<ArrowRight size={16} />}
              disabled={!predict}
            />
          </div>
        </Step>

        {status && (
          <div className="bg-blue-100 border-t-4 border-blue-500 rounded-b text-blue-900 px-4 py-3 shadow-md" role="alert">
            <div className="flex">
              <div className="py-1"><Check size={16} /></div>
              <div>
                <p className="font-bold">Status</p>
                <p className="text-sm">{status}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageClassificationEngine;
