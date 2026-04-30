import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, Loader2, ExternalLink, ClipboardList } from "lucide-react";
import { getAdminToken } from "@/lib/admin-auth";

interface FormField {
  id: number;
  label: string;
  field_type: string;
  placeholder: string | null;
  required: boolean;
  options: string | null;
  sort_order: number;
  is_active: boolean;
}

interface Submission {
  id: number;
  form_data: Record<string, string>;
  status: string;
  notes: string | null;
  created_at: string;
}

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const FIELD_TYPES = [
  { value: "text", label: "نص قصير" },
  { value: "textarea", label: "نص طويل" },
  { value: "email", label: "بريد إلكتروني" },
  { value: "tel", label: "رقم هاتف" },
  { value: "number", label: "رقم" },
  { value: "select", label: "قائمة اختيار" },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "قيد الانتظار", color: "bg-amber-100 text-amber-700" },
  approved: { label: "مقبول", color: "bg-green-100 text-green-700" },
  rejected: { label: "مرفوض", color: "bg-red-100 text-red-700" },
};

function authHeaders() {
  const token = getAdminToken();
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

export default function TrainingFormBuilder() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"fields" | "submissions">("fields");
  const [fields, setFields] = useState<FormField[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    label: "",
    field_type: "text",
    placeholder: "",
    required: false,
    options: "",
    sort_order: 0,
  });

  const fetchFields = async () => {
    setIsLoading(true);
    const res = await fetch(`${BASE}/api/training-form/admin/fields`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    setFields(Array.isArray(data) ? data : []);
    setIsLoading(false);
  };

  const fetchSubmissions = async () => {
    const res = await fetch(`${BASE}/api/training-form/admin/submissions`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    setSubmissions(data.items || []);
    setSubTotal(data.total || 0);
  };

  useEffect(() => {
    fetchFields();
    fetchSubmissions();
  }, []);

  const openAdd = () => {
    setEditingField(null);
    setForm({ label: "", field_type: "text", placeholder: "", required: false, options: "", sort_order: fields.length });
    setDialogOpen(true);
  };

  const openEdit = (field: FormField) => {
    setEditingField(field);
    setForm({
      label: field.label,
      field_type: field.field_type,
      placeholder: field.placeholder || "",
      required: field.required,
      options: field.options || "",
      sort_order: field.sort_order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.label.trim()) {
      toast({ variant: "destructive", title: "اسم الحقل مطلوب" });
      return;
    }
    setSaving(true);
    try {
      const body = {
        label: form.label.trim(),
        field_type: form.field_type,
        placeholder: form.placeholder || null,
        required: form.required,
        options: form.options || null,
        sort_order: form.sort_order,
      };

      if (editingField) {
        await fetch(`${BASE}/api/training-form/admin/fields/${editingField.id}`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify(body),
        });
        toast({ title: "تم تحديث الحقل" });
      } else {
        await fetch(`${BASE}/api/training-form/admin/fields`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(body),
        });
        toast({ title: "تم إضافة الحقل" });
      }
      setDialogOpen(false);
      await fetchFields();
    } catch {
      toast({ variant: "destructive", title: "حدث خطأ، يرجى المحاولة مرة أخرى" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الحقل؟")) return;
    await fetch(`${BASE}/api/training-form/admin/fields/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    toast({ title: "تم حذف الحقل" });
    await fetchFields();
  };

  const handleToggleActive = async (field: FormField) => {
    await fetch(`${BASE}/api/training-form/admin/fields/${field.id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ is_active: !field.is_active }),
    });
    await fetchFields();
  };

  const handleStatusChange = async (id: number, status: string) => {
    await fetch(`${BASE}/api/training-form/admin/submissions/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    await fetchSubmissions();
    toast({ title: "تم تحديث الحالة" });
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">نموذج الدورات والتأمين</h1>
          <p className="text-slate-500 text-sm mt-1">إدارة حقول وطلبات نموذج التسجيل في الدورات التدريبية والتأمين الصحي</p>
        </div>
        <a
          href="/training-register"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ExternalLink size={15} />
          عرض النموذج
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-6 w-fit">
        <button
          onClick={() => setActiveTab("fields")}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "fields" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
        >
          حقول النموذج
        </button>
        <button
          onClick={() => setActiveTab("submissions")}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === "submissions" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
        >
          الطلبات المستلمة
          {subTotal > 0 && (
            <span className="bg-primary text-white text-xs rounded-full px-2 py-0.5">{subTotal}</span>
          )}
        </button>
      </div>

      {/* ─── Fields Tab ─── */}
      {activeTab === "fields" && (
        <div>
          <div className="flex justify-end mb-4">
            <Button onClick={openAdd} className="bg-primary text-white gap-2">
              <Plus size={16} />
              إضافة حقل جديد
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : fields.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <ClipboardList className="text-slate-300 mx-auto mb-4" size={48} />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">لا توجد حقول بعد</h3>
              <p className="text-slate-400 text-sm mb-6">ابدأ بإضافة حقول لنموذج التسجيل</p>
              <Button onClick={openAdd} className="bg-primary text-white gap-2">
                <Plus size={16} />
                إضافة أول حقل
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-medium w-8">#</th>
                      <th className="px-4 py-3 font-medium">اسم الحقل</th>
                      <th className="px-4 py-3 font-medium">النوع</th>
                      <th className="px-4 py-3 font-medium">مطلوب</th>
                      <th className="px-4 py-3 font-medium">نشط</th>
                      <th className="px-4 py-3 font-medium">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fields.map((field, idx) => (
                      <tr key={field.id} className={`hover:bg-slate-50 transition-colors ${!field.is_active ? "opacity-50" : ""}`}>
                        <td className="px-4 py-3 text-slate-400">
                          <GripVertical size={16} className="inline text-slate-300" />
                          <span className="mr-1">{idx + 1}</span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">{field.label}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {FIELD_TYPES.find((t) => t.value === field.field_type)?.label || field.field_type}
                        </td>
                        <td className="px-4 py-3">
                          {field.required ? (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">مطلوب</Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100">اختياري</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleToggleActive(field)} className="text-slate-400 hover:text-primary transition-colors">
                            {field.is_active ? <Eye size={18} className="text-green-500" /> : <EyeOff size={18} />}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(field)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary transition-colors"
                              title="تعديل"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(field.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                              title="حذف"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Submissions Tab ─── */}
      {activeTab === "submissions" && (
        <div>
          {submissions.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <ClipboardList className="text-slate-300 mx-auto mb-4" size={48} />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">لا توجد طلبات بعد</h3>
              <p className="text-slate-400 text-sm">ستظهر هنا الطلبات التي يرسلها المستخدمون</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub) => (
                <div key={sub.id} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                    <div>
                      <span className="text-xs text-slate-400">
                        {new Date(sub.created_at).toLocaleDateString("ar-SA", {
                          year: "numeric", month: "long", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                      <span className="mx-2 text-slate-300">·</span>
                      <span className="text-xs text-slate-400">طلب #{sub.id}</span>
                    </div>
                    <Select
                      value={sub.status}
                      onValueChange={(v) => handleStatusChange(sub.id, v)}
                    >
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">قيد الانتظار</SelectItem>
                        <SelectItem value="approved">مقبول</SelectItem>
                        <SelectItem value="rejected">مرفوض</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(sub.form_data).map(([label, val]) => (
                      <div key={label} className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-400 mb-1">{label}</p>
                        <p className="text-sm font-medium text-slate-800 break-words">{val || "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Add / Edit Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingField ? "تعديل الحقل" : "إضافة حقل جديد"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="mb-1.5 block">اسم الحقل *</Label>
              <Input
                placeholder="مثال: الاسم الكامل"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              />
            </div>

            <div>
              <Label className="mb-1.5 block">نوع الحقل</Label>
              <Select
                value={form.field_type}
                onValueChange={(v) => setForm((f) => ({ ...f, field_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block">نص التلميح (placeholder)</Label>
              <Input
                placeholder="مثال: أدخل اسمك الكامل"
                value={form.placeholder}
                onChange={(e) => setForm((f) => ({ ...f, placeholder: e.target.value }))}
              />
            </div>

            {form.field_type === "select" && (
              <div>
                <Label className="mb-1.5 block">
                  خيارات القائمة
                  <span className="text-slate-400 font-normal mr-2 text-xs">(كل خيار في سطر منفصل)</span>
                </Label>
                <Textarea
                  placeholder={"خيار 1\nخيار 2\nخيار 3"}
                  value={form.options}
                  onChange={(e) => setForm((f) => ({ ...f, options: e.target.value }))}
                  className="min-h-[120px] resize-y"
                  dir="rtl"
                />
              </div>
            )}

            <div>
              <Label className="mb-1.5 block">الترتيب</Label>
              <Input
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
              />
            </div>

            <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
              <Label className="cursor-pointer">حقل مطلوب</Label>
              <Switch
                checked={form.required}
                onCheckedChange={(v) => setForm((f) => ({ ...f, required: v }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 flex-row-reverse">
            <Button onClick={handleSave} className="bg-primary text-white" disabled={saving}>
              {saving ? <Loader2 className="animate-spin ml-2" size={16} /> : null}
              {editingField ? "حفظ التعديلات" : "إضافة الحقل"}
            </Button>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
