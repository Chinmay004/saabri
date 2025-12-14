import { fetchProperties, fetchPropertyById as fetchPropertyByIdApi, ApiProperty, ApiFilterOptions } from './api';

// Helper function to convert text numbers to integers
function textToNumber(text: string): number | null {
  if (!text || typeof text !== 'string') return null;
  
  const normalized = text.toLowerCase().trim();
  
  // Map of text numbers to integers
  const numberMap: { [key: string]: number } = {
    'zero': 0,
    'one': 1,
    'two': 2,
    'three': 3,
    'four': 4,
    'five': 5,
    'six': 6,
    'seven': 7,
    'eight': 8,
    'nine': 9,
    'ten': 10,
    'eleven': 11,
    'twelve': 12,
    'thirteen': 13,
    'fourteen': 14,
    'fifteen': 15,
    'sixteen': 16,
    'seventeen': 17,
    'eighteen': 18,
    'nineteen': 19,
    'twenty': 20,
  };
  
  // Check if it's a direct match
  if (numberMap[normalized] !== undefined) {
    return numberMap[normalized];
  }
  
  // Try parsing as regular number
  const parsed = parseInt(normalized, 10);
  if (!isNaN(parsed)) {
    return parsed;
  }
  
  return null;
}

// Property interface - matches current structure
export interface Property {
  id?: string | number;
  title: string;
  description: string;
  type: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  location: string;
  city?: string;
  locality?: string;
  category?: string;
  developer?: string;
  amenities: string[];
  mainImage: string;
  gallery: string[];
  createdAt?: string;
  updatedAt?: string;
  readyDate?: string;
  listingType?: 'sale' | 'rent';
  floors?: number | string;
  security?: boolean | string;
  furnished?: string;
  paymentPlan?: string;
}

