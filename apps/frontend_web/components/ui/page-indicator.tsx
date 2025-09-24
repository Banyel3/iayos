import React from "react";

interface PageIndicatorProps {
  currentPage: number;
  totalPages: number;
}

export const PageIndicator: React.FC<PageIndicatorProps> = ({
  currentPage,
  totalPages,
}) => {
  return (
    <div className="flex justify-center items-center space-x-2 py-6 pb-8">
      {Array.from({ length: totalPages }, (_, index) => (
        <div
          key={index}
          className={`w-2 h-2 rounded-full transition-colors duration-200 ${
            index + 1 === currentPage ? "bg-blue-500" : "bg-gray-300"
          }`}
        />
      ))}
    </div>
  );
};
