"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { geocodeRegion } from "@/utils/geocodeRegion";
import { formatPrice } from "@/utils/formatPrice";

const MultiPropertyMap = dynamic(() => import("@/components/MultiPropertyMap"), {
  ssr: false,
});

const PropertyInfoPanel = dynamic(() => import("@/components/PropertyInfoPanel"), {
  ssr: false,
});

interface Property {
  propertyId: number; // Numeric ID for compatibility with MultiPropertyMap
  id?: string; // UUID from API (for navigation)
  title: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  price: number;
  images: string[];
  developer?: string;
  propertyType?: string[];
  description?: string;
  latitude?: number;
  longitude?: number;
}

interface APIProject {
  id: string;
  title: string;
  description: string;
  image_urls: string[];
  min_price?: number;
  max_price?: number;
  address: string;
  city: string;
  type: string[];
  category: string;
  project_name: string;
  min_bedrooms?: string;
  max_bedrooms?: string;
  min_bathrooms?: string;
  max_bathrooms?: string;
  latitude?: number;
  longitude?: number;
  developer?: {
    company?: {
      name?: string;
    };
  };
}

interface HotspotSearchRequestBody {
  prioritize_brokerage_id: string;
  category: string;
  include_developer: boolean;
  type?: string;
  min_bedrooms?: string[];
  developer?: {
    company?: {
      name?: string;
    };
  };
}

// Helper function to convert bedroom enum to number
const bedroomEnumToNumber = (bedroomEnum?: string): number => {
  const enumMap: { [key: string]: number } = {
    "Studio": 0,
    "One": 1,
    "Two": 2,
    "Three": 3,
    "Four": 4,
    "Four_Plus": 5,
    "Five": 5,
    "Six": 6,
    "Seven": 7,
  };
  return bedroomEnum ? enumMap[bedroomEnum] || 0 : 0;
};

// Helper function to convert bathroom enum to number
const bathroomEnumToNumber = (bathroomEnum?: string): number => {
  const enumMap: { [key: string]: number } = {
    "One": 1,
    "Two": 2,
    "Three_Plus": 3,
  };
  return bathroomEnum ? enumMap[bathroomEnum] || 0 : 0;
};

