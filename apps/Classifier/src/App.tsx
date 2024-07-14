
import './App.css'
import * as React from "react"
import { BrowserRouter , Route , Routes } from 'react-router-dom'
import HomePage from './pages/HomePage.tsx'
import ImageClassificationEngine from './pages/ImageClassificationEngine.tsx'

 const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/image-classify" element={<ImageClassificationEngine/>} />

      </Routes>
    </BrowserRouter>
  )
}

export default App;