// Map API property to our Property interface
function mapApiPropertyToProperty(apiProperty: ApiProperty): Property {
  // Log the raw API property for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('=== Mapping API Property ===');
    console.log('Raw bedrooms value:', apiProperty.bedrooms, 'Type:', typeof apiProperty.bedrooms);
    console.log('Full property:', JSON.stringify(apiProperty, null, 2));
  }

  // ID - can be string or number
  const id = apiProperty.id || apiProperty._id || undefined;

  // Title - check multiple possible fields
  const title = apiProperty.title || 
                apiProperty.name || 
                apiProperty.property_name ||
                'Untitled Property';

  // Description - check multiple possible fields
  const description = apiProperty.description || 
                      apiProperty.details || 
                      apiProperty.overview ||
                      apiProperty.summary ||
                      '';

  // Type - check multiple possible fields and ensure it's a string
  const typeValue = apiProperty.type || 
                    apiProperty.property_type || 
                    apiProperty.category ||
                    'Property';
  // Convert to string if it's not already
  const type = typeof typeValue === 'string' ? typeValue : String(typeValue || 'Property');

  // Price - use min_price if available, otherwise max_price, otherwise check price field
  const price = apiProperty.min_price ?? 
                apiProperty.max_price ?? 
                apiProperty.price ?? 
                (apiProperty.price_range?.min ?? apiProperty.price_range?.max) ??
                0;

  // Area - prefer sq_ft, then area, then property_size, only use if > 0
  const areaValue = apiProperty.sq_ft ?? 
                   apiProperty.area ?? 
                   apiProperty.property_size ??
                   apiProperty.size ??
                   (apiProperty.sq_ft_range?.min ?? apiProperty.sq_ft_range?.max) ??
                   0;
  const area = (typeof areaValue === 'number' && areaValue > 0) ? areaValue : 0;

  // Bedrooms - always convert to integer (handles text numbers like "one", "two", "three")
  // Use undefined instead of 0 to indicate missing/invalid data
  let bedrooms: number | undefined = undefined;
  if (apiProperty.bedrooms !== undefined && apiProperty.bedrooms !== null) {
    if (typeof apiProperty.bedrooms === 'string') {
      const trimmed = apiProperty.bedrooms.trim();
      // Skip empty strings or "zero"
      if (trimmed === '' || trimmed.toLowerCase() === 'zero') {
        bedrooms = undefined;
      } else {
        // Try converting text number first
        const textNumber = textToNumber(trimmed);
        if (textNumber !== null && textNumber > 0) {
          bedrooms = textNumber;
        } else {
          // Fallback to parseInt
          const parsed = parseInt(trimmed, 10);
          bedrooms = (!isNaN(parsed) && parsed > 0) ? parsed : undefined;
        }
      }
    } else if (Array.isArray(apiProperty.bedrooms) && apiProperty.bedrooms.length > 0) {
      const firstValue = apiProperty.bedrooms[0];
      if (typeof firstValue === 'string') {
        const trimmed = firstValue.trim();
        if (trimmed === '' || trimmed.toLowerCase() === 'zero') {
          bedrooms = undefined;
        } else {
          // Try converting text number first
          const textNumber = textToNumber(trimmed);
          if (textNumber !== null && textNumber > 0) {
            bedrooms = textNumber;
          } else {
            // Fallback to parseInt
            const parsed = parseInt(trimmed, 10);
            bedrooms = (!isNaN(parsed) && parsed > 0) ? parsed : undefined;
          }
        }
      } else if (typeof firstValue === 'number' && firstValue > 0) {
        bedrooms = Math.floor(firstValue);
      }
    } else if (typeof apiProperty.bedrooms === 'number' && apiProperty.bedrooms > 0) {
      bedrooms = Math.floor(apiProperty.bedrooms);
    }
  } else if (apiProperty.min_bedrooms) {
    const minBedrooms = Array.isArray(apiProperty.min_bedrooms) 
      ? apiProperty.min_bedrooms[0] 
      : apiProperty.min_bedrooms;
    if (typeof minBedrooms === 'string') {
      const trimmed = minBedrooms.trim();
      if (trimmed === '' || trimmed.toLowerCase() === 'zero') {
        bedrooms = undefined;
      } else {
        // Try converting text number first
        const textNumber = textToNumber(trimmed);
        if (textNumber !== null && textNumber > 0) {
          bedrooms = textNumber;
        } else {
          // Fallback to parseInt
          const parsed = parseInt(trimmed, 10);
          bedrooms = (!isNaN(parsed) && parsed > 0) ? parsed : undefined;
        }
      }
    } else if (typeof minBedrooms === 'number' && minBedrooms > 0) {
      bedrooms = Math.floor(minBedrooms);
    }
  }
  
  // Default to 0 only if we need a number, but use undefined to indicate missing data
  // For display purposes, we'll check for > 0, so undefined works fine

  // Bathrooms - handle string or number, only set if > 0
  let bathrooms: number = 0;
  if (apiProperty.bathrooms !== undefined && apiProperty.bathrooms !== null) {
    if (typeof apiProperty.bathrooms === 'string') {
      const trimmed = apiProperty.bathrooms.trim();
      if (trimmed !== '' && trimmed.toLowerCase() !== 'zero') {
        const parsed = parseInt(trimmed, 10);
        bathrooms = (!isNaN(parsed) && parsed > 0) ? parsed : 0;
      }
    } else if (Array.isArray(apiProperty.bathrooms) && apiProperty.bathrooms.length > 0) {
      const firstValue = apiProperty.bathrooms[0];
      if (typeof firstValue === 'string') {
        const trimmed = firstValue.trim();
        if (trimmed !== '' && trimmed.toLowerCase() !== 'zero') {
          const parsed = parseInt(trimmed, 10);
          bathrooms = (!isNaN(parsed) && parsed > 0) ? parsed : 0;
        }
      } else if (typeof firstValue === 'number' && firstValue > 0) {
        bathrooms = Math.floor(firstValue);
      }
    } else if (typeof apiProperty.bathrooms === 'number' && apiProperty.bathrooms > 0) {
      bathrooms = Math.floor(apiProperty.bathrooms);
    }
  } else if (apiProperty.min_bathrooms) {
    const minBathrooms = Array.isArray(apiProperty.min_bathrooms) 
      ? apiProperty.min_bathrooms[0] 
      : apiProperty.min_bathrooms;
    if (typeof minBathrooms === 'string') {
      const trimmed = minBathrooms.trim();
      if (trimmed !== '' && trimmed.toLowerCase() !== 'zero') {
        const parsed = parseInt(trimmed, 10);
        bathrooms = (!isNaN(parsed) && parsed > 0) ? parsed : 0;
      }
    } else if (typeof minBathrooms === 'number' && minBathrooms > 0) {
      bathrooms = Math.floor(minBathrooms);
    }
  }

  // City - extract from API
  const city = apiProperty.city && typeof apiProperty.city === 'string' && apiProperty.city.trim() !== '' 
    ? apiProperty.city : undefined;

  // Locality - extract from API
  const locality = apiProperty.locality && typeof apiProperty.locality === 'string' && apiProperty.locality.trim() !== '' 
    ? apiProperty.locality : undefined;

  // Category - extract from API (Residential/Commercial)
  const category = apiProperty.category && typeof apiProperty.category === 'string' && apiProperty.category.trim() !== '' 
    ? apiProperty.category : undefined;

  // Location - combine multiple fields
  let location = apiProperty.location || '';
  if (!location) {
    const parts: string[] = [];
    if (apiProperty.locality) parts.push(apiProperty.locality);
    if (apiProperty.city) parts.push(apiProperty.city);
    if (apiProperty.address) parts.push(apiProperty.address);
    if (apiProperty.area_name) parts.push(apiProperty.area_name);
    location = parts.join(', ');
  }
  if (!location) {
    location = 'Location not specified';
  }

  // Developer - handle object or string, ensure it's a string
  let developer: string | undefined = undefined;
  if (apiProperty.developer) {
    if (typeof apiProperty.developer === 'string') {
      developer = apiProperty.developer.trim() !== '' ? apiProperty.developer : undefined;
    } else if (apiProperty.developer.name) {
      developer = typeof apiProperty.developer.name === 'string' 
        ? (apiProperty.developer.name.trim() !== '' ? apiProperty.developer.name : undefined)
        : String(apiProperty.developer.name || '').trim() !== '' ? String(apiProperty.developer.name) : undefined;
    }
  }
  // Also check developer_name field
  if (!developer && (apiProperty as any).developer_name) {
    const devName = (apiProperty as any).developer_name;
    developer = typeof devName === 'string' 
      ? (devName.trim() !== '' ? devName : undefined)
      : String(devName || '').trim() !== '' ? String(devName) : undefined;
  }

  // Images - check multiple possible fields
  let mainImage: string | null = null;
  let gallery: string[] = [];

  // Check for main_image field
  if (apiProperty.main_image && apiProperty.main_image.trim() !== '') {
    mainImage = apiProperty.main_image;
  }

  // Check for images array
  if (apiProperty.images && Array.isArray(apiProperty.images) && apiProperty.images.length > 0) {
    // Filter out empty strings
    const validImages = apiProperty.images.filter((img: any) => img && typeof img === 'string' && img.trim() !== '');
    
    if (validImages.length > 0) {
      // Use first image as main if no main_image
      if (!mainImage) {
        mainImage = validImages[0];
      }
      // Rest as gallery (excluding main image)
      gallery = validImages.filter((img: string) => img !== mainImage);
    }
  }

  // Check for gallery array
  if (apiProperty.gallery && Array.isArray(apiProperty.gallery) && apiProperty.gallery.length > 0) {
    const validGallery = apiProperty.gallery.filter((img: any) => img && typeof img === 'string' && img.trim() !== '');
    if (validGallery.length > 0) {
      gallery = [...gallery, ...validGallery.filter((img: string) => img !== mainImage)];
    }
  }

  // Check for image_urls or photo_urls
  if (!mainImage && (apiProperty as any).image_urls && Array.isArray((apiProperty as any).image_urls)) {
    const imageUrls = (apiProperty as any).image_urls.filter((img: any) => img && typeof img === 'string' && img.trim() !== '');
    if (imageUrls.length > 0) {
      mainImage = imageUrls[0];
      gallery = imageUrls.slice(1);
    }
  }

  // Use placeholder if no image is available
  const finalMainImage = mainImage && mainImage.trim() !== '' 
    ? mainImage 
    : 'https://via.placeholder.com/800x600?text=No+Image';

  // Amenities - ensure it's an array
  let amenities: string[] = [];
  if (apiProperty.amenities) {
    if (Array.isArray(apiProperty.amenities)) {
      amenities = apiProperty.amenities.filter((a: any) => a && (typeof a === 'string' || typeof a === 'object'));
      // If amenities are objects, extract names
      amenities = amenities.map((a: any) => typeof a === 'string' ? a : (a.name || a.title || String(a)));
    } else if (typeof apiProperty.amenities === 'string') {
      // Try to parse if it's a JSON string
      try {
        const parsed = JSON.parse(apiProperty.amenities);
        amenities = Array.isArray(parsed) ? parsed : [];
      } catch {
        amenities = [apiProperty.amenities];
      }
    }
  }

  // Dates
  const createdAt = apiProperty.created_at || apiProperty.createdAt || apiProperty.created || undefined;
  const updatedAt = apiProperty.updated_at || apiProperty.updatedAt || apiProperty.updated || undefined;
  
  // Ready date / Handover year - ensure it's a string
  let readyDate: string | undefined = undefined;
  if (apiProperty.ready_date) {
    readyDate = typeof apiProperty.ready_date === 'string' 
      ? apiProperty.ready_date 
      : String(apiProperty.ready_date);
  } else if (apiProperty.handover_year) {
    readyDate = String(apiProperty.handover_year);
  } else if (apiProperty.handover_date) {
    readyDate = typeof apiProperty.handover_date === 'string' 
      ? apiProperty.handover_date 
      : String(apiProperty.handover_date);
  } else if (apiProperty.completion_date) {
    readyDate = typeof apiProperty.completion_date === 'string' 
      ? apiProperty.completion_date 
      : String(apiProperty.completion_date);
  }

  // Listing type
  const listingType = apiProperty.listing_type || 
                      apiProperty.listingType || 
                      (apiProperty.category === 'rent' ? 'rent' : 'sale') ||
                      'sale';

  // Floors - handle number or string
  let floors: number | string | undefined = undefined;
  if (apiProperty.floors !== undefined && apiProperty.floors !== null) {
    if (typeof apiProperty.floors === 'string') {
      const parsed = parseInt(apiProperty.floors);
      floors = isNaN(parsed) ? apiProperty.floors : parsed;
    } else {
      floors = apiProperty.floors;
    }
  } else if ((apiProperty as any).num_floors) {
    floors = (apiProperty as any).num_floors;
  } else if ((apiProperty as any).floor_count) {
    floors = (apiProperty as any).floor_count;
  }

  // Security - handle boolean or string
  let security: boolean | string | undefined = undefined;
  if (apiProperty.security !== undefined && apiProperty.security !== null) {
    if (typeof apiProperty.security === 'boolean') {
      security = apiProperty.security;
    } else if (typeof apiProperty.security === 'string') {
      const lower = apiProperty.security.toLowerCase();
      security = lower === 'true' || lower === 'yes' || lower === '1' ? true : 
                 lower === 'false' || lower === 'no' || lower === '0' ? false : 
                 apiProperty.security;
    }
  } else if ((apiProperty as any).has_security) {
    security = (apiProperty as any).has_security;
  } else if ((apiProperty as any).security_available) {
    security = (apiProperty as any).security_available;
  }

  // Furnished - ensure it's a string
  let furnished: string | undefined = undefined;
  const furnishedValue = apiProperty.furnished || (apiProperty as any).furnishing;
  if (furnishedValue !== undefined && furnishedValue !== null) {
    furnished = typeof furnishedValue === 'string' 
      ? (furnishedValue.trim() !== '' ? furnishedValue : undefined)
      : String(furnishedValue).trim() !== '' ? String(furnishedValue) : undefined;
  }

  // Payment plan - ensure it's a string
  let paymentPlan: string | undefined = undefined;
  const paymentPlanValue = apiProperty.payment_plan || (apiProperty as any).payment_plan_name;
  if (paymentPlanValue !== undefined && paymentPlanValue !== null) {
    paymentPlan = typeof paymentPlanValue === 'string' 
      ? (paymentPlanValue.trim() !== '' ? paymentPlanValue : undefined)
      : String(paymentPlanValue).trim() !== '' ? String(paymentPlanValue) : undefined;
  }

  // Build the return object, only including fields with valid values
  const property: Property = {
    id,
    title,
    description,
    type,
    price,
    area,
    location,
    city,
    locality,
    category,
    developer: developer || undefined,
    amenities,
    mainImage: finalMainImage,
    gallery,
    createdAt,
    updatedAt,
    readyDate,
    listingType: listingType as 'sale' | 'rent',
  };

  // Only add bedrooms if it's a valid number > 0
  if (bedrooms !== undefined && bedrooms > 0) {
    property.bedrooms = bedrooms;
  }

  // Only add bathrooms if it's a valid number > 0
  if (bathrooms !== undefined && bathrooms > 0) {
    property.bathrooms = bathrooms;
  }

  // Only add optional fields if they have valid values
  if (floors !== undefined && floors !== null) {
    property.floors = floors;
  }
  if (security !== undefined && security !== null) {
    property.security = security;
  }
  if (furnished !== undefined) {
    property.furnished = furnished;
  }
  if (paymentPlan !== undefined) {
    property.paymentPlan = paymentPlan;
  }

  return property;
}

