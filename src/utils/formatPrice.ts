/**
 * Format price to a readable format
 * Examples:
 * - 7,800,000 → 7.8M
 * - 750,000 → 750K
 * - 1,250,000 → 1.25M
 * - 50,000 → 50K
 */
export function formatPrice(price: number): string {
    if (price >= 1000000) {
        // Format as millions
        const millions = price / 1000000;
        // Remove trailing zeros
        return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(2).replace(/\.?0+$/, '')}M`;
    } else if (price >= 1000) {
        // Format as thousands
        const thousands = price / 1000;
        // Remove trailing zeros
        return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(0)}K`;
    } else {
        // Less than 1000, show as is
        return price.toLocaleString();
    }
}

