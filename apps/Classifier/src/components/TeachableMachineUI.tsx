import React, { useEffect, useState } from "react";
import { useImageClassification } from "../context/ImageClassificationContext.tsx";


function TeachableMachineUI() {
  const {
    status,
    imagesAdded,
    handleImageUpload,
    trainAndPredict,
    predictImage,
    startWebcam,
    stopWebcam,
    predictInputRef,
    webcamRef,
    predictionResult,
    captureFrame,
    startLivePrediction,
    stopLivePrediction,
  } = useImageClassification();

  return (
    <div className="flex justify-between p-8 bg-white min-h-screen">
      {/* Accept multiple sample images if needed, when user clicks on add more button */}
      <div className="flex flex-col w-1/3 space-y-8">
        {/* Image upload class for class 1 */}
        <div className="bg-blue-100 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Class-1</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Add sample image</label>
            <input type="file" accept="image/*" className="w-full" onChange={handleImageUpload(0)} />
          </div>
          <span className="block text-center mb-4">OR</span>
          <div className="text-center">
            <label className="block text-sm font-medium mb-2">Use your webcam</label>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700" onClick={startWebcam}>Start</button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 ml-2" onClick={() => captureFrame(0)}>Capture</button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 ml-2" onClick={stopWebcam}>Stop</button>
          </div>
          <p>Status of image upload for class 1: {imagesAdded[0]}</p>
          <video ref={webcamRef} autoPlay className="mt-4" width="200" height="150"></video>
        </div>
        {/* Image upload class for class 2 */}
        <div className="bg-pink-100 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Class-2</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Add sample image</label>
            <input type="file" accept="image/*" className="w-full" onChange={handleImageUpload(1)} />
          </div>
          <span className="block text-center mb-4">OR</span>
          <div className="text-center">
            <label className="block text-sm font-medium mb-2">Use your webcam</label>
            <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700" onClick={startWebcam}>Start</button>
            <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 ml-2" onClick={() => captureFrame(1)}>Capture</button>
            <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 ml-2" onClick={stopWebcam}>Stop</button>
          </div>
          <p>Status of image upload for class 2: {imagesAdded[1]}</p>
          <video ref={webcamRef} autoPlay className="mt-4" width="200" height="150"></video>
        </div>
      </div>
      {/* Model training */}
      <div className="flex flex-col w-1/3 space-y-8 items-center justify-center">
        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700" onClick={trainAndPredict}>Train</button>
        <p>Status of training: {status}</p>
      </div>
      {/* Live prediction */}
      <div className="flex flex-col items-center justify-center w-1/3 space-y-8">
        <div className="text-center">
          <label className="block text-sm font-medium mb-2">Use your webcam</label>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
            onClick={startLivePrediction}
          >
            Start Live Prediction
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 ml-2"
            onClick={stopLivePrediction}
          >
            Stop Live Prediction
          </button>
          <video ref={webcamRef} autoPlay className="mt-4" width="200" height="150"></video>
        </div>
        <p className="block text-center">OR</p>
        <div className="text-center">
          <label className="block text-sm font-medium mb-2">Upload image</label>
          <input type="file" accept="image/*" className="w-full" ref={predictInputRef} onChange={predictImage} />
        </div>
        {/* Result of prediction as progress bar giving confidence of both classes */}
        <div className="bg-white p-6 rounded-lg shadow-md w-full">
          <h2 className="text-xl font-semibold mb-4">Result</h2>
          {predictionResult.map((result, index) => (
            <div key={index} className="mb-4">
              <p className="mb-2">{result.class}</p>
              <div className={`w-full ${index === 0 ? 'bg-blue-100' : 'bg-pink-100'} rounded-full h-2.5`}>
                <div className={`h-2.5 rounded-full ${index === 0 ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${result.confidence}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TeachableMachineUI;
