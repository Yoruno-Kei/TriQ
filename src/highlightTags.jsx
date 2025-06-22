import React from "react";

export function highlightTags(text) {
  if (typeof text !== "string") return text;

  const regex = /(#\S+?)(?=\s|$|[.,!?"'“”‘’])/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <span
        key={match.index}
        className="inline-block bg-indigo-600 text-white px-2 py-0.5 rounded-full text-xs font-bold mr-1 select-none"
      >
        {match[1]}
      </span>
    );
    lastIndex = match.index + match[1].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts;
}
