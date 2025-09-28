import React, { useState } from "react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: number | null;
  gameUrl: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  gameId,
  gameUrl,
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(gameUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = gameUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareToSocial = (platform: string) => {
    const text = `Join my Rock Paper Scissors game! 🎮\n\nGame ID: #${gameId}\n\n`;
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(gameUrl);

    let shareUrl = "";
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodedText}${encodedUrl}`;
        break;
      case "discord":
        shareUrl = `https://discord.com/channels/@me`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Share Game</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Share this game with a friend to invite them to play!
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-600">
                Game ID:
              </span>
              <span className="font-mono text-lg font-bold text-primary">
                #{gameId}
              </span>
            </div>
            <div className="text-sm text-gray-500 break-all">{gameUrl}</div>
          </div>

          <button
            onClick={copyToClipboard}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
              copied
                ? "bg-green-500 text-white"
                : "bg-primary text-white hover:bg-primary-dark"
            }`}
          >
            {copied ? "✓ Copied to Clipboard!" : "📋 Copy Link"}
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium text-gray-600 mb-3">
            Share on social media:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => shareToSocial("twitter")}
              className="flex items-center justify-center gap-2 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <span>🐦</span>
              <span className="text-sm font-medium">Twitter</span>
            </button>
            <button
              onClick={() => shareToSocial("telegram")}
              className="flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>📱</span>
              <span className="text-sm font-medium">Telegram</span>
            </button>
            <button
              onClick={() => shareToSocial("whatsapp")}
              className="flex items-center justify-center gap-2 py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <span>💬</span>
              <span className="text-sm font-medium">WhatsApp</span>
            </button>
            <button
              onClick={() => shareToSocial("discord")}
              className="flex items-center justify-center gap-2 py-2 px-4 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              <span>💬</span>
              <span className="text-sm font-medium">Discord</span>
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            The link will automatically open the game for the second player
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
