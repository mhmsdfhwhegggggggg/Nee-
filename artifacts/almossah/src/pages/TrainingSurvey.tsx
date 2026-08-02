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
import { CheckCircle2, Loader2, ClipboardCheck } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const CITIES = [
  "صنعاء", "عدن", "تعز", "الحديدة", "إب", "حضرموت", "ذمار", "مأرب",
  "لحج", "أبين", "شبوة", "المهرة", "ريمة", "الجوف", "عمران", "البيضاء",
  "حجة", "المحويت", "صعدة", "الضالع", "خارج اليمن",
];

const TARGET_CATEGORIES = [
  "طالب", "خريج", "موظف", "صاحب مشروع",
  "باحث", "مهتم بتطوير مهاراته", "أخرى",
];

const TRAINING_TRACKS = [
  "العلوم الصحية والتخصصات الطبية المساندة",
  "الإدارة والقيادة وتطوير الأداء المؤسسي",
  "البحث العلمي والمهارات الأكاديمية",
  "الذكاء الاصطناعي والتحول الرقمي",
  "تقنية المعلومات والمهارات التقنية",
  "اللغات والتواصل المهني",
  "المهارات الشخصية والتطوير المهني",
  "ريادة الأعمال وإدارة المشاريع",
  "التربية والتعليم وتنمية الطفل",
  "الإعلام والتصميم وصناعة المحتوى",
  "التنمية المجتمعية والعمل الإنساني",
  "أخرى",
];

const TRAINING_MODES = [
  "تدريب حضوري",
  "تدريب عن بعد",
  "لا مانع لدي من أي طريقة",
];

const TRAINING_GOALS = [
  "تطوير المهارات الشخصية والمهنية",
  "تحسين فرص الحصول على عمل",
  "تطوير الأداء الوظيفي",
  "اكتساب مهارات تساعد في مشروع خاص",
  "دعم الدراسة والتخصص الأكاديمي",
  "الحصول على معرفة جديدة",
  "أخرى",
];

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

