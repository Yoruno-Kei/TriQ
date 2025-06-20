// App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainPage from "./MainPage";
import LogDetail from "./LogDetail";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white font-sans">
        <header className="py-10 text-center shadow-lg bg-opacity-90 bg-gray-950">
          <h1 className="text-6xl font-extrabold text-blue-400 drop-shadow-md tracking-wide">
            🤖 TriQ
          </h1>
          <p className="mt-3 text-xl sm:text-2xl text-gray-300 font-light">
            AIたちによる未来型討論アプリ
          </p>
        </header>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/log/:id" element={<LogDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
