import { SVGProps } from "react";

/**
 * Peso sign icon (₱) — drop-in replacement for lucide's PesoSign.
 * Accepts the same className / size props pattern as lucide icons.
 */
export function PesoSign({ className, ...props }: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...props}
        >
            {/* Vertical bar */}
            <line x1="12" y1="3" x2="12" y2="21" />
            {/* Top arc — peso double-stroke top bar */}
            <path d="M7 7h7a4 4 0 0 1 0 8H7" />
            {/* Two horizontal lines through the stem */}
            <line x1="7" y1="11" x2="17" y2="11" />
            <line x1="7" y1="15" x2="17" y2="15" />
        </svg>
    );
}
