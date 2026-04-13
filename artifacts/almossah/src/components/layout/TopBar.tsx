import { Phone, Mail, MapPin } from "lucide-react";
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaLinkedin } from "react-icons/fa";
import { useGetContactInfo } from "@workspace/api-client-react";

export function TopBar() {
  const { data: contact } = useGetContactInfo();

  return (
    <div className="bg-primary text-primary-foreground py-2 text-sm hidden md:block">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Phone size={14} className="ml-1" />
            <span dir="ltr">{contact?.phone1 || "+967 123 456 789"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail size={14} className="ml-1" />
            <span>{contact?.email1 || "info@almossah.org"}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="ml-1" />
            <span>{contact?.address || "صنعاء، اليمن"}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a href={contact?.facebookUrl || "#"} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors"><FaFacebook /></a>
          <a href={contact?.twitterUrl || "#"} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors"><FaTwitter /></a>
          <a href={contact?.instagramUrl || "#"} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors"><FaInstagram /></a>
          <a href={contact?.youtubeUrl || "#"} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors"><FaYoutube /></a>
          <a href={contact?.linkedinUrl || "#"} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors"><FaLinkedin /></a>
        </div>
      </div>
    </div>
  );
}