export interface FilterOptions {
  type?: string | string[];
  bedrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  city?: string;
  locality?: string;
  search?: string;
  sortBy?: 'created_at' | 'updated_at' | 'min_price' | 'max_price';
  sortOrder?: 'asc' | 'desc';
}

// Convert FilterOptions to ApiFilterOptions for API calls
function convertToApiFilters(filters: FilterOptions): ApiFilterOptions {
  const apiFilters: ApiFilterOptions = {};
  
  // Property Type filter - support single or multiple types
  // Only send if we have actual values (not empty strings/arrays)
  if (filters.type) {
    if (typeof filters.type === 'string' && filters.type.trim() !== '') {
      apiFilters.type = [filters.type];
    } else if (Array.isArray(filters.type) && filters.type.length > 0) {
      apiFilters.type = filters.type;
    }
  }
  
  // City filter - only send if not empty
  if (filters.city && filters.city.trim() !== '') {
    apiFilters.city = filters.city;
  }
  
  // Locality filter (more specific than city) - only send if not empty
  if (filters.locality && filters.locality.trim() !== '') {
    apiFilters.locality = filters.locality;
  }
  
  // Price range filters - only send if > 0
  if (filters.minPrice && filters.minPrice > 0) {
    apiFilters.min_price = filters.minPrice;
  }
  
  if (filters.maxPrice && filters.maxPrice > 0) {
    apiFilters.max_price = filters.maxPrice;
  }
  
  // Area/Size range filters - only send if > 0
  if (filters.minArea && filters.minArea > 0) {
    apiFilters.min_sq_ft = filters.minArea;
  }
  
  if (filters.maxArea && filters.maxArea > 0) {
    apiFilters.max_sq_ft = filters.maxArea;
  }
  
  // Bedrooms filter - DON'T SEND, causes 500 error
  // Backend has Prisma enum bug that causes 500 errors
  // Keeping this disabled until backend is fixed
  // if (filters.bedrooms !== undefined && filters.bedrooms > 0) {
  //   apiFilters.min_bedrooms = [filters.bedrooms.toString()];
  // }
  
  // Sort options - only send if defined
  if (filters.sortBy) {
    apiFilters.sort_by = filters.sortBy;
  }
  
  if (filters.sortOrder) {
    apiFilters.sort_order = filters.sortOrder;
  }
  
  // Search term - only include actual search text
  if (filters.search && filters.search.trim() !== '') {
    apiFilters.search = filters.search.trim();
  }
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('=== Converting Filters ===');
    console.log('Input filters:', filters);
    console.log('API filters:', apiFilters);
  }
  
  return apiFilters;
}

