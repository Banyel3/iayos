"use client";

import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";

interface AgencySearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function AgencySearchBar({
  onSearch,
  placeholder = "Search agencies by name or description...",
}: AgencySearchBarProps) {
  const [query, setQuery] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2 || query.length === 0) {
        onSearch(query);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <div className="relative">
      <div className="flex items-center">
        <Search className="absolute left-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      {query.length > 0 && query.length < 2 && (
        <p className="text-xs text-gray-500 mt-1">
          Type at least 2 characters to search
        </p>
      )}
    </div>
  );
}
