'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import PropertyCard from '../../../components/property/property-card';
import InquiryModal from '../../../components/property/inquiry-modal';
import DescriptionModal from '../../../components/property/description-modal';
import ImageViewerModal from '../../../components/property/image-viewer-modal';
import AmenitiesModal from '../../../components/property/amenities-modal';
import FAQ from '../../../components/home/FAQ';
import { getPropertyById, getRelatedProperties, formatPrice, Property } from '../../../lib/properties';

export default function PropertyDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [relatedProperties, setRelatedProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [isAmenitiesModalOpen, setIsAmenitiesModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (id) {
      const propertyData = getPropertyById(id);
      if (propertyData) {
        setProperty(propertyData);
        const related = getRelatedProperties(id, propertyData.type, 3);
        setRelatedProperties(related);
      }
      setIsLoading(false);
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-black text-lg md:text-xl font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-black text-lg md:text-xl font-semibold mb-4">Property not found</div>
          <Link href="/projects" className="text-[#1f2462] hover:underline">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const images = [property.mainImage, ...property.gallery.filter((img: string) => img !== property.mainImage)];
  const descriptionPreview = property.description.length > 200 ? property.description.substring(0, 200) : property.description;
  const hasMoreDescription = property.description.length > 200;

  return (
    <>
      <Header />
      <main className="bg-neutral-50 min-h-screen pt-[120px] pb-0">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-[100px]">
          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-6 md:gap-8 lg:gap-[30px] mb-6 md:mb-8 lg:mb-[30px]">
            {/* Left: Image Gallery */}
            <div className="flex flex-col sm:flex-row gap-4 md:gap-5 lg:gap-[19px] flex-1">
              {/* Main Image */}
              <div 
                className="relative w-full sm:w-[400px] lg:w-[569px] h-[250px] sm:h-[350px] lg:h-[443px] rounded-[10px] overflow-hidden cursor-pointer shrink-0"
                onClick={() => setIsImageViewerOpen(true)}
              >
                <Image
                  src={images[selectedImage]}
                  alt={property.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 400px, 569px"
                  priority
                />
              </div>

              {/* Thumbnails */}
              <div className="flex flex-row sm:flex-col gap-3 md:gap-[15px]">
                {images.slice(0, 5).map((image, idx) => {
                  const isSelected = selectedImage === idx;
                  const isLastWithMore = idx === 4 && images.length > 5 && !isSelected;
                  
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (isLastWithMore) {
                          setIsImageViewerOpen(true);
                        } else {
                          setSelectedImage(idx);
                        }
                      }}
                      className={`relative w-[80px] sm:w-[102px] h-[60px] sm:h-[75.6px] rounded-[10px] overflow-hidden cursor-pointer transition-all shrink-0 ${
                        isSelected ? 'ring-2 ring-[#1f2462]' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="102px"
                      />
                      {isLastWithMore && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white text-xs md:text-sm font-semibold">
                            +{images.length - 5}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Property Info - Match image height */}
            <div className="flex-1 max-w-full lg:max-w-[530px] lg:h-[443px] flex flex-col">
              <div className="flex flex-col gap-3 md:gap-4 flex-1">
                {/* Title and Location */}
                <div>
                  <h1 className="font-semibold text-xl md:text-2xl lg:text-[26px] leading-[1.3] text-black mb-2">
                    {property.title}
                  </h1>
                  <p className="text-sm md:text-base leading-normal text-[#61656e]">
                    {property.location}
                  </p>
                </div>

                {/* Description with Read More */}
                <div className="flex-1 min-h-0 flex flex-col">
                  <p className="text-sm md:text-base leading-[1.6] text-[#12161D] mb-1">
                    {descriptionPreview}
                    {hasMoreDescription && (
                      <>
                        ...{' '}
                        <button
                          onClick={() => setIsDescriptionModalOpen(true)}
                          className="text-[#1f2462] hover:underline font-medium"
                        >
                          Read more
                        </button>
                      </>
                    )}
                  </p>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 md:gap-2.5">
                  <div className="bg-[#e5e7ff] flex gap-1.5 items-center px-3 md:px-3.5 py-1.5 md:py-2 rounded-[28px]">
                    <div className="w-5 h-5 md:w-5 md:h-5 flex items-center justify-center shrink-0">
                      <svg width="18" height="14" viewBox="0 0 22 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="7.078" width="18" height="12" rx="2" stroke="black" strokeWidth="2"/>
                        <path d="M7 7.078V5.078C7 3.97343 7.89543 3.078 9 3.078H13C14.1046 3.078 15 3.97343 15 5.078V7.078" stroke="black" strokeWidth="2"/>
                      </svg>
                    </div>
                    <span className="font-medium text-sm md:text-base leading-normal text-black whitespace-nowrap">
                      {property.bedrooms}-Bedroom
                    </span>
                  </div>

                  <div className="bg-[#e5e7ff] flex gap-1.5 items-center px-3 md:px-3.5 py-1.5 md:py-2 rounded-[28px]">
                    <div className="w-5 h-5 md:w-5 md:h-5 flex items-center justify-center shrink-0">
                      <svg width="17" height="17" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="3.078" width="16" height="16" rx="2" stroke="black" strokeWidth="2"/>
                        <circle cx="10.5" cy="9.078" r="2" stroke="black" strokeWidth="2"/>
                      </svg>
                    </div>
                    <span className="font-medium text-sm md:text-base leading-normal text-black whitespace-nowrap">
                      {property.bathrooms}-Bathroom
                    </span>
                  </div>

                  <div className="bg-[#e5e7ff] flex gap-1.5 items-center px-3 md:px-3.5 py-1.5 md:py-2 rounded-[28px]">
                    <div className="w-5 h-5 md:w-5 md:h-5 flex items-center justify-center shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="black" strokeWidth="2"/>
                      </svg>
                    </div>
                    <span className="font-medium text-sm md:text-base leading-normal text-black whitespace-nowrap">
                      {property.type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-auto pt-4">
                {/* Price */}
                <p className="font-semibold text-2xl md:text-3xl lg:text-[32px] leading-normal text-black">
                  AED {formatPrice(property.price)}
                </p>

                {/* Enquire Button */}
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full bg-[#1f2462] text-white text-base md:text-lg font-medium px-4 md:px-6 py-3 md:py-4 rounded-[4px] hover:bg-[#1a1f5a] transition-colors"
                >
                  Enquire Now
                </button>
              </div>
            </div>
          </div>

          {/* Property Details Grid */}
          <div className="bg-white border border-[#dddddd] rounded-[8px] p-4 md:p-6 mb-6 md:mb-8 lg:mb-[30px]">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {property.developer && (
                <div className="flex flex-col gap-1">
                  <span className="text-[#61656e] text-sm md:text-[16px] font-medium leading-[27px]">Developer Name</span>
                  <span className="text-black text-base md:text-[18px] font-medium leading-[27px]">{property.developer}</span>
                </div>
              )}
              {property.area && (
                <div className="flex flex-col gap-1">
                  <span className="text-[#61656e] text-sm md:text-[16px] font-medium leading-[27px]">Area</span>
                  <span className="text-black text-base md:text-[18px] font-medium leading-[27px]">{property.area} sq. ft</span>
                </div>
              )}
              {property.amenities && property.amenities.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-[#61656e] text-sm md:text-[16px] font-medium leading-[27px]">Amenities</span>
                  <div className="flex flex-col gap-1">
                    <span className="text-black text-base md:text-[18px] font-medium leading-[27px]">
                      {property.amenities.slice(0, 2).join(', ')}
                    </span>
                    {property.amenities.length > 2 && (
                      <button
                        onClick={() => setIsAmenitiesModalOpen(true)}
                        className="text-[#1f2462] text-xs md:text-[14px] hover:underline text-left"
                      >
                        +{property.amenities.length - 2} more
                      </button>
                    )}
                  </div>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex flex-col gap-1">
                  <span className="text-[#61656e] text-sm md:text-[16px] font-medium leading-[27px]">Bathrooms</span>
                  <span className="text-black text-base md:text-[18px] font-medium leading-[27px]">{property.bathrooms}</span>
                </div>
              )}
              {property.readyDate && (
                <div className="flex flex-col gap-1">
                  <span className="text-[#61656e] text-sm md:text-[16px] font-medium leading-[27px]">Delivery Date</span>
                  <span className="text-black text-base md:text-[18px] font-medium leading-[27px]">{property.readyDate}</span>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <span className="text-[#61656e] text-sm md:text-[16px] font-medium leading-[27px]">Floors</span>
                <span className="text-black text-base md:text-[18px] font-medium leading-[27px]">2</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[#61656e] text-sm md:text-[16px] font-medium leading-[27px]">Security</span>
                <span className="text-black text-base md:text-[18px] font-medium leading-[27px]">Yes</span>
              </div>
            </div>
          </div>

          {/* Related Properties */}
          {relatedProperties.length > 0 && (
            <div className="mb-6 md:mb-8 lg:mb-[30px]">
              <h2 className="font-medium text-2xl md:text-3xl lg:text-[32px] leading-normal text-black mb-4 md:mb-6 lg:mb-[30px]">
                Other Properties
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-[30px]">
                {relatedProperties.map((relatedProperty) => (
                  <PropertyCard key={relatedProperty.id} property={relatedProperty} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FAQ Section */}
        <FAQ />

        {/* Modals */}
        <InquiryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          propertyId={property.id?.toString() || ''}
          propertyTitle={property.title}
        />

        <DescriptionModal
          isOpen={isDescriptionModalOpen}
          onClose={() => setIsDescriptionModalOpen(false)}
          title={property.title}
          description={property.description}
        />

        <ImageViewerModal
          isOpen={isImageViewerOpen}
          onClose={() => setIsImageViewerOpen(false)}
          images={images}
          initialIndex={selectedImage}
          propertyTitle={property.title}
        />

        <AmenitiesModal
          isOpen={isAmenitiesModalOpen}
          onClose={() => setIsAmenitiesModalOpen(false)}
          amenities={property.amenities || []}
          propertyTitle={property.title}
        />
      </main>
      <Footer />
    </>
  );
}
