"use client";

import { useState } from "react";
import { Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/generic_button";
import type { PortfolioItemData } from "@/lib/api/worker-profile";

interface PortfolioGridProps {
  items: PortfolioItemData[];
  onImageClick: (index: number) => void;
  onDelete: (id: number) => void;
  onReorder?: (items: PortfolioItemData[]) => void;
}

export function PortfolioGrid({
  items,
  onImageClick,
  onDelete,
  onReorder,
}: PortfolioGridProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setHoveredIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setHoveredIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex || !onReorder) {
      return;
    }

    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];

    // Remove from old position
    newItems.splice(draggedIndex, 1);
    // Insert at new position
    newItems.splice(dropIndex, 0, draggedItem);

    onReorder(newItems);
    setDraggedIndex(null);
    setHoveredIndex(null);
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item, index) => (
        <div
          key={item.portfolioID}
          draggable={!!onReorder}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          onDrop={(e) => handleDrop(e, index)}
          className={`relative group rounded-lg overflow-hidden bg-gray-100 aspect-square cursor-pointer transition-all ${
            draggedIndex === index ? "opacity-50 scale-95" : ""
          } ${
            hoveredIndex === index && draggedIndex !== null
              ? "ring-2 ring-primary"
              : ""
          }`}
        >
          {/* Drag Handle */}
          {onReorder && (
            <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-white rounded p-1 shadow-md cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-gray-600" />
              </div>
            </div>
          )}

          {/* Image */}
          <img
            src={item.image_url}
            alt={item.caption || "Portfolio image"}
            className="w-full h-full object-cover"
            onClick={() => onImageClick(index)}
          />

          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.portfolioID);
              }}
              className="shadow-lg"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Caption Preview */}
          {item.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
              <p className="text-white text-sm line-clamp-2">{item.caption}</p>
            </div>
          )}

          {/* Display Order Badge */}
          <div className="absolute top-2 right-2 bg-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium text-gray-700 shadow-md">
            {index + 1}
          </div>
        </div>
      ))}
    </div>
  );
}
