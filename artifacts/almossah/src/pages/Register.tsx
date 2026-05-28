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
  import { GraduationCap, Loader2, CheckCircle2, Upload, X } from "lucide-react";

  interface FormField {
    id: number;
    fieldKey: string;
    label: string;
    fieldType: string;
    placeholder: string | null;
    required: boolean;
    options: string[] | null;
    sortOrder: number;
  }

  const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

  export default function Register() {
    const { toast } = useToast();
    const [fields, setFields] = useState<FormField[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [values, setValues] = useState<Record<string, string>>({});
    const [otherValues, setOtherValues] = useState<Record<string, string>>({});
    const [fileData, setFileData] = useState<Record<string, { name: string; base64: string }>>({});
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
      fetch(`${BASE}/api/registration-form-config`)
        .then((r) => r.json())
        .then((data) => {
          setFields(Array.isArray(data) ? data : []);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }, []);

    const handleChange = (key: string, value: string) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFileData((prev) => ({ ...prev, [key]: { name: file.name, base64 } }));
        setValues((prev) => ({ ...prev, [key]: base64 }));
      };
      reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      for (const field of fields) {
        const val =
          field.fieldType === "select_with_other" && values[field.fieldKey] === "__other__"
            ? otherValues[field.fieldKey]
            : values[field.fieldKey];
        if (field.required && !val?.trim()) {
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
        const body: Record<string, string> = {};
        for (const field of fields) {
          let val = values[field.fieldKey] || "";
          if (field.fieldType === "select_with_other" && val === "__other__") {
            val = otherValues[field.fieldKey] || "";
          }
          if (field.fieldKey === "certificateImage") {
            body["certificateImageUrl"] = val;
          } else {
            body[field.fieldKey] = val;
          }
        }

        const res = await fetch(`${BASE}/api/registrations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          setSubmitted(true);
          toast({ title: "تم إرسال طلبك بنجاح" });
        } else {
          const data = await res.json();
          throw new Error(data.error || data.message || "حدث خطأ");
        }
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "خطأ في الإرسال",
          description: err.message || "حدث خطأ أثناء الإرسال، يرجى المحاولة لاحقاً",
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    const renderField = (field: FormField) => {
      const value = values[field.fieldKey] || "";

      switch (field.fieldType) {
        case "textarea":
          return (
            <Textarea
              id={`field-${field.id}`}
              placeholder={field.placeholder || ""}
              value={value}
              onChange={(e) => handleChange(field.fieldKey, e.target.value)}
              required={field.required}
              className="min-h-[100px] resize-y"
            />
          );

        case "select":
          return (
            <Select value={value} onValueChange={(v) => handleChange(field.fieldKey, v)}>
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || "اختر..."} />
              </SelectTrigger>
              <SelectContent className="max-h-56 overflow-y-auto">
                {(field.options || []).map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );

        case "select_with_other":
          return (
            <div className="space-y-2">
              <Select value={value} onValueChange={(v) => handleChange(field.fieldKey, v)}>
                <SelectTrigger>
                  <SelectValue placeholder={field.placeholder || "اختر..."} />
                </SelectTrigger>
                <SelectContent className="max-h-56 overflow-y-auto">
                  {(field.options || []).map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                  <SelectItem value="__other__">أخرى...</SelectItem>
                </SelectContent>
              </Select>
              {value === "__other__" && (
                <Input
                  placeholder="أدخل القيمة"
                  value={otherValues[field.fieldKey] || ""}
                  onChange={(e) =>
                    setOtherValues((prev) => ({ ...prev, [field.fieldKey]: e.target.value }))
                  }
                  required={field.required}
                />
              )}
            </div>
          );

        case "file":
        case "image":
          return (
            <div>
              {fileData[field.fieldKey] ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="text-green-600 shrink-0" size={16} />
                    <span className="text-sm text-green-700 truncate flex-1">
                      {fileData[field.fieldKey].name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFileData((prev) => {
                          const n = { ...prev };
                          delete n[field.fieldKey];
                          return n;
                        });
                        setValues((prev) => ({ ...prev, [field.fieldKey]: "" }));
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <img
                    src={fileData[field.fieldKey].base64}
                    alt="معاينة الصورة"
                    className="w-full max-h-48 object-contain rounded-lg border border-gray-200"
                  />
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors group">
                  <Upload className="text-primary/60 mb-2 group-hover:text-primary transition-colors" size={24} />
                  <span className="text-sm text-primary/80 font-medium">انقر لرفع صورة الشهادة</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP — حتى 10MB</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, field.fieldKey)}
                  />
                </label>
              )}
            </div>
          );

        default:
          return (
            <Input
              id={`field-${field.id}`}
              type={
                field.fieldType === "number"
                  ? "number"
                  : field.fieldType === "email"
                  ? "email"
                  : field.fieldType === "tel"
                  ? "tel"
                  : "text"
              }
              placeholder={field.placeholder || ""}
              value={value}
              onChange={(e) => handleChange(field.fieldKey, e.target.value)}
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
              <CheckCircle2 className="text-green-600" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">تم استلام طلبك!</h2>
            <p className="text-gray-500 mb-6">
              شكراً لتقديمك. سيتم التواصل معك قريباً من قِبل فريق المؤسسة.
            </p>
            <Button
              className="bg-primary text-white"
              onClick={() => {
                setSubmitted(false);
                setValues({});
                setOtherValues({});
                setFileData({});
              }}
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
              <GraduationCap className="mx-auto mb-3" size={40} />
              <h1 className="text-3xl font-bold mb-2">سجّل الآن</h1>
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
                  <GraduationCap className="text-gray-300 mb-4" size={56} />
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
                          field.fieldType === "textarea" ||
                          field.fieldType === "file" ||
                          field.fieldType === "select_with_other"
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
  