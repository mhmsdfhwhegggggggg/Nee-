import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Plus, Trash2, Loader2, UserCheck } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const CITIES = [
  "صنعاء", "عدن", "تعز", "الحديدة", "إب", "حضرموت", "ذمار", "مأرب",
  "لحج", "أبين", "شبوة", "المهرة", "ريمة", "الجوف", "عمران", "البيضاء",
  "حجة", "المحويت", "صعدة", "الضالع", "خارج اليمن",
];

const TRAINING_DOMAINS = [
  "الصحة", "الإدارة", "القيادة", "الموارد البشرية", "البحث العلمي",
  "الإحصاء", "الذكاء الاصطناعي", "ريادة الأعمال", "الجودة",
  "المالية", "التربية", "اللغات", "تقنية المعلومات",
];

interface Education {
  degree: string;
  specialization: string;
  university: string;
  graduationYear: string;
}

interface ProposedProgram {
  name: string;
  duration: string;
  targetAudience: string;
  mode: string;
}

function SectionCard({ title, number, children }: { title: string; number: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: number * 0.04 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div className="bg-gradient-to-l from-[#C41E24]/5 to-transparent border-b border-gray-100 px-6 py-4 flex items-center gap-3">
        <span className="w-8 h-8 bg-[#C41E24] text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">{number}</span>
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Label className="text-gray-700 font-semibold text-sm block mb-2">
      {children}
      {required && <span className="text-red-500 mr-1">*</span>}
    </Label>
  );
}

