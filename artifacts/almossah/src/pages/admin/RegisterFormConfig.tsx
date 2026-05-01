import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { getAdminToken } from "@/lib/admin-auth";
import { Plus, Pencil, Trash2, GripVertical, Save, X, ChevronDown, ChevronUp, Settings2, GraduationCap, BookOpen } from "lucide-react";

interface FormField {
  id: number;
  fieldKey: string;
  label: string;
  fieldType: string;
  placeholder: string | null;
  required: boolean;
  options: string[] | null;
  sortOrder: number;
  enabled: boolean;
}

interface Specialization {
  id: number;
  universityId: number;
  name: string;
  category: string | null;
  minGpa: number;
  track: string;
  order: number;
  enabled: boolean;
}

interface University {
  id: number;
  name: string;
  description: string | null;
  order: number;
  enabled: boolean;
  specializations: Specialization[];
}

const TRACK_OPTIONS = [
  { value: "scientific", label: "علمي فقط" },
  { value: "literary", label: "أدبي فقط" },
  { value: "both", label: "علمي وأدبي" },
];

const FIELD_TYPES = [
  { value: "text", label: "نص" },
  { value: "select", label: "قائمة منسدلة" },
  { value: "select_with_other", label: "قائمة منسدلة مع خيار أخرى" },
  { value: "textarea", label: "نص طويل" },
  { value: "image", label: "صورة" },
  { value: "university_select", label: "قائمة الجامعات (ديناميكية)" },
  { value: "specialization_select", label: "قائمة التخصصات (ديناميكية)" },
];

