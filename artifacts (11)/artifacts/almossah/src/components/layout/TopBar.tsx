import { Phone, Mail, MapPin } from "lucide-react";
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaLinkedin } from "react-icons/fa";

export function TopBar() {
  return (
    <div className="bg-primary text-primary-foreground py-2 text-sm hidden md:block">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Phone size={14} className="ml-1" />
            <span dir="ltr">+967 123 456 789</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail size={14} className="ml-1" />
            <span>info@almossah.org</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="ml-1" />
            <span>صنعاء، اليمن</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-accent transition-colors"><FaFacebook /></a>
          <a href="#" className="hover:text-accent transition-colors"><FaTwitter /></a>
          <a href="#" className="hover:text-accent transition-colors"><FaInstagram /></a>
          <a href="#" className="hover:text-accent transition-colors"><FaYoutube /></a>
          <a href="#" className="hover:text-accent transition-colors"><FaLinkedin /></a>
        </div>
      </div>
    </div>
  );
}