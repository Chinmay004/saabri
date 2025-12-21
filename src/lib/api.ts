// Use Next.js API route to proxy requests (avoids CORS issues)
const API_BASE_URL = '/api/projects';

export interface ApiFilterOptions {
  brokerage_id?: string;
  developer_id?: string;
  city?: string | string[];
  category?: string | string[];
  type?: string | string[];
  source_type?: string | string[];
  furnished?: string | string[];
  payment_plan?: string | string[];
  min_price?: number;
  max_price?: number;
  price_range?: {
    min: number;
    max: number;
  };
  min_sq_ft?: number;
  max_sq_ft?: number;
  sq_ft_range?: {
    min: number;
    max: number;
  };
  property_size?: number;
  property_size_range?: {
    min: number;
    max: number;
  };
  min_bedrooms?: string[] | number[];
  max_bedrooms?: string[] | number[];
  min_bathrooms?: string[] | number[];
  max_bathrooms?: string[] | number[];
  handover_year?: number[];
  handover_year_range?: {
    min: number;
    max: number;
  };
  amenities?: string[];
  unit_types?: string[];
  locality?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  search?: string;
  created_after?: string;
  created_before?: string;
  updated_after?: string;
  updated_before?: string;
  sort_by?: 'created_at' | 'updated_at' | 'min_price' | 'max_price' | 'handover_year' | 'views';
  sort_order?: 'asc' | 'desc';
  prioritize_brokerage_id?: string;
  include_developer?: boolean;
  include_brokerage?: boolean;
  include_floor_plans?: boolean;
}

export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: ApiPagination;
}

export interface ApiProperty {
  id?: string;
  _id?: string;
  title?: string;
  name?: string;
  property_name?: string;
  description?: string;
  details?: string;
  overview?: string;
  summary?: string;
  type?: string;
  property_type?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  price?: number;
  price_range?: {
    min?: number;
    max?: number;
  };
  bedrooms?: string | number | string[];
  min_bedrooms?: string[] | string;
  max_bedrooms?: string[] | string;
  bathrooms?: string | number | string[];
  min_bathrooms?: string[] | string;
  max_bathrooms?: string[] | string;
  area?: number;
  sq_ft?: number;
  property_size?: number;
  size?: number;
  sq_ft_range?: {
    min?: number;
    max?: number;
  };
  location?: string;
  address?: string;
  city?: string;
  locality?: string;
  area_name?: string;
  developer?: {
    id?: string;
    name?: string;
  } | string;
  developer_id?: string;
  developer_name?: string;
  brokerage?: {
    id?: string;
    name?: string;
  };
  amenities?: string[] | any[];
  images?: string[];
  image_urls?: string[];
  photo_urls?: string[];
  main_image?: string;
  gallery?: string[];
  created_at?: string;
  createdAt?: string;
  created?: string;
  updated_at?: string;
  updatedAt?: string;
  updated?: string;
  handover_year?: number;
  handover_date?: string;
  ready_date?: string;
  completion_date?: string;
  listing_type?: 'sale' | 'rent';
  listingType?: 'sale' | 'rent';
  furnished?: string;
  payment_plan?: string;
  roi?: {
    firstYear?: number;
    thirdYear?: number;
    fifthYear?: number;
  };
  [key: string]: any; // For any additional fields
}

export async function fetchProperties(
  filters: ApiFilterOptions = {},
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<ApiProperty[]>> {
  // Construct URL with query parameters
  const url = `${API_BASE_URL}?page=${page}&limit=${limit}`;

  try {
    // Use Next.js fetch caching - cache for 5 minutes, revalidate in background
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filters),
      // Cache for 5 minutes, allow stale-while-revalidate
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`API error: ${response.status} ${errorData.message || response.statusText}`);
    }

    const data: ApiResponse<ApiProperty[]> = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }
}

export async function fetchPropertyById(id: string): Promise<ApiProperty | null> {
  try {
    // Optimized: Try searching by ID first using the search filter
    // This is much more efficient than looping through pages
    const searchResponse = await fetchProperties({ search: id }, 1, 100);
    
    if (searchResponse.success && searchResponse.data) {
      // Find exact match by ID
      const found = searchResponse.data.find(
        (p) => p.id === id || 
               p.id?.toString() === id || 
               p._id === id ||
               p._id?.toString() === id
      );
      
      if (found) {
        return found;
      }
    }
    
    // Fallback: If search didn't work, try first few pages (but limit to 3 pages for performance)
    // This is a backup strategy in case the API doesn't support ID search
    let page = 1;
    const limit = 100;
    const maxPages = 3; // Reduced from 10 to 3 for better performance
    
    while (page <= maxPages) {
      const response = await fetchProperties({}, page, limit);
      
      if (response.success && response.data) {
        const found = response.data.find(
          (p) => p.id === id || 
                 p.id?.toString() === id ||
                 p._id === id ||
                 p._id?.toString() === id
        );
        if (found) {
          return found;
        }
        
        // If we've reached the last page, stop searching
        if (!response.pagination || page >= response.pagination.total_pages) {
          break;
        }
      } else {
        break;
      }
      
      page++;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching property by ID:', error);
    return null;
  }
}

