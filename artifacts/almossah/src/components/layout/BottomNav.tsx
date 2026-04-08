import { Link, useLocation } from "wouter";
import { Home, Info, BookOpen, Layers, Newspaper, Handshake, Phone } from "lucide-react";

const navItems = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/about", label: "عن المؤسسة", icon: Info },
  { href: "/services", label: "خدماتنا", icon: BookOpen },
  { href: "/programs", label: "البرامج", icon: Layers },
  { href: "/media/news", label: "الأخبار", icon: Newspaper },
  { href: "/partners-success", label: "شركاؤنا", icon: Handshake },
  { href: "/contact", label: "اتصل بنا", icon: Phone },
];

export function BottomNav() {
  const [location] = useLocation();

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <nav
      dir="rtl"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-white/90 backdrop-blur-lg border border-gray-200/60 rounded-2xl shadow-2xl shadow-black/10 px-3 py-2"
      style={{ maxWidth: "calc(100vw - 32px)" }}
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link key={href} href={href}>
            <div
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 min-w-[52px] ${
                active
                  ? "bg-[#8B0000] text-white shadow-md shadow-red-900/25"
                  : "text-gray-500 hover:text-[#8B0000] hover:bg-red-50"
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-bold leading-none whitespace-nowrap">
                {label}
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
