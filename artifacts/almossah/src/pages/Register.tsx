import { useForm } from "react-hook-form";
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
import { useState } from "react";
import { Upload, X } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const formSchema = z.object({
  fullName: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone: z.string().min(9, "رقم الهاتف غير صالح"),
  city: z.string().min(1, "يرجى اختيار المدينة"),
  programType: z.string().min(1, "يرجى اختيار البرنامج"),
  gpa: z.string().min(1, "يرجى إدخال المعدل"),
  department: z.string().min(1, "يرجى اختيار القسم"),
  universityChoice1: z.string().min(1, "يرجى اختيار الجامعة الأولى"),
  universityChoice2: z.string().optional(),
  universityChoice3: z.string().optional(),
  message: z.string().optional(),
});

export default function Register() {
  const { toast } = useToast();
  const createRegistration = useCreateRegistration();
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

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
      universityChoice2: "",
      universityChoice3: "",
      message: "",
    },
  });

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

  function onSubmit(values: z.infer<typeof formSchema>) {
    const submitData: Record<string, string | undefined> = {
      ...values,
      certificateImageUrl: certificatePreview || undefined,
    };

    createRegistration.mutate(
      { data: submitData as any },
      {
        onSuccess: () => {
          toast({
            title: "تم التسجيل بنجاح",
            description: "سيتم التواصل معك قريباً.",
          });
          form.reset();
          setCertificateFile(null);
          setCertificatePreview(null);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "خطأ",
            description: "حدث خطأ أثناء التسجيل، يرجى المحاولة لاحقاً.",
          });
        },
      }
    );
  }

  const [uni1IsOther, setUni1IsOther] = useState(false);
  const [uni2IsOther, setUni2IsOther] = useState(false);
  const [uni3IsOther, setUni3IsOther] = useState(false);

  const cities = ["صنعاء", "عدن", "تعز", "حضرموت", "إب", "الحديدة", "مأرب", "المكلا"];
  const programs = ["منح دراسية", "تخفيضات جامعية", "تأمين طبي", "برامج أكاديمية"];
  const universities = [
    "الجامعة اللبنانية الدولية",
    "جامعة العلوم والتكنولوجيا",
    "جامعة سبأ",
    "جامعة الملكة أروى",
    "جامعة الأندلس",
    "جامعة الحكمة",
    "جامعة دار السلام",
    "جامعة الناصر",
    "جامعة المستقبل",
    "جامعة الجيل الجديد",
    "جامعة آزال",
    "جامعة الإيمان",
    "جامعة المعرفة والعلوم",
    "جامعة الوطن",
    "جامعة القرآن الكريم والدراسات الإسلامية",
    "جامعة الرازي",
    "أخرى",
  ];

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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر المحافظة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cities.map((city) => (
                              <SelectItem key={city} value={city}>
                                {city}
                              </SelectItem>
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
                        <FormLabel>القسم</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <FormLabel>المعدل</FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: 85.5" dir="ltr" className="text-right" {...field} />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر البرنامج" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {programs.map((program) => (
                              <SelectItem key={program} value={program}>
                                {program}
                              </SelectItem>
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
                        {!uni1IsOther ? (
                          <Select
                            onValueChange={(val) => {
                              if (val === "أخرى") {
                                setUni1IsOther(true);
                                field.onChange("");
                              } else {
                                field.onChange(val);
                              }
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر الجامعة الأولى" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-56 overflow-y-auto">
                              {universities.map((uni) => (
                                <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                placeholder="اكتب اسم الجامعة"
                                value={field.value}
                                onChange={field.onChange}
                                autoFocus
                              />
                            </FormControl>
                            <button type="button" onClick={() => { setUni1IsOther(false); field.onChange(""); }}
                              className="text-xs text-gray-400 hover:text-primary whitespace-nowrap px-2">
                              اختر من القائمة
                            </button>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="universityChoice2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الجامعة - الخيار الثاني (اختياري)</FormLabel>
                        {!uni2IsOther ? (
                          <Select
                            onValueChange={(val) => {
                              if (val === "أخرى") {
                                setUni2IsOther(true);
                                field.onChange("");
                              } else {
                                field.onChange(val);
                              }
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر الجامعة الثانية" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-56 overflow-y-auto">
                              {universities.map((uni) => (
                                <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                placeholder="اكتب اسم الجامعة"
                                value={field.value}
                                onChange={field.onChange}
                                autoFocus
                              />
                            </FormControl>
                            <button type="button" onClick={() => { setUni2IsOther(false); field.onChange(""); }}
                              className="text-xs text-gray-400 hover:text-primary whitespace-nowrap px-2">
                              اختر من القائمة
                            </button>
                          </div>
                        )}
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
                        {!uni3IsOther ? (
                          <Select
                            onValueChange={(val) => {
                              if (val === "أخرى") {
                                setUni3IsOther(true);
                                field.onChange("");
                              } else {
                                field.onChange(val);
                              }
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر الجامعة الثالثة" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-56 overflow-y-auto">
                              {universities.map((uni) => (
                                <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                placeholder="اكتب اسم الجامعة"
                                value={field.value}
                                onChange={field.onChange}
                                autoFocus
                              />
                            </FormControl>
                            <button type="button" onClick={() => { setUni3IsOther(false); field.onChange(""); }}
                              className="text-xs text-gray-400 hover:text-primary whitespace-nowrap px-2">
                              اختر من القائمة
                            </button>
                          </div>
                        )}
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
                            className="min-h-[100px] max-h-[240px] resize-y overflow-y-auto"
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