export default function RegisterFormConfig() {
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [optionInput, setOptionInput] = useState("");

  const [universities, setUniversities] = useState<University[]>([]);
  const [expandedUni, setExpandedUni] = useState<Record<number, boolean>>({});
  const [editingUni, setEditingUni] = useState<Partial<University> | null>(null);
  const [isNewUni, setIsNewUni] = useState(false);
  const [editingSpec, setEditingSpec] = useState<{ uniId: number; spec: Partial<Specialization> } | null>(null);
  const [isNewSpec, setIsNewSpec] = useState(false);

  const token = getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  function normalizeFieldOptions(data: unknown[]): FormField[] {
    return data.map((f: unknown) => {
      const field = f as FormField & { options: unknown };
      let opts: string[] | null = null;
      if (Array.isArray(field.options)) {
        opts = (field.options as unknown[]).filter((o): o is string => typeof o === "string" && o.trim() !== "");
      } else if (typeof field.options === "string" && field.options) {
        try {
          const parsed = JSON.parse(field.options as string);
          if (Array.isArray(parsed)) opts = parsed.filter((o: unknown): o is string => typeof o === "string" && (o as string).trim() !== "");
          else if (typeof parsed === "string") {
            const parsed2 = JSON.parse(parsed);
            if (Array.isArray(parsed2)) opts = parsed2.filter((o: unknown): o is string => typeof o === "string" && (o as string).trim() !== "");
          }
        } catch {}
      }
      return { ...field, options: opts };
    });
  }

  const fetchFields = async () => {
    try {
      const res = await fetch("/api/admin/registration-form-config", { headers });
      if (res.ok) {
        const data = await res.json();
        setFields(normalizeFieldOptions(Array.isArray(data) ? data : []));
      }
    } catch {}
    setLoading(false);
  };

  const fetchUniversities = async () => {
    try {
      const res = await fetch("/api/admin/universities", { headers });
      if (res.ok) setUniversities(await res.json());
    } catch {}
  };

  const seedUniversities = async (force = false) => {
    if (force && !window.confirm("سيؤدي هذا إلى حذف جميع الجامعات والتخصصات الحالية واستبدالها بالقائمة الكاملة الافتراضية. هل تريد المتابعة؟")) return;
    setSaving(true);
    try {
      const url = force ? "/api/admin/universities/seed-defaults?force=true" : "/api/admin/universities/seed-defaults";
      const res = await fetch(url, { method: "POST", headers });
      if (res.ok) await fetchUniversities();
    } catch {}
    setSaving(false);
  };

  const startNewUni = () => {
    setEditingUni({ name: "", description: "", order: universities.length + 1, enabled: true });
    setIsNewUni(true);
  };
  const startEditUni = (u: University) => { setEditingUni({ ...u }); setIsNewUni(false); };
  const saveUni = async () => {
    if (!editingUni || !editingUni.name) return;
    setSaving(true);
    try {
      if (isNewUni) {
        await fetch("/api/admin/universities", { method: "POST", headers, body: JSON.stringify(editingUni) });
      } else {
        await fetch(`/api/admin/universities/${editingUni.id}`, { method: "PATCH", headers, body: JSON.stringify(editingUni) });
      }
      await fetchUniversities();
      setEditingUni(null);
    } catch {}
    setSaving(false);
  };
  const deleteUni = async (id: number) => {
    if (!confirm("هل تريد حذف هذه الجامعة وجميع تخصصاتها؟")) return;
    try {
      await fetch(`/api/admin/universities/${id}`, { method: "DELETE", headers });
      await fetchUniversities();
    } catch {}
  };
  const toggleUniEnabled = async (u: University) => {
    try {
      await fetch(`/api/admin/universities/${u.id}`, { method: "PATCH", headers, body: JSON.stringify({ enabled: !u.enabled }) });
      await fetchUniversities();
    } catch {}
  };

  const startNewSpec = (uniId: number) => {
    const uni = universities.find((u) => u.id === uniId);
    setEditingSpec({
      uniId,
      spec: { name: "", category: "", minGpa: 50, track: "both", order: uni ? uni.specializations.length + 1 : 1, enabled: true },
    });
    setIsNewSpec(true);
  };
  const startEditSpec = (uniId: number, spec: Specialization) => { setEditingSpec({ uniId, spec: { ...spec } }); setIsNewSpec(false); };
  const saveSpec = async () => {
    if (!editingSpec || !editingSpec.spec.name) return;
    setSaving(true);
    try {
      if (isNewSpec) {
        await fetch(`/api/admin/universities/${editingSpec.uniId}/specializations`, {
          method: "POST", headers, body: JSON.stringify(editingSpec.spec),
        });
      } else {
        await fetch(`/api/admin/specializations/${editingSpec.spec.id}`, {
          method: "PATCH", headers, body: JSON.stringify(editingSpec.spec),
        });
      }
      await fetchUniversities();
      setEditingSpec(null);
    } catch {}
    setSaving(false);
  };
  const deleteSpec = async (id: number) => {
    if (!confirm("هل تريد حذف هذا التخصص؟")) return;
    try {
      await fetch(`/api/admin/specializations/${id}`, { method: "DELETE", headers });
      await fetchUniversities();
    } catch {}
  };
  const toggleSpecEnabled = async (s: Specialization) => {
    try {
      await fetch(`/api/admin/specializations/${s.id}`, { method: "PATCH", headers, body: JSON.stringify({ enabled: !s.enabled }) });
      await fetchUniversities();
    } catch {}
  };

  const seedDefaults = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/registration-form-config/seed-defaults", {
        method: "POST",
        headers,
      });
      if (res.ok) {
        await fetchFields();
      }
    } catch {}
    setSaving(false);
  };

  useEffect(() => {
    fetchFields();
    fetchUniversities();
  }, []);

  const startEdit = (field: FormField) => {
    setEditingField({ ...field });
    setIsNew(false);
    setOptionInput("");
  };

  const startNew = () => {
    setEditingField({
      id: 0,
      fieldKey: "",
      label: "",
      fieldType: "text",
      placeholder: "",
      required: true,
      options: null,
      sortOrder: fields.length > 0 ? Math.max(...fields.map((f) => f.sortOrder)) + 1 : 1,
      enabled: true,
    });
    setIsNew(true);
    setOptionInput("");
  };

  const cancelEdit = () => {
    setEditingField(null);
    setIsNew(false);
  };

  const saveField = async () => {
    if (!editingField) return;
    setSaving(true);

    const body = {
      fieldKey: editingField.fieldKey,
      label: editingField.label,
      fieldType: editingField.fieldType,
      placeholder: editingField.placeholder || null,
      required: editingField.required,
      options: editingField.options,
      sortOrder: editingField.sortOrder,
      enabled: editingField.enabled,
    };

    try {
      if (isNew) {
        const res = await fetch("/api/admin/registration-form-config", {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        if (res.ok) {
          await fetchFields();
          cancelEdit();
        }
      } else {
        const res = await fetch(`/api/admin/registration-form-config/${editingField.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(body),
        });
        if (res.ok) {
          await fetchFields();
          cancelEdit();
        }
      }
    } catch {}
    setSaving(false);
  };

  const deleteField = async (id: number) => {
    if (!confirm("هل تريد حذف هذا الحقل؟")) return;
    try {
      await fetch(`/api/admin/registration-form-config/${id}`, {
        method: "DELETE",
        headers,
      });
      await fetchFields();
    } catch {}
  };

  const toggleEnabled = async (field: FormField) => {
    try {
      await fetch(`/api/admin/registration-form-config/${field.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ enabled: !field.enabled }),
      });
      await fetchFields();
    } catch {}
  };

  const moveField = async (field: FormField, direction: "up" | "down") => {
    const idx = fields.findIndex((f) => f.id === field.id);
    if (direction === "up" && idx <= 0) return;
    if (direction === "down" && idx >= fields.length - 1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const otherField = fields[swapIdx];

    try {
      await Promise.all([
        fetch(`/api/admin/registration-form-config/${field.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ sortOrder: otherField.sortOrder }),
        }),
        fetch(`/api/admin/registration-form-config/${otherField.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ sortOrder: field.sortOrder }),
        }),
      ]);
      await fetchFields();
    } catch {}
  };

  const addOption = () => {
    if (!optionInput.trim() || !editingField) return;
    setEditingField({
      ...editingField,
      options: [...(editingField.options || []), optionInput.trim()],
    });
    setOptionInput("");
  };

  const removeOption = (index: number) => {
    if (!editingField?.options) return;
    setEditingField({
      ...editingField,
      options: editingField.options.filter((_, i) => i !== index),
    });
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">إدارة نموذج التسجيل</h1>
            <p className="text-slate-500">تحكم في حقول صفحة "سجل الآن" - إضافة، تعديل، حذف، ترتيب</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={seedDefaults}
              disabled={saving}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-60"
            >
              <Settings2 size={16} />
              {fields.length === 0 ? "تحميل الحقول الافتراضية" : "إضافة الحقول الناقصة"}
            </button>
            <button
              onClick={startNew}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors"
            >
              <Plus size={16} />
              إضافة حقل جديد
            </button>
          </div>
        </div>
      </div>

      {editingField && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-800">
              {isNew ? "إضافة حقل جديد" : "تعديل الحقل"}
            </h3>
            <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">مفتاح الحقل (بالإنجليزية)</label>
                <input
                  type="text"
                  value={editingField.fieldKey}
                  onChange={(e) => setEditingField({ ...editingField, fieldKey: e.target.value })}
                  placeholder="مثال: fullName"
                  dir="ltr"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم الحقل (العربي)</label>
                <input
                  type="text"
                  value={editingField.label}
                  onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                  placeholder="مثال: الاسم الرباعي"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">نوع الحقل</label>
                <select
                  value={editingField.fieldType}
                  onChange={(e) => setEditingField({ ...editingField, fieldType: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">نص توضيحي</label>
                <input
                  type="text"
                  value={editingField.placeholder || ""}
                  onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                  placeholder="مثال: أدخل اسمك الكامل"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الترتيب</label>
                <input
                  type="number"
                  value={editingField.sortOrder}
                  onChange={(e) => setEditingField({ ...editingField, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="flex items-center gap-6 pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingField.required}
                    onChange={(e) => setEditingField({ ...editingField, required: e.target.checked })}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm font-medium text-slate-700">مطلوب</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingField.enabled}
                    onChange={(e) => setEditingField({ ...editingField, enabled: e.target.checked })}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm font-medium text-slate-700">مفعّل</span>
                </label>
              </div>
            </div>

            {editingField.fieldType === "university_select" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-800 mb-1">قائمة الجامعات الديناميكية</p>
                <p className="text-xs text-blue-600">هذا الحقل سيعرض تلقائياً قائمة الجامعات المُدارة من قسم "الجامعات والتخصصات" أدناه. لا حاجة لإضافة خيارات يدوياً.</p>
              </div>
            )}

            {editingField.fieldType === "specialization_select" && (
              <div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-3">
                  <p className="text-sm font-medium text-emerald-800 mb-1">قائمة التخصصات الديناميكية</p>
                  <p className="text-xs text-emerald-600">أضف مفتاح حقل الجامعة المرتبط به (مثال: universityChoice1) لعرض تخصصات الجامعة المختارة فقط. اتركه فارغاً لعرض جميع التخصصات.</p>
                </div>
                <label className="block text-sm font-medium text-slate-700 mb-2">مفتاح حقل الجامعة المرتبط (اختياري)</label>
                <select
                  value={editingField.options?.[0] || ""}
                  onChange={(e) => setEditingField({ ...editingField, options: e.target.value ? [e.target.value] : null })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="">— بدون ربط (كل التخصصات) —</option>
                  {fields.filter(f => f.fieldType === "university_select" || ["universityChoice1","universityChoice2","universityChoice3"].includes(f.fieldKey)).map(f => (
                    <option key={f.id} value={f.fieldKey}>{f.label} ({f.fieldKey})</option>
                  ))}
                  {fields.filter(f => f.fieldType === "select" || f.fieldType === "select_with_other").map(f => (
                    <option key={f.id} value={f.fieldKey}>{f.label} ({f.fieldKey})</option>
                  ))}
                </select>
              </div>
            )}

            {(editingField.fieldType === "select" || editingField.fieldType === "select_with_other") && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">خيارات القائمة</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={optionInput}
                    onChange={(e) => setOptionInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
                    placeholder="أضف خيار جديد..."
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={addOption}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    إضافة
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editingField.options?.map((opt, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-sm"
                    >
                      {opt}
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        className="text-red-400 hover:text-red-600 mr-1"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                  {(!editingField.options || editingField.options.length === 0) && (
                    <p className="text-sm text-slate-400">لا توجد خيارات بعد</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={saveField}
                disabled={saving || !editingField.fieldKey || !editingField.label}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
          <h2 className="font-bold text-lg text-slate-800">حقول النموذج ({fields.length})</h2>
        </div>
        {fields.length === 0 ? (
          <div className="p-12 text-center">
            <Settings2 className="mx-auto mb-4 text-slate-300" size={48} />
            <p className="text-slate-500 mb-2">لا توجد حقول محددة</p>
            <p className="text-sm text-slate-400 mb-4">اضغط "تحميل الحقول الافتراضية" لإضافة الحقول الأساسية</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {fields.map((field, idx) => (
              <div
                key={field.id}
                className={`flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors ${
                  !field.enabled ? "opacity-50" : ""
                }`}
              >
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveField(field, "up")}
                    disabled={idx === 0}
                    className="text-slate-400 hover:text-slate-600 disabled:opacity-30"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    onClick={() => moveField(field, "down")}
                    disabled={idx === fields.length - 1}
                    className="text-slate-400 hover:text-slate-600 disabled:opacity-30"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
                <GripVertical className="text-slate-300 shrink-0" size={20} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-slate-900">{field.label}</h4>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded" dir="ltr">
                      {field.fieldKey}
                    </span>
                    {field.required && (
                      <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">مطلوب</span>
                    )}
                    {!field.enabled && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">معطّل</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {FIELD_TYPES.find((t) => t.value === field.fieldType)?.label || field.fieldType}
                    {field.options && field.options.length > 0 && ` - ${field.options.length} خيارات`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleEnabled(field)}
                    className={`w-10 h-6 rounded-full transition-colors relative ${
                      field.enabled ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${
                        field.enabled ? "left-1" : "left-5"
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => startEdit(field)}
                    className="text-blue-500 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => deleteField(field.id)}
                    className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-l from-primary/5 to-slate-50 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <GraduationCap className="text-primary" size={24} />
            <div>
              <h2 className="font-bold text-lg text-slate-800">الجامعات والتخصصات</h2>
              <p className="text-xs text-slate-500">تظهر هذه القائمة للطالب في حقول "الجامعة - الخيار الأول/الثاني/الثالث". المعدل المطلوب لا يظهر للطالب لكن يستخدمه الموقع للتحقق.</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {universities.length === 0 ? (
              <button
                onClick={() => seedUniversities(false)}
                disabled={saving}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-60"
              >
                <Settings2 size={16} />
                تحميل الجامعات الافتراضية
              </button>
            ) : (
              <button
                onClick={() => seedUniversities(true)}
                disabled={saving}
                title="يحذف القائمة الحالية ويستبدلها بالقائمة الكاملة الافتراضية"
                className="flex items-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-60"
              >
                <Settings2 size={16} />
                إعادة تحميل القائمة الافتراضية
              </button>
            )}
            <button
              onClick={startNewUni}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
            >
              <Plus size={16} />
              إضافة جامعة
            </button>
          </div>
        </div>

        {editingUni && (
          <div className="px-6 py-5 bg-blue-50/40 border-b border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800">{isNewUni ? "إضافة جامعة جديدة" : "تعديل الجامعة"}</h3>
              <button onClick={() => setEditingUni(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">اسم الجامعة *</label>
                <input
                  type="text"
                  value={editingUni.name || ""}
                  onChange={(e) => setEditingUni({ ...editingUni, name: e.target.value })}
                  placeholder="مثال: جامعة أزال"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">الترتيب</label>
                <input
                  type="number"
                  value={editingUni.order || 0}
                  onChange={(e) => setEditingUni({ ...editingUni, order: parseInt(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">وصف (اختياري)</label>
                <input
                  type="text"
                  value={editingUni.description || ""}
                  onChange={(e) => setEditingUni({ ...editingUni, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setEditingUni(null)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">إلغاء</button>
              <button
                onClick={saveUni}
                disabled={saving || !editingUni.name}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-60"
              >
                <Save size={14} />
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        )}

        {editingSpec && (
          <div className="px-6 py-5 bg-emerald-50/40 border-b border-emerald-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800">{isNewSpec ? "إضافة تخصص" : "تعديل التخصص"}</h3>
              <button onClick={() => setEditingSpec(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">اسم التخصص *</label>
                <input
                  type="text"
                  value={editingSpec.spec.name || ""}
                  onChange={(e) => setEditingSpec({ ...editingSpec, spec: { ...editingSpec.spec, name: e.target.value } })}
                  placeholder="مثال: الصيدلة"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">المعدل المطلوب (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingSpec.spec.minGpa ?? 0}
                  onChange={(e) => setEditingSpec({ ...editingSpec, spec: { ...editingSpec.spec, minGpa: parseFloat(e.target.value) || 0 } })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
                <p className="text-[11px] text-slate-400 mt-1">لا يُعرض للطالب — يُستخدم فقط للسماح أو المنع.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">القسم المطلوب *</label>
                <select
                  value={editingSpec.spec.track || "both"}
                  onChange={(e) => setEditingSpec({ ...editingSpec, spec: { ...editingSpec.spec, track: e.target.value } })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  {TRACK_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">التصنيف (اختياري)</label>
                <input
                  type="text"
                  value={editingSpec.spec.category || ""}
                  onChange={(e) => setEditingSpec({ ...editingSpec, spec: { ...editingSpec.spec, category: e.target.value } })}
                  placeholder="مثال: العلوم الطبية"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">الترتيب</label>
                <input
                  type="number"
                  value={editingSpec.spec.order || 0}
                  onChange={(e) => setEditingSpec({ ...editingSpec, spec: { ...editingSpec.spec, order: parseInt(e.target.value) || 0 } })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSpec.spec.enabled !== false}
                    onChange={(e) => setEditingSpec({ ...editingSpec, spec: { ...editingSpec.spec, enabled: e.target.checked } })}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm text-slate-700">مفعّل</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setEditingSpec(null)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">إلغاء</button>
              <button
                onClick={saveSpec}
                disabled={saving || !editingSpec.spec.name}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-60"
              >
                <Save size={14} />
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        )}

        {universities.length === 0 ? (
          <div className="p-12 text-center">
            <GraduationCap className="mx-auto mb-3 text-slate-300" size={40} />
            <p className="text-slate-500 text-sm mb-1">لا توجد جامعات بعد</p>
            <p className="text-xs text-slate-400">اضغط "تحميل الجامعات الافتراضية" لإضافة جامعة أزال والجامعة اليمنية</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {universities.map((u) => (
              <div key={u.id} className={!u.enabled ? "opacity-60" : ""}>
                <div className="px-6 py-3 hover:bg-slate-50 flex items-center gap-3">
                  <button
                    onClick={() => setExpandedUni({ ...expandedUni, [u.id]: !expandedUni[u.id] })}
                    className="text-slate-400 hover:text-slate-600 shrink-0"
                  >
                    {expandedUni[u.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  <GraduationCap className="text-primary shrink-0" size={20} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{u.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      <BookOpen className="inline ml-1" size={11} />
                      {u.specializations.length} تخصصات
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleUniEnabled(u)}
                      className={`w-9 h-5 rounded-full transition-colors relative ${u.enabled ? "bg-emerald-500" : "bg-slate-300"}`}
                    >
                      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${u.enabled ? "left-[3px]" : "left-[18px]"}`} />
                    </button>
                    <button
                      onClick={() => startNewSpec(u.id)}
                      className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold mr-1"
                    >
                      <Plus size={12} />
                      تخصص
                    </button>
                    <button onClick={() => startEditUni(u)} className="text-blue-500 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deleteUni(u.id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {expandedUni[u.id] && (
                  <div className="px-6 pb-4 bg-slate-50/50">
                    {u.specializations.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">لا توجد تخصصات. اضغط "تخصص" لإضافة واحد.</p>
                    ) : (
                      <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                              <th className="px-3 py-2 font-medium">التخصص</th>
                              <th className="px-3 py-2 font-medium">التصنيف</th>
                              <th className="px-3 py-2 font-medium">المعدل المطلوب</th>
                              <th className="px-3 py-2 font-medium">القسم</th>
                              <th className="px-3 py-2 font-medium">الحالة</th>
                              <th className="px-3 py-2 font-medium">إجراءات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {u.specializations.map((s) => (
                              <tr key={s.id} className={`hover:bg-slate-50 ${!s.enabled ? "opacity-50" : ""}`}>
                                <td className="px-3 py-2 font-medium text-slate-900">{s.name}</td>
                                <td className="px-3 py-2 text-slate-500">{s.category || "-"}</td>
                                <td className="px-3 py-2">
                                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">{s.minGpa}%</span>
                                </td>
                                <td className="px-3 py-2 text-slate-600">{TRACK_OPTIONS.find((t) => t.value === s.track)?.label || s.track}</td>
                                <td className="px-3 py-2">
                                  <button
                                    onClick={() => toggleSpecEnabled(s)}
                                    className={`w-8 h-4 rounded-full transition-colors relative ${s.enabled ? "bg-emerald-500" : "bg-slate-300"}`}
                                  >
                                    <div className={`w-3 h-3 bg-white rounded-full absolute top-[2px] transition-all ${s.enabled ? "left-[2px]" : "left-[18px]"}`} />
                                  </button>
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex gap-1">
                                    <button onClick={() => startEditSpec(u.id, s)} className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50">
                                      <Pencil size={12} />
                                    </button>
                                    <button onClick={() => deleteSpec(s.id)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50">
                                      <Trash2 size={12} />
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
      </div>
    </AdminLayout>
  );
}
