import React from "react";
import { useAudioClassification } from "../context/AudioClassificationContext.tsx";

function TeachableAudioUI() {
  const {
    status,
    samplesAdded,
    handleAudioUpload,
    trainAndPredict,
    predictAudio,
    predictInputRef,
    predictionResult,
    startRecording,
    stopRecording,
    startRecordingForPrediction,
    stopRecordingForPrediction,
    isRecording,
    isPredicting,
  } = useAudioClassification();

  return (
    <div className="flex justify-between p-8 bg-white min-h-screen">
      {/* Accept multiple sample audios if needed, when user clicks on add more button */}
      <div className="flex flex-col w-1/3 space-y-8">
        {/* Audio upload class for class 1 */}
        <div className="bg-blue-100 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Class-1</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Add sample audio
            </label>
            <input
              type="file"
              accept="audio/*"
              className="w-full"
              onChange={handleAudioUpload(0)}
            />
          </div>
          <button
            className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => startRecording(0)}
            disabled={isRecording}
          >
            {isRecording ? "Recording..." : "Record"}
          </button>
          {isRecording && (
            <button
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 mt-2"
              onClick={stopRecording}
            >
              Stop
            </button>
          )}
          <p>Status of audio upload for class 1: {samplesAdded[0]}</p>
        </div>
        {/* Audio upload class for class 2 */}
        <div className="bg-pink-100 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Class-2</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Add sample audio
            </label>
            <input
              type="file"
              accept="audio/*"
              className="w-full"
              onChange={handleAudioUpload(1)}
            />
          </div>
          <button
            className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => startRecording(1)}
            disabled={isRecording}
          >
            {isRecording ? "Recording..." : "Record"}
          </button>
          {isRecording && (
            <button
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 mt-2"
              onClick={stopRecording}
            >
              Stop
            </button>
          )}
          <p>Status of audio upload for class 2: {samplesAdded[1]}</p>
        </div>
      </div>
      {/* Model training */}
      <div className="flex flex-col w-1/3 space-y-8 items-center justify-center">
        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700"
          onClick={trainAndPredict}
        >
          Train
        </button>
        <p>Status of training: {status}</p>
      </div>
      {/* Prediction */}
      <div className="flex flex-col items-center justify-center w-1/3 space-y-8">
        <div className="text-center">
          <label className="block text-sm font-medium mb-2">Upload audio for prediction</label>
          <input
            type="file"
            accept="audio/*"
            className="w-full"
            ref={predictInputRef}
            onChange={predictAudio}
          />
        </div>
        <div className="text-center">
          <button
            className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 ${isPredicting ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={startRecordingForPrediction}
            disabled={isPredicting}
          >
            {isPredicting ? "Recording..." : "Record for Prediction"}
          </button>
          {isPredicting && (
            <button
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 mt-2"
              onClick={stopRecordingForPrediction}
            >
              Stop
            </button>
          )}
        </div>
        {/* Result of prediction as progress bar giving confidence of both classes */}
        <div className="bg-white p-6 rounded-lg shadow-md w-full">
          <h2 className="text-xl font-semibold mb-4">Result</h2>
          {predictionResult.map((result, index) => (
            <div key={index} className="mb-4">
              <p className="mb-2">{result.class}</p>
              <div
                className={`w-full ${index === 0 ? "bg-blue-100" : "bg-pink-100"} rounded-full h-2.5`}
              >
                <div
                  className={`h-2.5 rounded-full ${index === 0 ? "bg-blue-500" : "bg-red-500"}`}
                  style={{ width: `${result.confidence}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TeachableAudioUI;
