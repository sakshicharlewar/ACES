import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, Maximize, Download, RotateCw } from "lucide-react";

export function ImagePreviewModal({ isOpen, onClose, imageUrl, altText = "Attachment" }) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      const handleKeyDown = (e) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const isPdf = imageUrl.startsWith("data:application/pdf") || imageUrl.toLowerCase().endsWith(".pdf");

  const handleZoomIn = () => setScale(s => Math.min(s + 0.5, 4));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.5, 0.5));
  const handleFitScreen = () => {
    setScale(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation(r => r + 90);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = altText || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div className="absolute top-4 right-4 flex items-center gap-4 z-[110] bg-[#0a1120]/80 p-2 rounded-xl border border-white/10 backdrop-blur-md" onClick={e => e.stopPropagation()}>
          {!isPdf && (
            <>
              <button onClick={handleZoomOut} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Zoom Out">
                <ZoomOut className="w-5 h-5" />
              </button>
              <span className="text-white/50 text-xs font-mono">{Math.round(scale * 100)}%</span>
              <button onClick={handleZoomIn} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Zoom In">
                <ZoomIn className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-white/10 mx-1"></div>
              <button onClick={handleFitScreen} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Fit to Screen">
                <Maximize className="w-5 h-5" />
              </button>
              <button onClick={handleRotate} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Rotate">
                <RotateCw className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-white/10 mx-1"></div>
            </>
          )}
          
          <button onClick={handleDownload} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Download">
            <Download className="w-5 h-5" />
          </button>
          
          <button onClick={onClose} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors ml-2" title="Close (Esc)">
            <X className="w-5 h-5" />
          </button>
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-full max-h-full flex items-center justify-center overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {isPdf ? (
            <div className="bg-[#0d1426] border border-white/10 rounded-2xl p-12 flex flex-col items-center gap-6">
              <div className="w-24 h-24 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-white font-medium text-lg">PDF Document</h3>
                <p className="text-white/50 text-sm mt-2">PDF previews are not available inline.</p>
              </div>
              <button onClick={handleDownload} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          ) : (
            <div className="overflow-auto max-w-[95vw] max-h-[90vh] custom-scrollbar rounded-lg">
               <motion.img
                src={imageUrl}
                alt={altText}
                style={{
                  scale,
                  rotate: rotation,
                }}
                className="max-w-none origin-center object-contain transition-transform duration-200"
                draggable={false}
              />
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
