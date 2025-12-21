"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, MessageCircle } from "lucide-react";
import Image from "next/image";
import { createPortal } from "react-dom";

interface Property {
  propertyId: string | number;
  id?: string;
  title: string;
  description?: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  cityName?: string;
  developer?: string;
  images?: string[];
  propertyType?: string[];
  region?: string;
  listingType?: string;
  status?: string;
  amenities?: string[];
}

interface Message {
  id: number;
  sender: "user" | "bot";
  text: string;
  options?: string[];
  isTyping?: boolean;
  properties?: Property[];
}

interface PropertySearch {
  minPrice?: number;
  maxPrice?: number;
  developer?: string;
  region?: string;
  bedroomMentioned?: boolean;
  bedroomCount?: number; // Captured bedroom count (1, 2, or 3) - for display override only
}

interface ChatBotSearchRequestBody {
  prioritize_brokerage_id: string;
  category: string;
  include_developer: boolean;
  min_price?: number;
  max_price?: number;
  search?: string;
  locality?: string;
  cityName?: string;
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
  developer?: {
    company?: {
      name?: string;
    };
  };
}

interface ChatBotProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function ChatBot({ isOpen: externalIsOpen, onClose }: ChatBotProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  
  // Memoize the close function to prevent unnecessary re-renders
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  }, [onClose]);

  // Memoize the open function
  const handleOpen = useCallback(() => {
    if (externalIsOpen === undefined) {
      setInternalIsOpen(true);
    }
  }, [externalIsOpen]);
  const greetings = [
    "👋 Hey there! Welcome to Saabri Properties!",
    "🌟 Hello! Ready to find your dream property?",
    "🏠 Hi! Saabri Properties at your service!",
  ];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      text: `${greetings[Math.floor(Math.random() * greetings.length)]}\n\nI'm your property assistant, and I'm super excited to help you discover amazing off-plan properties in Dubai! 🚀\n\nLet's make this quick and easy. I just need to know your budget and preferred developer.\n\nFirst things first - what's your budget range? 💰`,
      options: ["Under 1M", "1M - 2M", "2M - 5M", "Custom Budget"],
    },
  ]);
  const [input, setInput] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [searchData, setSearchData] = useState<PropertySearch>({});
  const [isSearching, setIsSearching] = useState(false);
  const [capturedBedroomCount, setCapturedBedroomCount] = useState<number | undefined>(undefined);

  const chatRef = useRef<HTMLDivElement>(null);

  // Helper function to format price display
  const formatPrice = (price: number): string => {
    if (price < 1000000) {
      // Under 1M: show in thousands (K)
      return `${Math.round(price / 1000)}K`;
    } else {
      // 1M and above: show in millions (M)
      return `${(price / 1000000).toFixed(2)}M`;
    }
  };

  const developers = ["EMAAR", "Sobha", "DAMAC", "Meraas", "Deyaar", "Arada", "Any Developer"];

  const regions = [
    "Dubai Marina", "Downtown Dubai", "Business Bay", "Jumeirah", "Palm Jumeirah",
    "Dubai Hills", "Damac Hills", "Arabian Ranches", "JBR", "JVC", "Dubai Creek Harbour",
    "Meydan", "City Walk", "DIFC", "Bluewaters", "Al Barari"
  ];

  const funFacts = [
    "💡 Did you know? Dubai has over 200 skyscrapers!",
    "🌆 Fun fact: Dubai's property market is one of the world's most dynamic!",
    "✨ Interesting: Off-plan properties often offer better payment plans!",
    "🎯 Tip: EMAAR properties typically have excellent resale value!",
  ];

  // Smart keyword parser to extract information from user input
  const parseUserInput = (input: string): Partial<PropertySearch> => {
    const lowerInput = input.toLowerCase();
    const parsed: Partial<PropertySearch> = {};

    console.log("=== PARSING USER INPUT ===");
    console.log("Input:", input);
    console.log("Lower input:", lowerInput);

    // Extract developer name (including variations)
    for (const dev of developers) {
      if (dev !== "Any Developer" && lowerInput.includes(dev.toLowerCase())) {
        parsed.developer = dev;
        console.log("✅ Detected developer:", dev);
        break;
      }
    }

    // Extract region/area
    for (const region of regions) {
      if (lowerInput.includes(region.toLowerCase())) {
        parsed.region = region;
        break;
      }
    }

    // Check for bedroom keywords (capture count for display override)
    // Check for studio first
    if (lowerInput.includes('studio')) {
      parsed.bedroomCount = 0; // Studio = 0 bedrooms
      parsed.bedroomMentioned = true;
      console.log("🛏️ Studio detected - bedroom count: 0");
    } else {
      // Check for numbered bedrooms (including common Dubai format: 1BR, 2BR, etc.)
      const bedroomPatterns = [
        { pattern: /(\d+)\s*br\b/i, name: "BR format" },  // Matches: 1BR, 1 BR, 2br, etc. (most common in Dubai)
        { pattern: /(\d+)\s*bhk\b/i, name: "BHK format" }, // Matches: 1BHK, 2bhk, etc.
        { pattern: /(\d+)\s*bedroom/i, name: "Bedroom format" }, // Matches: 1 bedroom, 2bedroom, etc.
        { pattern: /(\d+)\s*bed\b/i, name: "Bed format" }, // Matches: 1 bed, 2bed, etc.
      ];

      for (const { pattern, name } of bedroomPatterns) {
        const match = input.match(pattern);
        if (match && match[1]) {
          const bedroomNum = parseInt(match[1]);
          // Only capture 1, 2, or 3 bedrooms
          if (bedroomNum >= 1 && bedroomNum <= 3) {
            parsed.bedroomCount = bedroomNum;
            parsed.bedroomMentioned = true;
            console.log(`🛏️ Bedroom count captured: ${bedroomNum} using ${name} (e.g., "${match[0]}") - will override display, not filter search`);
          } else {
            // For 4+ bedrooms, show contact info (old behavior)
            parsed.bedroomMentioned = true;
            console.log(`🛏️ Bedroom keyword detected (4+) using ${name} - will show contact info`);
          }
          break;
        }
      }
    }

    // Extract price information with enhanced patterns
    // Support formats: "1M", "1.5M", "2 million", "2.5m", "1,500,000", "under 2M", "1M-3M", etc.

    // Check for range patterns first: "1M to 3M", "1-3M", "between 1M and 3M"
    const rangePatterns = [
      /(\d+\.?\d*)\s*(?:m|million|mn)\s*(?:to|-)\s*(\d+\.?\d*)\s*(?:m|million|mn)/i,
      /between\s*(\d+\.?\d*)\s*(?:m|million|mn)?\s*(?:to|-|and)\s*(\d+\.?\d*)\s*(?:m|million|mn)/i,
      /(\d+\.?\d*)\s*(?:to|-)\s*(\d+\.?\d*)\s*(?:m|million|mn)/i,
    ];

    let priceFound = false;
    for (const pattern of rangePatterns) {
      const match = input.match(pattern);
      if (match) {
        const min = parseFloat(match[1]);
        const max = parseFloat(match[2]);
        parsed.minPrice = min * 1000000;
        parsed.maxPrice = max * 1000000;
        priceFound = true;
        break;
      }
    }

    // If no range found, check for single price limits
    if (!priceFound) {
      // Maximum/under/below patterns
      const maxPatterns = [
        /(?:under|below|max|maximum|up to|upto)\s*(?:aed\s*)?(\d+\.?\d*)\s*(?:m|million|mn)/i,
        /(?:under|below|max|maximum|up to|upto)\s*(\d+\.?\d*)\s*(?:m|million|mn)/i,
      ];

      for (const pattern of maxPatterns) {
        const match = input.match(pattern);
        if (match) {
          parsed.maxPrice = parseFloat(match[1]) * 1000000;
          priceFound = true;
          break;
        }
      }

      // Minimum/above/over patterns
      const minPatterns = [
        /(?:above|over|minimum|min|from|starting)\s*(?:aed\s*)?(\d+\.?\d*)\s*(?:m|million|mn)/i,
        /(?:above|over|minimum|min|from|starting)\s*(\d+\.?\d*)\s*(?:m|million|mn)/i,
      ];

      if (!priceFound) {
        for (const pattern of minPatterns) {
          const match = input.match(pattern);
          if (match) {
            parsed.minPrice = parseFloat(match[1]) * 1000000;
            priceFound = true;
            break;
          }
        }
      }

      // Around/approximately patterns
      const aroundPatterns = [
        /(?:around|approximately|about|roughly)\s*(?:aed\s*)?(\d+\.?\d*)\s*(?:m|million|mn)/i,
      ];

      if (!priceFound) {
        for (const pattern of aroundPatterns) {
          const match = input.match(pattern);
          if (match) {
            const price = parseFloat(match[1]) * 1000000;
            // Set a range of ±20% around the stated price
            parsed.minPrice = price * 0.8;
            parsed.maxPrice = price * 1.2;
            priceFound = true;
            break;
          }
        }
      }

      // General price pattern (standalone): "1.5M", "2 million", "3M"
      if (!priceFound) {
        const generalPattern = /\b(\d+\.?\d*)\s*(?:m|million|mn)\b(?!\s*(?:to|-|and))/i;
        const match = input.match(generalPattern);
        if (match) {
          const price = parseFloat(match[1]) * 1000000;
          // If context suggests max, use maxPrice, otherwise use it as a reference
          if (lowerInput.includes('under') || lowerInput.includes('below') || lowerInput.includes('max')) {
            parsed.maxPrice = price;
          } else if (lowerInput.includes('above') || lowerInput.includes('over') || lowerInput.includes('min')) {
            parsed.minPrice = price;
          } else {
            // Default: treat as approximate budget, set a range around it
            parsed.minPrice = price * 0.8;
            parsed.maxPrice = price * 1.2;
          }
          priceFound = true;
        }
      }

      // Try to parse pure numbers (in millions or full amounts)
      if (!priceFound) {
        // Check for numbers in the millions format like "2000000" or "2,000,000"
        const pureNumberPattern = /\b(\d{1,3}(?:,?\d{3})*)\b/;
        const match = input.match(pureNumberPattern);
        if (match) {
          const num = parseInt(match[1].replace(/,/g, ''));
          // Only consider if it's a reasonable property price (> 100k and < 100M)
          if (num >= 100000 && num <= 100000000) {
            // Treat as approximate budget
            parsed.minPrice = num * 0.8;
            parsed.maxPrice = num * 1.2;
            priceFound = true;
          }
        }
      }
    }

    console.log("=== PARSED RESULT ===");
    console.log("Parsed data:", JSON.stringify(parsed, null, 2));
    return parsed;
  };

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (text: string, options?: string[], isTyping = false, properties?: Property[]) => {
    const message: Message = {
      id: Date.now(),
      sender: "bot",
      text,
      options,
      isTyping,
      properties
    };
    setMessages(prev => [...prev, message]);
  };

  const handleOptionClick = (option: string) => {
    const userMsg: Message = { id: Date.now(), sender: "user", text: option };
    setMessages(prev => [...prev, userMsg]);

    // Handle special actions
    if (option === "Try Again") {
      setTimeout(() => {
        performSearch();
      }, 500);
      return;
    }

    if (option === "Start New Search" || option === "Adjust Filters") {
      setTimeout(() => {
        setCurrentStep(0);
        setSearchData({});
        setCapturedBedroomCount(undefined); // Clear captured bedroom count
        addMessage(
          "Perfect! Let's find you another great property! 🔍\n\nWhat's your budget range?",
          ["Under 1M", "1M - 2M", "2M - 5M", "Custom Budget"]
        );
      }, 1000);
      return;
    }

    if (option === "Contact Agent" || option === "Contact Support") {
      setTimeout(() => {
        addMessage(
          "📞 I'd be happy to connect you with our expert team!\n\nYou can reach us at:\n\n📍 Address:\n2110-B2B Office Tower - Marasi Dr\nBusiness Bay - Dubai\n\n📧 Email:\npropertiescontinental58@gmail.com\n\n📱 Phone:\n+971 4 770 5704\n\nOur team is ready to help you find your perfect property! Would you like to continue searching?",
          ["Continue Searching", "Start New Search"]
        );
      }, 1000);
      return;
    }

    if (option === "See More Properties" || option === "Browse All") {
      setTimeout(() => {
        addMessage(
          "For a complete list of all available properties, please visit our listings page or I can help you refine your search criteria.\n\nWhat would you like to do?",
          ["Refine Search", "Start New Search", "Contact Agent"]
        );
      }, 1000);
      return;
    }

    if (option === "Continue Searching" || option === "Refine Search") {
      setTimeout(() => {
        setCurrentStep(0);
        setSearchData({});
        setCapturedBedroomCount(undefined); // Clear captured bedroom count
        addMessage(
          "Awesome! Let's find your perfect property! 🏠✨\n\nWhat's your budget range?",
          ["Under 1M", "1M - 2M", "2M - 5M", "Custom Budget"]
        );
      }, 1000);
      return;
    }

    setTimeout(() => {
      handleBotResponse(option);
    }, 1000);
  };

  const handleBotResponse = (userInput: string) => {
    switch (currentStep) {
      case 0: // Budget
        let minPrice: number | undefined, maxPrice: number | undefined;

        // Check if it's a button option
        const isButtonOption = ["Under 1M", "1M - 2M", "2M - 5M", "Custom Budget"].includes(userInput);

        if (isButtonOption) {
          switch (userInput) {
            case "Under 1M":
              maxPrice = 1000000;
              break;
            case "1M - 2M":
              minPrice = 1000000;
              maxPrice = 2000000;
              break;
            case "2M - 5M":
              minPrice = 2000000;
              maxPrice = 5000000;
              break;
            case "Custom Budget":
              addMessage(
                "No problem! 📝\n\nPlease type your budget range.\nFor example: '1.5M to 3M' or 'Maximum 2.5M'\n\n(Note: We show properties up to AED 5M)",
                undefined
              );
              return;
          }
        } else {
          // Try to parse custom budget from text
          const parsedBudget = parseUserInput(userInput);
          if (parsedBudget.minPrice || parsedBudget.maxPrice) {
            minPrice = parsedBudget.minPrice;
            maxPrice = parsedBudget.maxPrice;
          } else {
            // Couldn't parse budget, ask again
            addMessage(
              "I couldn't quite understand that budget. 🤔\n\nCould you try again? Examples:\n• '1.5M to 3M'\n• 'Under 2M'\n• 'Maximum 2.5M'\n\n(Note: We show properties up to AED 5M)",
              ["Under 1M", "1M - 2M", "2M - 5M"]
            );
            return;
          }
        }

        setSearchData(prev => ({ ...prev, minPrice, maxPrice }));

        // Add a fun fact while moving to next question
        const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];
        setTimeout(() => {
          addMessage(randomFact, undefined);
        }, 800);

        setTimeout(() => {
          const budgetStr = `${minPrice ? `AED ${(minPrice / 1000000).toFixed(1)}M` : 'Any'} - ${maxPrice ? `AED ${(maxPrice / 1000000).toFixed(1)}M` : 'No limit'}`;
          addMessage(
            `Awesome! Budget range set to ${budgetStr}. 💎\n\nNow, which developer catches your eye? We have some fantastic options!`,
            developers
          );
        }, 2000);
        setCurrentStep(1);
        break;

      case 1: // Developer
        if (userInput !== "Any Developer") {
          setSearchData(prev => ({ ...prev, developer: userInput }));
        }

        addMessage(
          `${userInput !== "Any Developer" ? `Excellent choice! ${userInput} builds stunning properties! 🏗️` : 'Great! We\'ll search across all developers! 🌟'}\n\nGive me a moment while I search our database...`,
          undefined
        );

        setTimeout(() => {
          performSearch();
        }, 1500);
        break;

      default:
        // For any other case, try to parse as general input
        addMessage(
          "I'm here to help you find properties! You can tell me about:\n\n• Your budget (e.g., '2M to 5M')\n• Preferred developer (e.g., 'EMAAR')\n• Location (e.g., 'Dubai Marina')\n\nOr you can start a new search!",
          ["Start New Search", "Contact Agent"]
        );
        break;
    }
  };

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

  const performSearch = async (customSearchData?: PropertySearch) => {
    setIsSearching(true);

    // Use custom search data if provided, otherwise use state
    const dataToUse = customSearchData || searchData;

    // Use saabri's API proxy route
    const baseUrl = "/api/projects";

    // Build request body for new API
    const requestBody: ChatBotSearchRequestBody = {
      // Always prioritize brokerage_id projects first
      prioritize_brokerage_id: "cc3e22bb-5ee1-443a-a4b0-47c33f0d9040",
      // Market type is always offPlan for chatbot
      category: "Off_plan",
      // Include developer information
      include_developer: true,
    };

    // Add optional parameters if they exist
    if (dataToUse.minPrice) {
      requestBody.min_price = dataToUse.minPrice;
    }
    if (dataToUse.maxPrice) {
      // Apply permanent max price cap of 5M
      const MAX_PRICE_CAP = 5000000;
      requestBody.max_price = dataToUse.maxPrice > MAX_PRICE_CAP ? MAX_PRICE_CAP : dataToUse.maxPrice;
    } else {
      // If no max price specified, apply 5M cap
      requestBody.max_price = 5000000;
    }

    // Developer filter - use search parameter to find developer
    // The search parameter searches in: title, description, project_name, address
    if (dataToUse.developer && dataToUse.developer !== "Any Developer") {
      requestBody.search = dataToUse.developer;
    }

    // Region/Locality filter
    // Use locality for area searches (e.g., "Dubai Marina", "Downtown Dubai")
    // Locality uses contains search (case-insensitive) which is better for area names
    if (dataToUse.region) {
      requestBody.locality = dataToUse.region;
    }

    // Build query parameters for pagination
    // Note: API limit is max 100, so we'll use 100 and may need multiple requests for more results
    const queryParams = new URLSearchParams();
    queryParams.append("page", "1");
    queryParams.append("limit", "100");

    const apiUrl = `${baseUrl}?${queryParams.toString()}`;

    // Build search summary message
    let searchSummary = `🔍 Searching our exclusive collection of off-plan properties...\n\n`;
    if (dataToUse.developer && dataToUse.developer !== "Any Developer") searchSummary += `🏢 Developer: ${dataToUse.developer}\n`;
    if (dataToUse.region) searchSummary += `📍 Location: ${dataToUse.region}\n`;
    searchSummary += `💰 Budget: ${dataToUse.minPrice ? `AED ${(dataToUse.minPrice / 1000000).toFixed(1)}M` : 'Any'} - AED ${(requestBody.max_price / 1000000).toFixed(1)}M`;

    addMessage(
      searchSummary,
      undefined,
      true
    );

    try {
      console.log("=== API REQUEST ===");
      console.log("URL:", apiUrl);
      console.log("Method:", "POST");
      console.log("Request Body:", JSON.stringify(requestBody, null, 2));

      // Highlight developer filter specifically
      if (dataToUse.developer && dataToUse.developer !== "Any Developer") {
        console.log("🔍 DEVELOPER FILTER APPLIED:", dataToUse.developer);
      } else {
        console.log("⚠️ NO DEVELOPER FILTER - Will show all developers");
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("=== API RESPONSE ===");
      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Error response:", errorText);
        throw new Error(`API error: ${response.status} - ${errorText || 'No error details'}`);
      }

      const data = await response.json();
      console.log("Response data:", data);
      console.log("Total records received:", data.data?.length || 0);
      console.log("Pagination:", data.pagination);

      // Map API response to Property format
      const mappedProperties: Property[] = (data.data || []).map((item: APIProject) => {
        // Generate a numeric propertyId from UUID
        const numericId = item.id
          .replace(/-/g, "")
          .split("")
          .reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000000;

        return {
          propertyId: numericId,
          id: item.id,
          title: item.title || item.project_name || "Untitled Property",
          description: item.description || "",
          price: item.min_price || item.max_price || 0,
          bedrooms: bedroomEnumToNumber(item.min_bedrooms || item.max_bedrooms),
          bathrooms: bathroomEnumToNumber(item.min_bathrooms || item.max_bathrooms),
          cityName: item.city || item.address || "N/A",
          developer: item.developer?.company?.name || "N/A",
          images: item.image_urls || [],
          propertyType: item.type || [],
          listingType: item.category,
        };
      });

      // Log first few developers to verify
      if (mappedProperties.length > 0) {
        console.log("First 5 developers in results:",
          mappedProperties.slice(0, 5).map((p: Property) => p.developer)
        );
      }

      // Filter out properties with "sartawi properties" in description
      const filteredRecords = mappedProperties.filter((property: Property) => {
        const description = property.description?.toLowerCase() || '';
        return !description.includes('sartawi properties');
      });

      console.log(`Filtered ${mappedProperties.length} properties to ${filteredRecords.length} (removed Sartawi Properties)`);

      // If developer filter was applied, verify results
      if (dataToUse.developer && dataToUse.developer !== "Any Developer") {
        const developersInResults = [...new Set(filteredRecords.map((p: Property) => p.developer))];
        console.log("🔍 Developers in filtered results:", developersInResults);
      }

      setTimeout(() => {
        if (filteredRecords && filteredRecords.length > 0) {
          const successMessages = [
            `🎉 Fantastic! I found ${filteredRecords.length} amazing properties for you!`,
            `✨ Great news! We have ${filteredRecords.length} properties that match your preferences!`,
            `🌟 Perfect! ${filteredRecords.length} stunning properties are waiting for you!`,
          ];
          addMessage(
            `${successMessages[Math.floor(Math.random() * successMessages.length)]}\n\nHere are some handpicked recommendations just for you:`,
            ["See More Properties", "Start New Search", "Contact Agent"],
            false,
            filteredRecords.slice(0, 6)
          );
        } else {
          addMessage(
            `Hmm... 🤔 I couldn't find properties matching those exact criteria.\n\nBut don't worry! Let's try:\n• Adjusting your budget range\n• Exploring other developers\n• Speaking with our expert agents for hidden gems`,
            ["Adjust Filters", "Browse All", "Contact Agent"]
          );
        }
        setIsSearching(false);
      }, 2000);

    } catch (error) {
      console.error("Search error:", error);
      setTimeout(() => {
        addMessage(
          `Sorry, I encountered an issue while searching. The server might be temporarily unavailable.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or contact our team directly.`,
          ["Try Again", "Contact Support"]
        );
        setIsSearching(false);
      }, 2000);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now(), sender: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    const userInput = input;
    setInput("");

    setTimeout(() => {
      // Parse the user input for keywords
      const parsedData = parseUserInput(userInput);

      // Check if user provided substantial information (can do smart search)
      const hasSubstantialInfo = Object.keys(parsedData).length > 0;

      if (hasSubstantialInfo) {
        // Check if bedroom was mentioned - handle specially
        if (parsedData.bedroomMentioned) {
          // If bedroom count is 1, 2, or 3, proceed with search (ignore bedroom for filtering)
          if (parsedData.bedroomCount !== undefined && parsedData.bedroomCount >= 0 && parsedData.bedroomCount <= 3) {
            console.log(`✅ Bedroom count ${parsedData.bedroomCount} captured - will override display but not filter search`);
            // Continue to search below (don't return)
          } else {
            // For 4+ bedrooms or unspecified, show contact info (old behavior)
            addMessage(
              "Thank you for your interest! 🏠\n\nOur exclusive off-plan projects feature a diverse range of bedroom configurations to suit every lifestyle - from cozy studios to luxurious penthouses.\n\nFor detailed information about bedroom availability, floor plans, and unit specifications, I'd love to connect you with our expert property consultants who can provide you with comprehensive details tailored to your needs.\n\n📞 Here's how to reach us:",
              undefined
            );

            setTimeout(() => {
              addMessage(
                "📍 Address:\n2110-B2B Office Tower - Marasi Dr\nBusiness Bay - Dubai\n\n📧 Email:\npropertiescontinental58@gmail.com\n\n📱 Phone:\n+971 4 770 5704\n\nOur team is ready to assist you with detailed bedroom configurations and help you find the perfect property! 🌟\n\nWould you like to continue exploring other properties?",
                ["Continue Searching", "Start New Search"]
              );
            }, 1000);
            return;
          }
        }

        // Merge parsed data with existing search data
        const updatedSearchData = { ...searchData, ...parsedData };
        setSearchData(updatedSearchData);

        // Capture bedroom count for URL override (if present and valid)
        if (parsedData.bedroomCount !== undefined && parsedData.bedroomCount >= 0 && parsedData.bedroomCount <= 3) {
          setCapturedBedroomCount(parsedData.bedroomCount);
          console.log(`💾 Stored bedroom count for URL override: ${parsedData.bedroomCount}`);
        }

        console.log("=== UPDATED SEARCH DATA ===");
        console.log("Updated search data:", JSON.stringify(updatedSearchData, null, 2));

        // Build a confirmation message
        let confirmationMsg = "Great! I understood:\n\n";
        const detectedItems: string[] = [];

        if (parsedData.bedroomCount !== undefined) {
          const bedroomText = parsedData.bedroomCount === 0 ? 'Studio' : `${parsedData.bedroomCount} Bedroom${parsedData.bedroomCount > 1 ? 's' : ''}`;
          detectedItems.push(`🛏️ ${bedroomText} (will show ${bedroomText} properties)`);
        }
        if (parsedData.developer) detectedItems.push(`🏢 Developer: ${parsedData.developer}`);
        if (parsedData.region) detectedItems.push(`📍 Location: ${parsedData.region}`);
        if (parsedData.minPrice || parsedData.maxPrice) {
          // Apply 5M cap to displayed prices
          const displayMaxPrice = parsedData.maxPrice && parsedData.maxPrice <= 5000000 ? parsedData.maxPrice : 5000000;
          const priceStr = `💰 Budget: ${parsedData.minPrice ? `AED ${(parsedData.minPrice / 1000000).toFixed(1)}M` : 'Any'} - AED ${(displayMaxPrice / 1000000).toFixed(1)}M`;
          detectedItems.push(priceStr);
        }

        if (detectedItems.length > 0) {
          confirmationMsg += detectedItems.join('\n');

          // For natural language input, always search with whatever info we have
          // Don't ask for more filters - just show results
          confirmationMsg += "\n\nLet me search for properties matching your criteria! 🔍";
          addMessage(confirmationMsg, undefined);

          console.log("=== PERFORMING SEARCH WITH ===");
          console.log("Search criteria:", JSON.stringify(updatedSearchData, null, 2));

          // Perform search after a short delay, passing the updated search data
          setTimeout(() => {
            performSearch(updatedSearchData);
          }, 1500);
        } else {
          // Parsed but found nothing - fall back to regular flow
          handleBotResponse(userInput);
        }
      } else {
        // No keywords detected - continue with regular conversation flow
        handleBotResponse(userInput);
      }
    }, 1000);
  };

  // Handle escape key and body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleClose]);

  // Floating Chat Button (only show if using internal state)
  const FloatingButton = useMemo(() => {
    if (externalIsOpen !== undefined) return null; // Don't show button if controlled externally

    return (
      <motion.button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 bg-[#1A1F56] text-white p-4 rounded-full shadow-lg hover:bg-[#1f2462] transition-all duration-300 flex items-center justify-center group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <MessageCircle size={28} className="group-hover:scale-110 transition-transform" />
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-semibold animate-pulse">
          1
        </span>
      </motion.button>
    );
  }, [externalIsOpen, handleOpen]);

  // ChatBot Popup Content - render portal only when open
  const ChatBotContent = () => {
    if (typeof window === 'undefined') return null;

    return createPortal(
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="chatbot-popup-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-end p-4 md:p-6 pointer-events-none"
          >
            {/* Backdrop - removed blur, only transparent overlay for click-to-close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-transparent pointer-events-auto"
            />

            {/* Chat Window - Only animate on mount/unmount, not on content changes */}
            <motion.div
              initial={{ opacity: 0, x: 400, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 400, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md h-[85vh] md:h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
           {/* Header */}
           <div className="bg-gradient-to-r from-[#1A1F56] to-[#1f2462] px-5 py-4 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-md flex items-center justify-center overflow-hidden bg-white p-1">
                 <Image
                   src="/logo.webp"
                   alt="Saabri Logo"
                   width={28}
                   height={28}
                   className="object-contain"
                 />
               </div>
               <h1 className="text-base md:text-lg font-semibold text-white">
                 Saabri GPT
               </h1>
             </div>
             <button
               onClick={handleClose}
               className="text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
             >
               <X size={20} />
             </button>
           </div>

        {/* Chat Area */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto p-5 space-y-5 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"
                } items-start gap-3`}
            >
              {msg.sender === "bot" && (
                <div className="w-8 h-8 flex-shrink-0 rounded-full overflow-hidden">
                  <Image
                    src="/logo.webp"
                    alt="Bot Avatar"
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                </div>
              )}

              <div className={`flex flex-col gap-3 max-w-[75%] md:max-w-[70%]`}>
                <div
                  className={`px-4 py-3 rounded-lg text-sm md:text-base whitespace-pre-line shadow-sm leading-relaxed ${msg.sender === "bot"
                    ? "bg-white text-gray-800 border border-gray-200"
                    : "bg-[#1A1F56] text-white"
                    }`}
                >
                  {msg.text}
                </div>

                {/* Option Buttons */}
                {msg.options && msg.sender === "bot" && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {msg.options.map((option, index) => (
                      <motion.button
                        key={index}
                        onClick={() => handleOptionClick(option)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-2 text-xs md:text-sm bg-[#1A1F56] hover:bg-[#1f2462] text-white rounded-full border border-[#1A1F56] transition-all duration-200 shadow-sm"
                      >
                        {option}
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Property Cards */}
                {msg.properties && msg.properties.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 mt-3">
                    {msg.properties.map((property: Property, index: number) => {
                      // Use id if available, otherwise use propertyId
                      const propertyId = property.id || property.propertyId;
                      // Build URL with bedroom count if captured - use saabri's routing
                      const propertyUrl = capturedBedroomCount !== undefined
                        ? `/projects/${propertyId}?bedrooms=${capturedBedroomCount}`
                        : `/projects/${propertyId}`;

                      return (
                        <motion.a
                          key={property.id || property.propertyId || index}
                          href={propertyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className="bg-white border border-gray-200 rounded-lg p-2.5 hover:border-[#1A1F56] hover:shadow-md hover:shadow-[#1A1F56]/10 transition-all duration-200 cursor-pointer group"
                        >
                          <div className="flex gap-2.5">
                            {/* Property Image */}
                            <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 relative">
                              <Image
                                src={property.images?.[0] || "/logo.webp"}
                                alt={property.title}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/logo.webp";
                                }}
                              />
                              {/* External Link Indicator */}
                              <div className="absolute inset-0 bg-[#1A1F56]/0 group-hover:bg-[#1A1F56]/60 transition-all duration-200 flex items-center justify-center">
                                <svg
                                  className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </div>
                            </div>

                            {/* Property Details */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-gray-800 font-semibold text-xs leading-tight truncate mb-0.5 group-hover:text-[#1A1F56] transition-colors duration-200">
                                {property.title}
                              </h4>
                              <p className="text-[#1A1F56] font-bold text-xs">
                                AED {formatPrice(property.price)}
                              </p>
                            </div>
                          </div>
                        </motion.a>
                      );
                    })}
                  </div>
                )}

                {/* Typing Indicator */}
                {msg.isTyping && (
                  <div className="flex items-center gap-1 text-gray-600 text-sm">
                    <div className="flex gap-1">
                      <motion.div
                        className="w-2 h-2 bg-[#1A1F56] rounded-full"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-[#1A1F56] rounded-full"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-[#1A1F56] rounded-full"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                    <span className="ml-2">Searching properties...</span>
                  </div>
                )}
               </div>
             </div>
           ))}
         </div>

        {/* Input Section */}
        <div className="flex items-center gap-2 p-4 border-t border-gray-200 bg-white">
          <input
            type="text"
            placeholder="Type your message or use the options above..."
            className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm md:text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1A1F56] focus:bg-white transition"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={isSearching}
          />
          <button
            onClick={handleSend}
            disabled={isSearching || !input.trim()}
            className="bg-[#1A1F56] hover:bg-[#1f2462] active:scale-95 transition rounded-lg p-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
         </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );
  };

   return (
     <>
       {FloatingButton}
       <ChatBotContent />
     </>
   );
 }

