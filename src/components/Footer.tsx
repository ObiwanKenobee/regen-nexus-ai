import { Linkedin, Mail, Globe } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">RDX Platform</h3>
              <p className="text-background/80 leading-relaxed mb-4">
                Regenerative Development Exchange: Building cooperative intelligence systems 
                that align economies, ecologies, and education for sustainable transformation.
              </p>
              <div className="flex gap-4">
                <a 
                  href="#" 
                  className="w-10 h-10 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
                  aria-label="Email"
                >
                  <Mail className="h-5 w-5" />
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
                  aria-label="Website"
                >
                  <Globe className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-background/80">
                <li><a href="#" className="hover:text-background transition-colors">RVX Architecture</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Sovereign Vaults</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Impact Dashboard</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Research Network</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-background/80">
                <li><a href="#" className="hover:text-background transition-colors">Whitepaper</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Academic Papers</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Case Studies</a></li>
                <li><a href="#" className="hover:text-background transition-colors">2070 Vision</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-background/20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-background/70">
              <p>© 2025 Regenerative Development Exchange. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-background transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-background transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-background transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
