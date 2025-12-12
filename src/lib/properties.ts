import propertiesData from '../data/properties.json';

// Property interface moved here
export interface Property {
  id?: number;
  title: string;
  description: string;
  type: string;
  price: number;
  bedrooms: number | string;
  bathrooms: number;
  area: number;
  location: string;
  developer?: string;
  amenities: string[];
  mainImage: string;
  gallery: string[];
  createdAt?: string;
  updatedAt?: string;
  readyDate?: string;
  listingType: 'sale' | 'rent';
}

interface PropertiesData {
  properties: Property[];
}

// Add IDs to properties if they don't have them
const propertiesWithIds = (propertiesData as PropertiesData).properties.map((property, index) => ({
  ...property,
  id: index + 1,
}));

export function getAllProperties(): Property[] {
  return propertiesWithIds;
}

export function getPropertyById(id: string | number): Property | null {
  const propertyId = typeof id === 'string' ? parseInt(id, 10) : id;
  const property = propertiesWithIds.find((p) => p.id === propertyId);
  return property || null;
}

export function getRelatedProperties(
  excludeId: string | number,
  type?: string,
  limit: number = 4
): Property[] {
  const excludeIdNum = typeof excludeId === 'string' ? parseInt(excludeId, 10) : excludeId;
  let filtered = propertiesWithIds.filter((p) => p.id !== excludeIdNum);
  
  if (type) {
    filtered = filtered.filter((p) => p.type === type);
  }
  
  return filtered.slice(0, limit);
}

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

export interface FilterOptions {
  type?: string;
  bedrooms?: number;
  bathrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  listingType?: 'sale' | 'rent';
}

export function filterProperties(properties: Property[], filters: FilterOptions): Property[] {
  return properties.filter((property) => {
    if (filters.type && property.type !== filters.type) return false;
    if (filters.bedrooms && property.bedrooms !== filters.bedrooms) return false;
    if (filters.bathrooms && property.bathrooms !== filters.bathrooms) return false;
    if (filters.minPrice && property.price < filters.minPrice) return false;
    if (filters.maxPrice && property.price > filters.maxPrice) return false;
    if (filters.listingType && property.listingType !== filters.listingType) return false;
    return true;
  });
}
