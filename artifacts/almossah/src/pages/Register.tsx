import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Upload, X, Info } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const formSchema = z.object({
  fullName: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone: z.string().min(9, "رقم الهاتف غير صالح"),
  city: z.string().min(1, "يرجى اختيار المدينة"),
  programType: z.string().min(1, "يرجى اختيار البرنامج"),
  gpa: z.string().min(1, "يرجى إدخال المعدل").refine((v) => {
    const n = parseFloat(v);
    return !isNaN(n) && n >= 0 && n <= 100;
  }, "يرجى إدخال معدل صحيح بين 0 و100"),
  department: z.string().min(1, "يرجى اختيار القسم"),
  universityChoice1: z.string().min(1, "يرجى اختيار الجامعة الأولى"),
  specialty: z.string().optional(),
  universityChoice2: z.string().optional(),
  universityChoice3: z.string().optional(),
  message: z.string().optional(),
});

interface Specialty {
  id: number;
  university_name: string;
  specialty_name: string;
  department_type: string;
  min_gpa: number;
}

export default function Register() {
  const { toast } = useToast();
  const createRegistration = useCreateRegistration();
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [allSpecialties, setAllSpecialties] = useState<Specialty[]>([]);
  const [filteredSpecialties, setFilteredSpecialties] = useState<Specialty[]>([]);
  const [specialtiesLoading, setSpecialtiesLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      city: "",
      programType: "",
      gpa: "",
      department: "",
      universityChoice1: "",
      specialty: "",
      universityChoice2: "",
      universityChoice3: "",
      message: "",
    },
  });

  const watchedUniversity = useWatch({ control: form.control, name: "universityChoice1" });
  const watchedGpa = useWatch({ control: form.control, name: "gpa" });
  const watchedDepartment = useWatch({ control: form.control, name: "department" });

  useEffect(() => {
    if (!watchedUniversity) {
      setAllSpecialties([]);
      setFilteredSpecialties([]);
      form.setValue("specialty", "");
      return;
    }
    setSpecialtiesLoading(true);
    fetch(`/api/university-specialties?university=${encodeURIComponent(watchedUniversity)}`)
      .then((r) => r.json())
      .then((data: Specialty[]) => setAllSpecialties(Array.isArray(data) ? data : []))
      .catch(() => setAllSpecialties([]))
      .finally(() => setSpecialtiesLoading(false));
    form.setValue("specialty", "");
  }, [watchedUniversity]);

  useEffect(() => {
    const gpaNum = parseFloat(watchedGpa);
    const filtered = allSpecialties.filter((s) => {
      const gpaOk = isNaN(gpaNum) || gpaNum >= Number(s.min_gpa);
      const deptOk =
        s.department_type === "all" ||
        !watchedDepartment ||
        s.department_type === watchedDepartment;
      return gpaOk && deptOk;
    });
    setFilteredSpecialties(filtered);
    const currentSpecialty = form.getValues("specialty");
    if (currentSpecialty && !filtered.find((s) => s.specialty_name === currentSpecialty)) {
      form.setValue("specialty", "");
    }
  }, [watchedGpa, watchedDepartment, allSpecialties]);

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
    reader.onload = (event) => setCertificatePreview(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeCertificate = () => {
    setCertificateFile(null);
    setCertificatePreview(null);
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    const submitData: Record<string, string | undefined> = {
      ...values,
      certificateImageUrl: certificatePreview || undefined,
    };
    createRegistration.mutate(
      { data: submitData as any },
      {
        onSuccess: () => {
          toast({ title: "تم التسجيل بنجاح", description: "سيتم التواصل معك قريباً." });
          form.reset();
          setCertificateFile(null);
          setCertificatePreview(null);
          setAllSpecialties([]);
          setFilteredSpecialties([]);
        },
        onError: () => {
          toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء التسجيل، يرجى المحاولة لاحقاً." });
        },
      }
    );
  }

  const cities = ["صنعاء", "عدن", "تعز", "حضرموت", "إب", "الحديدة", "مأرب", "المكلا"];
  const programs = ["منح دراسية", "تخفيضات جامعية", "تأمين طبي", "دورات تدريبية", "برامج أكاديمية"];
  const universities = [
    "جامعة صنعاء", "جامعة عدن", "جامعة تعز", "جامعة حضرموت",
    "جامعة إب", "جامعة ذمار", "جامعة الحديدة",
    "الجامعة اللبنانية الدولية", "جامعة العلوم والتكنولوجيا",
    "جامعة سبأ", "جامعة الملكة أروى", "جامعة الأندلس",
    "جامعة الحكمة", "جامعة دار السلام", "جامعة الناصر",
    "جامعة المستقبل", "جامعة الجيل الجديد", "جامعة آزال",
    "الجامعة اليمنية", "أخرى",
  ];

  const gpaNum = parseFloat(watchedGpa);
  const hasValidGpa = !isNaN(gpaNum) && gpaNum >= 0 && gpaNum <= 100;
  const showNoSpecialtiesForUni = watchedUniversity && allSpecialties.length === 0 && !specialtiesLoading;
  const showSpecialtyHint = watchedUniversity && hasValidGpa && allSpecialties.length > 0 && filteredSpecialties.length === 0 && !specialtiesLoading;

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
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم الرباعي</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل اسمك الكامل" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم الهاتف</FormLabel>
                        <FormControl>
                          <Input placeholder="7xx xxx xxx" dir="ltr" className="text-right" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>البريد الإلكتروني</FormLabel>
                        <FormControl>
                          <Input placeholder="example@email.com" dir="ltr" className="text-right" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المحافظة/المدينة</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر المحافظة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cities.map((city) => (
                              <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>قسم الثانوية</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر القسم" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="علمي">علمي</SelectItem>
                            <SelectItem value="أدبي">أدبي</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gpa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>معدل الثانوية العامة (%)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="مثال: 85.5"
                            dir="ltr"
                            className="text-right"
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="programType"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>البرنامج المطلوب</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر البرنامج" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {programs.map((program) => (
                              <SelectItem key={program} value={program}>{program}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="universityChoice1"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>الجامعة - الخيار الأول</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الجامعة الأولى" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {universities.map((uni) => (
                              <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchedUniversity && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">التخصص المطلوب</label>
                      {specialtiesLoading ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 py-3 px-3 border border-gray-200 rounded-lg">
                          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          جاري تحميل التخصصات المتاحة...
                        </div>
                      ) : showNoSpecialtiesForUni ? (
                        <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                          <Info size={16} className="shrink-0 mt-0.5" />
                          <span>لا توجد تخصصات مضافة لهذه الجامعة حتى الآن. يمكنك ذكر التخصص في ملاحظات إضافية.</span>
                        </div>
                      ) : showSpecialtyHint ? (
                        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                          <Info size={16} className="shrink-0 mt-0.5" />
                          <span>
                            لا توجد تخصصات متاحة بمعدل {watchedGpa}%
                            {watchedDepartment ? ` للقسم ${watchedDepartment}` : ""}
                            في هذه الجامعة. يرجى مراجعة شروط القبول.
                          </span>
                        </div>
                      ) : filteredSpecialties.length > 0 ? (
                        <>
                          <FormField
                            control={form.control}
                            name="specialty"
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="اختر التخصص المتاح لمعدلك" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {filteredSpecialties.map((s) => (
                                      <SelectItem key={s.id} value={s.specialty_name}>
                                        <span>{s.specialty_name}</span>
                                        <span className="text-gray-400 text-xs mr-2">
                                          ({Number(s.min_gpa)}%+
                                          {s.department_type !== "all" ? ` ${s.department_type}` : ""})
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {hasValidGpa && (
                            <p className="text-xs text-gray-400 mt-1.5">
                              يعرض التخصصات المتاحة لمعدل {watchedGpa}%
                              {watchedDepartment ? ` - قسم ${watchedDepartment}` : ""}
                              ({filteredSpecialties.length} تخصص)
                            </p>
                          )}
                        </>
                      ) : !hasValidGpa ? (
                        <div className="flex items-start gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
                          <Info size={16} className="shrink-0 mt-0.5" />
                          <span>أدخل معدلك أولاً لعرض التخصصات المتاحة لك.</span>
                        </div>
                      ) : null}
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="universityChoice2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الجامعة - الخيار الثاني (اختياري)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الجامعة الثانية" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {universities.map((uni) => (
                              <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="universityChoice3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الجامعة - الخيار الثالث (اختياري)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الجامعة الثالثة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {universities.map((uni) => (
                              <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      صورة الشهادة الثانوية العامة
                    </label>
                    {!certificatePreview ? (
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                        <Upload className="text-gray-400 mb-2" size={32} />
                        <span className="text-sm text-gray-500">اضغط لرفع صورة الشهادة</span>
                        <span className="text-xs text-gray-400 mt-1">JPG, PNG - الحد الأقصى 5 ميغابايت</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      </label>
                    ) : (
                      <div className="relative">
                        <img src={certificatePreview} alt="صورة الشهادة" className="w-full max-h-60 object-contain rounded-xl border border-gray-200" />
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

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>ملاحظات إضافية (اختياري)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="أي تفاصيل أخرى تود إضافتها..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
