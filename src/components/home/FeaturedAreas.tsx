'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchProperties } from '../../lib/api';

interface FeaturedArea {
  id: number;
  name: string;
  description: string;
  image: string;
  cityFilter: string; // City name to use for API filtering
  localityFilter?: string; // Optional locality for more specific filtering
}

const allFeaturedAreas: FeaturedArea[] = [
  {
    id: 1,
    name: 'Downtown Dubai',
    description: 'Iconic luxury investments',
    image: '/home/featured-areas/downtown-dubai.webp',
    cityFilter: 'Dubai',
    localityFilter: 'Downtown Dubai',
  },
  {
    id: 2,
    name: 'Business Bay',
    description: 'Smart returns and capital appreciation',
    image: '/home/featured-areas/business-bay.webp',
    cityFilter: 'Dubai',
    localityFilter: 'Business Bay',
  },
  {
    id: 3,
    name: 'Dubai Hills Estate',
    description: 'Modern villas with growth potential',
    image: '/home/featured-areas/dubai-hills-estate.webp',
    cityFilter: 'Dubai',
    localityFilter: 'Dubai Hills',
  },
  {
    id: 4,
    name: 'Dubai South',
    description: 'Future-growth hub near Expo City',
    image: '/home/featured-areas/dubai-south.webp',
    cityFilter: 'Dubai',
    localityFilter: 'Dubai South',
  }
];

interface AreaCardProps {
  area: FeaturedArea;
  index: number;
}

