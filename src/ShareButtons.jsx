// ShareButtons.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  FacebookShareButton,
  TwitterShareButton,
  LineShareButton,
  FacebookIcon,
  TwitterIcon,
  LineIcon,
} from "react-share";

export default function ShareButtons({ url, title }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("URLコピーに失敗しました:", err);
    }
  };

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative inline-block text-left ml-3 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-semibold"
      >
        共有
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 right-0 bg-white p-4 rounded shadow-lg flex flex-col gap-3 w-56">
          <FacebookShareButton url={url} quote={title}>
            <div className="flex items-center gap-2">
              <FacebookIcon size={32} round />
              <span className="text-sm text-gray-800 font-medium">Facebookで共有</span>
            </div>
          </FacebookShareButton>

          <TwitterShareButton url={url} title={title}>
            <div className="flex items-center gap-2">
              <TwitterIcon size={32} round />
              <span className="text-sm text-gray-800 font-medium">Twitterで共有</span>
            </div>
          </TwitterShareButton>

          <LineShareButton url={url} title={title}>
            <div className="flex items-center gap-2">
              <LineIcon size={32} round />
              <span className="text-sm text-gray-800 font-medium">LINEで共有</span>
            </div>
          </LineShareButton>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            📋 URLをコピー
          </button>

          {copied && (
            <div className="text-green-600 text-xs mt-1">✅ コピーしました！</div>
          )}
        </div>
      )}
    </div>
  );
}
