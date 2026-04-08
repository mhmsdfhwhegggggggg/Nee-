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
        { href: "/programs#courses", label: "الدورات التدريبية" },
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
    <>
      {/* Top bar */}
      <div className="bg-[#8B0000] text-white text-xs py-2 hidden md:block">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex gap-6 items-center text-white/80">
            <span>📞 +967 123 456 789</span>
            <span>✉ info@almossah.org</span>
            <span>📍 صنعاء، اليمن</span>
          </div>
          <div className="flex gap-3">
            {["facebook", "twitter", "instagram", "youtube", "linkedin"].map(s => (
              <a key={s} href="#"
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/30 flex items-center justify-center transition-colors text-[10px]">
                {s === "facebook" ? "f" : s === "twitter" ? "𝕏" : s === "instagram" ? "◻" : s === "youtube" ? "▶" : "in"}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-lg shadow-black/[0.05]"
            : "bg-white"
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-3 items-center h-[72px]">

            {/* Logo — right column in RTL */}
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer group w-fit">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                  <img src="/logo.png" alt="" className="h-10 w-auto object-contain"
                    onError={e => {
                      e.currentTarget.style.display = "none";
                      const p = e.currentTarget.parentElement;
                      if (p) p.innerHTML = `<span class="text-white font-black text-xl">م</span>`;
                    }} />
                </div>
                <div className="leading-tight">
                  <div className="font-black text-[#8B0000] text-[17px] tracking-tight">المؤسسة الوطنية</div>
                  <div className="text-[11px] text-[#2D5A27] font-semibold">للتنمية الشاملة</div>
                </div>
              </div>
            </Link>

            {/* Desktop nav — center column */}
            <nav className="hidden lg:flex items-center justify-center gap-1">
              {navLinks.map(link => (
                <div key={link.href} className="relative group">
                  <Link href={link.href}>
                    <div className={`flex items-center gap-1 px-3 py-2 rounded-lg text-[13.5px] font-semibold transition-colors cursor-pointer select-none ${
                      isActive(link.href)
                        ? "text-primary bg-primary/5"
                        : "text-gray-700 hover:text-primary hover:bg-gray-50"
                    }`}>
                      {link.label}
                      {link.dropdown && (
                        <ChevronDown size={13} className="opacity-50 group-hover:rotate-180 transition-transform duration-200" />
                      )}
                    </div>
                  </Link>

                  {link.dropdown && (
                    <div className="absolute top-full right-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all translate-y-1 group-hover:translate-y-0 duration-200 z-50">
                      <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[180px] overflow-hidden">
                        {link.dropdown.map(d => (
                          <Link key={d.href} href={d.href}>
                            <div className="px-4 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary cursor-pointer font-medium transition-colors">
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

            {/* CTA — left column */}
            <div className="hidden lg:flex items-center justify-end gap-3">
              <Link href="/admin/dashboard">
                <div className="text-xs text-gray-400 hover:text-primary cursor-pointer transition-colors">
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
            <div className="flex lg:hidden justify-end col-start-3">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
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
                      className={`px-4 py-3 rounded-lg font-bold text-sm cursor-pointer ${isActive(link.href) ? "text-primary bg-primary/5" : "text-gray-800"}`}
                      onClick={() => !link.dropdown && setIsOpen(false)}
                    >
                      {link.label}
                    </div>
                  </Link>
                  {link.dropdown && (
                    <div className="pr-4 flex flex-col gap-0.5">
                      {link.dropdown.map(d => (
                        <Link key={d.href} href={d.href}>
                          <div className="px-4 py-2 text-xs text-gray-500 cursor-pointer hover:text-primary" onClick={() => setIsOpen(false)}>
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
                  <button className="w-full bg-primary text-white font-bold py-3 rounded-xl" onClick={() => setIsOpen(false)}>
                    سجّل الآن
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