export default function TrainingSurvey() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Section 1
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [education, setEducation] = useState("");
  const [studySpecialization, setStudySpecialization] = useState("");
  const [profession, setProfession] = useState("");

  // Section 2
  const [targetCategory, setTargetCategory] = useState("");
  const [otherCategory, setOtherCategory] = useState("");

  // Section 3
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [otherTrack, setOtherTrack] = useState("");

  // Section 4
  const [requestedPrograms, setRequestedPrograms] = useState("");

  // Section 5
  const [trainingMode, setTrainingMode] = useState("");

  // Section 6
  const [trainingGoal, setTrainingGoal] = useState("");
  const [otherGoal, setOtherGoal] = useState("");

  // Section 7
  const [wantsNotification, setWantsNotification] = useState("");
  const [notifPhone, setNotifPhone] = useState("");
  const [notifEmail, setNotifEmail] = useState("");

  // Section 8
  const [suggestions, setSuggestions] = useState("");

  const toggleTrack = (track: string) =>
    setSelectedTracks((prev) =>
      prev.includes(track) ? prev.filter((t) => t !== track) : [...prev, track]
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast({ variant: "destructive", title: "حقل مطلوب", description: "يرجى إدخال الاسم الرباعي" });
      return;
    }
    if (selectedTracks.length === 0) {
      toast({ variant: "destructive", title: "حقل مطلوب", description: "يرجى اختيار مسار تدريبي واحد على الأقل" });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = {
        "القسم الأول - البيانات الأساسية": {
          "الاسم الرباعي": fullName,
          "العمر": age,
          "الجنس": gender,
          "المدينة": city,
          "المؤهل العلمي": education,
          "التخصص الدراسي": studySpecialization,
          "المهنة أو المجال المهني": profession,
        },
        "القسم الثاني - الفئة المستهدفة": {
          "الفئة": targetCategory,
          "تحديد أخرى": otherCategory,
        },
        "القسم الثالث - المسارات التدريبية": {
          "المسارات المختارة": selectedTracks,
          "مسار آخر": otherTrack,
        },
        "القسم الرابع - البرامج المطلوبة": requestedPrograms,
        "القسم الخامس - طريقة التدريب المفضلة": trainingMode,
        "القسم السادس - الهدف من التدريب": {
          "الهدف": trainingGoal,
          "تحديد أخرى": otherGoal,
        },
        "القسم السابع - التواصل والمتابعة": {
          "يرغب في الإبلاغ": wantsNotification,
          "رقم الهاتف": notifPhone,
          "البريد الإلكتروني": notifEmail,
        },
        "القسم الثامن - المقترحات": suggestions,
      };

      const res = await fetch(`${BASE}/api/training-survey/submit`, {
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
          <h2 className="text-2xl font-bold text-gray-800 mb-3">شكراً لمشاركتك!</h2>
          <p className="text-gray-600 mb-2">تم استلام إجاباتك في الاستطلاع بنجاح</p>
          <p className="text-gray-500 text-sm">سنستفيد من آرائك في بناء خطة تدريبية أفضل وأكثر فاعلية</p>
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
            <ClipboardCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-3">استطلاع البرامج التدريبية</h1>
          <p className="text-white/85 max-w-2xl mx-auto text-base leading-relaxed">
            هل ترغب في أن تكون من أوائل الملتحقين بالبرامج التدريبية التي تناسب اهتماماتك وتطور مهاراتك؟
            ندعوك للمشاركة في هذا الاستطلاع للمساهمة في تحديد المسارات والبرامج التدريبية الأكثر أهمية وطلباً.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Section 1 */}
          <SectionCard title="القسم الأول: البيانات الأساسية" number={1}>
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
                <FieldLabel>العمر</FieldLabel>
                <Input
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="سنة"
                  type="number"
                  min="15"
                  max="80"
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
                <FieldLabel>المؤهل العلمي</FieldLabel>
                <Select value={education} onValueChange={setEducation}>
                  <SelectTrigger>
                    <SelectValue placeholder="المؤهل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ثانوية عامة">ثانوية عامة</SelectItem>
                    <SelectItem value="دبلوم">دبلوم</SelectItem>
                    <SelectItem value="بكالوريوس">بكالوريوس</SelectItem>
                    <SelectItem value="ماجستير">ماجستير</SelectItem>
                    <SelectItem value="دكتوراه">دكتوراه</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel>التخصص الدراسي</FieldLabel>
                <Input
                  value={studySpecialization}
                  onChange={(e) => setStudySpecialization(e.target.value)}
                  placeholder="تخصصك الدراسي"
                />
              </div>
              <div>
                <FieldLabel>المهنة أو المجال المهني</FieldLabel>
                <Input
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="عملك أو مجال عملك"
                />
              </div>
            </div>
          </SectionCard>

          {/* Section 2 */}
          <SectionCard title="القسم الثاني: الفئة المستهدفة" number={2}>
            <p className="text-gray-500 text-sm mb-4">ما الفئة التي تنتمي إليها؟</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TARGET_CATEGORIES.map((cat) => (
                <label
                  key={cat}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    targetCategory === cat
                      ? "border-[#C41E24] bg-[#C41E24]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="targetCategory"
                    value={cat}
                    checked={targetCategory === cat}
                    onChange={() => setTargetCategory(cat)}
                    className="accent-[#C41E24]"
                  />
                  <span className="text-sm font-medium">
                    {cat === "أخرى" ? "أخرى (يرجى التحديد)" : cat}
                  </span>
                </label>
              ))}
            </div>
            {targetCategory === "أخرى" && (
              <div className="mt-4">
                <FieldLabel>حدد الفئة</FieldLabel>
                <Input
                  value={otherCategory}
                  onChange={(e) => setOtherCategory(e.target.value)}
                  placeholder="اكتب الفئة هنا"
                />
              </div>
            )}
          </SectionCard>

          {/* Section 3 */}
          <SectionCard title="القسم الثالث: المسارات التدريبية ذات الاهتمام" number={3}>
            <p className="text-gray-500 text-sm mb-4">
              ما المسارات التدريبية التي تهمك؟ (يمكن اختيار أكثر من مسار)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TRAINING_TRACKS.map((track) => (
                <label
                  key={track}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedTracks.includes(track)
                      ? "border-[#C41E24] bg-[#C41E24]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Checkbox
                    checked={selectedTracks.includes(track)}
                    onCheckedChange={() => toggleTrack(track)}
                    className="mt-0.5 shrink-0 border-[#C41E24] data-[state=checked]:bg-[#C41E24] data-[state=checked]:border-[#C41E24]"
                  />
                  <span className="text-sm font-medium leading-relaxed">
                    {track === "أخرى" ? "أخرى (يرجى التحديد)" : track}
                  </span>
                </label>
              ))}
            </div>
            {selectedTracks.includes("أخرى") && (
              <div className="mt-4">
                <FieldLabel>حدد المسار الآخر</FieldLabel>
                <Input
                  value={otherTrack}
                  onChange={(e) => setOtherTrack(e.target.value)}
                  placeholder="اكتب المسار هنا"
                />
              </div>
            )}
          </SectionCard>

          {/* Section 4 */}
          <SectionCard title="القسم الرابع: البرامج التدريبية المطلوبة" number={4}>
            <FieldLabel>
              ما البرامج أو الدورات التدريبية التي ترغب في حضورها ضمن المسارات التي اخترتها؟
            </FieldLabel>
            <p className="text-gray-400 text-xs mb-3">
              (يمكن كتابة أكثر من برنامج أو موضوع تدريبي)
            </p>
            <Textarea
              value={requestedPrograms}
              onChange={(e) => setRequestedPrograms(e.target.value)}
              placeholder="اكتب هنا البرامج والمواضيع التدريبية التي تهمك..."
              className="min-h-[120px]"
            />
          </SectionCard>

          {/* Section 5 */}
          <SectionCard title="القسم الخامس: طبيعة التدريب المفضلة" number={5}>
            <p className="text-gray-500 text-sm mb-4">ما طريقة التدريب التي تفضلها؟</p>
            <div className="flex flex-col md:flex-row gap-3">
              {TRAINING_MODES.map((mode) => (
                <label
                  key={mode}
                  className={`flex items-center gap-3 p-4 rounded-xl border flex-1 cursor-pointer transition-all ${
                    trainingMode === mode
                      ? "border-[#C41E24] bg-[#C41E24]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="trainingMode"
                    value={mode}
                    checked={trainingMode === mode}
                    onChange={() => setTrainingMode(mode)}
                    className="accent-[#C41E24]"
                  />
                  <span className="text-sm font-medium">{mode}</span>
                </label>
              ))}
            </div>
          </SectionCard>

          {/* Section 6 */}
          <SectionCard title="القسم السادس: الهدف من التدريب" number={6}>
            <p className="text-gray-500 text-sm mb-4">
              ما الهدف الأساسي من التحاقك بالبرامج التدريبية؟
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TRAINING_GOALS.map((goal) => (
                <label
                  key={goal}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    trainingGoal === goal
                      ? "border-[#C41E24] bg-[#C41E24]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="trainingGoal"
                    value={goal}
                    checked={trainingGoal === goal}
                    onChange={() => setTrainingGoal(goal)}
                    className="accent-[#C41E24]"
                  />
                  <span className="text-sm font-medium">
                    {goal === "أخرى" ? "أخرى (يرجى التحديد)" : goal}
                  </span>
                </label>
              ))}
            </div>
            {trainingGoal === "أخرى" && (
              <div className="mt-4">
                <FieldLabel>حدد الهدف</FieldLabel>
                <Input
                  value={otherGoal}
                  onChange={(e) => setOtherGoal(e.target.value)}
                  placeholder="اكتب هدفك هنا"
                />
              </div>
            )}
          </SectionCard>

          {/* Section 7 */}
          <SectionCard title="القسم السابع: التواصل والمتابعة" number={7}>
            <div>
              <FieldLabel>
                هل ترغب في إبلاغك بالبرامج التدريبية القادمة التي تتوافق مع اهتماماتك؟
              </FieldLabel>
              <div className="flex gap-4 mt-2">
                {["نعم", "لا"].map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl border cursor-pointer transition-all ${
                      wantsNotification === opt
                        ? "border-[#C41E24] bg-[#C41E24]/5 font-semibold"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="wantsNotification"
                      value={opt}
                      checked={wantsNotification === opt}
                      onChange={() => setWantsNotification(opt)}
                      className="accent-[#C41E24]"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
            {wantsNotification === "نعم" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 pt-5 border-t border-gray-100">
                <div>
                  <FieldLabel required>رقم الهاتف</FieldLabel>
                  <Input
                    value={notifPhone}
                    onChange={(e) => setNotifPhone(e.target.value)}
                    placeholder="7xx xxx xxx"
                    type="tel"
                  />
                </div>
                <div>
                  <FieldLabel>البريد الإلكتروني (اختياري)</FieldLabel>
                  <Input
                    value={notifEmail}
                    onChange={(e) => setNotifEmail(e.target.value)}
                    placeholder="example@email.com"
                    type="email"
                  />
                </div>
              </div>
            )}
          </SectionCard>

          {/* Section 8 */}
          <SectionCard title="القسم الثامن: المقترحات" number={8}>
            <FieldLabel>
              ما البرامج أو الموضوعات التدريبية التي ترى أن المجتمع بحاجة إليها؟
            </FieldLabel>
            <Textarea
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              placeholder="شاركنا مقترحاتك وأفكارك..."
              className="min-h-[150px]"
            />
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
                "إرسال الاستطلاع"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
