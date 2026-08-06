//==============================
// إعدادات النظام
//==============================

const CONFIG = {
    // رابط سكربت Google Apps Script (نفس السكربت الحالي - يتولى الشيت والذكاء الاصطناعي)
    API: "https://script.google.com/macros/s/AKfycbzVAlLVRAOt5miZyROEWuRMLUXvZBl7u0JLXp7TOqoT4IXDFnaZb99Y685UF3ZAmMrw7g/exec",

    // أسماء التبويبات في ملف Google Sheets (يجب أن تطابق الأسماء تمامًا)
    TABLES: {
        patients: "Patients",         // سجل المرضى
        assessments: "Assessments",   // التقييمات ونتائج الذكاء الاصطناعي
        questions: "Questions",       // أسئلة الاستبيان (قابلة للتعديل من الإعدادات)
        videos: "Videos",             // الفيديوهات التعليمية بأوصافها
        doctors: "Doctors"            // حسابات الأطباء (اسم المستخدم، كلمة المرور المشفّرة، الدور)
    },

    // معلومات المشروع (تظهر في شاشة البداية وترويسة التقرير)
    PROJECT: {
        brand: "DENTARA",
        university: "جامعة البصرة",
        college: "كلية طب الأسنان",
        titleEn: "AI Personalized Oral Hygiene System",
        titleAr: "نظام تعليمات العناية الفموية المخصصة بالذكاء الاصطناعي",
        universityEn: "University of Basrah",
        collegeEn: "College of Dentistry",
        subtitleEn: "Personalized Oral Hygiene Instructions Following Scaling and Polishing",
        subtitle: "تعليمات عناية فموية مخصصة بعد التقليح والتلميع",
        students: [
            "روان جمل حطاب",
            "ضحى محمود شاكر",
            "بان راضي عاشور",
            "هاجر وحيم أبو الهيل"
        ],
        supervisor: "م.م. د. سرى عبد الكريم",
        supervisorEn: "Assistant Lecturer Dr. Sura Abd Alkareem",
        studentsEn: ["Rawan Jamel Hattab", "Doha Mahmood Shaker", "Ban Radhyi Ashoor", "Hajir Wahim Abual Hail"]
    }
};

// أقسام الاستبيان بالترتيب (تُستخدم لتقسيم الأسئلة على خطوات)
const SECTIONS = [
    { key: "demographic", en: "Demographic Information", ar: "المعلومات الأساسية", icon: "fa-user" },
    { key: "medical",     en: "Medical History",         ar: "التاريخ الطبي",      icon: "fa-notes-medical" },
    { key: "dental",      en: "Dental History",          ar: "تاريخ الأسنان",      icon: "fa-tooth" },
    { key: "habits",      en: "Oral Hygiene Habits",     ar: "عادات العناية الفموية", icon: "fa-tooth" },
    { key: "diet",        en: "Diet & Knowledge",        ar: "الغذاء والمعرفة",    icon: "fa-apple-whole" },
    { key: "motivation",  en: "Motivation",              ar: "الدافعية",           icon: "fa-heart-pulse" },
    { key: "barriers",    en: "Barriers",                ar: "العوائق",            icon: "fa-triangle-exclamation" },
    { key: "goal",        en: "Patient Goal",            ar: "هدف المريض",         icon: "fa-bullseye" },
    { key: "clinical",    en: "Clinical Examination (Dentist Only)", ar: "الفحص السريري (للطبيب فقط)", icon: "fa-stethoscope" }
];

// عنوان القسم حسب اللغة الحالية
function sectionTitle(s) { return pick(s.en, s.ar); }

// أنواع الأسئلة المدعومة
const QUESTION_TYPES = {
    yesno:  { en: "Yes / No",          ar: "نعم / لا" },
    text:   { en: "Text answer",       ar: "إجابة نصية" },
    radio:  { en: "Single choice",     ar: "اختيار واحد" },
    multi:  { en: "Multiple choice",   ar: "اختيار متعدد" },
    scale:  { en: "Scale 0 - 10",      ar: "مقياس 0 - 10" },
    likert: { en: "Agreement (SA-SD)", ar: "درجة الموافقة" }
};

function typeLabel(k) {
    const e = QUESTION_TYPES[k];
    return e ? pick(e.en, e.ar) : k;
}

// خيارات مقياس الموافقة (Likert) المستخدم في قسم المعرفة
const LIKERT = [
    { v: "SA", en: "Strongly Agree",    ar: "أوافق بشدة" },
    { v: "A",  en: "Agree",             ar: "أوافق" },
    { v: "N",  en: "Neutral",           ar: "محايد" },
    { v: "D",  en: "Disagree",          ar: "لا أوافق" },
    { v: "SD", en: "Strongly Disagree", ar: "لا أوافق بشدة" }
];
