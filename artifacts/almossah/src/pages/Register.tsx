import { useState, useEffect, useRef, Component, type ReactNode } from "react";
import { useCreateRegistration } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { Upload, X, Loader2, ChevronDown, Lock } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface FormFieldConfig {
  id: number;
  fieldKey: string;
  label: string;
  fieldType: string;
  placeholder: string | null;
  required: boolean;
  options: string[] | string | null;
  sortOrder: number;
  enabled: boolean;
}

interface Specialization {
  id: number;
  name: string;
  category: string | null;
  minGpa: number;
  track: string;
  enabled: boolean;
}

interface University {
  id: number;
  name: string;
  enabled: boolean;
  specializations: Specialization[];
}

function parseOptions(raw: string[] | string | null): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(o => typeof o === "string" && o.trim() !== "");
  try {
    const parsed = JSON.parse(raw as string);
    if (Array.isArray(parsed)) return parsed.filter((o: unknown) => typeof o === "string" && (o as string).trim() !== "");
  } catch {}
  return String(raw).split("\n").map(s => s.trim()).filter(Boolean);
}

const UNIVERSITY_KEYS = ["universityChoice1", "universityChoice2", "universityChoice3"];

class FieldErrorBoundary extends Component<{ children: ReactNode; label: string }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; label: string }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return <Input placeholder={`حقل ${this.props.label}`} onChange={() => {}} />;
    }
    return this.props.children;
  }
}

function isEligible(spec: Specialization, gpa: number, department: string): boolean {
  const gpaOk = gpa === 0 || gpa >= spec.minGpa;
  const trackOk =
    spec.track === "both" ||
    (department === "علمي" && spec.track === "scientific") ||
    (department === "أدبي" && (spec.track === "literary" || spec.track === "both"));
  return gpaOk && trackOk;
}

function ineligibleReason(spec: Specialization, gpa: number, department: string): string {
  const gpaOk = gpa === 0 || gpa >= spec.minGpa;
  const trackOk =
    spec.track === "both" ||
    (department === "علمي" && spec.track === "scientific") ||
    (department === "أدبي" && (spec.track === "literary" || spec.track === "both"));
  if (!trackOk && !gpaOk) return `هذا التخصص للقسم العلمي فقط والحد الأدنى للمعدل ${spec.minGpa}%`;
  if (!trackOk) return "هذا التخصص غير متاح لقسمك الدراسي";
  if (!gpaOk) return `للأسف، معدلك لا يؤهلك لهذا التخصص — الحد الأدنى المطلوب ${spec.minGpa}%`;
  return "";
}

interface SpecSelectProps {
  specs: Specialization[];
  value: string;
  placeholder: string;
  gpa: number;
  department: string;
  onChange: (val: string) => void;
  onBlock: (reason: string) => void;
}

