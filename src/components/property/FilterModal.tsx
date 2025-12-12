'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FilterOptions } from '../../lib/properties';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
}

export default function FilterModal({ isOpen, onClose, filters, onApplyFilters }: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {};
    setLocalFilters(resetFilters);
    onApplyFilters(resetFilters);
    onClose();
  };

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
        <div className="sticky top-0 bg-white border-b border-[#e5e5e5] p-6 flex items-start justify-between z-10">
          <h2 className="text-black text-xl md:text-2xl font-semibold leading-normal">
            Filter Properties
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
          <div className="flex flex-col gap-6">
            {/* Property Type */}
            <div>
              <label className="block text-black text-sm md:text-base font-medium mb-2">
                Property Type
              </label>
              <select
                value={localFilters.type || ''}
                onChange={(e) => setLocalFilters({ ...localFilters, type: e.target.value || undefined })}
                className="w-full py-2.5 md:py-3 px-3 rounded-[4px] border border-[#dddddd] text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#1f2462] focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="Apartment">Apartment</option>
                <option value="Villa">Villa</option>
                <option value="Mansion">Mansion</option>
              </select>
            </div>

            {/* Listing Type */}
            <div>
              <label className="block text-black text-sm md:text-base font-medium mb-2">
                Listing Type
              </label>
              <select
                value={localFilters.listingType || ''}
                onChange={(e) => setLocalFilters({ ...localFilters, listingType: e.target.value as 'sale' | 'rent' | undefined })}
                className="w-full py-2.5 md:py-3 px-3 rounded-[4px] border border-[#dddddd] text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#1f2462] focus:border-transparent"
              >
                <option value="">All</option>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-black text-sm md:text-base font-medium mb-2">
                Bedrooms
              </label>
              <select
                value={localFilters.bedrooms || ''}
                onChange={(e) => setLocalFilters({ ...localFilters, bedrooms: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full py-2.5 md:py-3 px-3 rounded-[4px] border border-[#dddddd] text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#1f2462] focus:border-transparent"
              >
                <option value="">Any</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5+</option>
              </select>
            </div>

            {/* Price Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-black text-sm md:text-base font-medium mb-2">
                  Min Price (AED)
                </label>
                <input
                  type="number"
                  value={localFilters.minPrice || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, minPrice: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full py-2.5 md:py-3 px-3 rounded-[4px] border border-[#dddddd] text-black bg-white placeholder:text-[#9E9E9E] focus:outline-none focus:ring-2 focus:ring-[#1f2462] focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-black text-sm md:text-base font-medium mb-2">
                  Max Price (AED)
                </label>
                <input
                  type="number"
                  value={localFilters.maxPrice || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, maxPrice: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full py-2.5 md:py-3 px-3 rounded-[4px] border border-[#dddddd] text-black bg-white placeholder:text-[#9E9E9E] focus:outline-none focus:ring-2 focus:ring-[#1f2462] focus:border-transparent"
                  placeholder="No limit"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-2">
              <button
                onClick={handleReset}
                className="flex-1 border border-[#1f2462] text-[#1f2462] py-2.5 md:py-3 rounded-[4px] font-medium hover:bg-gray-50 transition-colors text-sm md:text-base"
              >
                Reset
              </button>
              <button
                onClick={handleApply}
                className="flex-1 bg-[#1f2462] text-white py-2.5 md:py-3 rounded-[4px] font-medium hover:bg-[#1a1f5a] transition-colors text-sm md:text-base"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
