import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { getAdminToken } from "@/lib/admin-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  BookOpen,
  Settings2,
} from "lucide-react";

interface Specialization {
  id: number;
  universityId: number;
  name: string;
  category: string | null;
  minGpa: number;
  track: string;
  durationYears: number | null;
  annualFees: string | null;
  notes: string | null;
  order: number;
  enabled: boolean;
}

interface University {
  id: number;
  name: string;
  description: string | null;
  logoUrl: string | null;
  order: number;
  enabled: boolean;
  specializations: Specialization[];
}

const TRACK_OPTIONS = [
  { value: "scientific", label: "علمي فقط" },
  { value: "literary", label: "أدبي فقط" },
  { value: "both", label: "علمي وأدبي" },
];

export default function Universities() {
  const { toast } = useToast();
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const [editingUni, setEditingUni] = useState<Partial<University> | null>(null);
  const [isNewUni, setIsNewUni] = useState(false);

  const [editingSpec, setEditingSpec] = useState<{ uniId: number; spec: Partial<Specialization> } | null>(null);
  const [isNewSpec, setIsNewSpec] = useState(false);

  const token = getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const fetchAll = async () => {
    try {
      const res = await fetch("/api/admin/universities", { headers });
      if (res.ok) {
        const data = await res.json();
        setUniversities(data);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const seedDefaults = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/universities/seed-defaults", { method: "POST", headers });
      if (res.ok) {
        await fetchAll();
        toast({ title: "تم تحميل الجامعات الافتراضية" });
      }
    } catch {}
    setSaving(false);
  };

  const startNewUni = () => {
    setEditingUni({
      name: "",
      description: "",
      order: universities.length + 1,
      enabled: true,
    });
    setIsNewUni(true);
  };

  const startEditUni = (u: University) => {
    setEditingUni({ ...u });
    setIsNewUni(false);
  };

  const saveUni = async () => {
    if (!editingUni || !editingUni.name) return;
    setSaving(true);
    try {
      if (isNewUni) {
        await fetch("/api/admin/universities", {
          method: "POST",
          headers,
          body: JSON.stringify(editingUni),
        });
      } else {
        await fetch(`/api/admin/universities/${editingUni.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(editingUni),
        });
      }
      await fetchAll();
      setEditingUni(null);
    } catch {}
    setSaving(false);
  };

  const deleteUni = async (id: number) => {
    if (!confirm("هل تريد حذف هذه الجامعة وجميع تخصصاتها؟")) return;
    try {
      await fetch(`/api/admin/universities/${id}`, { method: "DELETE", headers });
      await fetchAll();
    } catch {}
  };

  const toggleUniEnabled = async (u: University) => {
    try {
      await fetch(`/api/admin/universities/${u.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ enabled: !u.enabled }),
      });
      await fetchAll();
    } catch {}
  };

  const startNewSpec = (uniId: number) => {
    const uni = universities.find((u) => u.id === uniId);
    setEditingSpec({
      uniId,
      spec: {
        name: "",
        category: "",
        minGpa: 50,
        track: "both",
        durationYears: 4,
        annualFees: "",
        order: uni ? uni.specializations.length + 1 : 1,
        enabled: true,
      },
    });
    setIsNewSpec(true);
  };

  const startEditSpec = (uniId: number, spec: Specialization) => {
    setEditingSpec({ uniId, spec: { ...spec } });
    setIsNewSpec(false);
  };

  const saveSpec = async () => {
    if (!editingSpec || !editingSpec.spec.name) return;
    setSaving(true);
    try {
      if (isNewSpec) {
        await fetch(`/api/admin/universities/${editingSpec.uniId}/specializations`, {
          method: "POST",
          headers,
          body: JSON.stringify(editingSpec.spec),
        });
      } else {
        await fetch(`/api/admin/specializations/${editingSpec.spec.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(editingSpec.spec),
        });
      }
      await fetchAll();
      setEditingSpec(null);
    } catch {}
    setSaving(false);
  };

  const deleteSpec = async (id: number) => {
    if (!confirm("هل تريد حذف هذا التخصص؟")) return;
    try {
      await fetch(`/api/admin/specializations/${id}`, { method: "DELETE", headers });
      await fetchAll();
    } catch {}
  };

  const toggleSpecEnabled = async (s: Specialization) => {
    try {
      await fetch(`/api/admin/specializations/${s.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ enabled: !s.enabled }),
      });
      await fetchAll();
    } catch {}
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">جاري التحميل...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">إدارة الجامعات والتخصصات</h1>
            <p className="text-slate-500">
              تحكم بالجامعات وتخصصاتها (المعدل المطلوب، نوع القسم) - تظهر في صفحة "سجل الآن"
            </p>
          </div>
          <div className="flex gap-2">
            {universities.length === 0 && (
              <button
                onClick={seedDefaults}
                disabled={saving}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-60"
              >
                <Settings2 size={16} />
                تحميل البيانات الافتراضية
              </button>
            )}
            <button
              onClick={startNewUni}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors"
            >
              <Plus size={16} />
              إضافة جامعة
            </button>
          </div>
        </div>
      </div>

      {editingUni && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-800">{isNewUni ? "إضافة جامعة جديدة" : "تعديل الجامعة"}</h3>
            <button onClick={() => setEditingUni(null)} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">اسم الجامعة *</label>
              <input
                type="text"
                value={editingUni.name || ""}
                onChange={(e) => setEditingUni({ ...editingUni, name: e.target.value })}
                placeholder="مثال: جامعة أزال"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">الترتيب</label>
              <input
                type="number"
                value={editingUni.order || 0}
                onChange={(e) => setEditingUni({ ...editingUni, order: parseInt(e.target.value) || 0 })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">الوصف (اختياري)</label>
              <input
                type="text"
                value={editingUni.description || ""}
                onChange={(e) => setEditingUni({ ...editingUni, description: e.target.value })}
                placeholder="مثال: Azal University for Human Development"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingUni.enabled !== false}
                  onChange={(e) => setEditingUni({ ...editingUni, enabled: e.target.checked })}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm font-medium text-slate-700">مفعّل (يظهر في صفحة التسجيل)</span>
              </label>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingUni(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button
                onClick={saveUni}
                disabled={saving || !editingUni.name}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingSpec && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-800">{isNewSpec ? "إضافة تخصص جديد" : "تعديل التخصص"}</h3>
            <button onClick={() => setEditingSpec(null)} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">اسم التخصص *</label>
              <input
                type="text"
                value={editingSpec.spec.name || ""}
                onChange={(e) => setEditingSpec({ ...editingSpec, spec: { ...editingSpec.spec, name: e.target.value } })}
                placeholder="مثال: الصيدلة"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">المعدل المطلوب (%) *</label>
              <input
                type="number"
                step="0.01"
                value={editingSpec.spec.minGpa ?? 0}
                onChange={(e) => setEditingSpec({ ...editingSpec, spec: { ...editingSpec.spec, minGpa: parseFloat(e.target.value) || 0 } })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">القسم المطلوب *</label>
              <select
                value={editingSpec.spec.track || "both"}
                onChange={(e) => setEditingSpec({ ...editingSpec, spec: { ...editingSpec.spec, track: e.target.value } })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                {TRACK_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">مدة الدراسة (سنوات)</label>
              <input
                type="number"
                value={editingSpec.spec.durationYears ?? ""}
                onChange={(e) => setEditingSpec({ ...editingSpec, spec: { ...editingSpec.spec, durationYears: e.target.value ? parseInt(e.target.value) : null } })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">التصنيف (اختياري)</label>
              <input
                type="text"
                value={editingSpec.spec.category || ""}
                onChange={(e) => setEditingSpec({ ...editingSpec, spec: { ...editingSpec.spec, category: e.target.value } })}
                placeholder="مثال: العلوم الطبية"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">الرسوم السنوية (اختياري)</label>
              <input
                type="text"
                value={editingSpec.spec.annualFees || ""}
                onChange={(e) => setEditingSpec({ ...editingSpec, spec: { ...editingSpec.spec, annualFees: e.target.value } })}
                placeholder="مثال: $2,143"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">الترتيب</label>
              <input
                type="number"
                value={editingSpec.spec.order || 0}
                onChange={(e) => setEditingSpec({ ...editingSpec, spec: { ...editingSpec.spec, order: parseInt(e.target.value) || 0 } })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingSpec.spec.enabled !== false}
                  onChange={(e) => setEditingSpec({ ...editingSpec, spec: { ...editingSpec.spec, enabled: e.target.checked } })}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm font-medium text-slate-700">مفعّل</span>
              </label>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingSpec(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button
                onClick={saveSpec}
                disabled={saving || !editingSpec.spec.name}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {universities.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <GraduationCap className="mx-auto mb-4 text-slate-300" size={48} />
          <p className="text-slate-500 mb-2">لا توجد جامعات بعد</p>
          <p className="text-sm text-slate-400 mb-4">اضغط "تحميل البيانات الافتراضية" لإضافة جامعة أزال والجامعة اليمنية</p>
        </div>
      ) : (
        <div className="space-y-4">
          {universities.map((u) => (
            <div key={u.id} className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${!u.enabled ? "opacity-60" : ""}`}>
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-4">
                <button
                  onClick={() => setExpanded({ ...expanded, [u.id]: !expanded[u.id] })}
                  className="text-slate-400 hover:text-slate-600 shrink-0"
                >
                  {expanded[u.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                <GraduationCap className="text-primary shrink-0" size={24} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{u.name}</h3>
                  {u.description && <p className="text-xs text-slate-500 truncate">{u.description}</p>}
                  <p className="text-xs text-slate-400 mt-0.5">
                    <BookOpen className="inline ml-1" size={11} />
                    {u.specializations.length} تخصصات
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleUniEnabled(u)}
                    className={`w-10 h-6 rounded-full transition-colors relative ${u.enabled ? "bg-emerald-500" : "bg-slate-300"}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${u.enabled ? "left-1" : "left-5"}`} />
                  </button>
                  <button
                    onClick={() => startNewSpec(u.id)}
                    className="flex items-center gap-1 bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                  >
                    <Plus size={12} />
                    تخصص
                  </button>
                  <button onClick={() => startEditUni(u)} className="text-blue-500 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => deleteUni(u.id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {expanded[u.id] && (
                <div className="p-4">
                  {u.specializations.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">لا توجد تخصصات. اضغط "تخصص" لإضافة واحد.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-sm">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2 font-medium">التخصص</th>
                            <th className="px-3 py-2 font-medium">التصنيف</th>
                            <th className="px-3 py-2 font-medium">المعدل</th>
                            <th className="px-3 py-2 font-medium">القسم</th>
                            <th className="px-3 py-2 font-medium">المدة</th>
                            <th className="px-3 py-2 font-medium">الرسوم</th>
                            <th className="px-3 py-2 font-medium">الحالة</th>
                            <th className="px-3 py-2 font-medium">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {u.specializations.map((s) => (
                            <tr key={s.id} className={`hover:bg-slate-50 ${!s.enabled ? "opacity-50" : ""}`}>
                              <td className="px-3 py-2 font-medium text-slate-900">{s.name}</td>
                              <td className="px-3 py-2 text-slate-600">{s.category || "-"}</td>
                              <td className="px-3 py-2">
                                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">{s.minGpa}%</span>
                              </td>
                              <td className="px-3 py-2 text-slate-600">
                                {TRACK_OPTIONS.find((t) => t.value === s.track)?.label || s.track}
                              </td>
                              <td className="px-3 py-2 text-slate-600">{s.durationYears ? `${s.durationYears} سنوات` : "-"}</td>
                              <td className="px-3 py-2 text-slate-600">{s.annualFees || "-"}</td>
                              <td className="px-3 py-2">
                                <button
                                  onClick={() => toggleSpecEnabled(s)}
                                  className={`w-9 h-5 rounded-full transition-colors relative ${s.enabled ? "bg-emerald-500" : "bg-slate-300"}`}
                                >
                                  <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${s.enabled ? "left-[3px]" : "left-[18px]"}`} />
                                </button>
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex gap-1">
                                  <button onClick={() => startEditSpec(u.id, s)} className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50">
                                    <Pencil size={14} />
                                  </button>
                                  <button onClick={() => deleteSpec(s.id)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
