import { motion } from "framer-motion";

export function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-background pt-20 pb-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.05),transparent_50%)] pointer-events-none" />
      
      <div className="container mx-auto px-6 md:px-12 lg:px-24 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-12 mb-20 text-center md:text-left">
          
          <div className="max-w-xs">
            <h3 className="font-serif italic text-4xl text-white mb-4">ACES</h3>
            <p className="font-cambria text-text-secondary text-sm leading-relaxed">
              Association of Computer Engineering Students. Building the next generation of technologists.
            </p>
          </div>

          <div className="flex gap-12 md:gap-24">
            <div className="flex flex-col gap-4">
              <h4 className="font-sans text-white font-medium mb-2">Quick Links</h4>
              {['Home', 'About', 'Department', 'Committee'].map(link => (
                <a key={link} href="#" className="text-text-secondary hover:text-accent transition-colors text-sm font-light">
                  {link}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="font-sans text-white font-medium mb-2">Resources</h4>
              {['Events', 'Achievements', 'Contact'].map(link => (
                <a key={link} href="#" className="text-text-secondary hover:text-accent transition-colors text-sm font-light">
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-label tracking-widest text-text-secondary">
          <p className="font-cambria">© {new Date().getFullYear()} ACES SCET. All rights reserved.</p>
          <p className="font-cambria flex items-center gap-1">
            Developed by <span className="text-white hover:text-accent transition-colors cursor-pointer ml-1">CODEFury</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
