//==============================
// نظام اللغتين: الإنجليزية افتراضيًا مع إمكانية التحويل للعربية
//==============================

const LANG_KEY = "ohs_lang";

// الافتراضي إنجليزي لأن أطباء الأسنان يفضّلون المصطلحات الإنجليزية
let LANG = "en";
try { LANG = localStorage.getItem(LANG_KEY) || "en"; } catch (e) { LANG = "en"; }

const STR = {
    // عام
    save:        { en: "Save",             ar: "حفظ" },
    cancel:      { en: "Cancel",           ar: "إلغاء" },
    yes:         { en: "Yes",              ar: "نعم" },
    no:          { en: "No",               ar: "لا" },
    add:         { en: "Add",              ar: "إضافة" },
    edit:        { en: "Edit",             ar: "تعديل" },
    delete:      { en: "Delete",           ar: "حذف" },
    back:        { en: "Back",             ar: "السابق" },
    next:        { en: "Next",             ar: "التالي" },
    close:       { en: "Close",            ar: "إغلاق" },
    loading:     { en: "Loading...",       ar: "جارٍ التحميل..." },
    saving:      { en: "Saving...",        ar: "جارٍ الحفظ..." },
    notice:      { en: "Notice",           ar: "تنبيه" },
    retry:       { en: "Retry",            ar: "إعادة المحاولة" },

    // شاشة البداية
    startBtn:    { en: "Start New Assessment", ar: "ابدأ تقييمًا جديدًا" },
    developedBy: { en: "Developed by",     ar: "إعداد الطالبات" },
    supervisedBy:{ en: "Supervised by",    ar: "بإشراف" },
    tagline:     { en: "Smart Care. Personalized for Every Smile.", ar: "عناية ذكية مخصصة لكل ابتسامة" },

    // الرئيسية
    welcome:     { en: "Welcome, Doctor",  ar: "أهلاً دكتور" },
    newPatient:  { en: "New Patient",      ar: "مريض جديد" },
    newPatientD: { en: "Start assessment and generate instructions", ar: "ابدأ التقييم وولّد التعليمات" },
    prevPatients:{ en: "Previous Patients", ar: "المرضى السابقون" },
    questionsNav:{ en: "Questionnaire",    ar: "الاستبيان" },
    questionsD:  { en: "Add and edit questions", ar: "إضافة وتعديل الأسئلة" },
    videosNav:   { en: "Video Library",    ar: "المكتبة المرئية" },
    videosD:     { en: "Add videos with descriptions", ar: "إضافة فيديوهات بأوصافها" },
    settings:    { en: "Settings",         ar: "الإعدادات" },

    // بيانات المريض
    patientInfo: { en: "Patient Information", ar: "بيانات المريض" },
    basicInfo:   { en: "Basic Information", ar: "المعلومات الأساسية" },
    fullName:    { en: "Patient Name",     ar: "اسم المريض" },
    fullNameP:   { en: "Full name",        ar: "الاسم الكامل" },
    age:         { en: "Age (years)",      ar: "العمر (بالسنوات)" },
    sex:         { en: "Sex",              ar: "الجنس" },
    choose:      { en: "Select...",        ar: "اختر..." },
    male:        { en: "Male",             ar: "ذكر" },
    female:      { en: "Female",           ar: "أنثى" },
    startQ:      { en: "Start Questionnaire", ar: "بدء الاستبيان" },
    nameReq:     { en: "Patient name is required", ar: "اسم المريض مطلوب" },
    ageReq:      { en: "Patient age is required",  ar: "عمر المريض مطلوب" },

    // الاستبيان
    step:        { en: "Step",             ar: "الخطوة" },
    of:          { en: "of",               ar: "من" },
    review:      { en: "Review Before Submitting", ar: "مراجعة قبل الإرسال" },
    answered:    { en: "Answered",         ar: "تمت الإجابة على" },
    outOf:       { en: "out of",           ar: "من أصل" },
    questionsW:  { en: "questions",        ar: "سؤالًا" },
    allDone:     { en: "All questions are complete.", ar: "كل الأسئلة مكتملة." },
    someLeft:    { en: "You can go back to complete the remaining questions, or continue now.",
                   ar: "يمكنك الرجوع لإكمال الأسئلة الناقصة، أو المتابعة الآن." },
    saveAnalyze: { en: "Save & Generate Instructions", ar: "حفظ وتوليد التعليمات" },
    backHome:    { en: "Back to Home",     ar: "رجوع للرئيسية" },
    exitTitle:   { en: "Exit Assessment",  ar: "إنهاء التقييم" },
    exitMsg:     { en: "Your answers will be lost and will not be saved. Do you want to exit?",
                   ar: "سيتم فقدان الإجابات ولن تُحفظ. هل تريد الخروج؟" },
    noQuestions: { en: "No questions yet. Add questions from Settings first.",
                   ar: "لا توجد أسئلة بعد. أضف أسئلة من الإعدادات أولاً" },
    noAnswers:   { en: "No answers entered yet", ar: "لم تُدخل أي إجابة بعد" },
    detailsP:    { en: "If yes, please specify...", ar: "إن كانت الإجابة نعم، اذكر التفاصيل..." },
    typeHere:    { en: "Type here...",     ar: "اكتب الإجابة هنا..." },

    // المعالجة
    savingData:  { en: "Saving patient answers...", ar: "جارٍ حفظ إجابات المريض..." },
    analyzing:   { en: "Analyzing Patient Data",    ar: "جارٍ تحليل بيانات المريض" },
    analyzingD:  { en: "Generating personalized oral hygiene instructions and selecting matching videos...",
                   ar: "يقوم المساعد بإعداد تعليمات العناية الشخصية واختيار الفيديوهات المناسبة..." },
    pleaseWait:  { en: "This may take up to a minute", ar: "قد تستغرق العملية حتى دقيقة" },
    savedOk:     { en: "Answers saved successfully", ar: "تم حفظ الإجابات بنجاح" },

    // النتائج
    results:     { en: "AI Results",       ar: "نتائج التقييم" },
    riskLevel:   { en: "Personalized Risk Level", ar: "مستوى الخطورة" },
    topProblems: { en: "Top Priority Problems",   ar: "أهم المشاكل" },
    instructions:{ en: "Personalized Instructions", ar: "التعليمات الشخصية" },
    goals:       { en: "SMART Goals",      ar: "أهداف الأسبوع" },
    barriers:    { en: "Barriers & Solutions", ar: "العوائق وحلولها" },
    motivation:  { en: "Motivational Message", ar: "رسالة تحفيزية" },
    videos:      { en: "Recommended Videos", ar: "الفيديوهات المرشّحة" },
    noVideos:    { en: "No videos added yet. Add them from Settings so the assistant can match them to each patient.",
                   ar: "لم تُضف فيديوهات بعد. أضفها من الإعدادات ليختار المساعد ما يناسب كل مريض." },
    printReport: { en: "Print Patient Report", ar: "عرض ورقة المريض للطباعة" },
    anotherOne:  { en: "Assess Another Patient", ar: "تقييم مريض آخر" },
    analyzeNow:  { en: "Run AI Analysis",  ar: "تشغيل تحليل الذكاء الاصطناعي" },
    notAnalyzed: { en: "Saved — not analyzed yet", ar: "محفوظ — لم يُحلَّل بعد" },

    // الطباعة
    printHint:   { en: "Two pages: instructions, and the weekly tracking card.",
                   ar: "ورقتان: التعليمات، وكارت المتابعة الأسبوعي." },
    print:       { en: "Print",            ar: "طباعة" },

    // سجل المرضى
    searchP:     { en: "Search by patient name...", ar: "بحث باسم المريض..." },
    noRecords:   { en: "No saved assessments yet. Start a new assessment from the home page.",
                   ar: "لا توجد تقييمات محفوظة بعد. ابدأ تقييمًا جديدًا من الصفحة الرئيسية." },
    noMatch:     { en: "No results match your search.", ar: "لا نتائج مطابقة لبحثك." },

    // الإعدادات
    addQuestion: { en: "Add Question",     ar: "إضافة سؤال" },
    editQuestion:{ en: "Edit Question",    ar: "تعديل سؤال" },
    suggestQ:    { en: "Suggest Questions with AI", ar: "اقتراح أسئلة بالذكاء الاصطناعي" },
    importQ:     { en: "Import Default Questions", ar: "استيراد الأسئلة الافتراضية" },
    noQYet:      { en: "No questions yet. Start by importing the default set, or add your own.",
                   ar: "لا توجد أسئلة بعد. ابدأ باستيراد الأسئلة الافتراضية، أو أضف أسئلتك الخاصة." },
    qTextEn:     { en: "Question (English)", ar: "نص السؤال (إنجليزي)" },
    qTextAr:     { en: "Question (Arabic)",  ar: "نص السؤال (عربي)" },
    section:     { en: "Section",          ar: "القسم" },
    answerType:  { en: "Answer Type",      ar: "نوع الإجابة" },
    optionsEn:   { en: "Options in English (comma separated)", ar: "الخيارات بالإنجليزية (افصل بفاصلة)" },
    optionsAr:   { en: "Options in Arabic (comma separated)",  ar: "الخيارات بالعربية (افصل بفاصلة)" },
    order:       { en: "Order within section", ar: "الترتيب داخل القسم" },
    qReq:        { en: "Question text is required", ar: "نص السؤال مطلوب" },
    addVideo:    { en: "Add Video",        ar: "إضافة فيديو" },
    editVideo:   { en: "Edit Video",       ar: "تعديل فيديو" },
    videoTitle:  { en: "Video Title",      ar: "عنوان الفيديو" },
    videoUrl:    { en: "Link",             ar: "الرابط" },
    videoDesc:   { en: "Description — who is it for and when", ar: "الوصف — لمن يصلح ومتى" },
    videoDescP:  { en: "e.g. Explains the Bass brushing technique, suitable for patients with bleeding gums or poor technique",
                   ar: "مثال: يشرح تقنية باس للتفريش، مناسب لمن يعاني نزف اللثة أو يفرّش بطريقة خاطئة" },
    videoHint:   { en: "Write an accurate description for each video — the assistant relies on it to match videos to patients.",
                   ar: "اكتب وصفًا دقيقًا لكل فيديو، فالمساعد يعتمد عليه ليختار الفيديو المناسب لكل مريض." },
    noVideosYet: { en: "No videos yet.",   ar: "لا توجد فيديوهات بعد." },
    noDesc:      { en: "No description — add one so the assistant can recommend it",
                   ar: "بلا وصف — أضف وصفًا ليتمكن المساعد من ترشيحه" },
    openLink:    { en: "Open link",        ar: "فتح الرابط" },
    titleReq:    { en: "Video title is required", ar: "عنوان الفيديو مطلوب" },
    urlReq:      { en: "Video link is required",  ar: "رابط الفيديو مطلوب" },
    goalQ:       { en: "What is the goal of these questions?", ar: "ما هدف هذه الأسئلة؟" },
    count:       { en: "Number of questions", ar: "عدد الأسئلة" },
    suggest:     { en: "Suggest",          ar: "اقترح" },
    suggested:   { en: "Suggested Questions", ar: "أسئلة مقترحة" },
    pickHint:    { en: "Select the questions you want to add.", ar: "اختر الأسئلة التي تريد إضافتها." },
    addPicked:   { en: "Add Selected",     ar: "إضافة المختارة" },
    noneChosen:  { en: "You did not select anything", ar: "لم تختر أي عنصر" },

    // رسائل
    added:       { en: "Added successfully", ar: "تمت الإضافة" },
    updated:     { en: "Updated successfully", ar: "تم التعديل" },
    deleted:     { en: "Deleted successfully", ar: "تم الحذف" },
    saveFailed:  { en: "Could not save, please try again", ar: "تعذر الحفظ، حاول مرة أخرى" },
    aiFailed:    { en: "AI Generation Failed", ar: "تعذر التوليد" },
    reason:      { en: "Reason",           ar: "السبب" },
    answersSafe: { en: "Your answers were saved successfully. You can retry the analysis at any time from the patient record.",
                   ar: "إجاباتك محفوظة بأمان. يمكنك إعادة التحليل في أي وقت من سجل المريض." },
    confirmDel:  { en: "Confirm Delete",   ar: "تأكيد الحذف" },
    titleShort:  { en: "Oral Hygiene System", ar: "نظام العناية الفموية" },
    orUpload:    { en: "Or upload a video file", ar: "أو ارفع ملف فيديو" },
    uploadFileHint: { en: "Max 8MB. For longer videos, use a YouTube or Drive link above instead.",
                       ar: "الحد الأقصى 8 ميجابايت. للفيديوهات الأطول، استخدم رابط يوتيوب أو درايف أعلاه." },
    uploading:   { en: "Uploading video...", ar: "جارٍ رفع الفيديو..." },
    uploadDone:  { en: "Upload complete", ar: "تم الرفع بنجاح" },
    uploadHint:  { en: "Paste a YouTube link, or upload the video to Google Drive (set sharing to \u201cAnyone with the link\u201d) and paste the share link here.",
                   ar: "الصق رابط يوتيوب، أو ارفع الفيديو على Google Drive (واجعل المشاركة \u201cأي شخص لديه الرابط\u201d) ثم الصق رابط المشاركة هنا." },
    stillLoading:{ en: "Still connecting... this can take a few extra seconds the first time.",
                   ar: "لا يزال يتصل بالخادم... قد يستغرق ثوانٍ إضافية عند أول استخدام." },
    // ======== حسابات الأطباء ========
    loginTitle:  { en: "Doctor Login",       ar: "تسجيل دخول الطبيب" },
    username:    { en: "Username",           ar: "اسم المستخدم" },
    password:    { en: "Password",           ar: "كلمة المرور" },
    loginBtn:    { en: "Log In",             ar: "دخول" },
    newDoctorLink: { en: "New doctor? Create an account", ar: "طبيب جديد؟ أنشئ حسابًا" },
    registerTitle: { en: "New Doctor Account", ar: "حساب طبيب جديد" },
    doctorName:  { en: "Your Name",          ar: "اسمك" },
    inviteCode:  { en: "Invite Code",        ar: "رمز الدعوة" },
    inviteCodeHint: { en: "Ask the clinic administrator for the invite code.",
                       ar: "اطلب رمز الدعوة من مدير العيادة." },
    registerBtn: { en: "Create Account",     ar: "إنشاء الحساب" },
    haveAccountLink: { en: "Already have an account? Log in", ar: "لديك حساب بالفعل؟ سجّل دخولك" },
    loginReq:    { en: "Enter your username and password", ar: "أدخل اسم المستخدم وكلمة المرور" },
    loginFailed: { en: "Incorrect username or password", ar: "اسم المستخدم أو كلمة المرور غير صحيحة" },
    welcomeBack: { en: "Welcome back,",      ar: "أهلاً بعودتك،" },
    registerReq: { en: "Please fill in all fields", ar: "الرجاء تعبئة كل الحقول" },
    passwordShort: { en: "Password must be at least 4 characters", ar: "كلمة المرور يجب أن تكون 4 أحرف على الأقل" },
    registerFailed: { en: "Could not create the account. Check the invite code.",
                       ar: "تعذر إنشاء الحساب. تحقق من رمز الدعوة." },
    welcomeNew:  { en: "Welcome,",           ar: "أهلاً بك،" },
    logout:      { en: "Log Out",            ar: "تسجيل الخروج" },
    logoutMsg:   { en: "You will need your username and password to log in again.",
                   ar: "ستحتاج اسم المستخدم وكلمة المرور لتسجيل الدخول من جديد." },
    adminPanel:  { en: "Admin Panel",        ar: "لوحة المدير" },
    adminPanelD: { en: "Manage doctor accounts", ar: "إدارة حسابات الأطباء" },
    adminIntro:  { en: "All registered doctor accounts. All doctors can view every patient, but can only edit or delete patients they created themselves.",
                   ar: "كل حسابات الأطباء المسجَّلة. يستطيع كل الأطباء عرض جميع المرضى، لكن لا يستطيعون تعديل أو حذف إلا المرضى الذين أضافوهم بأنفسهم." },
    noDoctors:   { en: "No doctor accounts yet.", ar: "لا توجد حسابات أطباء بعد." },
    admin:       { en: "Admin",              ar: "مدير" },
    joined:      { en: "Joined",             ar: "تاريخ الانضمام" },
    // ======== حذف المرضى وتقييد الأسئلة ========
    // ======== صورة قبل العلاج ========
    beforePhoto:     { en: "Before-Treatment Photo", ar: "صورة قبل العلاج" },
    beforePhotoHint: { en: "Optional: attach a photo of the patient's teeth before starting treatment (max 8MB).",
                        ar: "اختياري: أرفق صورة لأسنان المريض قبل بدء العلاج (الحد الأقصى 8 ميجابايت)." },

    // ======== التصدير على آيفون ========
    exportedTitle:    { en: "File Ready", ar: "الملف جاهز" },
    printIOSHint:     { en: "The page opened in a new tab and will print automatically. If nothing appears, tap the Share button in Safari and choose \u201cPrint\u201d.",
                          ar: "فُتحت الصفحة في تبويب جديد وستُطبع تلقائيًا. إن لم تظهر نافذة الطباعة، اضغط زر المشاركة في Safari واختر \u201cطباعة\u201d." },
    exportedIOSHint:  { en: "The file opened in a new tab. Tap the Share button in Safari, then choose \u201cSave to Files\u201d to keep it.",
                         ar: "فُتح الملف في تبويب جديد. اضغط زر المشاركة في Safari، ثم اختر \u201cحفظ في الملفات\u201d لحفظه." },

    // ======== تثبيت التطبيق ========
    installApp:  { en: "Install App",       ar: "تثبيت التطبيق" },
    installAppD: { en: "Add a shortcut to your home screen", ar: "أضف اختصارًا للشاشة الرئيسية" },
    installTitle:{ en: "Add to Home Screen", ar: "إضافة للشاشة الرئيسية" },
    installIntro:{ en: "Follow these steps to add DENTARA as an app icon on your device:",
                   ar: "اتبع هذه الخطوات لإضافة DENTARA كأيقونة تطبيق على جهازك:" },
    installNote: { en: "Once added, it opens like a regular app — no browser address bar.",
                   ar: "بعد الإضافة، يفتح مثل أي تطبيق عادي — بلا شريط عنوان المتصفح." },

    // ======== مركز المعرفة ========
    // ======== تذكير المتابعة ========
    fu_overdue:  { en: "Overdue",     ar: "متأخر" },
    fu_dueToday: { en: "Due Today",   ar: "موعده اليوم" },
    fu_thisWeek: { en: "This Week",   ar: "خلال أسبوع" },
    fu_upcoming: { en: "Upcoming",    ar: "قادم" },
    fu_completed:{ en: "Completed",   ar: "مكتمل" },
    fu_tabAll:       { en: "All",             ar: "الكل" },
    fu_tabDue:       { en: "Follow-up Due",   ar: "موعد قريب" },
    fu_tabOverdue:   { en: "Overdue",         ar: "متأخر" },
    fu_tabCompleted: { en: "Completed",       ar: "مكتمل" },
    scheduledDate:   { en: "Scheduled Date",  ar: "تاريخ الموعد المجدول" },
    reminders:   { en: "Reminders", ar: "التذكيرات" },
    noReminders: { en: "No follow-up reminders match this filter.", ar: "لا مواعيد متابعة مطابقة لهذا الفلتر." },
    editBooklet: { en: "Edit This Patient's Booklet", ar: "تعديل دفتر هذا المريض" },
    editBookletNote: { en: "These 4 tasks apply only to this patient's booklet.",
                        ar: "هذه المهام الأربع تخص دفتر هذا المريض فقط." },
    taskLbl:     { en: "Task", ar: "المهمة" },
    taskTimesPh: { en: "Times (e.g. 07:00, 21:00)", ar: "الأوقات (مثال: 07:00، 21:00)" },
    bookletTemplateNav: { en: "Booklet Template", ar: "قالب الدفتر" },
    titleEnLbl:  { en: "English title", ar: "العنوان بالإنكليزي" },
    titleArLbl:  { en: "Arabic title", ar: "العنوان بالعربي" },
    bookletTemplateNote: { en: "This is the default booklet template used for every new patient unless a doctor customizes their own patient's booklet.",
                            ar: "هذا هو القالب الافتراضي لدفتر كل مريض جديد، إلا إذا خصّصه الطبيب لمريضه تحديدًا." },
    bookletTemplateAdminOnly: { en: "Only the administrator can edit the default booklet template.",
                                 ar: "المدير فقط يمكنه تعديل القالب الافتراضي للدفتر." },
    designedByLbl: { en: "Build & Development: Hussein Mahmoud", ar: "بناء وبرمجة: حسين محمود" },
    ideaByLbl:     { en: "Idea & Follow-up:", ar: "فكرة ومتابعة:" },
    rawanName:     { en: "Rawan Jamil", ar: "روان جميل" },
    startFollowUp:   { en: "Start Follow-up Assessment", ar: "بدء تقييم المتابعة" },

    // ======== تفسير الذكاء الاصطناعي ========
    whyAI:        { en: "Why did AI recommend this?", ar: "لماذا اقترح الذكاء الاصطناعي هذا؟" },
    whyAITitle:   { en: "AI Reasoning", ar: "تفسير الذكاء الاصطناعي" },
    whyAIIntro:   { en: "Based on the patient's specific answers:", ar: "بناءً على إجابات المريض المحدَّدة:" },
    thereforeRecommends: { en: "Therefore, DENTARA AI recommends:", ar: "لذلك، يوصي DENTARA AI بـ:" },

    // ======== الشات بوت ========
    dentalAssistant:   { en: "Dental AI Assistant", ar: "المساعد الذكي لطب الأسنان" },
    dentalAssistantD:  { en: "Ask evidence-based dentistry questions", ar: "اسأل أسئلة طب أسنان مبنية على أدلة" },
    chatEmptyHint:      { en: "Ask any evidence-based dentistry or periodontal care question.",
                          ar: "اسأل أي سؤال بطب الأسنان أو دواعم السن مبني على أدلة علمية." },
    chatPlaceholder:    { en: "Type a dentistry question...", ar: "اكتب سؤالاً بطب الأسنان..." },
    clearChat:          { en: "Clear Conversation", ar: "مسح المحادثة" },
    clearChatMsg:       { en: "This will delete the current conversation.", ar: "سيُحذَف سجل المحادثة الحالي." },

    // ======== شاشات التعريف ========
    skip:        { en: "Skip", ar: "تخطّي" },
    getStarted:  { en: "Get Started", ar: "ابدأ الآن" },
    ob1_title:   { en: "Enter Patient Information", ar: "أدخل بيانات المريض" },
    ob1_body:    { en: "Fill in the patient's demographic, medical, behavioral, and clinical information through a guided step-by-step questionnaire.",
                   ar: "أدخل المعلومات الديموغرافية والطبية والسلوكية والسريرية للمريض عبر استبيان موجَّه خطوة بخطوة." },
    ob2_title:   { en: "AI Analysis", ar: "تحليل بالذكاء الاصطناعي" },
    ob2_body:    { en: "DENTARA AI analyzes the patient's data and identifies the most important risk factors and areas that need improvement.",
                   ar: "يحلّل DENTARA AI بيانات المريض ويحدّد أهم عوامل الخطورة والمجالات التي تحتاج تحسينًا." },
    ob3_title:   { en: "Personalized Report", ar: "تقرير شخصي" },
    ob3_body:    { en: "Receive personalized oral hygiene instructions, SMART goals, a weekly plan, barriers & solutions, and a QR code linking to educational videos.",
                   ar: "احصل على تعليمات عناية فموية شخصية، أهداف أسبوعية، خطة أسبوعية، عوائق وحلولها، ورمز QR يربط بفيديوهات تعليمية." },

    knowledgeCenter:     { en: "AI Knowledge Center", ar: "مركز المعرفة" },
    knowledgeCenterCardD:{ en: "Patterns from all patients", ar: "أنماط من كل المرضى" },
    knowledgeCenterD:    { en: "Patterns extracted automatically from every analyzed patient — not a single case, but the accumulated experience of the whole clinic.",
                            ar: "أنماط مستخلصة تلقائيًا من كل مريض جرى تحليله — لا حالة واحدة، بل خبرة العيادة كلها مجتمعة." },
    knowledgeCenterNote: { en: "This is not AI \u201clearning\u201d — it simply counts what already exists in the saved data. The more patients you assess, the more accurate and useful this picture becomes.",
                            ar: "هذا ليس \u201cتعلّمًا\u201d من الذكاء الاصطناعي — هو فقط إحصاء لما هو موجود فعلاً في البيانات المحفوظة. كلما زاد عدد المرضى المُقيَّمين، ازدادت دقة هذه الصورة وفائدتها." },
    assessmentCompleteTitle: { en: "Assessment Completed Successfully!", ar: "اكتمل التقييم بنجاح!" },
    assessmentCompleteSub:   { en: "The AI personalized oral hygiene instructions have been generated, printed, and saved successfully.",
                                ar: "تم توليد تعليمات العناية الفموية الشخصية بالذكاء الاصطناعي وطباعتها وحفظها بنجاح." },
    departmentSummary:  { en: "DEPARTMENT SUMMARY", ar: "ملخص القسم" },
    departmentSummaryD: { en: "Overview of data collected and department performance",
                           ar: "نظرة عامة على البيانات المجمّعة وأداء القسم" },
    totalPatients:  { en: "Total Patients", ar: "إجمالي المرضى" },
    assessedLbl:    { en: "Assessed", ar: "تم تقييمهم" },
    ofTotal:        { en: "of total", ar: "من الإجمالي" },
    mostCommonFinding: { en: "Most Common Finding", ar: "أكثر ملاحظة شيوعًا" },
    patientsLbl:    { en: "patients", ar: "مريض" },
    avgPlaqueIndex: { en: "Average Plaque Index (PI)", ar: "متوسط مؤشر اللويحة الجرثومية (PI)" },
    acrossAllPatients: { en: "Across all patients", ar: "عبر كل المرضى" },
    csNote: { en: "Collected data can be exported for statistical analysis and future departmental research.",
              ar: "يمكن تصدير البيانات المجمّعة لأغراض التحليل الإحصائي والبحث العلمي المستقبلي للقسم." },
    dataSecureNote: { en: "All data is secure and confidential.", ar: "كل البيانات آمنة وسرّية." },
    exportData: { en: "Export Data", ar: "تصدير البيانات" },

    totalAssessed:    { en: "Total Assessed",   ar: "إجمالي المُقيَّمين" },
    highRisk:         { en: "High Risk",        ar: "خطورة مرتفعة" },
    moderateRiskS:    { en: "Moderate",         ar: "متوسطة" },
    lowRiskS:         { en: "Low",              ar: "منخفضة" },
    topRiskFactors:   { en: "Most Common Risk Factors & Problems", ar: "أكثر عوامل الخطورة والمشاكل شيوعًا" },
    topRecommendations:{ en: "Most Common AI Recommendations", ar: "أكثر التوصيات التي ولّدها الذكاء الاصطناعي" },
    topVideos:        { en: "Most Recommended Videos", ar: "أكثر الفيديوهات ترشيحًا" },
    noInsightsYet:    { en: "No analyzed assessments yet. Insights will appear here once you have patient data.",
                         ar: "لا توجد تقييمات مُحلَّلة بعد. ستظهر الإحصائيات هنا بمجرد توفّر بيانات مرضى." },
    noDataYet:        { en: "Not enough data yet", ar: "لا توجد بيانات كافية بعد" },

    deletePatient:    { en: "Delete Patient",  ar: "حذف المريض" },
    deletePatientMsg: { en: "Delete the record of", ar: "هل تريد حذف سجل" },
    questionsAdminOnly: { en: "Only the administrator can add, edit, or delete questionnaire questions.",
                           ar: "فقط المدير يستطيع إضافة أو تعديل أو حذف أسئلة الاستبيان." },
    sameTextBothLang:     { en: "Same text in both languages", ar: "نفس النص للغتين" },
    sameTextBothLangHint: { en: "Use one field only — useful for numbers or clinical values that don't need translation.",
                             ar: "استخدم حقلًا واحدًا فقط — مفيد للأرقام أو القيم السريرية التي لا تحتاج ترجمة." },

    // ======== إدارة حسابات الأطباء ========
    you:                { en: "You",           ar: "أنت" },
    resetPasswordTitle: { en: "Reset Password", ar: "إعادة تعيين كلمة المرور" },
    resetPasswordFor:   { en: "Set a new password for", ar: "عيّن كلمة مرور جديدة لـ" },
    resetPasswordBtn:   { en: "Reset Password", ar: "إعادة التعيين" },
    passwordReset:      { en: "Password reset successfully", ar: "تم تغيير كلمة المرور بنجاح" },
    changeRole:         { en: "Change Role",    ar: "تغيير الصلاحية" },
    makeAdminMsg:       { en: "Make this doctor an administrator?", ar: "هل تريد جعل هذا الطبيب مديرًا؟" },
    removeAdminMsg:     { en: "Remove administrator privileges from", ar: "هل تريد إزالة صلاحية المدير عن" },
    deleteDoctorTitle:  { en: "Delete Account", ar: "حذف الحساب" },
    deleteDoctorMsg:    { en: "Delete the account of", ar: "هل تريد حذف حساب" },

    notOwner:    { en: "Only the doctor who created this patient (or an admin) can edit it.",
                   ar: "فقط الطبيب الذي أضاف هذا المريض (أو المدير) يستطيع تعديله." },

    booklet:     { en: "Patient Booklet",  ar: "دفتر المريض" },
    openBooklet: { en: "Open Patient Booklet", ar: "فتح دفتر المريض" },
    bookletHint: { en: "A multi-page booklet: cover, how to use, goals, 6 weekly tracking tables, and a review page.",
                   ar: "دفتر من عدة صفحات: الغلاف، طريقة الاستخدام، الأهداف، ستة جداول أسبوعية، وصفحة المراجعة." },
    exportWord:  { en: "Export all to Word", ar: "تصدير الكل إلى Word" },
    reanalyze:   { en: "Re-analyze",         ar: "إعادة التحليل" },
    reanalyzeMsg:{ en: "This will regenerate the instructions in the current interface language and replace the saved ones. Continue?",
                   ar: "سيُعاد توليد التعليمات بلغة الواجهة الحالية وتحل محل المحفوظة. هل تريد المتابعة؟" },
    editResults: { en: "Edit Results",     ar: "تعديل النتائج" },
    badFormat:   { en: "The AI reply was not in a valid format after 3 attempts. Please retry.",
                   ar: "لم يرجع الذكاء الاصطناعي صيغة صالحة بعد 3 محاولات. أعد المحاولة." }
};

function t(key) {
    const entry = STR[key];
    if (!entry) return key;
    return entry[LANG] || entry.en;
}

// اختيار النص المناسب حسب اللغة مع الرجوع للإنجليزية إن لم تتوفر الترجمة
function pick(en, ar) {
    if (LANG === "ar") return (ar && String(ar).trim()) ? ar : en;
    return (en && String(en).trim()) ? en : ar;
}

function toggleLang() {
    LANG = (LANG === "en") ? "ar" : "en";
    try { localStorage.setItem(LANG_KEY, LANG); } catch (e) {}
    applyLangDirection();
    location.reload();
}

function applyLangDirection() {
    const html = document.documentElement;
    html.setAttribute("lang", LANG);
    html.setAttribute("dir", LANG === "ar" ? "rtl" : "ltr");
}