export default function Hotspots() {
  const [propertyType, setPropertyType] = useState("All");
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Property type mapping
  const propertyTypeMap: { [key: string]: string | undefined } = {
    "All": undefined,
    "Villa": "Villa",
    "Apartment": "Apartment",
    "Townhouse": "Townhouse",
    "Duplex": "Duplex",
    "Penthouse": "Penthouse",
    "2 BHK": undefined, // Filter by bedroom count instead
    "3 BHK": undefined, // Filter by bedroom count instead
    "1 BHK": undefined, // Filter by bedroom count instead
  };

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      try {
        // Use the API route that proxies to the backend
        const baseUrl = "/api/projects";

        // Build request body for new API
        const requestBody: HotspotSearchRequestBody = {
          // Always prioritize brokerage_id projects first
          prioritize_brokerage_id: "cc3e22bb-5ee1-443a-a4b0-47c33f0d9040",
          // Market type is always offPlan for hotspots
          category: "Off_plan",
          // Include developer information
          include_developer: true,
        };

        // Add property type filter for non-BHK types
        const mappedType = propertyTypeMap[propertyType];
        if (mappedType) {
          requestBody.type = mappedType;
        }

        // Handle BHK types - filter by bedroom count
        if (propertyType === "1 BHK") {
          requestBody.min_bedrooms = ["One"];
        } else if (propertyType === "2 BHK") {
          requestBody.min_bedrooms = ["Two"];
        } else if (propertyType === "3 BHK") {
          requestBody.min_bedrooms = ["Three"];
        }

        // Build query parameters for pagination
        const queryParams = new URLSearchParams();
        queryParams.append("page", "1");
        queryParams.append("limit", "100"); // API max is 100

        const apiUrl = `${baseUrl}?${queryParams.toString()}`;

        console.log(`Fetching ${propertyType} properties:`, requestBody);

        const res = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        const records = data.data || [];

        console.log(`API returned ${records.length} properties`);

        // Map API response to Property format
        let mappedProperties: Property[] = records.map((item: APIProject) => {
          // Generate a numeric propertyId from UUID for compatibility
          const numericId = item.id
            .replace(/-/g, "")
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000000;

          const bedrooms = bedroomEnumToNumber(item.min_bedrooms || item.max_bedrooms);
          const bathrooms = bathroomEnumToNumber(item.min_bathrooms || item.max_bathrooms);

          return {
            propertyId: numericId, // Keep numeric for compatibility
            id: item.id, // Store UUID
            title: item.title || item.project_name || "Untitled Property",
            description: item.description || "",
            location: item.city || item.address || "N/A",
            bedrooms,
            bathrooms,
            price: item.min_price || item.max_price || 0,
            images: item.image_urls || [],
            developer: item.developer?.company?.name,
            propertyType: item.type || [],
            latitude: item.latitude,
            longitude: item.longitude,
          };
        });

        // Filter out properties with "sartawi properties" in description
        mappedProperties = mappedProperties.filter((property: Property) => {
          const description = property.description?.toLowerCase() || '';
          const hasSartawi = description.includes('sartawi properties');
          if (hasSartawi) {
            console.log(`Filtered out: ${property.title} - contains 'sartawi properties'`);
          }
          return !hasSartawi;
        });

        // For BHK types, ensure we filter by exact bedroom count
        if (propertyType === "1 BHK") {
          mappedProperties = mappedProperties.filter((p) => p.bedrooms === 1);
        } else if (propertyType === "2 BHK") {
          mappedProperties = mappedProperties.filter((p) => p.bedrooms === 2);
        } else if (propertyType === "3 BHK") {
          mappedProperties = mappedProperties.filter((p) => p.bedrooms === 3);
        }

        console.log(`After filtering: ${mappedProperties.length} properties remain for ${propertyType}`);

        // Show all properties
        setProperties(mappedProperties);
        // Reset selected property when filter changes
        setSelectedProperty(null);
      } catch (error) {
        console.error("Error fetching properties:", error);
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [propertyType]);

  // Geocode properties to get coordinates
  useEffect(() => {
    const geocodeProperties = async () => {
      const updatedProperties = await Promise.all(
        properties.map(async (property) => {
          // If property already has coordinates, return as is
          if (property.latitude && property.longitude) {
            return property;
          }

          // Try to geocode the location
          const coords = await geocodeRegion(property.location);
          if (coords) {
            return {
              ...property,
              latitude: coords.lat,
              longitude: coords.lon,
            };
          }

          return property;
        })
      );

      // Only update if coordinates were added
      if (JSON.stringify(updatedProperties) !== JSON.stringify(properties)) {
        setProperties(updatedProperties);
      }
    };

    if (properties.length > 0) {
      geocodeProperties();
    }
  }, [properties.length]); // Only run when properties count changes to avoid infinite loops

  const handleMarkerClick = (property: Property) => {
    setSelectedProperty(property);
  };

  const handleClosePanel = () => {
    setSelectedProperty(null);
  };

  return (
    <section className="bg-[#FFFFFF] px-6 md:px-12 lg:px-20 py-20">
      {/* Title */}
      <h2 className="text-center text-2xl md:text-4xl font-semibold text-black mb-6">
        Choose from Top Developers
      </h2>

      {/* Filter Buttons */}
      <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-6">
        {["All", "Villa", "2 BHK", "3 BHK", "1 BHK"].map((type) => (
          <button
            key={type}
            onClick={() => setPropertyType(type)}
            className={`px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium text-sm md:text-base transition-all ${
              propertyType === type
                ? "bg-[#1f2462] text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-300 hover:border-[#1f2462] hover:text-[#1f2462]"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Full Width Map with Side Panel */}
      <div className="relative w-full" style={{ height: "600px" }}>
        {isLoading ? (
          <div className="flex items-center justify-center bg-gray-100 rounded-xl h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            <MultiPropertyMap
              properties={properties}
              height="600px"
              onMarkerClick={handleMarkerClick}
              selectedPropertyId={selectedProperty?.propertyId}
            />
            {selectedProperty && (
              <PropertyInfoPanel
                property={selectedProperty}
                onClose={handleClosePanel}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
