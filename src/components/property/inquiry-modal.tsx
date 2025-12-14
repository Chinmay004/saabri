'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface InquiryModalProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
  propertyTitle: string
}

export default function InquiryModal({ isOpen, onClose, propertyId, propertyTitle }: InquiryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      const formDataToSend = new FormData(e.currentTarget)
      formDataToSend.append('access_key', '2f1d554b-4ad2-4bdb-b539-7fdf732d831f')
      formDataToSend.append('property', propertyTitle)

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formDataToSend
      })

      const data = await response.json()

      if (data.success) {
        setSubmitStatus('success')
        setFormData({ name: '', email: '', phone: '', message: '' })
        setTimeout(() => {
          onClose()
          setSubmitStatus(null)
        }, 2000)
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#e5e5e5] p-4 md:p-6 flex items-start justify-between z-10">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-black text-lg md:text-xl lg:text-2xl font-semibold leading-normal">
              Property Inquiry
            </h2>
            <p className="text-[#61656e] text-xs md:text-sm lg:text-base mt-1 truncate">
              {propertyTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#61656e] hover:text-black transition-colors shrink-0"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          {/* Status Messages */}
          {submitStatus === 'success' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              Thank you! Your inquiry has been submitted successfully. We&apos;ll get back to you soon.
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              Sorry, there was an error submitting your inquiry. Please try again.
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name */}
            <div className="w-full">
              <label htmlFor="name" className="block text-black text-sm md:text-base font-medium mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full py-2.5 md:py-3 px-3 rounded-[4px] bg-white border border-[#dddddd] placeholder:text-[#9E9E9E] text-black text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#1f2462] focus:border-transparent"
                placeholder="Enter Full Name"
              />
            </div>

            {/* Email */}
            <div className="w-full">
              <label htmlFor="email" className="block text-black text-sm md:text-base font-medium mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full py-2.5 md:py-3 px-3 rounded-[4px] bg-white border border-[#dddddd] placeholder:text-[#9E9E9E] text-black text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#1f2462] focus:border-transparent"
                placeholder="Enter Email"
              />
            </div>

            {/* Phone */}
            <div className="w-full">
              <label htmlFor="phone" className="block text-black text-sm md:text-base font-medium mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full py-2.5 md:py-3 px-3 rounded-[4px] bg-white border border-[#dddddd] placeholder:text-[#9E9E9E] text-black text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#1f2462] focus:border-transparent"
                placeholder="Enter Phone Number"
              />
            </div>

            {/* Message */}
            <div className="w-full">
              <label htmlFor="message" className="block text-black text-sm md:text-base font-medium mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={4}
                className="w-full py-2.5 md:py-3 px-3 rounded-[4px] bg-white border border-[#dddddd] placeholder:text-[#9E9E9E] text-black text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#1f2462] focus:border-transparent resize-none"
                placeholder="Write your message..."
              />
            </div>

            {/* Submit Button */}
            <div className="mt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1f2462] hover:bg-[#1a1f5a] transition-colors text-white rounded-[4px] font-medium text-sm md:text-base px-4 md:px-6 py-2.5 md:py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send Inquiry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
