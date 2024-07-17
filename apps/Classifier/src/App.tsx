import "./App.css";
import * as React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.tsx";
import ImageClassificationEngine from "./pages/ImageClassificationEngine.tsx";
import PoseEstimationEngine from "./pages/PoseEstimationEngine.tsx";
import { ImageClassificationProvider } from "./context/ImageClassificationContext.tsx";

const App = () => {
  return (
    <BrowserRouter>
      <ImageClassificationProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/image-classify"
            element={<ImageClassificationEngine />}
          />
          <Route path="/pose-estimation" element={<PoseEstimationEngine />} />
        </Routes>
      </ImageClassificationProvider>
    </BrowserRouter>
  );
};

export default App;
