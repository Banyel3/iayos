import { useEffect, useRef, useState } from "react";

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minSwipeDistance?: number;
  maxVerticalDistance?: number;
  animationDuration?: number;
}

export const useSwipeGesture = ({
  onSwipeRight,
  minSwipeDistance = 50,
  maxVerticalDistance = 100,
  animationDuration = 300,
}: SwipeGestureOptions) => {
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [translateX, setTranslateX] = useState(0);

  const handleTouchStart = (event: TouchEvent) => {
    if (isTransitioning) return;
    touchStartX.current = event.touches[0].clientX;
    touchStartY.current = event.touches[0].clientY;
    setTranslateX(0);
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (isTransitioning) return;
    touchEndX.current = event.touches[0].clientX;
    touchEndY.current = event.touches[0].clientY;

    const horizontalDistance = touchEndX.current - touchStartX.current;
    const verticalDistance = Math.abs(touchEndY.current - touchStartY.current);

    // Only apply visual feedback for primarily horizontal swipes
    if (Math.abs(horizontalDistance) > verticalDistance) {
      // Dampen the movement for a smoother feel
      const dampedDistance = horizontalDistance * 0.3;
      setTranslateX(Math.max(-50, Math.min(50, dampedDistance)));
    }
  };

  const handleTouchEnd = () => {
    if (isTransitioning) return;

    const horizontalDistance = touchEndX.current - touchStartX.current;
    const verticalDistance = Math.abs(touchEndY.current - touchStartY.current);

    // Reset visual feedback
    setTranslateX(0);

    // Check if the swipe is primarily horizontal and meets minimum distance
    if (
      Math.abs(horizontalDistance) > minSwipeDistance &&
      verticalDistance < maxVerticalDistance
    ) {
      setIsTransitioning(true);

      // Add a small delay for smooth transition feeling
      setTimeout(() => {
        if (horizontalDistance > 0) {
          // Swipe right (left to right)
          onSwipeRight?.();
        } else {
          // Swipe left (right to left)
        }

        // Reset transition state after animation
        setTimeout(() => {
          setIsTransitioning(false);
        }, animationDuration);
      }, 50);
    }
  };

  useEffect(() => {
    const element = document;

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: true });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    onSwipeRight,
    minSwipeDistance,
    maxVerticalDistance,
    isTransitioning,
    handleTouchEnd,
    handleTouchMove,
    handleTouchStart,
  ]);

  return {
    translateX,
    isTransitioning,
  };
};
