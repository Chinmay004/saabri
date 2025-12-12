"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

interface DescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
}

export default function DescriptionModal({ isOpen, onClose, title, description }: DescriptionModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#e5e5e5] p-6 flex items-start justify-between z-10">
          <h2 className="text-black text-xl md:text-2xl font-semibold leading-normal pr-8">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-[#61656e] hover:text-black transition-colors shrink-0"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-[#61656e] text-base md:text-lg leading-relaxed whitespace-pre-wrap">
            {description}
          </p>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-[#e5e5e5] p-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#1f2462] text-white px-6 py-3 rounded-[4px] font-medium hover:bg-[#1a1f5a] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
