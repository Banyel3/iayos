'use client';

import { Filter, X } from 'lucide-react';
import { useState } from 'react';

interface AgencyFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  city: string;
  province: string;
  minRating: number | null;
  sortBy: 'rating' | 'jobs' | 'created';
}

const PHILIPPINE_CITIES = [
  'Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig', 'Caloocan', 
  'Cebu City', 'Davao City', 'Cagayan de Oro', 'Zamboanga City'
];

const PHILIPPINE_PROVINCES = [
  'Metro Manila', 'Cebu', 'Davao del Sur', 'Laguna', 'Cavite', 
  'Bulacan', 'Rizal', 'Pampanga', 'Batangas', 'Pangasinan'
];

export default function AgencyFilters({ onFilterChange }: AgencyFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    city: '',
    province: '',
    minRating: null,
    sortBy: 'rating'
  });

  const [showFilters, setShowFilters] = useState(true);

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters: FilterState = {
      city: '',
      province: '',
      minRating: null,
      sortBy: 'rating'
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const hasActiveFilters = filters.city || filters.province || filters.minRating !== null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-sm text-blue-600 hover:text-blue-800 lg:hidden"
        >
          {showFilters ? 'Hide' : 'Show'}
        </button>
      </div>

      {showFilters && (
        <div className="space-y-6">
          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="rating">Highest Rating</option>
              <option value="jobs">Most Jobs Completed</option>
              <option value="created">Newest First</option>
            </select>
          </div>

          {/* Minimum Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Rating
            </label>
            <select
              value={filters.minRating || ''}
              onChange={(e) => updateFilter('minRating', e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Any Rating</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.0">4.0+ Stars</option>
              <option value="3.5">3.5+ Stars</option>
              <option value="3.0">3.0+ Stars</option>
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <select
              value={filters.city}
              onChange={(e) => updateFilter('city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Cities</option>
              {PHILIPPINE_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Province */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Province
            </label>
            <select
              value={filters.province}
              onChange={(e) => updateFilter('province', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Provinces</option>
              {PHILIPPINE_PROVINCES.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
