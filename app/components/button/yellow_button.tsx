import { Button } from "@/components/ui/button";
import { link } from "fs";
import Link from "next/link";

type ButtonProps = {
  label: string;
  variant?: "primary" | "secondary";
  link: string;
};

export function ButtonComp({ label, variant = "primary", link }: ButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <div className="w-full">
      <Link href={link} className="w-full">
        <Button
          className={`w-full rounded-2xl ${
            isPrimary
              ? "bg-yellow-300 hover:bg-yellow-400 text-black"
              : "bg-gray-100 hover:bg-gray-300 text-black"
          }`}
          size="lg"
        >
          {label}
        </Button>
      </Link>
    </div>
  );
}
