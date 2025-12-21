// utils/geocodeRegion.ts

export const geocodeRegion = async (
    region: string
): Promise<{ lat: number; lon: number } | null> => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        region
    )}&format=json&limit=1`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.length === 0) return null;

        return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
        };
    } catch (err) {
        console.error("Geocoding failed:", err);
        return null;
    }
};

