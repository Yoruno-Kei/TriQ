import React from "react";

export default function UserInputArea({ userInput, setUserInput, onSubmit, userPrefix }) {
  return (
    <div className="fixed bottom-32 left-0 w-full flex justify-center z-50">
      <div className="bg-white shadow-lg rounded-xl p-4 w-[min(90%,600px)] border">
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (userInput.trim()) {
                onSubmit(`${userPrefix}${userInput.trim()}`);
                setUserInput("");
              }
            }
          }}
          rows={3}
          className="w-full p-2 border rounded text-base"
          placeholder="あなたの意見を入力..."
        />
        <button
          className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded"
          onClick={() => {
            if (userInput.trim()) {
              onSubmit(`${userPrefix}${userInput.trim()}`);
              setUserInput("");
            }
          }}
        >
          送信
        </button>
      </div>
    </div>
  );
}
