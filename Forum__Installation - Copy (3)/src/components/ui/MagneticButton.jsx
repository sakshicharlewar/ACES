import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { cn } from "../../lib/utils";

export function MagneticButton({ children, className, ...props }) {
  return (
    <button
      className={cn(
        "relative px-8 py-3.5 rounded-full font-sans text-sm font-semibold tracking-wide bg-white text-black hover:bg-neutral-200 transition-all duration-300 shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.22)] active:scale-95 cursor-pointer",
        "flex items-center justify-center gap-2 overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
