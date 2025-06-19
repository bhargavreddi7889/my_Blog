import { useState } from 'react';
import { 
  FaFacebookF, 
  FaTwitter, 
  FaLinkedinIn, 
  FaWhatsapp, 
  FaRedditAlien, 
  FaTelegramPlane,
  FaLink,
  FaCheck
} from 'react-icons/fa';

const ShareButtons = ({ url, title, summary }) => {
  const [copied, setCopied] = useState(false);
  
  // Encode parameters properly
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedSummary = encodeURIComponent(summary?.slice(0, 150) || '');
  
  // Define share URLs
  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedSummary}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
  };
  
  // Handle window-based sharing
  const handleShare = (platform) => {
    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  };
  
  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  return (
    <div className="share-buttons">
      <p className="text-gray-600 mb-3 font-medium">Share this post:</p>
      <div className="flex flex-wrap gap-2">
        {/* Facebook */}
        <button
          onClick={() => handleShare('facebook')}
          aria-label="Share on Facebook"
          className="w-9 h-9 rounded-full bg-[#3b5998] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <FaFacebookF />
        </button>
        
        {/* Twitter */}
        <button
          onClick={() => handleShare('twitter')}
          aria-label="Share on Twitter"
          className="w-9 h-9 rounded-full bg-[#1da1f2] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <FaTwitter />
        </button>
        
        {/* LinkedIn */}
        <button
          onClick={() => handleShare('linkedin')}
          aria-label="Share on LinkedIn"
          className="w-9 h-9 rounded-full bg-[#0077b5] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <FaLinkedinIn />
        </button>
        
        {/* WhatsApp */}
        <button
          onClick={() => handleShare('whatsapp')}
          aria-label="Share on WhatsApp"
          className="w-9 h-9 rounded-full bg-[#25d366] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <FaWhatsapp />
        </button>
        
        {/* Reddit */}
        <button
          onClick={() => handleShare('reddit')}
          aria-label="Share on Reddit"
          className="w-9 h-9 rounded-full bg-[#ff4500] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <FaRedditAlien />
        </button>
        
        {/* Telegram */}
        <button
          onClick={() => handleShare('telegram')}
          aria-label="Share on Telegram"
          className="w-9 h-9 rounded-full bg-[#0088cc] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <FaTelegramPlane />
        </button>
        
        {/* Copy Link */}
        <button
          onClick={copyToClipboard}
          aria-label="Copy link"
          className="w-9 h-9 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-300 transition-colors"
        >
          {copied ? <FaCheck className="text-green-600" /> : <FaLink />}
        </button>
      </div>
      
      {copied && (
        <div className="mt-2 text-sm text-green-600">Link copied to clipboard!</div>
      )}
    </div>
  );
};

export default ShareButtons; 