import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { cn } from "../../lib/utils";

export function MagneticButton({ children, className, ...props }) {
  return (
    <button
      className={cn(
        "relative px-8 py-3 rounded-full font-button text-sm tracking-wide bg-white text-black hover:bg-gray-200 transition-colors",
        "flex items-center justify-center gap-2 overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
