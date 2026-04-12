import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChevronDown } from "lucide-react";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn, { passive: true });
    fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const navLinks = [
    { href: "/", label: "الرئيسية" },
    {
      href: "/about",
      label: "عن المؤسسة",
      dropdown: [
        { href: "/about", label: "من نحن" },
        { href: "/about#vision", label: "رؤيتنا وأهدافنا" },
      ],
    },
    { href: "/services", label: "خدماتنا" },
    {
      href: "/programs",
      label: "البرامج",
      dropdown: [
        { href: "/programs#scholarships", label: "المنح الدراسية" },
        { href: "/programs#discounts", label: "التخفيضات الجامعية" },
        { href: "/programs#insurance", label: "التأمين الصحي" },
      ],
    },
    {
      href: "/media",
      label: "المركز الإعلامي",
      dropdown: [
        { href: "/media/news", label: "الأخبار" },
        { href: "/media/events", label: "الفعاليات" },
      ],
    },
    { href: "/partners-success", label: "شركاء النجاح" },
    { href: "/contact", label: "اتصل بنا" },
  ];

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? "bg-white/97 backdrop-blur-md shadow-md border-gray-100"
          : "bg-white border-transparent"
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-[84px]">

          {/* Logo — full brand image */}
          <Link href="/">
            <div className="cursor-pointer flex items-center h-full">
              <img
                src="/header-logo.jpg"
                alt="المؤسسة الوطنية للتنمية الشاملة"
                className="h-[72px] w-auto object-contain"
                onError={e => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              {/* Fallback text logo */}
              <div className="hidden">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-4 border-[#8B0000] flex items-center justify-center text-[#8B0000] font-black text-xl">م</div>
                  <div>
                    <div className="font-black text-[#8B0000] text-lg leading-tight">المؤسسة الوطنية</div>
                    <div className="font-black text-[#8B0000] text-lg leading-tight">للتنمية الشاملة</div>
                    <div className="text-[#2D5A27] text-sm font-semibold italic">نأخذ بيدك نحو المستقبل</div>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map(link => (
              <div key={link.href} className="relative group">
                <Link href={link.href}>
                  <div className={`flex items-center gap-1 px-3 py-2 rounded-lg text-[13.5px] font-semibold transition-colors cursor-pointer select-none ${
                    isActive(link.href)
                      ? "text-[#8B0000] bg-[#8B0000]/5"
                      : "text-gray-700 hover:text-[#8B0000] hover:bg-gray-50"
                  }`}>
                    {link.label}
                    {link.dropdown && (
                      <ChevronDown size={12} className="opacity-50 group-hover:rotate-180 transition-transform duration-200" />
                    )}
                  </div>
                </Link>

                {link.dropdown && (
                  <div className="absolute top-full right-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all translate-y-1 group-hover:translate-y-0 duration-200 z-50">
                    <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[180px] overflow-hidden">
                      {link.dropdown.map(d => (
                        <Link key={d.href} href={d.href}>
                          <div className="px-4 py-2.5 text-sm text-gray-700 hover:bg-[#8B0000]/5 hover:text-[#8B0000] cursor-pointer font-medium transition-colors">
                            {d.label}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* CTA buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/admin/dashboard">
              <div className="text-xs text-gray-400 hover:text-[#8B0000] cursor-pointer transition-colors">
                لوحة التحكم
              </div>
            </Link>
            <Link href="/register">
              <button className="bg-[#8B0000] hover:bg-[#7A0000] text-white font-bold text-sm px-6 py-2.5 rounded-full transition-all hover:shadow-lg hover:shadow-red-900/20 active:scale-95">
                سجّل الآن
              </button>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-2xl max-h-[80vh] overflow-y-auto">
          <div className="container mx-auto px-6 py-4 flex flex-col gap-1">
            {navLinks.map(link => (
              <div key={link.href}>
                <Link href={link.href}>
                  <div
                    className={`px-4 py-3 rounded-lg font-bold text-sm cursor-pointer ${isActive(link.href) ? "text-[#8B0000] bg-[#8B0000]/5" : "text-gray-800"}`}
                    onClick={() => !link.dropdown && setIsOpen(false)}
                  >
                    {link.label}
                  </div>
                </Link>
                {link.dropdown && (
                  <div className="pr-4 flex flex-col gap-0.5">
                    {link.dropdown.map(d => (
                      <Link key={d.href} href={d.href}>
                        <div className="px-4 py-2 text-xs text-gray-500 cursor-pointer hover:text-[#8B0000]" onClick={() => setIsOpen(false)}>
                          {d.label}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-3">
              <Link href="/register">
                <button className="w-full bg-[#8B0000] text-white font-bold py-3 rounded-xl" onClick={() => setIsOpen(false)}>
                  سجّل الآن
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
