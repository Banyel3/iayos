import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styling - optimized for mobile
        "flex h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-inter",
        "placeholder:text-gray-400 text-gray-900",
        "transition-all duration-200 ease-in-out",
        "shadow-sm",

        // Focus styling with soft blue glow
        "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
        "focus:shadow-lg focus:shadow-blue-500/10",

        // Error styling
        "aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/20",
        "aria-invalid:focus:border-red-500 aria-invalid:focus:ring-red-500/20",

        // Disabled styling
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50",

        // File input styling
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-700",

        className
      )}
      {...props}
    />
  );
}

export { Input };
