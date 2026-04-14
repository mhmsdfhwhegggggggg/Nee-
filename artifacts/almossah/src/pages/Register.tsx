import { useForm } from "react-hook-form";
import { useCreateRegistration } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Upload, X } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface DynamicField {
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

const DEFAULT_FIELDS: DynamicField[] = [
  { id: 1, fieldKey: "fullName", label: "الاسم الرباعي", fieldType: "text", placeholder: "أدخل اسمك الكامل", required: true, options: null, sortOrder: 1, enabled: true },
  { id: 2, fieldKey: "phone", label: "رقم الهاتف", fieldType: "text", placeholder: "7xx xxx xxx", required: true, options: null, sortOrder: 2, enabled: true },
  { id: 3, fieldKey: "email", label: "البريد الإلكتروني", fieldType: "text", placeholder: "example@email.com", required: true, options: null, sortOrder: 3, enabled: true },
  { id: 4, fieldKey: "city", label: "المحافظة/المدينة", fieldType: "select", placeholder: "اختر المحافظة", required: true, options: ["صنعاء", "عدن", "تعز", "حضرموت", "إب", "الحديدة", "مأرب", "المكلا"], sortOrder: 4, enabled: true },
  { id: 5, fieldKey: "department", label: "القسم", fieldType: "select", placeholder: "اختر القسم", required: true, options: ["علمي", "أدبي"], sortOrder: 5, enabled: true },
  { id: 6, fieldKey: "gpa", label: "المعدل", fieldType: "text", placeholder: "مثال: 85.5", required: true, options: null, sortOrder: 6, enabled: true },
  { id: 7, fieldKey: "programType", label: "البرنامج المطلوب", fieldType: "select", placeholder: "اختر البرنامج", required: true, options: ["منح دراسية", "تخفيضات جامعية", "تأمين طبي", "برامج أكاديمية"], sortOrder: 7, enabled: true },
  { id: 8, fieldKey: "universityChoice1", label: "الجامعة - الخيار الأول", fieldType: "select_with_other", placeholder: "اختر الجامعة الأولى", required: true, options: ["الجامعة اللبنانية الدولية", "جامعة العلوم والتكنولوجيا", "جامعة سبأ", "جامعة الملكة أروى", "جامعة الأندلس", "جامعة الحكمة", "جامعة دار السلام", "جامعة الناصر", "جامعة المستقبل", "جامعة الجيل الجديد", "جامعة آزال", "جامعة الإيمان", "جامعة المعرفة والعلوم", "جامعة الوطن", "جامعة القرآن الكريم والدراسات الإسلامية", "جامعة الرازي"], sortOrder: 8, enabled: true },
  { id: 9, fieldKey: "universityChoice2", label: "الجامعة - الخيار الثاني (اختياري)", fieldType: "select_with_other", placeholder: "اختر الجامعة الثانية", required: false, options: ["الجامعة اللبنانية الدولية", "جامعة العلوم والتكنولوجيا", "جامعة سبأ", "جامعة الملكة أروى", "جامعة الأندلس", "جامعة الحكمة", "جامعة دار السلام", "جامعة الناصر", "جامعة المستقبل", "جامعة الجيل الجديد", "جامعة آزال", "جامعة الإيمان", "جامعة المعرفة والعلوم", "جامعة الوطن", "جامعة القرآن الكريم والدراسات الإسلامية", "جامعة الرازي"], sortOrder: 9, enabled: true },
  { id: 10, fieldKey: "universityChoice3", label: "الجامعة - الخيار الثالث (اختياري)", fieldType: "select_with_other", placeholder: "اختر الجامعة الثالثة", required: false, options: ["الجامعة اللبنانية الدولية", "جامعة العلوم والتكنولوجيا", "جامعة سبأ", "جامعة الملكة أروى", "جامعة الأندلس", "جامعة الحكمة", "جامعة دار السلام", "جامعة الناصر", "جامعة المستقبل", "جامعة الجيل الجديد", "جامعة آزال", "جامعة الإيمان", "جامعة المعرفة والعلوم", "جامعة الوطن", "جامعة القرآن الكريم والدراسات الإسلامية", "جامعة الرازي"], sortOrder: 10, enabled: true },
  { id: 11, fieldKey: "certificateImage", label: "صورة الشهادة الثانوية العامة", fieldType: "image", placeholder: "اضغط لرفع صورة الشهادة", required: false, options: null, sortOrder: 11, enabled: true },
  { id: 12, fieldKey: "message", label: "ملاحظات إضافية (اختياري)", fieldType: "textarea", placeholder: "أي تفاصيل أخرى تود إضافتها...", required: false, options: null, sortOrder: 12, enabled: true },
];

export default function Register() {
  const { toast } = useToast();
  const createRegistration = useCreateRegistration();
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [formFields, setFormFields] = useState<DynamicField[]>(DEFAULT_FIELDS);
  const [otherStates, setOtherStates] = useState<Record<string, boolean>>({});

  const form = useForm({
    defaultValues: {} as Record<string, string>,
  });

  useEffect(() => {
    fetch("/api/registration-form-config")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed");
      })
      .then((data: DynamicField[]) => {
        if (data && data.length > 0) {
          setFormFields(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: "destructive",
        title: "حجم الملف كبير",
        description: "يجب أن لا يتجاوز حجم الصورة 5 ميغابايت",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "نوع ملف غير مدعوم",
        description: "يرجى اختيار صورة فقط (JPG, PNG, etc.)",
      });
      return;
    }

    setCertificateFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setCertificatePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeCertificate = () => {
    setCertificateFile(null);
    setCertificatePreview(null);
  };

  function onSubmit(values: Record<string, string>) {
    const submitData: Record<string, string | undefined> = { ...values };
    if (certificatePreview) {
      submitData.certificateImageUrl = certificatePreview;
    }

    Object.keys(submitData).forEach((key) => {
      if (submitData[key] === "" || submitData[key] === undefined) {
        delete submitData[key];
      }
    });

    const requiredFields = formFields.filter((f) => f.required && f.fieldType !== "image");
    for (const field of requiredFields) {
      if (!submitData[field.fieldKey]) {
        toast({
          variant: "destructive",
          title: "حقول مطلوبة",
          description: `يرجى ملء حقل "${field.label}"`,
        });
        return;
      }
    }

    createRegistration.mutate(
      { data: submitData as any },
      {
        onSuccess: () => {
          toast({
            title: "تم التسجيل بنجاح",
            description: "سيتم التواصل معك قريبا.",
          });
          form.reset();
          setCertificateFile(null);
          setCertificatePreview(null);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "خطأ",
            description: "حدث خطأ أثناء التسجيل، يرجى المحاولة لاحقا.",
          });
        },
      }
    );
  }

  const toggleOther = (key: string, value: boolean) => {
    setOtherStates((prev) => ({ ...prev, [key]: value }));
    if (value) {
      form.setValue(key, "");
    }
  };

  const renderField = (field: DynamicField) => {
    if (field.fieldType === "image") {
      return (
        <div key={field.id} className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
          {!certificatePreview ? (
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
              <Upload className="text-gray-400 mb-2" size={32} />
              <span className="text-sm text-gray-500">{field.placeholder || "اضغط لرفع صورة"}</span>
              <span className="text-xs text-gray-400 mt-1">JPG, PNG - الحد الأقصى 5 ميغابايت</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          ) : (
            <div className="relative">
              <img src={certificatePreview} alt="صورة" className="w-full max-h-60 object-contain rounded-xl border border-gray-200" />
              <button
                type="button"
                onClick={removeCertificate}
                className="absolute top-2 left-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X size={16} />
              </button>
              <p className="text-xs text-gray-500 mt-2">{certificateFile?.name}</p>
            </div>
          )}
        </div>
      );
    }

    if (field.fieldType === "textarea") {
      return (
        <FormField
          key={field.id}
          control={form.control}
          name={field.fieldKey}
          render={({ field: formFieldProps }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>{field.label}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={field.placeholder || ""}
                  className="min-h-[100px]"
                  {...formFieldProps}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }

    if (field.fieldType === "select" && field.options) {
      return (
        <FormField
          key={field.id}
          control={form.control}
          name={field.fieldKey}
          render={({ field: formFieldProps }) => (
            <FormItem className={field.fieldKey === "programType" ? "md:col-span-2" : ""}>
              <FormLabel>{field.label}</FormLabel>
              <Select onValueChange={formFieldProps.onChange} value={formFieldProps.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder || "اختر..."} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {field.options!.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }

    if (field.fieldType === "select_with_other" && field.options) {
      const isOther = otherStates[field.fieldKey] || false;
      return (
        <FormField
          key={field.id}
          control={form.control}
          name={field.fieldKey}
          render={({ field: formFieldProps }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>{field.label}</FormLabel>
              {!isOther ? (
                <Select
                  onValueChange={(val) => {
                    if (val === "__other__") {
                      toggleOther(field.fieldKey, true);
                    } else {
                      formFieldProps.onChange(val);
                    }
                  }}
                  value={formFieldProps.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder || "اختر..."} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.options!.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                    <SelectItem value="__other__">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      placeholder="اكتب هنا..."
                      value={formFieldProps.value || ""}
                      onChange={formFieldProps.onChange}
                      autoFocus
                    />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => {
                      toggleOther(field.fieldKey, false);
                      formFieldProps.onChange("");
                    }}
                    className="text-xs text-gray-400 hover:text-primary whitespace-nowrap px-2"
                  >
                    اختر من القائمة
                  </button>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }

    return (
      <FormField
        key={field.id}
        control={form.control}
        name={field.fieldKey}
        render={({ field: formFieldProps }) => (
          <FormItem>
            <FormLabel>{field.label}</FormLabel>
            <FormControl>
              <Input
                placeholder={field.placeholder || ""}
                dir={["email", "phone", "gpa"].includes(field.fieldKey) ? "ltr" : undefined}
                className={["email", "phone", "gpa"].includes(field.fieldKey) ? "text-right" : ""}
                {...formFieldProps}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="bg-primary p-8 text-center text-white">
            <h1 className="text-3xl font-bold mb-2">سجل الآن</h1>
            <p className="text-white/80">املأ النموذج أدناه للتقديم على برامج المؤسسة</p>
          </div>

          <div className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {formFields.map((field) => renderField(field))}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-lg mt-8"
                  disabled={createRegistration.isPending}
                >
                  {createRegistration.isPending ? "جاري الإرسال..." : "إرسال الطلب"}
                </Button>
              </form>
            </Form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
