/**
 * Job Categories with Minimum Rates
 * Based on DOLE (Department of Labor and Employment) guidelines
 * and industry standards for skilled labor in the Philippines
 */

export interface JobCategory {
  id: string;
  name: string;
  description: string;
  minimumRate: number; // in PHP per hour
  rateType: "hourly" | "daily" | "fixed";
  skillLevel: "entry" | "intermediate" | "expert";
  averageProjectCost: {
    min: number;
    max: number;
  };
}

/**
 * Minimum wage rates are based on:
 * - DOLE National Capital Region (NCR) minimum wage: ₱610/day (2024)
 * - Skilled labor rates are typically 1.5x to 3x minimum wage
 * - Hourly rates calculated based on 8-hour workday
 */

export const JOB_CATEGORIES: JobCategory[] = [
  {
    id: "plumbing",
    name: "Plumbing",
    description:
      "Pipe installation, repair, leak fixing, and water system maintenance",
    minimumRate: 150, // ₱150/hour (₱1,200/day)
    rateType: "hourly",
    skillLevel: "intermediate",
    averageProjectCost: {
      min: 500,
      max: 5000,
    },
  },
  {
    id: "electrical",
    name: "Electrical",
    description: "Wiring, electrical panel installation, lighting, and repairs",
    minimumRate: 175, // ₱175/hour (₱1,400/day)
    rateType: "hourly",
    skillLevel: "intermediate",
    averageProjectCost: {
      min: 800,
      max: 8000,
    },
  },
  {
    id: "carpentry",
    name: "Carpentry",
    description:
      "Furniture making, cabinet installation, door/window repair, and woodwork",
    minimumRate: 140, // ₱140/hour (₱1,120/day)
    rateType: "hourly",
    skillLevel: "intermediate",
    averageProjectCost: {
      min: 1000,
      max: 15000,
    },
  },
  {
    id: "home-cleaning",
    name: "Home Cleaning",
    description:
      "Residential cleaning, deep cleaning, and housekeeping services",
    minimumRate: 85, // ₱85/hour (₱680/day)
    rateType: "hourly",
    skillLevel: "entry",
    averageProjectCost: {
      min: 300,
      max: 2000,
    },
  },
  {
    id: "hvac",
    name: "HVAC (Heating, Ventilation, Air Conditioning)",
    description:
      "AC installation, repair, maintenance, and ventilation systems",
    minimumRate: 200, // ₱200/hour (₱1,600/day)
    rateType: "hourly",
    skillLevel: "expert",
    averageProjectCost: {
      min: 1500,
      max: 10000,
    },
  },
  {
    id: "painting",
    name: "Painting",
    description:
      "Interior/exterior painting, wall finishing, and surface preparation",
    minimumRate: 120, // ₱120/hour (₱960/day)
    rateType: "hourly",
    skillLevel: "intermediate",
    averageProjectCost: {
      min: 800,
      max: 8000,
    },
  },
  {
    id: "masonry",
    name: "Masonry",
    description: "Brickwork, concrete work, tile installation, and stonework",
    minimumRate: 130, // ₱130/hour (₱1,040/day)
    rateType: "hourly",
    skillLevel: "intermediate",
    averageProjectCost: {
      min: 1500,
      max: 20000,
    },
  },
  {
    id: "welding",
    name: "Welding",
    description: "Metal fabrication, gate repair, structural welding",
    minimumRate: 180, // ₱180/hour (₱1,440/day)
    rateType: "hourly",
    skillLevel: "expert",
    averageProjectCost: {
      min: 1000,
      max: 12000,
    },
  },
];

/**
 * Get category by ID
 */
export function getCategoryById(id: string): JobCategory | undefined {
  return JOB_CATEGORIES.find((cat) => cat.id === id);
}

/**
 * Get category by name
 */
export function getCategoryByName(name: string): JobCategory | undefined {
  return JOB_CATEGORIES.find(
    (cat) => cat.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Get all category names
 */
export function getAllCategoryNames(): string[] {
  return JOB_CATEGORIES.map((cat) => cat.name);
}

/**
 * Validate if a rate meets the minimum for a category
 */
export function validateRate(
  categoryId: string,
  rate: number
): {
  isValid: boolean;
  minimumRate: number;
  message?: string;
} {
  const category = getCategoryById(categoryId);

  if (!category) {
    return {
      isValid: false,
      minimumRate: 0,
      message: "Invalid category",
    };
  }

  const isValid = rate >= category.minimumRate;

  return {
    isValid,
    minimumRate: category.minimumRate,
    message: isValid
      ? undefined
      : `Minimum rate for ${category.name} is ₱${category.minimumRate}/hour`,
  };
}

/**
 * Get recommended rate range for a category
 */
export function getRecommendedRateRange(categoryId: string): {
  min: number;
  max: number;
  average: number;
} | null {
  const category = getCategoryById(categoryId);

  if (!category) return null;

  return {
    min: category.minimumRate,
    max: category.minimumRate * 2.5, // Experienced workers can charge up to 2.5x
    average: category.minimumRate * 1.5,
  };
}

/**
 * DOLE Minimum Wage Reference (NCR - 2024)
 * - Non-Agriculture: ₱610/day
 * - Agriculture: ₱573/day
 * - Retail/Service (≤10 employees): ₱560/day
 *
 * Skilled labor rates are calculated as multiples of minimum wage:
 * - Entry level: 1.1x - 1.3x minimum wage
 * - Intermediate: 1.5x - 2x minimum wage
 * - Expert: 2x - 3x minimum wage
 */
