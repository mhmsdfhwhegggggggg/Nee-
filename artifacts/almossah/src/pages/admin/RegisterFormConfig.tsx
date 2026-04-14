import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { getAdminToken } from "@/lib/admin-auth";
import { Plus, Pencil, Trash2, GripVertical, Save, X, ChevronDown, ChevronUp, Settings2 } from "lucide-react";

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

const FIELD_TYPES = [
  { value: "text", label: "نص" },
  { value: "select", label: "قائمة منسدلة" },
  { value: "select_with_other", label: "قائمة منسدلة مع خيار أخرى" },
  { value: "textarea", label: "نص طويل" },
  { value: "image", label: "صورة" },
];

export default function RegisterFormConfig() {
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [optionInput, setOptionInput] = useState("");

  const token = getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const fetchFields = async () => {
    try {
      const res = await fetch("/api/admin/registration-form-config", { headers });
      if (res.ok) {
        const data = await res.json();
        setFields(data);
      }
    } catch {}
    setLoading(false);
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
            {fields.length === 0 && (
              <button
                onClick={seedDefaults}
                disabled={saving}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-60"
              >
                <Settings2 size={16} />
                تحميل الحقول الافتراضية
              </button>
            )}
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
    </AdminLayout>
  );
}
