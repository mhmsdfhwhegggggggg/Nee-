import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
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
import { ClipboardList, Loader2 } from "lucide-react";

interface FormField {
  id: number;
  label: string;
  field_type: string;
  placeholder: string | null;
  required: boolean;
  options: string | null;
  sort_order: number;
}

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export default function TrainingRegister() {
  const { toast } = useToast();
  const [fields, setFields] = useState<FormField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/training-form/fields`)
      .then((r) => r.json())
      .then((data) => {
        setFields(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const handleChange = (id: number, value: string) => {
    setValues((prev) => ({ ...prev, [String(id)]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    for (const field of fields) {
      if (field.required && !values[String(field.id)]?.trim()) {
        toast({
          variant: "destructive",
          title: "حقل مطلوب",
          description: `يرجى ملء حقل "${field.label}"`,
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Build form data with labels
      const formData: Record<string, string> = {};
      for (const field of fields) {
        formData[field.label] = values[String(field.id)] || "";
      }

      const res = await fetch(`${BASE}/api/training-form/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitted(true);
        toast({ title: "تم الإرسال بنجاح", description: data.message });
      } else {
        throw new Error(data.message || "حدث خطأ");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: err.message || "حدث خطأ أثناء الإرسال، يرجى المحاولة لاحقاً",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = values[String(field.id)] || "";
    const options = field.options
      ? field.options.split("\n").map((o) => o.trim()).filter(Boolean)
      : [];

    switch (field.field_type) {
      case "textarea":
        return (
          <Textarea
            id={`field-${field.id}`}
            placeholder={field.placeholder || ""}
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
            className="min-h-[100px] max-h-[220px] resize-y overflow-y-auto"
          />
        );
      case "select":
        return (
          <Select
            value={value}
            onValueChange={(v) => handleChange(field.id, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "اختر..."} />
            </SelectTrigger>
            <SelectContent className="max-h-56 overflow-y-auto">
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            id={`field-${field.id}`}
            type={field.field_type === "number" ? "number" : field.field_type === "email" ? "email" : field.field_type === "tel" ? "tel" : "text"}
            placeholder={field.placeholder || ""}
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
          />
        );
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 py-16 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center max-w-md mx-4"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ClipboardList className="text-green-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">تم استلام طلبك!</h2>
          <p className="text-gray-500 mb-6">
            شكراً لتسجيلك. سيتم التواصل معك قريباً من قِبل فريق المؤسسة.
          </p>
          <Button
            className="bg-primary text-white"
            onClick={() => { setSubmitted(false); setValues({}); }}
          >
            تسجيل طلب جديد
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="bg-primary p-8 text-center text-white">
            <ClipboardList className="mx-auto mb-3" size={40} />
            <h1 className="text-3xl font-bold mb-2">
              سجل الآن في الدورات التدريبية والتأهيل أو التأمين الصحي
            </h1>
            <p className="text-white/80">
              املأ النموذج أدناه وسيتم التواصل معك من قِبل فريق المؤسسة
            </p>
          </div>

          <div className="p-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Loader2 className="animate-spin mb-3" size={32} />
                <p>جاري تحميل النموذج...</p>
              </div>
            ) : fields.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ClipboardList className="text-gray-300 mb-4" size={56} />
                <h3 className="text-lg font-semibold text-gray-500 mb-2">
                  النموذج قيد الإعداد
                </h3>
                <p className="text-gray-400 text-sm">
                  يتم حالياً إعداد حقول هذا النموذج من قِبل الإدارة.
                  <br />
                  يرجى العودة لاحقاً.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {fields.map((field) => (
                    <div
                      key={field.id}
                      className={
                        field.field_type === "textarea"
                          ? "md:col-span-2"
                          : ""
                      }
                    >
                      <Label htmlFor={`field-${field.id}`} className="mb-1.5 block">
                        {field.label}
                        {field.required && (
                          <span className="text-red-500 mr-1">*</span>
                        )}
                      </Label>
                      {renderField(field)}
                    </div>
                  ))}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-lg mt-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin ml-2" size={18} />
                      جاري الإرسال...
                    </>
                  ) : (
                    "إرسال الطلب"
                  )}
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
