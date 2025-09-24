import { Button } from "@/components/ui/generic_button";
import Link from "next/link";
import "./button.css";

type ButtonProps = {
  label: string;
  variant?: "primary" | "secondary" | "black";
  link: string;
  style?: string;
};

export function ButtonComp({ label, variant, link, style }: ButtonProps) {
  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";
  const isBlack = variant === "black";

  return (
    <div className="w-full">
      <Link href={link} className="w-full">
        <Button
          className={`w-full rounded-4xl ${style} ${
            isPrimary ? "text-white bg-blue-300 hover:bg-blue-500" : ""
          } ${isBlack ? "text-white bg-black hover:bg-gray-800" : ""}
          ${
            isSecondary
              ? "text-black bg-white border border-solid border-black hover:bg-gray-200"
              : ""
          }
          `}
          // style={isPrimary ? { background: "var(--primary-gradient)" } : {}}
          size="lg"
        >
          {label}
        </Button>
      </Link>
    </div>
  );
}
