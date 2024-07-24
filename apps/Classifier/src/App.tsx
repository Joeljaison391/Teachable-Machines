import "./App.css";
import * as React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.tsx";
import ImageClassificationEngine from "./pages/ImageClassificationEngine.tsx";
import PoseEstimationEngine from "./pages/PoseEstimationEngine.tsx";
import { ImageClassificationProvider } from "./context/ImageClassificationContext.tsx";
import { PoseDetectionProvider } from "./context/PoseDetectionContext.tsx";
import AudioClassificationEngine from "./pages/AudioClassificationEngine.tsx";
import { AudioClassificationProvider } from "./context/AudioClassificationContext.tsx";

const App = () => {
  return (
    <BrowserRouter>
      <ImageClassificationProvider>
        <PoseDetectionProvider>
          <AudioClassificationProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/image-classify"
              element={<ImageClassificationEngine />}
            />
            <Route path="/pose-estimation" element={<PoseEstimationEngine />} />
            <Route path="/audio-classification" element={<AudioClassificationEngine />} />
          </Routes>
          </AudioClassificationProvider>
        </PoseDetectionProvider>
      </ImageClassificationProvider>
    </BrowserRouter>
  );
};

export default App;
