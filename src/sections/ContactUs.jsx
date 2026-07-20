import { motion } from "framer-motion";
import { MapPin, Phone, Mail, ChevronRight, Code } from "lucide-react";

export function ContactUs() {
  const currentYear = 2026;

  const scrollToSection = (e, id) => {
    e.preventDefault();
    // Assuming sections have ids that match lowercase names (e.g., id="home", id="about")
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Fallback: simply scroll to top if "home", else just let anchor work
      if(id === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="pt-20 pb-8 px-6 md:px-12 lg:px-24 border-t border-white/10 relative z-10" id="contact">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h2 className="font-sans text-3xl md:text-4xl font-bold text-white">Contact Us</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          
          {/* Column 1 - ACES */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-6"
          >
            <h3 className="font-sans text-2xl font-bold text-white tracking-wide">ACES</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-text-secondary hover:text-white transition-colors">
                <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <p className="font-cambria text-sm leading-relaxed">Suryodaya College of Engineering & Technology,<br/> Nagpur, Maharashtra, India</p>
              </div>
              <div className="flex items-center gap-3 text-text-secondary hover:text-white transition-colors">
                <Mail className="w-5 h-5 text-accent shrink-0" />
                <a href="mailto:acescomputer0101@gmail.com" className="text-sm">acescomputer0101@gmail.com</a>
              </div>
            </div>
          </motion.div>

          {/* Column 2 - Developers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-6"
          >
            <div className="space-y-6 flex flex-col items-start pt-2">
              <div>
                <h4 className="font-sans text-base text-white mb-1">Yatharth Donarkar</h4>
                <a href="tel:+918999045885" className="text-text-secondary text-sm flex items-center gap-2 hover:text-white transition-colors"><Phone className="w-3.5 h-3.5"/> +91 8999045885</a>
              </div>
              <div>
                <h4 className="font-sans text-base text-white mb-1">Sakshi Charlewar</h4>
                <a href="tel:+918087436159" className="text-text-secondary text-sm flex items-center gap-2 hover:text-white transition-colors"><Phone className="w-3.5 h-3.5"/> +91 8087436159</a>
              </div>
              <div>
                <h4 className="font-sans text-base text-white mb-1">Soham Runghe</h4>
                <a href="tel:+919545382135" className="text-text-secondary text-sm flex items-center gap-2 hover:text-white transition-colors"><Phone className="w-3.5 h-3.5"/> +91 95453 82135</a>
              </div>
              <div>
                <h4 className="font-sans text-base text-white mb-1">Aakansha Adhau</h4>
                <a href="tel:+919527908347" className="text-text-secondary text-sm flex items-center gap-2 hover:text-white transition-colors"><Phone className="w-3.5 h-3.5"/> +91 95279 08347</a>
              </div>
            </div>
          </motion.div>

          {/* Column 3 - Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col gap-6"
          >
            <h3 className="font-sans text-lg font-medium text-white tracking-wide">Quick Links</h3>
            <ul className="space-y-3">
              {['Home', 'About', 'Events', 'Gallery', 'Committee', 'Contact'].map((item) => (
                <li key={item}>
                  <a 
                    href={`#${item.toLowerCase()}`}
                    onClick={(e) => scrollToSection(e, item.toLowerCase())}
                    className="text-text-secondary hover:text-accent transition-colors text-sm flex items-center gap-2 group"
                  >
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all duration-300"/>
                    <span className="transform transition-transform duration-300">{item}</span>
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

        </div>

        {/* Bottom Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="py-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left"
        >
          <p className="font-cambria text-[14px] font-medium text-white/65">
            © {currentYear} ACES – Association of Computer Engineering Students. All Rights Reserved.
          </p>
          <p className="text-[14px] text-white font-bold flex items-center gap-1.5 justify-center md:justify-end">
            <Code className="w-4 h-4 text-accent" />
            Developed by CODEFury
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
