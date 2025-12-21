import propertyData from "@/db/property-data-v5";

// Location aliases for better matching (same as Continental)
const LOCATION_ALIASES: { [key: string]: string } = {
    "jbr": "Jumeirah Beach Residence",
    "jlt": "Jumeirah Lake Towers",
    "jvc": "Jumeirah Village Circle",
    "difc": "Dubai International Financial Centre",
    "dip": "Dubai Investments Park",
    "dso": "Dubai Silicon Oasis",
    "dpc": "Dubai Production City",
    "dfc": "Dubai Festival City",
    "gcv": "Green Community Village",
    "business bay": "Business Bay",
    "downtown": "Downtown Dubai",
    "downtown dubai": "Downtown Dubai",
    "marina": "Dubai Marina",
    "palm": "The Palm Jumeirah",
    "palm jumeirah": "The Palm Jumeirah",
    "the palm": "The Palm Jumeirah",
    "barsha": "Al Barsha 1",
    "al barsha": "Al Barsha 1",
    "barsha heights": "Barsha Heights",
    "tecom": "Barsha Heights",
    "jafza": "Jabal Ali Industrial First",
    "jabal ali": "Jabal Ali Industrial First",
    "jebel ali": "Mina Jebel Ali",
    "silicon oasis": "Dubai Silicon Oasis",
    "production city": "Dubai Production City",
    "investments park": "Dubai Investments Park",
    "festival city": "Dubai Festival City",
    "green community": "Green Community Village",
    "emirates hills": "Emirates Hills",
    "jumeirah": "Jumeirah 2",
    "mirdiff": "Mirdif",
    "nad al sheba": "Nad Al Sheba",
    "ras al khor": "Ras Al Khor",
    "al sufouh": "Al Sufouh",
    "sufouh": "Al Sufouh",
    "al satwa": "Al Satwa",
    "satwa": "Al Satwa",
    "al wasl": "Al Wasl",
    "wasl": "Al Wasl",
    "al quoz": "Al Quoz 1",
    "quoz": "Al Quoz 1",
    "al jaddaf": "Al Jaddaf",
    "jaddaf": "Al Jaddaf",
    "muhaisnah": "Muhaisnah 1",
    "international city": "International City Phase(2)",
    "dubai hills": "Dubai Hills Estate",
    "dubai hills estate": "Dubai Hills Estate",
    "hills estate": "Dubai Hills Estate",
    "creek harbour": "Dubai Creek Harbour",
    "dubai creek": "Dubai Creek Harbour",
    "dubai creek harbour": "Dubai Creek Harbour",
};

// Function to normalize location string
const normalizeLocation = (loc: string): string => {
    const normalized = loc.toLowerCase().trim();
    return LOCATION_ALIASES[normalized] || loc;
};

// Function to calculate similarity between two strings (Levenshtein distance)
const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
};

// Levenshtein distance function
const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,
                matrix[j - 1][i] + 1,
                matrix[j - 1][i - 1] + indicator
            );
        }
    }

    return matrix[str2.length][str1.length];
};

// Find matching region with improved logic
const findMatchingRegion = (location: string): string | null => {
    const normalizedLocation = normalizeLocation(location);
    const regions = Object.keys(propertyData);

    // Step 1: Check for exact match (case-insensitive)
    for (const region of regions) {
        if (region.toLowerCase() === normalizedLocation.toLowerCase()) {
            return region;
        }
    }

    // Step 2: Check if location contains or is contained in region name
    for (const region of regions) {
        const regionLower = region.toLowerCase();
        const locationLower = normalizedLocation.toLowerCase();

        // Skip if location is just "dubai" and region contains more specific info
        if (locationLower === "dubai" && regionLower.includes("dubai") && regionLower !== "dubai") {
            continue;
        }

        if (regionLower.includes(locationLower) || locationLower.includes(regionLower)) {
            const lengthDiff = Math.abs(locationLower.length - regionLower.length);
            const maxLength = Math.max(locationLower.length, regionLower.length);
            const score = 1 - (lengthDiff / maxLength);

            if (score >= 0.7) {
                return region;
            }
        }
    }

    // Step 3: Use fuzzy matching
    let bestMatch = "";
    let bestScore = 0;

    for (const region of regions) {
        const regionLower = region.toLowerCase();
        const locationLower = normalizedLocation.toLowerCase();

        // Skip generic "dubai" matches
        if (locationLower === "dubai" && regionLower.includes("dubai") && regionLower !== "dubai") {
            continue;
        }

        const similarity = calculateSimilarity(locationLower, regionLower);
        if (similarity > bestScore && similarity >= 0.65) {
            bestScore = similarity;
            bestMatch = region;
        }
    }

    return bestMatch || null;
};

// Calculate ROI based on location and property type
export function calculateROI(location: string, propertyType?: string | string[]): {
    firstYear: number;
    thirdYear: number;
    fifthYear: number;
} | null {
    const matchedRegion = findMatchingRegion(location);

    if (!matchedRegion || !propertyData[matchedRegion]) {
        // Return default fallback values
        return {
            firstYear: 9.3,
            thirdYear: 15.8,
            fifthYear: 22.1,
        };
    }

    const regionData = propertyData[matchedRegion];

    // Determine which property type to use
    // Priority: 1. Passed propertyType, 2. Apartment, 3. Villa
    let selectedPropertyData: { appreciation_perc: number; roi: number }[] | undefined;
    
    // Handle propertyType as string or array
    const typeString = Array.isArray(propertyType) 
        ? propertyType[0] 
        : propertyType;

    if (typeString && regionData[typeString as keyof typeof regionData]) {
        selectedPropertyData = regionData[typeString as keyof typeof regionData] as { appreciation_perc: number; roi: number }[];
    } else if (regionData.Apartment) {
        selectedPropertyData = regionData.Apartment;
    } else if (regionData.Villa) {
        selectedPropertyData = regionData.Villa;
    }

    if (selectedPropertyData && selectedPropertyData.length >= 5) {
        // Index 0 = Year 1, Index 2 = Year 3, Index 4 = Year 5
        return {
            firstYear: selectedPropertyData[0]?.roi ?? 9.3,
            thirdYear: selectedPropertyData[2]?.roi ?? 15.8,
            fifthYear: selectedPropertyData[4]?.roi ?? 22.1,
        };
    }

    // Fallback values
    return {
        firstYear: 9.3,
        thirdYear: 15.8,
        fifthYear: 22.1,
    };
}

