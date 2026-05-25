import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { getAdminToken } from "@/lib/admin-auth";
import { Plus, Pencil, Trash2, Save, X, BookOpen, Search, Database } from "lucide-react";

interface Specialty {
  id: number;
  university_name: string;
  specialty_name: string;
  department_type: string;
  min_gpa: number;
}

const UNIVERSITIES = [
  "جامعة صنعاء", "جامعة عدن", "جامعة تعز", "جامعة حضرموت",
  "جامعة إب", "جامعة ذمار", "جامعة الحديدة",
  "الجامعة اللبنانية الدولية", "جامعة العلوم والتكنولوجيا",
  "جامعة سبأ", "جامعة الملكة أروى", "جامعة الأندلس",
  "جامعة الحكمة", "جامعة دار السلام", "جامعة الناصر",
  "جامعة المستقبل", "جامعة الجيل الجديد", "جامعة آزال",
  "الجامعة اليمنية", "أخرى",
];

const DEPT_TYPES = [
  { value: "all", label: "علمي وأدبي" },
  { value: "علمي", label: "علمي فقط" },
  { value: "أدبي", label: "أدبي فقط" },
];

const emptyForm = {
  universityName: "",
  specialtyName: "",
  departmentType: "all",
  minGpa: "0",
};

export default function UniversitySpecialties() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [search, setSearch] = useState("");

  const token = getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/university-specialties", { headers });
      if (res.ok) setSpecialties(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const universities = Array.from(new Set([
    ...UNIVERSITIES.filter((u) => specialties.some((s) => s.university_name === u)),
    ...Array.from(new Set(specialties.map((s) => s.university_name))),
  ]));

  const displayedSpecialties = specialties.filter((s) => {
    const uniMatch = !selectedUniversity || s.university_name === selectedUniversity;
    const searchMatch = !search || s.specialty_name.includes(search) || s.university_name.includes(search);
    return uniMatch && searchMatch;
  });

  const uniCounts = specialties.reduce<Record<string, number>>((acc, s) => {
    acc[s.university_name] = (acc[s.university_name] || 0) + 1;
    return acc;
  }, {});

  const startNew = (preUni?: string) => {
    setForm({ ...emptyForm, universityName: preUni || selectedUniversity || "" });
    setEditingId(null);
    setIsNew(true);
  };

  const startEdit = (s: Specialty) => {
    setForm({
      universityName: s.university_name,
      specialtyName: s.specialty_name,
      departmentType: s.department_type,
      minGpa: String(s.min_gpa),
    });
    setEditingId(s.id);
    setIsNew(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsNew(false);
    setForm({ ...emptyForm });
  };

  const saveEntry = async () => {
    if (!form.universityName || !form.specialtyName) return;
    setSaving(true);
    try {
      const body = {
        universityName: form.universityName,
        specialtyName: form.specialtyName,
        departmentType: form.departmentType,
        minGpa: parseFloat(form.minGpa) || 0,
      };
      if (isNew) {
        const res = await fetch("/api/admin/university-specialties", {
          method: "POST", headers, body: JSON.stringify(body),
        });
        if (res.ok) { await fetchAll(); cancelEdit(); }
      } else if (editingId !== null) {
        const res = await fetch(`/api/admin/university-specialties/${editingId}`, {
          method: "PATCH", headers, body: JSON.stringify(body),
        });
        if (res.ok) { await fetchAll(); cancelEdit(); }
      }
    } catch {}
    setSaving(false);
  };

  const deleteEntry = async (id: number) => {
    if (!confirm("هل تريد حذف هذا التخصص؟")) return;
    try {
      await fetch(`/api/admin/university-specialties/${id}`, { method: "DELETE", headers });
      await fetchAll();
    } catch {}
  };

  const seedDefaults = async () => {
    if (!confirm("سيضيف هذا بيانات جامعة آزال والجامعة اليمنية كبيانات أولية. هل تريد المتابعة؟")) return;
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/university-specialties/seed", { method: "POST", headers });
      const data = await res.json();
      if (res.ok) {
        await fetchAll();
        alert(data.message || "تم تحميل البيانات بنجاح");
      }
    } catch {}
    setSeeding(false);
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
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">تخصصات الجامعات</h1>
            <p className="text-slate-500 text-sm">إدارة التخصصات المتاحة لكل جامعة مع تحديد الحد الأدنى للمعدل والقسم المطلوب</p>
          </div>
          <div className="flex gap-2">
            {specialties.length === 0 && (
              <button
                onClick={seedDefaults}
                disabled={seeding}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-60"
              >
                <Database size={16} />
                {seeding ? "جاري التحميل..." : "تحميل البيانات الأولية"}
              </button>
            )}
            <button
              onClick={() => startNew()}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors"
            >
              <Plus size={16} />
              إضافة تخصص
            </button>
          </div>
        </div>
      </div>

      {(isNew || editingId !== null) && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-5 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">{isNew ? "إضافة تخصص جديد" : "تعديل التخصص"}</h3>
            <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">الجامعة</label>
              <select
                value={form.universityName}
                onChange={(e) => setForm({ ...form, universityName: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">-- اختر الجامعة --</option>
                {UNIVERSITIES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">اسم التخصص</label>
              <input
                type="text"
                value={form.specialtyName}
                onChange={(e) => setForm({ ...form, specialtyName: e.target.value })}
                placeholder="مثال: الصيدلة"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">الحد الأدنى للمعدل (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={form.minGpa}
                onChange={(e) => setForm({ ...form, minGpa: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">القسم المطلوب</label>
              <select
                value={form.departmentType}
                onChange={(e) => setForm({ ...form, departmentType: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                {DEPT_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button onClick={cancelEdit} className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                إلغاء
              </button>
              <button
                onClick={saveEntry}
                disabled={saving || !form.universityName || !form.specialtyName}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h2 className="font-bold text-slate-800 text-sm">الجامعات ({universities.length})</h2>
            </div>
            <div className="p-2">
              <button
                onClick={() => setSelectedUniversity("")}
                className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${!selectedUniversity ? "bg-primary text-white" : "text-slate-700 hover:bg-slate-50"}`}
              >
                <span>جميع الجامعات</span>
                <span className={`text-xs font-bold ${!selectedUniversity ? "text-white/80" : "text-slate-400"}`}>{specialties.length}</span>
              </button>
              {UNIVERSITIES.filter((u) => uniCounts[u] || selectedUniversity === u).concat(
                Array.from(new Set(specialties.map((s) => s.university_name))).filter((u) => !UNIVERSITIES.includes(u))
              ).map((uni) => (
                <button
                  key={uni}
                  onClick={() => setSelectedUniversity(uni)}
                  className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between mt-0.5 ${selectedUniversity === uni ? "bg-primary text-white" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  <span className="truncate">{uni}</span>
                  <span className={`text-xs font-bold shrink-0 mr-2 ${selectedUniversity === uni ? "text-white/80" : "text-slate-400"}`}>{uniCounts[uni] || 0}</span>
                </button>
              ))}
              {universities.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">لا توجد جامعات بعد</p>
              )}
            </div>
            <div className="p-3 border-t border-slate-100">
              <button
                onClick={() => startNew(selectedUniversity || "")}
                className="w-full flex items-center justify-center gap-1 text-primary hover:text-primary/80 text-xs font-bold py-1.5 transition-colors"
              >
                <Plus size={14} />
                إضافة تخصص {selectedUniversity ? `لـ${selectedUniversity}` : ""}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
              <h2 className="font-bold text-slate-800 text-sm flex-1">
                {selectedUniversity || "جميع التخصصات"} ({displayedSpecialties.length})
              </h2>
              <div className="relative">
                <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث..."
                  className="pr-8 pl-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-44"
                />
              </div>
            </div>

            {displayedSpecialties.length === 0 ? (
              <div className="p-12 text-center">
                <BookOpen className="mx-auto mb-3 text-slate-300" size={40} />
                <p className="text-slate-500 mb-1">لا توجد تخصصات</p>
                {specialties.length === 0 && (
                  <button
                    onClick={seedDefaults}
                    disabled={seeding}
                    className="mt-3 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-60"
                  >
                    {seeding ? "جاري التحميل..." : "تحميل البيانات الأولية"}
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {displayedSpecialties.map((s) => (
                  <div key={s.id} className={`flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors ${editingId === s.id ? "bg-blue-50" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">{s.specialty_name}</span>
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                          {Number(s.min_gpa)}%+
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          s.department_type === "all"
                            ? "bg-slate-100 text-slate-600"
                            : s.department_type === "علمي"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-purple-50 text-purple-700"
                        }`}>
                          {DEPT_TYPES.find((d) => d.value === s.department_type)?.label || s.department_type}
                        </span>
                      </div>
                      {!selectedUniversity && (
                        <p className="text-xs text-slate-400 mt-0.5">{s.university_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(s)}
                        className="text-blue-500 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => deleteEntry(s.id)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
