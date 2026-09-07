import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export function GlassCard({ children, className, ...props }) {
  return (
    <motion.div
      className={cn(
        "glass-card rounded-[28px] p-6 lg:p-8 bg-[#111317]/80 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300",
        "relative overflow-hidden group shadow-[0_12px_40px_rgba(0,0,0,0.4)]",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      {children}
    </motion.div>
  );
}
