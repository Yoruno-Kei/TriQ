export default function ShareButtons({ logData, title }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [docId, setDocId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("URLコピー失敗:", err);
    }
  };

  const handleShareClick = async () => {
    if (!logData) return;
    try {
      const id = await saveLogToFirestore(logData, docId);
      setDocId(id);
      const url = `${window.location.origin}/TriQ/log/${id}`;
      setShareUrl(url);
      setOpen(true);
    } catch (e) {
      console.error("Firestore共有失敗:", e);
      alert("共有に失敗しました。もう一度お試しください。");
    }
  };

  return (
    <div ref={menuRef} className="relative inline-block text-left z-50">
      <button
        onClick={handleShareClick}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-semibold"
      >
        共有
      </button>

      {open && shareUrl && (
        <div className="absolute bottom-full right-0 mb-2 w-56 bg-white p-4 rounded shadow-lg flex flex-col gap-3 z-50">
          <FacebookShareButton url={shareUrl} quote={title}>
            <div className="flex items-center gap-2">
              <FacebookIcon size={32} round />
              <span className="text-sm text-gray-800 font-medium">Facebookで共有</span>
            </div>
          </FacebookShareButton>

          <TwitterShareButton url={shareUrl} title={title}>
            <div className="flex items-center gap-2">
              <TwitterIcon size={32} round />
              <span className="text-sm text-gray-800 font-medium">Twitterで共有</span>
            </div>
          </TwitterShareButton>

          <LineShareButton url={shareUrl} title={title}>
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

          {copied && <div className="text-green-600 text-xs mt-1">✅ コピーしました！</div>}
        </div>
      )}
    </div>
  );
}
