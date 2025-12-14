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
        <div className="sticky top-0 bg-white border-b border-[#e5e5e5] p-4 md:p-6 flex items-start justify-between z-10">
          <h2 className="text-black text-lg md:text-xl lg:text-2xl font-semibold leading-normal">
            Filter Properties
          </h2>
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
          <div className="flex flex-col gap-6">
            {/* Property Type */}
            <div>
              <label className="block text-black text-sm md:text-base font-medium mb-2">
                Property Type
              </label>
              <select
                value={typeof localFilters.type === 'string' ? localFilters.type : ''}
                onChange={(e) => setLocalFilters({ ...localFilters, type: e.target.value || undefined })}
                className="w-full py-2.5 md:py-3 px-3 rounded-[4px] border border-[#dddddd] text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#1f2462] focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="Apartment">Apartment</option>
                <option value="Villa">Villa</option>
                <option value="Townhouse">Townhouse</option>
                <option value="Studio">Studio</option>
                <option value="Penthouse">Penthouse</option>
                <option value="Mansion">Mansion</option>
                <option value="Duplex">Duplex</option>
              </select>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-black text-sm md:text-base font-medium mb-2">
                Bedrooms
              </label>
              <select
                value={localFilters.bedrooms || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setLocalFilters({ 
                    ...localFilters, 
                    bedrooms: value ? parseInt(value) : undefined 
                  });
                }}
                className="w-full py-2.5 md:py-3 px-3 rounded-[4px] border border-[#dddddd] text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#1f2462] focus:border-transparent"
              >
                <option value="">Any</option>
                <option value="1">1 Bedroom</option>
                <option value="2">2 Bedrooms</option>
                <option value="3">3 Bedrooms</option>
                <option value="4">4 Bedrooms</option>
                <option value="5">5 Bedrooms</option>
                <option value="6">6+ Bedrooms</option>
              </select>
            </div>

            {/* Price Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-black text-sm md:text-base font-medium mb-2">
                  Min Price (AED)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={localFilters.minPrice || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setLocalFilters({ 
                      ...localFilters, 
                      minPrice: value && parseInt(value) > 0 ? parseInt(value) : undefined 
                    });
                  }}
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
                  min="0"
                  step="1000"
                  value={localFilters.maxPrice || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setLocalFilters({ 
                      ...localFilters, 
                      maxPrice: value && parseInt(value) > 0 ? parseInt(value) : undefined 
                    });
                  }}
                  className="w-full py-2.5 md:py-3 px-3 rounded-[4px] border border-[#dddddd] text-black bg-white placeholder:text-[#9E9E9E] focus:outline-none focus:ring-2 focus:ring-[#1f2462] focus:border-transparent"
                  placeholder="No limit"
                />
              </div>
            </div>

            {/* Area Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-black text-sm md:text-base font-medium mb-2">
                  Min Area (sq ft)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={localFilters.minArea || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setLocalFilters({ 
                      ...localFilters, 
                      minArea: value && parseInt(value) > 0 ? parseInt(value) : undefined 
                    });
                  }}
                  className="w-full py-2.5 md:py-3 px-3 rounded-[4px] border border-[#dddddd] text-black bg-white placeholder:text-[#9E9E9E] focus:outline-none focus:ring-2 focus:ring-[#1f2462] focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-black text-sm md:text-base font-medium mb-2">
                  Max Area (sq ft)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={localFilters.maxArea || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setLocalFilters({ 
                      ...localFilters, 
                      maxArea: value && parseInt(value) > 0 ? parseInt(value) : undefined 
                    });
                  }}
                  className="w-full py-2.5 md:py-3 px-3 rounded-[4px] border border-[#dddddd] text-black bg-white placeholder:text-[#9E9E9E] focus:outline-none focus:ring-2 focus:ring-[#1f2462] focus:border-transparent"
                  placeholder="No limit"
                />
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-black text-sm md:text-base font-medium mb-2">
                Sort By
              </label>
              <select
                value={localFilters.sortBy ? `${localFilters.sortBy}_${localFilters.sortOrder || 'desc'}` : ''}
                onChange={(e) => {
                  if (!e.target.value) {
                    setLocalFilters({ ...localFilters, sortBy: undefined, sortOrder: undefined });
                  } else {
                    const [sortBy, sortOrder] = e.target.value.split('_');
                    setLocalFilters({ 
                      ...localFilters, 
                      sortBy: sortBy as any,
                      sortOrder: sortOrder as 'asc' | 'desc'
                    });
                  }
                }}
                className="w-full py-2.5 md:py-3 px-3 rounded-[4px] border border-[#dddddd] text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#1f2462] focus:border-transparent"
              >
                <option value="">Default</option>
                <option value="min_price_asc">Price: Low to High</option>
                <option value="min_price_desc">Price: High to Low</option>
                <option value="created_at_desc">Newest First</option>
                <option value="created_at_asc">Oldest First</option>
              </select>
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
