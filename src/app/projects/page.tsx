'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PropertyCard from '../../components/property/property-card';
import FilterModal from '../../components/property/FilterModal';
import FAQ from '../../components/home/FAQ';
import { getAllProperties, filterProperties, FilterOptions, Property } from '../../lib/properties';

export default function ProjectsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const propertiesPerPage = 9;

  useEffect(() => {
    const allProperties = getAllProperties();
    setProperties(allProperties);
  }, []);

  const filteredProperties = useMemo(() => {
    let result = properties;
    
    if (Object.keys(filters).length > 0) {
      result = filterProperties(result, filters);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((property) =>
        property.title.toLowerCase().includes(query) ||
        property.location.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [properties, filters, searchQuery]);

  const totalPages = Math.ceil(filteredProperties.length / propertiesPerPage);
  const startIndex = (currentPage - 1) * propertiesPerPage;
  const paginatedProperties = filteredProperties.slice(startIndex, startIndex + propertiesPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

  const propertyRows = useMemo(() => {
    const rows: Property[][] = [];
    for (let i = 0; i < paginatedProperties.length; i += 3) {
      rows.push(paginatedProperties.slice(i, i + 3));
    }
    return rows;
  }, [paginatedProperties]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  return (
    <>
      <Header />
      <main className="bg-neutral-50 min-h-screen pt-[120px] pb-0">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-[100px]">
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 items-center justify-between mb-6 md:mb-8 lg:mb-[30px]">
            {/* Search Bar */}
            <div className="bg-white border border-[#eeeeee] flex gap-[10px] items-center px-[15px] py-[10px] rounded-[8px] flex-1 w-full sm:max-w-[546px] h-[47px]">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="#5c5c5c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 19L14.65 14.65" stroke="#5c5c5c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search for a Property by Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 outline-none text-[18px] font-medium text-[#5c5c5c] placeholder:text-[#5c5c5c] bg-transparent"
              />
            </div>

            {/* Filter Button */}
            <button 
              onClick={() => setIsFilterOpen(true)}
              className="bg-[#1f2462] flex gap-[10px] items-center justify-center px-[15px] py-[10px] rounded-[8px] w-full sm:w-[112px] h-[47px] hover:bg-[#1a1f5a] transition-colors"
            >
              <span className="font-medium text-[18px] leading-normal text-white">Filter</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6H16M6 10H14M8 14H12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Properties Grid */}
          {filteredProperties.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
              <p className="text-black text-lg md:text-xl font-semibold">No properties found</p>
              <p className="text-gray-600 text-sm md:text-base">Try adjusting your filters or search query</p>
            </div>
          ) : (
            <div className="flex flex-col gap-[30px] mb-[30px]">
              {propertyRows.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[30px]">
                  {row.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-[9px] mb-8 md:mb-12 lg:mb-[52px]">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="w-6 h-6 flex items-center justify-center disabled:opacity-50"
                aria-label="Previous page"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 18L9 12L15 6" stroke="#5f5b5b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                if (pageNum === 1 && currentPage > 3 && totalPages > 5) {
                  return (
                    <div key="start" className="flex items-center gap-[9px]">
                      <button
                        onClick={() => handlePageChange(1)}
                        className="font-medium text-[20px] leading-normal text-[#5f5b5b]"
                      >
                        1
                      </button>
                      <span className="font-medium text-[20px] leading-normal text-[#5f5b5b]">.......</span>
                    </div>
                  );
                }

                if (pageNum === totalPages && currentPage < totalPages - 2 && totalPages > 5) {
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`font-medium text-[20px] leading-normal ${
                      currentPage === pageNum
                        ? 'bg-[#1f2462] text-white w-[26px] h-[34px] flex items-center justify-center'
                        : 'text-[#5f5b5b]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {totalPages > 5 && currentPage < totalPages - 2 && (
                <div className="flex items-center gap-[9px]">
                  <span className="font-medium text-[20px] leading-normal text-[#5f5b5b]">.......</span>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className="font-medium text-[20px] leading-normal text-[#5f5b5b]"
                  >
                    {totalPages}
                  </button>
                </div>
              )}

              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="w-6 h-6 flex items-center justify-center disabled:opacity-50"
                aria-label="Next page"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="#5f5b5b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* FAQ Section */}
        <FAQ />

        {/* Filter Modal */}
        <FilterModal
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          filters={filters}
          onApplyFilters={handleApplyFilters}
        />
      </main>
      <Footer />
    </>
  );
}