export default function TrainerApplication() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Section 1 - Personal Info
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Section 2 - Education
  const [educations, setEducations] = useState<Education[]>([
    { degree: "", specialization: "", university: "", graduationYear: "" },
  ]);

  // Section 3 - Work Experience
  const [currentEmployer, setCurrentEmployer] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [pastPositions, setPastPositions] = useState("");

  // Section 4 - Training Experience
  const [trainingSince, setTrainingSince] = useState("");
  const [coursesCount, setCoursesCount] = useState("");
  const [topCourses, setTopCourses] = useState("");
  const [trainedAt, setTrainedAt] = useState("");
  const [mediaLinks, setMediaLinks] = useState("");

  // Section 5 - Domains
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [otherDomain, setOtherDomain] = useState("");

  // Section 6 - Programs
  const [proposedPrograms, setProposedPrograms] = useState<ProposedProgram[]>([
    { name: "", duration: "", targetAudience: "", mode: "" },
  ]);
  const [hasReadyProgram, setHasReadyProgram] = useState("");
  const [readyProgramName, setReadyProgramName] = useState("");

  // Section 7 - CV
  const [cvLink, setCvLink] = useState("");

  // Section 8 - Essay
  const [essay, setEssay] = useState("");

  const addEducation = () =>
    setEducations((prev) => [
      ...prev,
      { degree: "", specialization: "", university: "", graduationYear: "" },
    ]);
  const removeEducation = (i: number) =>
    setEducations((prev) => prev.filter((_, idx) => idx !== i));
  const updateEducation = (i: number, field: keyof Education, value: string) =>
    setEducations((prev) =>
      prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e))
    );

  const addProgram = () =>
    setProposedPrograms((prev) => [
      ...prev,
      { name: "", duration: "", targetAudience: "", mode: "" },
    ]);
  const removeProgram = (i: number) =>
    setProposedPrograms((prev) => prev.filter((_, idx) => idx !== i));
  const updateProgram = (i: number, field: keyof ProposedProgram, value: string) =>
    setProposedPrograms((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p))
    );

  const toggleDomain = (domain: string) =>
    setSelectedDomains((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast({ variant: "destructive", title: "حقل مطلوب", description: "يرجى إدخال الاسم الرباعي" });
      return;
    }
    if (!phone.trim()) {
      toast({ variant: "destructive", title: "حقل مطلوب", description: "يرجى إدخال رقم الهاتف" });
      return;
    }
    if (!email.trim()) {
      toast({ variant: "destructive", title: "حقل مطلوب", description: "يرجى إدخال البريد الإلكتروني" });
      return;
    }
    if (selectedDomains.length === 0) {
      toast({ variant: "destructive", title: "حقل مطلوب", description: "يرجى اختيار مجال تدريبي واحد على الأقل" });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = {
        "القسم الأول - البيانات الشخصية": {
          "الاسم الرباعي": fullName,
          "تاريخ الميلاد": birthDate,
          "الجنس": gender,
          "المدينة": city,
          "رقم الهاتف": phone,
          "البريد الإلكتروني": email,
        },
        "القسم الثاني - المؤهلات العلمية": educations,
        "القسم الثالث - الخبرات العملية": {
          "جهة العمل الحالية": currentEmployer,
          "المسمى الوظيفي": jobTitle,
          "سنوات الخبرة": yearsExperience,
          "أهم المناصب السابقة": pastPositions,
        },
        "القسم الرابع - الخبرة التدريبية": {
          "منذ متى تعمل في التدريب": trainingSince,
          "عدد الدورات": coursesCount,
          "أهم ثلاث دورات": topCourses,
          "الجهات التي دربت لديها": trainedAt,
          "روابط الشهادات والمواد": mediaLinks,
        },
        "القسم الخامس - المجالات التدريبية": {
          "المجالات المختارة": selectedDomains,
          "مجال آخر": otherDomain,
        },
        "القسم السادس - البرامج المقترحة": {
          "البرامج": proposedPrograms,
          "هل لديك برنامج جاهز": hasReadyProgram,
          "اسم البرنامج الجاهز": readyProgramName,
        },
        "القسم السابع - المرفقات": {
          "رابط السيرة الذاتية": cvLink,
        },
        "القسم الثامن - السؤال المقالي": {
          "القيمة المضافة والتميز": essay,
        },
      };

      const res = await fetch(`${BASE}/api/trainer-application/submit`, {
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "حدث خطأ، يرجى المحاولة لاحقاً";
      toast({ variant: "destructive", title: "خطأ في الإرسال", description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">تم استلام طلبك بنجاح</h2>
          <p className="text-gray-600 mb-2">شكراً لاهتمامك بالانضمام إلى شبكة المدربين المعتمدين</p>
          <p className="text-gray-500 text-sm">سيتم مراجعة طلبك والتواصل معك في أقرب وقت</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#C41E24] to-[#8B0000] text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-3">طلب الانضمام إلى شبكة المدربين المعتمدين</h1>
          <p className="text-white/85 max-w-2xl mx-auto text-base leading-relaxed">
            نشكر اهتمامكم بالانضمام إلى شبكة المدربين المعتمدين بالمؤسسة. تهدف هذه الاستمارة إلى التعرف على
            خبراتكم ومجالات تخصصكم. سيتم التعامل مع جميع البيانات بسرية تامة.
          </p>
          <p className="text-white/70 text-sm mt-3">
            ملاحظة: تعبئة الاستمارة لا تعني الاعتماد النهائي، وإنما تخضع الطلبات للتقييم والمفاضلة
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Section 1 */}
          <SectionCard title="القسم الأول: البيانات الشخصية" number={1}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <FieldLabel required>الاسم الرباعي</FieldLabel>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="أدخل اسمك الرباعي الكامل"
                  required
                />
              </div>
              <div>
                <FieldLabel>تاريخ الميلاد (اختياري)</FieldLabel>
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>الجنس</FieldLabel>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الجنس" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ذكر">ذكر</SelectItem>
                    <SelectItem value="أنثى">أنثى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel>المدينة</FieldLabel>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المدينة" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56 overflow-y-auto">
                    {CITIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel required>رقم الهاتف</FieldLabel>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="7xx xxx xxx"
                  required
                  type="tel"
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel required>البريد الإلكتروني</FieldLabel>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  type="email"
                  required
                />
              </div>
            </div>
          </SectionCard>

          {/* Section 2 - Education */}
          <SectionCard title="القسم الثاني: المؤهلات العلمية" number={2}>
            <div className="space-y-3">
              <div className="hidden md:grid grid-cols-4 gap-3 text-sm font-semibold text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                <span>الدرجة العلمية</span>
                <span>التخصص</span>
                <span>الجامعة</span>
                <span>سنة التخرج</span>
              </div>
              {educations.map((edu, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-xl">
                  <div>
                    <span className="md:hidden text-xs text-gray-500 block mb-1">الدرجة العلمية</span>
                    <Select value={edu.degree} onValueChange={(v) => updateEducation(i, "degree", v)}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="الدرجة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="دبلوم">دبلوم</SelectItem>
                        <SelectItem value="بكالوريوس">بكالوريوس</SelectItem>
                        <SelectItem value="ماجستير">ماجستير</SelectItem>
                        <SelectItem value="دكتوراه">دكتوراه</SelectItem>
                        <SelectItem value="أخرى">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <span className="md:hidden text-xs text-gray-500 block mb-1">التخصص</span>
                    <Input
                      value={edu.specialization}
                      onChange={(e) => updateEducation(i, "specialization", e.target.value)}
                      placeholder="التخصص"
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <span className="md:hidden text-xs text-gray-500 block mb-1">الجامعة</span>
                    <Input
                      value={edu.university}
                      onChange={(e) => updateEducation(i, "university", e.target.value)}
                      placeholder="الجامعة"
                      className="bg-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <span className="md:hidden text-xs text-gray-500 block mb-1">سنة التخرج</span>
                      <Input
                        value={edu.graduationYear}
                        onChange={(e) => updateEducation(i, "graduationYear", e.target.value)}
                        placeholder="السنة"
                        type="number"
                        min="1970"
                        max="2030"
                        className="bg-white"
                      />
                    </div>
                    {educations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEducation(i)}
                        className="mt-auto p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addEducation}
                className="gap-2 border-dashed border-[#C41E24] text-[#C41E24] hover:bg-[#C41E24]/5"
              >
                <Plus className="w-4 h-4" /> إضافة مؤهل آخر
              </Button>
            </div>
          </SectionCard>

          {/* Section 3 - Work Experience */}
          <SectionCard title="القسم الثالث: الخبرات العملية" number={3}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <FieldLabel>جهة العمل الحالية</FieldLabel>
                <Input
                  value={currentEmployer}
                  onChange={(e) => setCurrentEmployer(e.target.value)}
                  placeholder="اسم الجهة أو المنظمة"
                />
              </div>
              <div>
                <FieldLabel>المسمى الوظيفي</FieldLabel>
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="المنصب الحالي"
                />
              </div>
              <div>
                <FieldLabel>سنوات الخبرة</FieldLabel>
                <Select value={yearsExperience} onValueChange={setYearsExperience}>
                  <SelectTrigger>
                    <SelectValue placeholder="عدد السنوات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="أقل من سنة">أقل من سنة</SelectItem>
                    <SelectItem value="1-3 سنوات">1-3 سنوات</SelectItem>
                    <SelectItem value="3-5 سنوات">3-5 سنوات</SelectItem>
                    <SelectItem value="5-10 سنوات">5-10 سنوات</SelectItem>
                    <SelectItem value="أكثر من 10 سنوات">أكثر من 10 سنوات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <FieldLabel>أهم المناصب السابقة</FieldLabel>
                <Textarea
                  value={pastPositions}
                  onChange={(e) => setPastPositions(e.target.value)}
                  placeholder="اذكر أبرز المناصب والمواقع التي شغلتها سابقاً"
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </SectionCard>

          {/* Section 4 - Training Experience */}
          <SectionCard title="القسم الرابع: الخبرة التدريبية" number={4}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <FieldLabel>منذ متى تعمل في التدريب؟</FieldLabel>
                <Input
                  value={trainingSince}
                  onChange={(e) => setTrainingSince(e.target.value)}
                  placeholder="مثال: منذ عام 2015 أو منذ 8 سنوات"
                />
              </div>
              <div>
                <FieldLabel>عدد الدورات التي قدمتها</FieldLabel>
                <Input
                  value={coursesCount}
                  onChange={(e) => setCoursesCount(e.target.value)}
                  placeholder="العدد التقريبي"
                  type="number"
                  min="0"
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>أهم ثلاث دورات قدمتها</FieldLabel>
                <Textarea
                  value={topCourses}
                  onChange={(e) => setTopCourses(e.target.value)}
                  placeholder="اذكر اسم الدورة وموضوعها ومدتها..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>الجهات التي دربت لديها</FieldLabel>
                <Textarea
                  value={trainedAt}
                  onChange={(e) => setTrainedAt(e.target.value)}
                  placeholder="اسم الجهات والمؤسسات التي قدمت فيها تدريباً"
                  className="min-h-[80px]"
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>روابط صور أو فيديوهات أو شهادات (اختياري)</FieldLabel>
                <Textarea
                  value={mediaLinks}
                  onChange={(e) => setMediaLinks(e.target.value)}
                  placeholder="أضف روابط تثبت خبرتك التدريبية (Google Drive، YouTube، إلخ)"
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </SectionCard>

          {/* Section 5 - Training Domains */}
          <SectionCard title="القسم الخامس: المجالات التدريبية" number={5}>
            <p className="text-gray-500 text-sm mb-4">اختر جميع المجالات التي تستطيع التدريب فيها</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {TRAINING_DOMAINS.map((domain) => (
                <label
                  key={domain}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedDomains.includes(domain)
                      ? "border-[#C41E24] bg-[#C41E24]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Checkbox
                    checked={selectedDomains.includes(domain)}
                    onCheckedChange={() => toggleDomain(domain)}
                    className="border-[#C41E24] data-[state=checked]:bg-[#C41E24] data-[state=checked]:border-[#C41E24]"
                  />
                  <span className="text-sm font-medium">{domain}</span>
                </label>
              ))}
              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all col-span-2 md:col-span-1 ${
                  selectedDomains.includes("أخرى")
                    ? "border-[#C41E24] bg-[#C41E24]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Checkbox
                  checked={selectedDomains.includes("أخرى")}
                  onCheckedChange={() => toggleDomain("أخرى")}
                  className="border-[#C41E24] data-[state=checked]:bg-[#C41E24] data-[state=checked]:border-[#C41E24]"
                />
                <span className="text-sm font-medium">أخرى</span>
              </label>
            </div>
            {selectedDomains.includes("أخرى") && (
              <div className="mt-4">
                <FieldLabel>حدد المجال الآخر</FieldLabel>
                <Input
                  value={otherDomain}
                  onChange={(e) => setOtherDomain(e.target.value)}
                  placeholder="اكتب المجال هنا"
                />
              </div>
            )}
          </SectionCard>

          {/* Section 6 - Proposed Programs */}
          <SectionCard title="القسم السادس: البرامج المقترحة" number={6}>
            <p className="text-gray-500 text-sm mb-4">أضف البرامج التدريبية التي تستطيع تقديمها</p>
            <div className="space-y-3 mb-5">
              <div className="hidden md:grid grid-cols-4 gap-3 text-sm font-semibold text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                <span>اسم البرنامج</span>
                <span>المدة</span>
                <span>الفئة المستهدفة</span>
                <span>حضوري / عن بعد</span>
              </div>
              {proposedPrograms.map((prog, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-xl">
                  <div>
                    <span className="md:hidden text-xs text-gray-500 block mb-1">اسم البرنامج</span>
                    <Input
                      value={prog.name}
                      onChange={(e) => updateProgram(i, "name", e.target.value)}
                      placeholder="اسم البرنامج"
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <span className="md:hidden text-xs text-gray-500 block mb-1">المدة</span>
                    <Input
                      value={prog.duration}
                      onChange={(e) => updateProgram(i, "duration", e.target.value)}
                      placeholder="مثال: 3 أيام"
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <span className="md:hidden text-xs text-gray-500 block mb-1">الفئة المستهدفة</span>
                    <Input
                      value={prog.targetAudience}
                      onChange={(e) => updateProgram(i, "targetAudience", e.target.value)}
                      placeholder="الفئة"
                      className="bg-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <span className="md:hidden text-xs text-gray-500 block mb-1">حضوري / عن بعد</span>
                      <Select value={prog.mode} onValueChange={(v) => updateProgram(i, "mode", v)}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="الطريقة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="حضوري">حضوري</SelectItem>
                          <SelectItem value="عن بعد">عن بعد</SelectItem>
                          <SelectItem value="الاثنان">الاثنان</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {proposedPrograms.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProgram(i)}
                        className="mt-auto p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addProgram}
                className="gap-2 border-dashed border-[#C41E24] text-[#C41E24] hover:bg-[#C41E24]/5"
              >
                <Plus className="w-4 h-4" /> إضافة برنامج آخر
              </Button>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <FieldLabel>هل لديك برنامج تدريبي جاهز للتنفيذ؟</FieldLabel>
              <div className="flex gap-4 mt-2">
                {["نعم", "لا"].map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl border cursor-pointer transition-all ${
                      hasReadyProgram === opt
                        ? "border-[#C41E24] bg-[#C41E24]/5 font-semibold"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="hasReadyProgram"
                      value={opt}
                      checked={hasReadyProgram === opt}
                      onChange={() => setHasReadyProgram(opt)}
                      className="accent-[#C41E24]"
                    />
                    {opt}
                  </label>
                ))}
              </div>
              {hasReadyProgram === "نعم" && (
                <div className="mt-4">
                  <FieldLabel>اسم البرنامج الجاهز</FieldLabel>
                  <Input
                    value={readyProgramName}
                    onChange={(e) => setReadyProgramName(e.target.value)}
                    placeholder="اذكر اسم البرنامج"
                  />
                </div>
              )}
            </div>
          </SectionCard>

          {/* Section 7 - Attachments */}
          <SectionCard title="القسم السابع: المرفقات" number={7}>
            <div>
              <FieldLabel>رابط السيرة الذاتية</FieldLabel>
              <Input
                value={cvLink}
                onChange={(e) => setCvLink(e.target.value)}
                placeholder="أرفق رابط سيرتك الذاتية (Google Drive أو أي خدمة تخزين سحابي)"
                type="url"
              />
              <p className="text-xs text-gray-400 mt-1">
                ارفع ملف CV الخاص بك على Google Drive وشارك الرابط هنا
              </p>
            </div>
          </SectionCard>

          {/* Section 8 - Essay */}
          <SectionCard title="القسم الثامن: القيمة المضافة" number={8}>
            <div>
              <FieldLabel>
                برأيك، ما القيمة التي يمكنك إضافتها للمؤسسة؟ وما الذي يميزك عن غيرك كمدرب؟
              </FieldLabel>
              <Textarea
                value={essay}
                onChange={(e) => setEssay(e.target.value)}
                placeholder="اكتب هنا رأيك وما يميزك..."
                className="min-h-[150px]"
              />
            </div>
          </SectionCard>

          {/* Submit */}
          <div className="flex justify-center pt-4 pb-8">
            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className="bg-[#C41E24] hover:bg-[#a01a1f] text-white px-12 py-3 text-base font-semibold rounded-xl gap-3 min-w-[200px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> جاري الإرسال...
                </>
              ) : (
                "إرسال الطلب"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
