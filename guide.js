//==============================
// دليل استخدام النظام — نافذة تشرح كل ميزة وطريقة استعمالها
//==============================

function openUserGuide() {
    const ar = LANG === "ar";

    const sections = ar ? [
        { icon: "fa-user-plus", title: "تقييم مريض جديد",
          body: "من الصفحة الرئيسية اضغط \"مريض جديد\"، أدخل اسم المريض وعمره وجنسه، ثم أجب عن الاستبيان قسمًا بعد قسم مع المريض. في الخطوة الأخيرة (الفحص السريري) تُدخل أنت نتائج الفحص." },
        { icon: "fa-wand-magic-sparkles", title: "توليد التعليمات بالذكاء الاصطناعي",
          body: "بعد إكمال الاستبيان، تُحفظ الإجابات أولاً، ثم يحلّلها الذكاء الاصطناعي ويولّد تعليمات عناية شخصية، ويرشّح فيديوهات مناسبة من مكتبتك. إن فشل التحليز لأي سبب، إجاباتك تبقى محفوظة ويمكنك إعادة المحاولة من سجل المرضى." },
        { icon: "fa-pen-to-square", title: "تعديل النتائج",
          body: "كل ما يولّده الذكاء الاصطناعي مجرد مسودة. من شاشة النتائج اضغط \"تعديل النتائج\" لتغيير أي جزء (الخطورة، التعليمات، الأهداف، الفيديوهات...) قبل تسليمه للمريض." },
        { icon: "fa-book", title: "دفتر المريض",
          body: "من شاشة النتائج اضغط \"فتح دفتر المريض\" لإنشاء دفتر متابعة قابل للطباعة (غلاف، أهداف، جداول أسبوعية للتأشير، ورمز QR يفتح صفحة خاصة بالمريض على هاتفه)." },
        { icon: "fa-qrcode", title: "صفحة المريض عبر QR",
          body: "يمسح المريض رمز QR المطبوع في دفتره ليفتح صفحة خاصة به على هاتفه، تعرض تعليماته وفيديوهاته، ويستطيع تأشير كل مهمة أنجزها." },
        { icon: "fa-clipboard-question", title: "إدارة الأسئلة",
          body: "من الإعدادات ← الاستبيان: أضف أو عدّل أو احذف الأسئلة، أو استورد الأسئلة الافتراضية (44 سؤالًا جاهزة)، أو اطلب من الذكاء الاصطناعي اقتراح أسئلة جديدة." },
        { icon: "fa-video", title: "إضافة فيديوهات تعليمية",
          body: "من الإعدادات ← الفيديوهات: أضف رابط يوتيوب أو Google Drive، أو ارفع ملف فيديو من جهازك مباشرة (حتى 8 ميجابايت). اكتب وصفًا دقيقًا لكل فيديو — الذكاء الاصطناعي يعتمد على الوصف ليختار الفيديو المناسب لكل مريض." },
        { icon: "fa-folder-open", title: "المرضى السابقون",
          body: "سجل كامل بكل التقييمات المحفوظة، قابل للبحث بالاسم. التقييمات التي لم تُحلَّل بعد تظهر بشارة مميزة مع زر لإعادة المحاولة." },
        { icon: "fa-file-word", title: "تصدير الكل إلى Word",
          body: "من صفحة المرضى السابقون، زر \"تصدير الكل إلى Word\" ينشئ ملفًا واحدًا يحتوي كل المرضى وتقييماتهم وإجاباتهم الكاملة، جاهزًا للأرشفة أو الطباعة." },
        { icon: "fa-language", title: "تبديل اللغة",
          body: "زر \"ع / EN\" أعلى كل صفحة يبدّل لغة الواجهة والأسئلة وردّ الذكاء الاصطناعي بالكامل بين العربية والإنجليزية." }
    ] : [
        { icon: "fa-user-plus", title: "New Patient Assessment",
          body: "From the home page tap \"New Patient\", enter the patient's name, age and sex, then go through the questionnaire section by section with the patient. In the last step (Clinical Examination) you enter the exam findings yourself." },
        { icon: "fa-wand-magic-sparkles", title: "AI-Generated Instructions",
          body: "After completing the questionnaire, the answers are saved first, then AI analyzes them and generates personalized care instructions, recommending matching videos from your library. If analysis fails for any reason, the answers remain saved and you can retry from the patient record." },
        { icon: "fa-pen-to-square", title: "Editing Results",
          body: "Everything the AI generates is just a draft. From the results screen tap \"Edit Results\" to change any part (risk level, instructions, goals, videos...) before handing it to the patient." },
        { icon: "fa-book", title: "Patient Booklet",
          body: "From the results screen tap \"Open Patient Booklet\" to create a printable tracking booklet (cover, goals, weekly tick tables, and a QR code that opens a personal page for the patient)." },
        { icon: "fa-qrcode", title: "Patient Page via QR",
          body: "The patient scans the QR code printed in their booklet to open a personal page on their phone showing their instructions and videos, and can tick off each task they complete." },
        { icon: "fa-clipboard-question", title: "Managing Questions",
          body: "From Settings ← Questionnaire: add, edit, or delete questions, import the default question set (44 ready questions), or ask AI to suggest new ones." },
        { icon: "fa-video", title: "Adding Educational Videos",
          body: "From Settings ← Videos: add a YouTube or Google Drive link, or upload a video file directly from your device (up to 8MB). Write an accurate description for each video — AI relies on it to match videos to each patient." },
        { icon: "fa-folder-open", title: "Previous Patients",
          body: "A full record of all saved assessments, searchable by name. Assessments not yet analyzed show a badge with a retry button." },
        { icon: "fa-file-word", title: "Export All to Word",
          body: "From the Previous Patients page, the \"Export all to Word\" button creates one file containing every patient, their full assessment and answers — ready for archiving or printing." },
        { icon: "fa-language", title: "Switching Language",
          body: "The \"ع / EN\" button at the top of every page switches the interface, questions, and AI responses fully between Arabic and English." }
    ];

    openModal(ar ? "دليل الاستخدام" : "User Guide", `
        <p class="guide-intro">${ar
            ? "نظام تعليمات عناية فموية مخصصة بالذكاء الاصطناعي، يستخدمه الطبيب بعد جلسة التقليح والتلميع لإعداد خطة عناية شخصية لكل مريض."
            : "An AI-powered personalized oral hygiene system, used by the dentist after a scaling and polishing session to prepare a personal care plan for each patient."}</p>
        ${sections.map(s => `
            <div class="guide-item">
                <i class="fa-solid ${s.icon}"></i>
                <div>
                    <b>${s.title}</b>
                    <p>${s.body}</p>
                </div>
            </div>`).join("")}
    `, null);
}
