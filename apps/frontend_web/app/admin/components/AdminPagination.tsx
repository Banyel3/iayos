"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
}

export default function AdminPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 15,
  itemLabel = "items",
  onPageChange,
}: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  const showingCount =
    totalItems != null && totalItems > 0
      ? Math.min(itemsPerPage, totalItems - (currentPage - 1) * itemsPerPage)
      : null;

  // Build page number list with ellipsis
  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const btnBase =
    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-150 select-none";
  const btnActive =
    "bg-blue-400 text-white shadow-sm";
  const btnInactive =
    "bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-500";
  const btnDisabled =
    "bg-white text-gray-300 border border-gray-100 cursor-not-allowed";

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Showing X of Y */}
      {showingCount != null && totalItems != null && totalItems > 0 && (
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-700">{showingCount}</span>{" "}
          of <span className="font-semibold text-gray-700">{totalItems}</span>{" "}
          {itemLabel}
        </p>
      )}

      {/* Page buttons */}
      <div className="flex items-center gap-2">
        {/* Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnInactive}`}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {pageNumbers.map((p, idx) =>
          p === "..." ? (
            <span key={`ellipsis-${idx}`} className="w-10 h-10 flex items-center justify-center text-gray-400 text-sm">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`${btnBase} ${p === currentPage ? btnActive : btnInactive}`}
              aria-label={`Page ${p}`}
              aria-current={p === currentPage ? "page" : undefined}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`${btnBase} ${currentPage === totalPages ? btnDisabled : btnInactive}`}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