// Note: getAllProperties fetches without filters (used for related properties, etc.)
// For filtered results, use getPaginatedProperties which uses API-based filtering

// Fetch all properties from API (without filters - used for related properties)
export async function getAllProperties(page: number = 1, limit: number = 100): Promise<Property[]> {
  try {
    // Fetch all properties without any filters
    // Note: API has a max limit, so we use 100 which is typically accepted
    const response = await fetchProperties({}, page, limit);
    
    if (response.success && response.data) {
      return response.data.map(mapApiPropertyToProperty);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching properties:', error);
    return [];
  }
}

// Fetch property by ID from API
export async function getPropertyById(id: string | number): Promise<Property | null> {
  try {
    const idStr = typeof id === 'number' ? id.toString() : id;
    const apiProperty = await fetchPropertyByIdApi(idStr);
    
    if (apiProperty) {
      return mapApiPropertyToProperty(apiProperty);
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching property by ID:', error);
    return null;
  }
}

// Fetch related properties
export async function getRelatedProperties(
  excludeId: string | number,
  type?: string,
  limit: number = 4
): Promise<Property[]> {
  try {
    // Fetch all properties
    const properties = await getAllProperties(1, 100);
    const excludeIdStr = typeof excludeId === 'number' ? excludeId.toString() : excludeId;
    
    // Filter client-side: exclude current property and optionally filter by type
    const filtered = properties
      .filter((p) => {
        const pId = typeof p.id === 'number' ? p.id.toString() : p.id;
        if (pId === excludeIdStr) return false;
        if (type && p.type?.toLowerCase() !== type.toLowerCase()) return false;
        return true;
      })
      .slice(0, limit);
    
    return filtered;
  } catch (error) {
    console.error('Error fetching related properties:', error);
    return [];
  }
}

// Format price for display
export function formatPrice(price: number): string {
  if (price >= 1000000000) {
    const bValue = (price / 1000000000).toFixed(2);
    return `${parseFloat(bValue).toLocaleString('en-US')}B`;
  } else if (price >= 1000000) {
    const mValue = (price / 1000000).toFixed(2);
    return `${parseFloat(mValue).toLocaleString('en-US')}M`;
  } else if (price >= 1000) {
    const kValue = (price / 1000).toFixed(0);
    return `${parseInt(kValue).toLocaleString('en-US')}K`;
  }
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Filter properties (DEPRECATED - Now using API-based filtering)
// This function is kept for backward compatibility but should not be used in new code
// All filtering should be done via API in getPaginatedProperties which uses convertToApiFilters
export function filterProperties(properties: Property[], filters: FilterOptions): Property[] {
  return properties.filter((property) => {
    // Search filter - search in title, description, location, and type
    if (filters.search && filters.search.trim() !== '') {
      const searchLower = filters.search.toLowerCase().trim();
      const titleMatch = property.title?.toLowerCase().includes(searchLower) || false;
      const descMatch = property.description?.toLowerCase().includes(searchLower) || false;
      const locationMatch = property.location?.toLowerCase().includes(searchLower) || false;
      const typeMatch = property.type?.toLowerCase().includes(searchLower) || false;
      const developerMatch = property.developer?.toLowerCase().includes(searchLower) || false;
      
      if (!titleMatch && !descMatch && !locationMatch && !typeMatch && !developerMatch) {
        return false;
      }
    }
    
    // Type filter
    if (filters.type && filters.type.trim() !== '') {
      if (!property.type || property.type.toLowerCase() !== filters.type.toLowerCase()) {
        return false;
      }
    }
    
    // Bedrooms filter - filter for properties with AT LEAST the specified number of bedrooms
    if (filters.bedrooms !== undefined && filters.bedrooms > 0) {
      if (!property.bedrooms || property.bedrooms < filters.bedrooms) {
        return false;
      }
    }
    
    // Bathrooms filter - filter for properties with AT LEAST the specified number of bathrooms
    if (filters.bathrooms !== undefined && filters.bathrooms > 0) {
      if (!property.bathrooms || property.bathrooms < filters.bathrooms) {
        return false;
      }
    }
    
    // Price filters
    const propertyPrice = typeof property.price === 'number' ? property.price : 0;
    
    // Min price filter - exclude properties below minimum
    if (filters.minPrice !== undefined && filters.minPrice > 0) {
      if (propertyPrice < filters.minPrice) {
        return false;
      }
    }
    
    // Max price filter - exclude properties above maximum
    if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
      if (propertyPrice > filters.maxPrice) {
        return false;
      }
    }
    
    // Listing type filter (sale/rent)
    if (filters.listingType && filters.listingType.trim() !== '') {
      if (!property.listingType || property.listingType !== filters.listingType) {
        return false;
      }
    }
    
    // City filter
    if (filters.city && filters.city.trim() !== '') {
      // Check if location contains the city name
      if (!property.location || !property.location.toLowerCase().includes(filters.city.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  });
}

// Fetch properties with pagination
export interface PaginatedPropertiesResult {
  properties: Property[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getPaginatedProperties(
  filters: FilterOptions = {},
  page: number = 1,
  limit: number = 20
): Promise<PaginatedPropertiesResult> {
  try {
    // Convert FilterOptions to ApiFilterOptions
    const apiFilters = convertToApiFilters(filters);
    
    // Call API with filters - API handles filtering server-side
    const response = await fetchProperties(apiFilters, page, limit);
    
    if (response.success && response.data) {
      // Map API response to Property objects
      let properties = response.data.map(mapApiPropertyToProperty);
      
      // WORKAROUND: Apply client-side filtering for bedrooms
      // Backend has Prisma enum bug - it expects enum but receives strings
      // This causes 500 errors, so we filter client-side as temporary workaround
      let clientSideFiltered = false;
      
      if (filters.bedrooms !== undefined && filters.bedrooms > 0) {
        properties = properties.filter((p) => {
          return p.bedrooms !== undefined && p.bedrooms >= filters.bedrooms!;
        });
        clientSideFiltered = true;
      }
      
      // Get pagination info from API response
      // If we did client-side filtering, recalculate pagination
      let total = response.pagination?.total || properties.length;
      let totalPages = response.pagination?.total_pages || Math.ceil(total / limit);
      
      // Re-paginate if we did client-side filtering
      if (clientSideFiltered) {
        total = properties.length;
        totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        properties = properties.slice(startIndex, endIndex);
      }
      
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('=== API Filtering ===');
        console.log('Filters applied:', filters);
        console.log('API Filters:', apiFilters);
        console.log('Properties returned:', properties.length);
        console.log('Total:', total);
        console.log('Total Pages:', totalPages);
        if (filters.bedrooms) {
          console.warn('⚠️ Bedrooms filter applied client-side (backend Prisma enum bug)');
        }
      }
      
      return {
        properties,
        pagination: {
          page: response.pagination?.page || page,
          limit: response.pagination?.limit || limit,
          total,
          totalPages,
        },
      };
    }
    
    return {
      properties: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    };
  } catch (error) {
    console.error('Error fetching paginated properties:', error);
    return {
      properties: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    };
  }
}
