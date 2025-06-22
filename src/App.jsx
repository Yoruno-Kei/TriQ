// App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainPage from "./MainPage";
import LogDetail from "./LogDetail";

function App() {
  return (
    <BrowserRouter basename="/TriQ">
      <div className="min-h-screen bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white font-sans">
        <header className="py-6 text-center bg-gradient-to-r from-indigo-700 via-purple-800 to-indigo-900 shadow-lg">
  <div className="flex justify-center items-center gap-3">
    <img
      src="/TriQ/logo192.png"
      alt="TriQ logo"
      className="w-10 h-10 sm:w-12 sm:h-12 rounded-md shadow-md"
    />
    <h1 className="text-4xl sm:text-5xl font-extrabold text-white drop-shadow-lg tracking-wide select-none">
      TriQ
    </h1>
  </div>
  <p className="mt-1 text-sm sm:text-base text-indigo-200 font-light select-none">
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
