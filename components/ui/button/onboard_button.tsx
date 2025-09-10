import { Button } from "@/components/ui/generic_button";
import { link } from "fs";
import Link from "next/link";
import "./button.css";

type ButtonProps = {
  label: string;
  variant?: "primary" | "secondary" | "black";
  link: string;
  role?: string;
};

export function ButtonComp({ label, variant, link }: ButtonProps) {
  const isPrimary = variant === "primary";
  const isBlack = variant === "black";

  return (
    <div className="w-full">
      <Link href={link} className="w-full">
        <Button
          className={`w-full rounded-2xl ${
            isPrimary
              ? "text-white"
              : "bg-gray-100 hover:bg-gray-300 border border-solid border-black text-black"
          }
          ${
            isBlack
              ? "text-white bg-black"
              : "bg-gray-100 hover:bg-gray-300 border border-solid border-black text-black"
          }
          `}
          style={isPrimary ? { background: "var(--primary-gradient)" } : {}}
          size="lg"
        >
          {label}
        </Button>
      </Link>
    </div>
  );
}
