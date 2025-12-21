"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart } from "recharts";

interface ROIProps {
    roi?: {
        firstYear: number;
        thirdYear: number;
        fifthYear: number;
    };
}

export default function ROICalculator({ roi }: ROIProps) {
    const [activeTab, setActiveTab] = useState<"1year" | "3year" | "5year">("1year");
    const [chartData, setChartData] = useState<Array<{ period: string; roi: number }>>([]);

    // Calculate average appreciation per year
    const calculateAppreciation = (): number => {
        if (!roi) return 12;
        // Calculate average annual appreciation from 1st to 5th year
        const totalAppreciation = roi.fifthYear - roi.firstYear;
        return totalAppreciation / 4; // 4 years from 1st to 5th
    };

    // Calculate break even year (simplified: when ROI reaches a threshold)
    const calculateBreakEven = (): string => {
        if (!roi) return "4 Year";
        // Estimate break even based on ROI progression
        if (roi.firstYear >= 10) return "3 Year";
        if (roi.thirdYear >= 15) return "4 Year";
        return "5 Year";
    };

    // Estimate average rent (simplified calculation)
    const estimateRent = (): string => {
        if (!roi) return "AED 5,000";
        // Rough estimate based on ROI (higher ROI areas typically have higher rent)
        const baseRent = 3000;
        const multiplier = roi.firstYear / 10; // Scale based on ROI
        const estimatedRent = Math.round(baseRent * (1 + multiplier));
        return `AED ${estimatedRent.toLocaleString()}`;
    };

    useEffect(() => {
        if (!roi) {
            // Fallback data - start at 0, then show three year points
            setChartData([
                { period: "0", roi: 0 },
                { period: "1st Year", roi: 15 },
                { period: "3rd Year", roi: 20 },
                { period: "5th Year", roi: 25 }
            ]);
            return;
        }

        // Start at origin (0), then show three points: 1st Year, 3rd Year, 5th Year
        setChartData([
            { period: "0", roi: 0 },
            { period: "1st Year", roi: roi.firstYear },
            { period: "3rd Year", roi: roi.thirdYear },
            { period: "5th Year", roi: roi.fifthYear }
        ]);
    }, [roi]);

    if (!roi) {
        return (
            <div className="w-full bg-white py-16 px-4 sm:px-6 lg:px-12 rounded-lg shadow-lg">
                <div className="max-w-7xl mx-auto">
                    <p className="text-gray-500 text-center">ROI Calculator data not available for this property</p>
                </div>
            </div>
        );
    }

    const currentROI = activeTab === "1year" ? roi.firstYear : activeTab === "3year" ? roi.thirdYear : roi.fifthYear;
    const appreciation = calculateAppreciation();
    const breakEven = calculateBreakEven();
    const avgRent = estimateRent();

    return (
        <div className="w-full bg-white py-12 md:py-16 px-4 sm:px-6 lg:px-12 rounded-lg shadow-lg">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Left Section: ROI Calculator */}
                <div className="flex flex-col">
                    {/* Tabs */}
                    <div className="flex space-x-3 mb-6">
                        <button
                            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                                activeTab === "1year"
                                    ? "bg-black text-white shadow-md"
                                    : "bg-white text-gray-600 border border-gray-300 hover:border-gray-400"
                            }`}
                            onClick={() => setActiveTab("1year")}
                        >
                            1 Year
                        </button>
                        <button
                            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                                activeTab === "3year"
                                    ? "bg-black text-white shadow-md"
                                    : "bg-white text-gray-600 border border-gray-300 hover:border-gray-400"
                            }`}
                            onClick={() => setActiveTab("3year")}
                        >
                            3 Years
                        </button>
                        <button
                            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                                activeTab === "5year"
                                    ? "bg-black text-white shadow-md"
                                    : "bg-white text-gray-600 border border-gray-300 hover:border-gray-400"
                            }`}
                            onClick={() => setActiveTab("5year")}
                        >
                            5 Years
                        </button>
                    </div>

                    {/* Average Returns Card */}
                    <div className="mb-6 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <p className="text-base text-gray-600 mb-2 font-medium">Average Returns</p>
                        <p className="font-bold text-5xl" style={{ color: '#009829' }}>
                            {currentROI.toFixed(1)}%
                        </p>
                    </div>

                    {/* Graph */}
                    <div className="h-72 md:h-80 w-full bg-white p-4 md:p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={chartData}
                                margin={{
                                    top: 15,
                                    right: 20,
                                    left: 10,
                                    bottom: 15,
                                }}
                            >
                                <defs>
                                    <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#009829" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#009829" stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="period"
                                    stroke="#6b7280"
                                    tick={{ fill: '#374151', fontSize: 13, fontWeight: 500 }}
                                    axisLine={{ stroke: '#d1d5db' }}
                                    tickLine={{ stroke: '#d1d5db' }}
                                    allowDuplicatedCategory={false}
                                    tickFormatter={(value) => value === "0" ? "" : value}
                                />
                                <YAxis
                                    tickFormatter={(tick) => `${tick}%`}
                                    stroke="#6b7280"
                                    domain={[0, 'auto']}
                                    tick={{ fill: '#374151', fontSize: 13, fontWeight: 500 }}
                                    axisLine={{ stroke: '#d1d5db' }}
                                    tickLine={{ stroke: '#d1d5db' }}
                                    allowDecimals={true}
                                />
                                <Area
                                    type="linear"
                                    dataKey="roi"
                                    stroke="#009829"
                                    strokeWidth={3}
                                    fill="url(#colorRoi)"
                                    dot={{ stroke: '#009829', strokeWidth: 3, r: 5, fill: '#009829' }}
                                    activeDot={{ r: 7, stroke: '#009829', strokeWidth: 3, fill: '#fff' }}
                                    connectNulls={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                 
                </div>

                {/* Right Section: Future Prospects */}
                <div className="rounded-xl p-6 md:p-8 lg:p-10 flex flex-col justify-center shadow-lg" style={{ border: '2px solid #009829', backgroundColor: '#f9fafb' }}>
                    <h3 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: '#009829' }}>
                        Future Prospects of the Property
                    </h3>
                    <ul className="space-y-5 text-base md:text-lg text-gray-800">
                        <li className="flex items-start">
                            <span className="mr-3 mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-green-600"></span>
                            <div>
                                <strong className="font-semibold text-gray-900">Prime Connectivity:</strong> Direct access to a 7-lane highway ensuring faster commute and seamless city-wide connectivity.
                            </div>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-3 mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-green-600"></span>
                            <div>
                                <strong className="font-semibold text-gray-900">Global Neighbourhood:</strong> Surrounded by leading international investor firms, creating a premium business ecosystem.
                            </div>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-3 mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-green-600"></span>
                            <div>
                                <strong className="font-semibold text-gray-900">Future-Ready Investment:</strong> Strategic location designed to attract multinational businesses and premium clientele.
                            </div>
                        </li>
                    </ul>
                </div>

                   {/* Bottom Cards */}
                   <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Avg Break Even</p>
                            <p className="text-2xl font-bold text-gray-900">{breakEven}</p>
                        </div>
                        <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Avg Rent</p>
                            <p className="text-2xl font-bold text-gray-900">{avgRent}</p>
                        </div>
                    </div>

                    {/* Expected Area Appreciation */}
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Expected Area Appreciation per Year</p>
                        <p className="text-2xl font-bold" style={{ color: '#009829' }}>
                            {appreciation.toFixed(1)}%
                        </p>
                    </div>
            </div>
        </div>
    );
}
