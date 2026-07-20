import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export function GlassCard({ children, className, ...props }) {
  return (
    <motion.div
      className={cn(
        "glass rounded-[28px] p-6 lg:p-8 bg-card/40 hover:bg-card/60 transition-colors duration-500",
        "relative overflow-hidden group shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      {children}
    </motion.div>
  );
}
