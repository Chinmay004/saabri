'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'

interface ImageViewerModalProps {
  isOpen: boolean
  onClose: () => void
  images: string[]
  initialIndex?: number
  propertyTitle: string
}

export default function ImageViewerModal({ isOpen, onClose, images, initialIndex = 0, propertyTitle }: ImageViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
    }
  }, [isOpen, initialIndex])

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }, [images.length])

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }, [images.length])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    const handleArrowKeys = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'ArrowLeft') handlePrevious()
      if (e.key === 'ArrowRight') handleNext()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('keydown', handleArrowKeys)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('keydown', handleArrowKeys)
    }
  }, [isOpen, handleNext, handlePrevious, onClose])

  if (!isOpen) return null

  if (typeof window === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 text-white">
          <div className="flex-1">
            <p className="text-lg font-semibold">{propertyTitle}</p>
            <p className="text-sm text-gray-400">
              Image {currentIndex + 1} of {images.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Image */}
        <div className="flex-1 flex items-center justify-center px-6 pb-6 relative">
          {/* Previous Button */}
          {images.length > 1 && (
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
              aria-label="Previous image"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image Container */}
          <div className="relative w-full h-full max-w-6xl max-h-[70vh]">
            <Image
              src={images[currentIndex]}
              alt={`${propertyTitle} - Image ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Next Button */}
          {images.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
              aria-label="Next image"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="bg-black/50 backdrop-blur-sm p-4">
            <div className="flex gap-3 overflow-x-auto max-w-6xl mx-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent p-1">
              {images.map((image, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className="relative shrink-0 w-20 h-20 transition-all"
                >
                  <div className={`relative w-full h-full rounded-lg transition-all ${
                    currentIndex === idx 
                      ? 'ring-[3px] ring-[#1f2462] opacity-100' 
                      : 'opacity-50 hover:opacity-75'
                  }`}>
                    <div className="relative w-full h-full rounded-lg overflow-hidden">
                      <Image
                        src={image}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
