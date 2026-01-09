'use client';

interface SuccessPopupProps {
  message: string;
  onClose?: () => void;
}

export default function SuccessPopup({ message, onClose }: SuccessPopupProps) {
  return (
    <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 flex items-center gap-3 z-50 font-manrope">
      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">✓</div>
      <p className="text-sm font-medium text-green-800">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="text-green-600 hover:text-green-800 ml-2 text-lg"
        >
          ×
        </button>
      )}
    </div>
  );
}

