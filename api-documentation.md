# API cURL Examples for POST /api/projects

## Basic Request (No Filters)
```bash
curl -X POST https://tm-backend-qfaf.onrender.com/api/projects \
  -H "Content-Type: application/json" \
  -d '{}'
```

## With Pagination Only
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=20" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Comprehensive Example with All Filters

### Full Featured Request
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=20" \
  -H "Content-Type: application/json" \
  -d '{
    "brokerage_id": "brokerage-uuid-here",
    "developer_id": "developer-uuid-here",
    "city": ["Dubai", "Abu Dhabi"],
    "category": ["Residential", "Commercial"],
    "type": ["Apartment", "Villa"],
    "source_type": ["Primary", "Secondary"],
    "furnished": ["Furnished", "Semi-Furnished"],
    "payment_plan": ["Cash", "Installment"],
    "min_price": 500000,
    "max_price": 5000000,
    "price_range": {
      "min": 500000,
      "max": 5000000
    },
    "min_sq_ft": 1000,
    "max_sq_ft": 5000,
    "sq_ft_range": {
      "min": 1000,
      "max": 5000
    },
    "property_size": 2000,
    "property_size_range": {
      "min": 1500,
      "max": 3000
    },
    "min_bedrooms": ["2", "3", "4"],
    "max_bedrooms": ["3", "4", "5"],
    "min_bathrooms": ["2", "3"],
    "max_bathrooms": ["3", "4"],
    "handover_year": [2024, 2025, 2026],
    "handover_year_range": {
      "min": 2024,
      "max": 2026
    },
    "amenities": ["Swimming Pool", "Gym", "Parking"],
    "unit_types": ["Studio", "1BR", "2BR"],
    "locality": "Downtown",
    "latitude": 25.2048,
    "longitude": 55.2708,
    "radius": 10,
    "search": "luxury apartment",
    "created_after": "2024-01-01T00:00:00Z",
    "created_before": "2024-12-31T23:59:59Z",
    "updated_after": "2024-01-01T00:00:00Z",
    "updated_before": "2024-12-31T23:59:59Z",
    "sort_by": "created_at",
    "sort_order": "desc",
    "prioritize_brokerage_id": "brokerage-uuid-here",
    "include_developer": true,
    "include_brokerage": true,
    "include_floor_plans": true
  }'
```

## Individual Filter Examples

### 1. Filter by City (Single)
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=20" \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Dubai"
  }'
```

### 2. Filter by Multiple Cities
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=20" \
  -H "Content-Type: application/json" \
  -d '{
    "city": ["Dubai", "Abu Dhabi", "Sharjah"]
  }'
```

### 3. Price Range Filter
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=20" \
  -H "Content-Type: application/json" \
  -d '{
    "min_price": 1000000,
    "max_price": 5000000
  }'
```

### 4. Price Range (Alternative Format)
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=20" \
  -H "Content-Type: application/json" \
  -d '{
    "price_range": {
      "min": 1000000,
      "max": 5000000
    }
  }'
```

### 5. Square Footage Filter
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=20" \
  -H "Content-Type: application/json" \
  -d '{
    "min_sq_ft": 1500,
    "max_sq_ft": 3000
  }'
```

### 6. Bedrooms and Bathrooms
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=20" \
  -H "Content-Type: application/json" \
  -d '{
    "min_bedrooms": ["2", "3"],
    "min_bathrooms": ["2"]
  }'
```

### 7. Handover Year
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=20" \
  -H "Content-Type: application/json" \
  -d '{
    "handover_year": [2024, 2025]
  }'
```

### 8. Handover Year Range
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=20" \
  -H "Content-Type: application/json" \
  -d '{
    "handover_year_range": {
      "min": 2024,
      "max": 2026
    }
  }'
```

### 9. Amenities Filter
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=20" \
  -H "Content-Type: application/json" \
  -d '{
    "amenities": ["Swimming Pool", "Gym", "Parking", "Security"]
  }'
```

### 10. Text Search
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=20" \
  -H "Content-Type: application/json" \
  -d '{
    "search": "luxury apartment downtown"
  }'
```

### 11. Location-Based Search (Latitude/Longitude with Radius)
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=20" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 25.2048,
    "longitude": 55.2708,
    "radius": 5
  }'
```

### 12. Locality Search
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=20" \
  -H "Content-Type: application/json" \
  -d '{
    "locality": "Downtown Dubai"
  }'
```

### 13. Date Filters
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=20" \
  -H "Content-Type: application/json" \
  -d '{
    "created_after": "2024-01-01T00:00:00Z",
    "created_before": "2024-12-31T23:59:59Z"
  }'
```

### 14. Sorting
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=20" \
  -H "Content-Type: application/json" \
  -d '{
    "sort_by": "min_price",
    "sort_order": "asc"
  }'
```

### 15. Priority Sorting (Prioritize Specific Brokerage)
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=20" \
  -H "Content-Type: application/json" \
  -d '{
    "prioritize_brokerage_id": "brokerage-uuid-here",
    "sort_by": "created_at",
    "sort_order": "desc"
  }'
```

### 16. Include Relations
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=20" \
  -H "Content-Type: application/json" \
  -d '{
    "include_developer": true,
    "include_brokerage": true,
    "include_floor_plans": true
  }'
```

### 17. Category and Type Filters
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=20" \
  -H "Content-Type: application/json" \
  -d '{
    "category": ["Residential"],
    "type": ["Apartment", "Villa", "Townhouse"]
  }'
```

### 18. Furnished and Payment Plan
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=20" \
  -H "Content-Type: application/json" \
  -d '{
    "furnished": ["Furnished"],
    "payment_plan": ["Cash", "Installment"]
  }'
```

### 19. Brokerage ID Filter
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=20" \
  -H "Content-Type: application/json" \
  -d '{
    "brokerage_id": "brokerage-uuid-here"
  }'
```

### 20. Developer ID Filter
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=20" \
  -H "Content-Type: application/json" \
  -d '{
    "developer_id": "developer-uuid-here"
  }'
```

## Pagination Examples

### Page 1, 10 items per page
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=10" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Page 2, 50 items per page (max limit is 100)
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=2&limit=50" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Maximum pagination (100 items per page)
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=100" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Combined Examples

### Search with Filters + Pagination + Sorting
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=25" \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Dubai",
    "min_price": 1000000,
    "max_price": 3000000,
    "min_bedrooms": ["2", "3"],
    "sort_by": "min_price",
    "sort_order": "asc",
    "include_developer": true
  }'
```

### Location Search with Radius + Pagination
```bash
curl -X POST "https://tm-backend-qfaf.onrender.com/api/projects?page=1&limit=20" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 25.2048,
    "longitude": 55.2708,
    "radius": 10,
    "min_price": 500000,
    "max_price": 2000000,
    "sort_by": "created_at",
    "sort_order": "desc"
  }'
```

## Notes

- **Base URL**: `https://tm-backend-qfaf.onrender.com/api/projects` (adjust port if different)
- **Method**: POST
- **Pagination**: Uses query parameters `?page=1&limit=20`
  - `page`: Must be >= 1
  - `limit`: Must be between 1 and 100 (default: 20)
- **Filters**: All filters go in the request body (JSON)
- **Sort Options**: 
  - `sort_by`: `created_at`, `updated_at`, `min_price`, `max_price`, `handover_year`, `views`
  - `sort_order`: `asc` or `desc` (default: `desc`)
- **Date Format**: ISO 8601 format (e.g., `2024-01-01T00:00:00Z`)

## Response Format

```json
{
  "success": true,
  "message": "Projects fetched successfully",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

