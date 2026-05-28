import { Link, useLocation } from "wouter";
import { useGetAdminMe } from "@workspace/api-client-react";
import { LayoutDashboard, Users, FileText, Handshake, BarChart, LogOut, Settings, Menu, Image as ImageIcon, Phone, KeyRound, ClipboardEdit, GraduationCap, Bell, Bot, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { clearAdminToken, getAdminToken } from "@/lib/admin-auth";
import { useQueryClient } from "@tanstack/react-query";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const hasToken = !!getAdminToken();
  const { data: user, isLoading, isError } = useGetAdminMe({
    query: { enabled: hasToken, retry: false },
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [newRegCount, setNewRegCount] = useState(0);
  const lastTotalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!hasToken) return;

    const check = async () => {
      try {
        const token = getAdminToken();
        const r = await fetch("/api/admin/dashboard", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        });
        if (!r.ok) return;
        const data = await r.json() as { totalRegistrations?: number; pendingRegistrations?: number };
        const total = data.totalRegistrations ?? 0;

        if (lastTotalRef.current !== null && total > lastTotalRef.current) {
          const diff = total - lastTotalRef.current;
          setNewRegCount((c) => c + diff);
          if (Notification.permission === "granted") {
            new Notification("🔔 تسجيل جديد عبر ناصر", {
              body: `وصل ${diff} طلب${diff > 1 ? "ات" : ""} تسجيل جديد`,
              icon: "/logo.png",
            });
          }
        }
        lastTotalRef.current = total;
      } catch {}
    };

    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }

    void check();
    const interval = setInterval(check, 20000);
    return () => clearInterval(interval);
  }, [hasToken]);

  const handleLogout = async () => {
    try {
      const token = getAdminToken();
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
    } catch {}
    clearAdminToken();
    queryClient.clear();
    setLocation("/admin/login");
  };

  if (!hasToken) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans" dir="rtl">
        <div className="text-center">
          <p className="text-gray-600 mb-4">يرجى تسجيل الدخول أولاً</p>
          <Button onClick={() => setLocation("/admin/login")} className="bg-primary">تسجيل الدخول</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans" dir="rtl">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans" dir="rtl">
        <div className="text-center">
          <p className="text-gray-600 mb-4">انتهت جلسة تسجيل الدخول</p>
          <Button onClick={() => { clearAdminToken(); setLocation("/admin/login"); }} className="bg-primary">
            تسجيل الدخول من جديد
          </Button>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: "/admin/dashboard", label: "لوحة التحكم", icon: <LayoutDashboard size={20} /> },
    { href: "/admin/registrations", label: "طلبات التسجيل", icon: <Users size={20} /> },
    { href: "/admin/nassir", label: "ناصر المساعد الذكي", icon: <Bot size={20} /> },
    { href: "/admin/register-form-config", label: "إدارة نموذج التسجيل", icon: <ClipboardEdit size={20} /> },
    { href: "/admin/training-form", label: "نماذج تسجيل الدورات", icon: <ClipboardList size={20} /> },
    { href: "/admin/university-specialties", label: "تخصصات الجامعات", icon: <GraduationCap size={20} /> },
    { href: "/admin/news", label: "الأخبار والفعاليات", icon: <FileText size={20} /> },
    { href: "/admin/slides", label: "شرائح الصفحة الرئيسية", icon: <ImageIcon size={20} /> },
    { href: "/admin/partners", label: "شركاء النجاح", icon: <Handshake size={20} /> },
    { href: "/admin/team", label: "فريق العمل", icon: <Settings size={20} /> },
    { href: "/admin/stats", label: "الإحصائيات", icon: <BarChart size={20} /> },
    { href: "/admin/contact-info", label: "معلومات التواصل", icon: <Phone size={20} /> },
    { href: "/admin/settings", label: "الإعدادات", icon: <KeyRound size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans" dir="rtl">
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu />
        </Button>
      </div>

      {newRegCount > 0 && (
        <Link href="/admin/registrations">
          <div
            className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-primary text-white px-3 py-2 rounded-full shadow-lg cursor-pointer hover:bg-primary/90 transition-colors lg:hidden"
            onClick={() => setNewRegCount(0)}
          >
            <Bell size={16} className="animate-bounce" />
            <span className="text-xs font-bold">{newRegCount} جديد</span>
          </div>
        </Link>
      )}

      <aside className={`fixed inset-y-0 right-0 z-40 w-64 bg-slate-900 text-white transform ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col`}>
        <div className="p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center overflow-hidden shrink-0">
              <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <span className="font-bold text-base leading-tight">لوحة الإدارة</span>
          </div>

          {newRegCount > 0 && (
            <Link href="/admin/registrations">
              <button
                className="relative flex items-center justify-center w-9 h-9 rounded-full bg-amber-500/20 hover:bg-amber-500/30 transition-colors"
                onClick={() => { setNewRegCount(0); setSidebarOpen(false); }}
                title={`${newRegCount} طلب جديد عبر ناصر`}
              >
                <Bell size={18} className="text-amber-400 animate-bounce" />
                <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center">
                  {newRegCount > 99 ? "99+" : newRegCount}
                </span>
              </button>
            </Link>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm ${location === item.href ? 'bg-primary text-white font-semibold' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                {item.icon}
                <span>{item.label}</span>
                {item.href === "/admin/registrations" && newRegCount > 0 && (
                  <span className="mr-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {newRegCount}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{user.username}</p>
              <p className="text-xs text-slate-400">مدير النظام</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10 border-slate-700 text-sm h-9"
            onClick={handleLogout}
          >
            <LogOut className="ml-2" size={16} />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      <main className="flex-1 lg:mr-64 overflow-y-auto w-full">
        <div className="p-6 mt-12 lg:mt-0 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
