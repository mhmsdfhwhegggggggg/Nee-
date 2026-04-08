import { Link } from "wouter";
import { Phone, Mail, MapPin } from "lucide-react";
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaLinkedin } from "react-icons/fa";

export function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-gray-300 pt-16 pb-8 border-t-4 border-primary">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Column 1: About */}
          <div>
            <div className="flex items-center gap-3 mb-6 bg-white/5 p-2 rounded-lg inline-flex">
              <img src="/logo.png" alt="المؤسسة الوطنية" className="h-10 w-auto object-contain bg-white rounded p-1" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              <span className="font-bold text-lg text-white">المؤسسة الوطنية</span>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6 text-sm">
              مؤسسة وطنية رائدة تسعى لتقديم خدمات تعليمية وطبية وتنموية متميزة، للمساهمة في بناء مجتمع معرفي وصحي متكامل، وفقاً لأعلى معايير الجودة الشاملة.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary text-white transition-colors"><FaFacebook /></a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary text-white transition-colors"><FaTwitter /></a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary text-white transition-colors"><FaInstagram /></a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary text-white transition-colors"><FaYoutube /></a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6 relative inline-block after:content-[''] after:absolute after:-bottom-2 after:right-0 after:w-1/2 after:h-1 after:bg-primary">روابط سريعة</h3>
            <ul className="flex flex-col gap-3">
              <li><Link href="/about"><div className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2 before:content-['›'] before:text-primary">من نحن</div></Link></li>
              <li><Link href="/services"><div className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2 before:content-['›'] before:text-primary">خدماتنا</div></Link></li>
              <li><Link href="/programs"><div className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2 before:content-['›'] before:text-primary">البرامج</div></Link></li>
              <li><Link href="/media/news"><div className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2 before:content-['›'] before:text-primary">الأخبار</div></Link></li>
              <li><Link href="/partners-success"><div className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2 before:content-['›'] before:text-primary">شركاء النجاح</div></Link></li>
              <li><Link href="/contact"><div className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2 before:content-['›'] before:text-primary">اتصل بنا</div></Link></li>
            </ul>
          </div>

          {/* Column 3: Work Areas */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6 relative inline-block after:content-[''] after:absolute after:-bottom-2 after:right-0 after:w-1/2 after:h-1 after:bg-primary">مجالات العمل</h3>
            <ul className="flex flex-col gap-3">
              <li><Link href="/services#education"><div className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2 before:content-['›'] before:text-primary">الخدمات التعليمية</div></Link></li>
              <li><Link href="/services#medical"><div className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2 before:content-['›'] before:text-primary">الخدمات الطبية</div></Link></li>
              <li><Link href="/services#relief"><div className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2 before:content-['›'] before:text-primary">الإغاثة والرعاية</div></Link></li>
              <li><Link href="/services#empowerment"><div className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2 before:content-['›'] before:text-primary">التمكين الاقتصادي</div></Link></li>
              <li><Link href="/services#training"><div className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2 before:content-['›'] before:text-primary">التدريب والتأهيل</div></Link></li>
              <li><Link href="/services#protection"><div className="hover:text-primary transition-colors cursor-pointer flex items-center gap-2 before:content-['›'] before:text-primary">الحماية المجتمعية</div></Link></li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6 relative inline-block after:content-[''] after:absolute after:-bottom-2 after:right-0 after:w-1/2 after:h-1 after:bg-primary">تواصل معنا</h3>
            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <MapPin className="text-primary mt-1 shrink-0" size={18} />
                <span className="text-sm">الجمهورية اليمنية - أمانة العاصمة - شارع الزبيري</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="text-primary mt-1 shrink-0" size={18} />
                <span className="text-sm" dir="ltr">+967 1 234 567<br />+967 777 123 456</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="text-primary mt-1 shrink-0" size={18} />
                <span className="text-sm">info@almossah.org<br />support@almossah.org</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            جميع الحقوق محفوظة © {new Date().getFullYear()} المؤسسة الوطنية
          </p>
          <div className="flex gap-4 text-sm text-gray-400">
            <Link href="/privacy"><div className="hover:text-white cursor-pointer">سياسة الخصوصية</div></Link>
            <Link href="/terms"><div className="hover:text-white cursor-pointer">شروط الاستخدام</div></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}