function AnimatedAreaCard({ area, index }: AreaCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  // Build URL with city filter (use locality if available, otherwise city)
  const filterValue = area.localityFilter || area.cityFilter;
  const filterParam = area.localityFilter ? 'locality' : 'city';
  
  return (
    <Link
      ref={cardRef}
      href={`/projects?${filterParam}=${encodeURIComponent(filterValue)}`}
      className={`relative h-[350px] md:h-[400px] lg:h-[501px] w-[280px] md:w-[320px] lg:w-[353px] shrink-0 rounded-[16px] overflow-hidden group transition-all duration-700 ease-out hover:scale-[1.02] ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      {/* Image */}
      <Image
        src={area.image}
        alt={area.name}
        fill
        className="object-cover object-center group-hover:scale-110 transition-transform duration-500 ease-out"
        sizes="(max-width: 768px) 280px, (max-width: 1024px) 320px, 353px"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute bottom-0 left-0 w-full h-[120px] md:h-[180px] lg:h-[239px] bg-gradient-to-b from-[rgba(0,0,0,0)] to-[#000000] backdrop-blur-[0.5px] group-hover:opacity-90 transition-opacity duration-300">
        {/* Text Content */}
        <div className="absolute left-4 md:left-6 lg:left-[25px] bottom-3 md:bottom-4 lg:bottom-[14px] text-white">
          <h3 className="font-medium text-lg md:text-xl lg:text-2xl leading-normal font-noto-sans mb-1 group-hover:translate-y-[-2px] transition-transform duration-300">
            {area.name}
          </h3>
          <p className="font-light text-sm md:text-base leading-[1.538] font-poppins">
            {area.description}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function FeaturedAreas() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [featuredAreas, setFeaturedAreas] = useState<FeaturedArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check which areas have properties using API filters
  useEffect(() => {
    const checkAreasWithProperties = async () => {
      try {
        setIsLoading(true);
        
        // Check each area by calling the API with appropriate filters
        const areasWithProperties: FeaturedArea[] = [];
        
        // Check all areas in parallel for better performance
        const areaChecks = await Promise.allSettled(
          allFeaturedAreas.map(async (area) => {
            try {
              // Use locality filter if available, otherwise use city filter
              // According to API docs: locality is a string, city can be string or array
              const filters: import('../../lib/api').ApiFilterOptions = {};
              
              if (area.localityFilter) {
                // Use locality for more specific filtering (e.g., "Downtown Dubai")
                filters.locality = area.localityFilter;
              } else {
                // Use city filter (e.g., "Dubai")
                filters.city = area.cityFilter;
              }
              
              // Call API with filter to check if properties exist
              // Request only 1 property to check if any exist
              const response = await fetchProperties(filters, 1, 1);
              
              // If API returns at least one property, include this area
              // Also check pagination.total to see if there are any properties
              const hasProperties = response.success && 
                response.data && 
                (response.data.length > 0 || (response.pagination && response.pagination.total > 0));
              
              if (hasProperties) {
                if (process.env.NODE_ENV === 'development') {
                  console.log(`Area "${area.name}" has properties:`, response.pagination?.total || response.data?.length);
                }
                return area;
              }
              
              if (process.env.NODE_ENV === 'development') {
                console.log(`Area "${area.name}" has no properties`);
              }
              
              return null;
            } catch (error) {
              console.error(`Error checking area ${area.name}:`, error);
              return null;
            }
          })
        );
        
        // Collect areas that have properties
        areaChecks.forEach((result) => {
          if (result.status === 'fulfilled' && result.value !== null) {
            areasWithProperties.push(result.value);
          }
        });
        
        setFeaturedAreas(areasWithProperties);
      } catch (error) {
        console.error('Error checking areas with properties:', error);
        // On error, show all areas as fallback
        setFeaturedAreas(allFeaturedAreas);
      } finally {
        setIsLoading(false);
      }
    };

    checkAreasWithProperties();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      // Responsive scroll amount based on viewport
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      const scrollAmount = isMobile ? 304 : isTablet ? 346 : 377; // card width + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Don't render if no areas have properties
  if (!isLoading && featuredAreas.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-8 md:py-12 lg:py-[62px]">
      <div className="flex flex-col gap-8 md:gap-12 lg:gap-[55px] items-start">
        {/* Header with Navigation */}
        <div className="w-full flex items-center justify-between px-4 md:px-8 lg:px-[80px]">
          <h2 className="font-medium text-[#12161D] font-noto-sans text-2xl md:text-3xl lg:text-5xl leading-[1.2] md:leading-[52px]">
            Featured Areas
          </h2>
          <div className="hidden md:flex gap-3">
            <button
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="w-10 h-10 rounded-full border border-[#12161D] flex items-center justify-center hover:bg-[#12161D] hover:text-white transition-all duration-300"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="w-10 h-10 rounded-full border border-[#12161D] flex items-center justify-center hover:bg-[#12161D] hover:text-white transition-all duration-300"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Cards Horizontal Scroll - Left padding, right spacer for gap */}
        {isLoading ? (
          <div className="flex gap-4 md:gap-6 lg:gap-[24px] items-start w-full overflow-x-auto scrollbar-hide pl-4 md:pl-8 lg:pl-[80px]">
            <div className="h-[350px] md:h-[400px] lg:h-[501px] w-[280px] md:w-[320px] lg:w-[353px] shrink-0 rounded-[16px] bg-gray-200 animate-pulse" />
            <div className="h-[350px] md:h-[400px] lg:h-[501px] w-[280px] md:w-[320px] lg:w-[353px] shrink-0 rounded-[16px] bg-gray-200 animate-pulse" />
            <div className="h-[350px] md:h-[400px] lg:h-[501px] w-[280px] md:w-[320px] lg:w-[353px] shrink-0 rounded-[16px] bg-gray-200 animate-pulse" />
            <div className="shrink-0 w-4 md:w-8 lg:w-[80px] h-px" aria-hidden="true" />
          </div>
        ) : (
          <div ref={scrollRef} className="flex gap-4 md:gap-6 lg:gap-[24px] items-start w-full overflow-x-auto scrollbar-hide pl-4 md:pl-8 lg:pl-[80px]">
            {featuredAreas.map((area, index) => (
              <AnimatedAreaCard key={area.id} area={area} index={index} />
            ))}
            {/* Right spacer to match left padding */}
            <div className="shrink-0 w-4 md:w-8 lg:w-[80px] h-px" aria-hidden="true" />
          </div>
        )}
      </div>
    </section>
  );
}
