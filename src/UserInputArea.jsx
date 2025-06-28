export default function UserInputArea({
  isVisible,
  isFinalPhase = false, 
  userInput,
  setUserInput,
  onSubmit,
  maxLength = 50,
}) {
  if (!isVisible) return null;

  const handleChange = (e) => {
    let val = e.target.value;
    if (val.length > maxLength) {
      val = val.slice(0, maxLength);
    }
    setUserInput(val);
  };

  const handleSubmit = () => {
    const trimmed = userInput.trim();
    if (trimmed) {
      onSubmit(trimmed);
      setUserInput("");
    }
  };

  return (
    <div className="fixed bottom-28 sm:bottom-32 left-0 w-full flex justify-center z-50 pointer-events-auto">
      <div className="bg-white/90 backdrop-blur-md shadow-xl rounded-xl p-4 w-[95%] sm:w-[min(90%,600px)] border border-gray-300">
        <p className="text-sm sm:text-base font-semibold text-gray-700 mb-2">
          🧑 {isFinalPhase ? "あなたの最終ターン(意見要約+α)" : "あなたのターン"}
        </p>
        <textarea
          value={userInput}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          rows={3}
          inputMode="text"
          className="w-full p-2 border rounded text-sm sm:text-base text-black bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder={`あなたの意見を入力...（最大${maxLength}文字）`}
          maxLength={maxLength}
        />
        <div className="text-right text-xs sm:text-sm text-gray-500 mt-1">
          {userInput.length} / {maxLength}
        </div>
        <button
          className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 sm:py-3 rounded w-full sm:w-auto"
          onClick={handleSubmit}
        >
          送信
        </button>
      </div>
    </div>
  );
}
