import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '../../lib/properties';

interface Property {
  id?: number;
  title: string;
  price: number;
  bedrooms: number | string;
  bathrooms: number;
  type: string;
  mainImage: string;
}

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const {
    id,
    title,
    price,
    bedrooms,
    bathrooms,
    type,
    mainImage,
  } = property;

  return (
    <Link 
      href={`/projects/${id}`}
      className="block bg-white border border-[#c7c7c7] rounded-[16px] overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] h-full"
    >
      <div className="flex flex-col gap-4 p-4 md:p-5 h-full">
        {/* Image */}
        <div className="relative w-full h-[220px] md:h-[240px] lg:h-[260px] rounded-[10px] overflow-hidden">
          <Image
            src={mainImage}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 401px"
          />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 flex-1">
          {/* Title */}
          <h3 className="font-semibold text-lg md:text-xl leading-[1.4] text-black line-clamp-2">
            {title}
          </h3>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <div className="bg-[#e5e7ff] flex gap-1 items-center px-3 py-1.5 rounded-[28px]">
              <div className="w-5 h-5 flex items-center justify-center">
                <svg width="18" height="14" viewBox="0 0 22 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="7.078" width="18" height="12" rx="2" stroke="black" strokeWidth="2"/>
                  <path d="M7 7.078V5.078C7 3.97343 7.89543 3.078 9 3.078H13C14.1046 3.078 15 3.97343 15 5.078V7.078" stroke="black" strokeWidth="2"/>
                </svg>
              </div>
              <span className="font-medium text-sm md:text-base leading-normal text-black">
                {bedrooms}-Bedroom
              </span>
            </div>

            <div className="bg-[#e5e7ff] flex gap-1 items-center px-3 py-1.5 rounded-[28px]">
              <div className="w-5 h-5 flex items-center justify-center">
                <svg width="17" height="17" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="3.078" width="16" height="16" rx="2" stroke="black" strokeWidth="2"/>
                  <circle cx="10.5" cy="9.078" r="2" stroke="black" strokeWidth="2"/>
                </svg>
              </div>
              <span className="font-medium text-sm md:text-base leading-normal text-black">
                {bathrooms}-Bathroom
              </span>
            </div>

            <div className="bg-[#e5e7ff] flex gap-1 items-center px-3 py-1.5 rounded-[28px]">
              <div className="w-5 h-5 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="black" strokeWidth="2"/>
                </svg>
              </div>
              <span className="font-medium text-sm md:text-base leading-normal text-black">
                {type}
              </span>
            </div>
          </div>

          {/* Price */}
          <p className="font-semibold text-xl md:text-2xl lg:text-[28px] leading-normal text-black">
            AED {formatPrice(price)}
          </p>

          {/* Button */}
          <div className="mt-auto">
            <div className="border border-[#1f2462] rounded-[4px] px-4 md:px-6 py-3 text-center">
              <p className="font-medium text-sm md:text-base leading-normal text-[#1f2462]">
                View Property Details
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
