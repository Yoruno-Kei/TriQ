//CharacterSlider.jsx
import React from "react";
import { useDragScroll } from "./useDragScroll";

export default function CharacterSlider({
  title,
  characters,
  selectedKey,
  setSelectedKey,
  scrollRef,
}) {
  const { onMouseDown, onMouseUp, onMouseMove } = useDragScroll();

  const handleKeyScroll = (e) => {
    e.preventDefault();        // ← デフォルトのスクロールを止める
    e.stopPropagation();       // ← 他の親要素へのイベント伝播を止める
    const keys = Object.keys(characters);
    const index = keys.indexOf(selectedKey);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = (index + 1) % keys.length;
      setSelectedKey(keys[next]);
      scrollRef.current?.children[next]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = (index - 1 + keys.length) % keys.length;
      setSelectedKey(keys[prev]);
      scrollRef.current?.children[prev]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest"});
    }
  };

  return (
    <div className="mb-8">
      <div className="text-white font-semibold mb-2">{title}</div>
      <div
        ref={scrollRef}
        tabIndex={0}
        onClick={(e) => e.currentTarget.focus()}
        onKeyDown={handleKeyScroll}
        onMouseDown={(e) => onMouseDown(e, scrollRef)}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onMouseMove={(e) => onMouseMove(e, scrollRef)}
        className="overflow-x-auto flex gap-4 py-2 px-4 scrollbar-hide scroll-smooth cursor-grab active:cursor-grabbing"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {Object.entries(characters).map(([key, char]) => {
          const selected = selectedKey === key;
          return (
            <div
              key={key}
              onClick={() => setSelectedKey(key)}
              className={`min-w-[140px] flex-shrink-0 rounded-xl border transition cursor-pointer relative select-none
                ${
                  selected
                    ? "border-indigo-500 scale-105 shadow-xl bg-gradient-to-b from-indigo-900 to-gray-800"
                    : "border-gray-700 bg-gray-800"
                }
                hover:shadow-lg hover:scale-105 duration-200`}
              style={{ scrollSnapAlign: "start" }}
              >
              <img
                src={char.image}
                alt={char.label}
                className="w-full h-28 object-cover rounded-t-xl select-none"
              />
              <div className="p-2 text-center text-sm font-semibold text-white select-none">
                {char.label}
              </div>
            </div>
          );
        })}
        {/* 右端スペース */}
        <div className="min-w-[190px] flex-shrink-0" />
      </div>

      {selectedKey && (
        <div className="mt-4 p-4 rounded-xl bg-gray-800 border border-indigo-700 shadow-inner">
          <h3 className="text-lg font-bold text-indigo-300">{characters[selectedKey].label}</h3>
          <p className="text-sm text-gray-300 mt-1">{characters[selectedKey].description}</p>
          <p className="text-xs italic text-gray-400 mt-2">
            例：{characters[selectedKey].preview}
          </p>
        </div>
      )}
    </div>
  );
}
