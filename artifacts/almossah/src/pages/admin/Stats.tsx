import { AdminLayout } from "@/components/layout/AdminLayout";
import { useGetStats, useUpdateStats } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetStatsQueryKey } from "@workspace/api-client-react";

export default function Stats() {
  const { data: stats, isLoading } = useGetStats();
  const updateStats = useUpdateStats();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    yearsExperience: 0,
    programs: 0,
    beneficiaries: 0,
    experts: 0,
    universities: 0,
    partners: 0
  });

  useEffect(() => {
    if (stats) {
      setFormData(stats);
    }
  }, [stats]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateStats.mutate(
      { data: formData },
      {
        onSuccess: () => {
          toast({ title: "تم تحديث الإحصائيات بنجاح" });
          queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        },
        onError: () => toast({ variant: "destructive", title: "حدث خطأ أثناء التحديث" })
      }
    );
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">إحصائيات المؤسسة</h1>
        <p className="text-slate-500">تحديث الأرقام المعروضة في الصفحة الرئيسية</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 max-w-2xl">
        {isLoading ? (
          <div className="text-center py-8">جاري التحميل...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700">سنوات الخبرة</label>
                <Input 
                  type="number" 
                  required 
                  value={formData.yearsExperience} 
                  onChange={e => setFormData({...formData, yearsExperience: Number(e.target.value)})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700">برنامج ومبادرة</label>
                <Input 
                  type="number" 
                  required 
                  value={formData.programs} 
                  onChange={e => setFormData({...formData, programs: Number(e.target.value)})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700">مستفيد ومستفيدة</label>
                <Input 
                  type="number" 
                  required 
                  value={formData.beneficiaries} 
                  onChange={e => setFormData({...formData, beneficiaries: Number(e.target.value)})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700">خبير ومتطوع</label>
                <Input 
                  type="number" 
                  required 
                  value={formData.experts} 
                  onChange={e => setFormData({...formData, experts: Number(e.target.value)})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700">جامعة ومعهد</label>
                <Input 
                  type="number" 
                  required 
                  value={formData.universities} 
                  onChange={e => setFormData({...formData, universities: Number(e.target.value)})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700">شريك نجاح</label>
                <Input 
                  type="number" 
                  required 
                  value={formData.partners} 
                  onChange={e => setFormData({...formData, partners: Number(e.target.value)})} 
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <Button type="submit" className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white px-8" disabled={updateStats.isPending}>
                {updateStats.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}