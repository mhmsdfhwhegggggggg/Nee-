import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import { setAdminToken } from "@/lib/admin-auth";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token) {
          setAdminToken(data.token);
        }
        // Invalidate admin/me query so it refetches with the new token
        await queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
        toast({ title: "تم تسجيل الدخول بنجاح" });
        setLocation("/admin/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "فشل تسجيل الدخول",
          description: data.message || "اسم المستخدم أو كلمة المرور غير صحيحة",
        });
      }
    } catch {
      toast({ variant: "destructive", title: "تعذر الاتصال بالخادم" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans"
      style={{ background: "linear-gradient(135deg, #6B0000 0%, #8B0000 50%, #2D5A27 100%)" }}
      dir="rtl"
    >
      {/* Decorative circles */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-[#8B0000] to-[#6B0000] p-8 text-center overflow-hidden">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.3) 10px, rgba(255,255,255,0.3) 11px)" }}
            />
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain"
                  onError={(e) => { e.currentTarget.style.display = "none"; }} />
              </div>
              <h1 className="text-2xl font-black text-white mb-1">لوحة تحكم المؤسسة</h1>
              <p className="text-white/70 text-sm">قم بتسجيل الدخول للوصول إلى لوحة الإدارة</p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">اسم المستخدم</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    required
                    className="pr-10 pl-3 h-12 text-right border-gray-200 focus:border-primary"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="اسم المستخدم"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">كلمة المرور</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <button type="button" onClick={() => setShowPw(!showPw)} className="text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <Input
                    type={showPw ? "text" : "password"}
                    required
                    className="pr-10 pl-10 h-12 border-gray-200 focus:border-primary"
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-bold bg-gradient-to-r from-[#8B0000] to-[#CC0000] hover:from-[#7A0000] hover:to-[#AA0000] text-white rounded-xl shadow-lg mt-2"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    جاري التحقق...
                  </span>
                ) : "تسجيل الدخول"}
              </Button>
            </form>
          </div>
        </div>

        <p className="text-center text-white/50 text-xs mt-6">
          المؤسسة الوطنية للخدمات التعليمية والطبية
        </p>
      </div>
    </div>
  );
}