function SpecializationSelect({ specs, value, placeholder, gpa, department, onChange, onBlock }: SpecSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const grouped: Record<string, Specialization[]> = {};
  for (const s of specs) {
    const cat = s.category || "تخصصات";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  }

  const selectedSpec = specs.find(s => s.name === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors text-right"
      >
        <ChevronDown size={16} className={`text-gray-400 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value || placeholder || "اختر التخصص..."}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-y-auto">
          {Object.entries(grouped).map(([cat, catSpecs]) => (
            <div key={cat}>
              <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 bg-gray-50 border-b border-gray-100 sticky top-0">
                {cat}
              </div>
              {catSpecs.map(spec => {
                const eligible = isEligible(spec, gpa, department);
                const isSelected = spec.name === value;
                return (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => {
                      if (!eligible) {
                        onBlock(ineligibleReason(spec, gpa, department));
                      } else {
                        onChange(spec.name);
                        setOpen(false);
                      }
                    }}
                    className={`w-full text-right px-4 py-2.5 text-sm flex items-center justify-between gap-2 transition-colors
                      ${isSelected ? "bg-primary/10 text-primary font-medium" : ""}
                      ${eligible
                        ? "hover:bg-primary/5 text-gray-800 cursor-pointer"
                        : "text-gray-400 cursor-pointer bg-gray-50/60 hover:bg-red-50/60"
                      }`}
                  >
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {!eligible && <Lock size={12} className="text-gray-400" />}
                      {!eligible && spec.minGpa > 0 && (
                        <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full font-medium">
                          {spec.minGpa}%+
                        </span>
                      )}
                    </div>
                    <span className={eligible ? "" : "line-through decoration-gray-300"}>{spec.name}</span>
                  </button>
                );
              })}
            </div>
          ))}
          {specs.length === 0 && (
            <div className="px-4 py-6 text-sm text-gray-400 text-center">لا توجد تخصصات متاحة</div>
          )}
        </div>
      )}

      {selectedSpec && !isEligible(selectedSpec, gpa, department) && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <Lock size={11} />
          {ineligibleReason(selectedSpec, gpa, department)}
        </p>
      )}
    </div>
  );
}

export default function Register() {
  const { toast } = useToast();
  const createRegistration = useCreateRegistration();

  const [fields, setFields] = useState<FormFieldConfig[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [values, setValues] = useState<Record<string, string>>({});
  const [otherMode, setOtherMode] = useState<Record<string, boolean>>({});
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}/api/registration-form-config`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${BASE}/api/universities`).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([fieldsData, uniData]) => {
      setFields(Array.isArray(fieldsData) ? fieldsData.filter((f: FormFieldConfig) => f.enabled) : []);
      setUniversities(Array.isArray(uniData) ? uniData.filter((u: University) => u.enabled) : []);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  const setValue = (key: string, val: string) =>
    setValues(prev => ({ ...prev, [key]: val }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast({ variant: "destructive", title: "حجم الملف كبير", description: "يجب أن لا يتجاوز حجم الصورة 5 ميغابايت" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "نوع ملف غير مدعوم", description: "يرجى اختيار صورة فقط (JPG, PNG, etc.)" });
      return;
    }
    setCertificateFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCertificatePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    for (const field of fields) {
      if (field.required && field.fieldType !== "image") {
        const val = values[field.fieldKey]?.trim();
        if (!val) {
          toast({ variant: "destructive", title: "حقل مطلوب", description: `يرجى ملء حقل "${field.label}"` });
          return;
        }
      }
    }

    const submitData: Record<string, string | undefined> = { ...values };
    if (certificatePreview) submitData.certificateImageUrl = certificatePreview;

    createRegistration.mutate(
      { data: submitData as any },
      {
        onSuccess: () => {
          toast({ title: "تم التسجيل بنجاح", description: "سيتم التواصل معك قريباً." });
          setValues({});
          setOtherMode({});
          setCertificateFile(null);
          setCertificatePreview(null);
        },
        onError: () => {
          toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء التسجيل، يرجى المحاولة لاحقاً." });
        },
      }
    );
  }

  function renderSelectWithOptions(
    key: string,
    value: string,
    placeholder: string,
    options: string[],
    required: boolean,
    withOther: boolean
  ) {
    const isOther = otherMode[key] || false;
    const allOptions = withOther ? [...options, "أخرى"] : options;
    const validOptions = allOptions.filter(o => o && o.trim() !== "");

    if (validOptions.length === 0) {
      return (
        <Input
          placeholder={placeholder}
          value={value}
          required={required}
          onChange={e => setValue(key, e.target.value)}
        />
      );
    }

    if (isOther) {
      return (
        <div className="flex gap-2">
          <Input
            placeholder="اكتب الإجابة"
            value={value}
            onChange={e => setValue(key, e.target.value)}
            autoFocus
            required={required}
          />
          <button
            type="button"
            onClick={() => { setOtherMode(prev => ({ ...prev, [key]: false })); setValue(key, ""); }}
            className="text-xs text-gray-400 hover:text-primary whitespace-nowrap px-2"
          >
            اختر من القائمة
          </button>
        </div>
      );
    }

    return (
      <Select
        value={value}
        onValueChange={val => {
          if (val === "أخرى") {
            setOtherMode(prev => ({ ...prev, [key]: true }));
            setValue(key, "");
          } else {
            setValue(key, val);
          }
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder || "اختر..."} />
        </SelectTrigger>
        <SelectContent className="max-h-56 overflow-y-auto">
          {validOptions.map((opt, idx) => (
            <SelectItem key={`${opt}-${idx}`} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  function renderField(field: FormFieldConfig) {
    const key = field.fieldKey;
    const value = values[key] || "";
    const placeholder = field.placeholder || "";

    if (field.fieldType === "textarea") {
      return (
        <textarea
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary min-h-[100px] max-h-[240px] resize-y"
          placeholder={placeholder}
          value={value}
          required={field.required}
          onChange={e => setValue(key, e.target.value)}
        />
      );
    }

    if (field.fieldType === "image") {
      return (
        <div>
          {!certificatePreview ? (
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
              <Upload className="text-gray-400 mb-2" size={32} />
              <span className="text-sm text-gray-500">{placeholder || "اضغط لرفع صورة"}</span>
              <span className="text-xs text-gray-400 mt-1">JPG, PNG - الحد الأقصى 5 ميغابايت</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          ) : (
            <div className="relative">
              <img src={certificatePreview} alt="صورة" className="w-full max-h-60 object-contain rounded-xl border border-gray-200" />
              <button
                type="button"
                onClick={() => { setCertificateFile(null); setCertificatePreview(null); }}
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

    const isUniversityField = UNIVERSITY_KEYS.includes(key) || field.fieldType === "university_select";

    if (isUniversityField) {
      const uniNames = universities.map(u => u.name).filter(n => n && n.trim() !== "");
      return renderSelectWithOptions(key, value, placeholder || "اختر الجامعة...", uniNames, field.required, true);
    }

    if (field.fieldType === "specialization_select") {
      const linkedUniversityKey = parseOptions(field.options)[0] || "";
      const selectedUniversityName = linkedUniversityKey ? (values[linkedUniversityKey] || "") : "";

      let specs: Specialization[] = [];
      if (selectedUniversityName) {
        const uni = universities.find(u => u.name === selectedUniversityName);
        specs = uni ? uni.specializations.filter(s => s.enabled) : [];
      } else {
        specs = universities.flatMap(u => u.specializations.filter(s => s.enabled));
      }

      const gpa = parseFloat(values["gpa"] || "0") || 0;
      const department = values["department"] || "";

      const noUniSelected = linkedUniversityKey && !values[linkedUniversityKey];
      if (noUniSelected) {
        return (
          <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50">
            {placeholder || "اختر الجامعة أولاً..."}
          </div>
        );
      }

      return (
        <SpecializationSelect
          specs={specs}
          value={value}
          placeholder={placeholder || "اختر التخصص..."}
          gpa={gpa}
          department={department}
          onChange={val => setValue(key, val)}
          onBlock={reason => toast({
            variant: "destructive",
            title: "التخصص غير متاح",
            description: reason,
          })}
        />
      );
    }

    if (field.fieldType === "select" || field.fieldType === "select_with_other") {
      const opts = parseOptions(field.options);
      return renderSelectWithOptions(key, value, placeholder, opts, field.required, field.fieldType === "select_with_other");
    }

    return (
      <Input
        type={key === "email" ? "email" : key === "phone" ? "tel" : "text"}
        placeholder={placeholder}
        value={value}
        required={field.required}
        onChange={e => setValue(key, e.target.value)}
        dir={key === "email" || key === "phone" ? "ltr" : undefined}
        className={key === "email" || key === "phone" ? "text-right" : ""}
      />
    );
  }

  const isWideField = (field: FormFieldConfig) =>
    field.fieldType === "textarea" ||
    field.fieldType === "image" ||
    field.fieldType === "university_select" ||
    field.fieldType === "specialization_select" ||
    UNIVERSITY_KEYS.includes(field.fieldKey);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="bg-primary p-8 text-center text-white">
            <h1 className="text-3xl font-bold">سجل الآن في المقاعد الجامعية المخفضة</h1>
          </div>

          <div className="p-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Loader2 className="animate-spin mb-3" size={32} />
                <p>جاري تحميل النموذج...</p>
              </div>
            ) : fields.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p>النموذج قيد الإعداد، يرجى العودة لاحقاً.</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {fields.map(field => (
                    <div key={field.id} className={isWideField(field) ? "md:col-span-2" : ""}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {field.label}
                        {field.required && <span className="text-red-500 mr-1">*</span>}
                      </label>
                      <FieldErrorBoundary label={field.label}>
                        {renderField(field)}
                      </FieldErrorBoundary>
                    </div>
                  ))}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-lg mt-8"
                  disabled={createRegistration.isPending}
                >
                  {createRegistration.isPending ? (
                    <><Loader2 className="animate-spin ml-2" size={18} />جاري الإرسال...</>
                  ) : "إرسال الطلب"}
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
