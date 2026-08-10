//==============================
// دفتر متابعة العناية الفموية — يُطبع مرة واحدة لكل مريض
//==============================
// دفتر من عدة صفحات: غلاف، طريقة الاستخدام والأهداف، ست جداول أسبوعية،
// ثم صفحة المراجعة والمعلومات المهمة مع رمز QR للفيديوهات.

const BOOKLET_WEEKS = 6;

// لغة الدفتر: نتبع لغة توليد التعليمات المحفوظة مع السجل (instrLang) لا
// لغة الواجهة الحالية، لأن الطبيب قد يبدّل لغة الواجهة بعد التحليل فتختلط
// أعمدة إنكليزية قديمة مع نصوص دفتر عربية جديدة أو العكس. السجلات القديمة
// التي لا تملك instrLang (قبل هذا التعديل) ترجع للغة الواجهة الحالية كما كان.
function bookletLang() {
    const rec = (App.current && App.current.record) || {};
    return rec.instrLang === "ar" || rec.instrLang === "en" ? rec.instrLang : LANG;
}

function bookletStrings(lang) {
    const ar = (lang || bookletLang()) === "ar";
    return {
        ar,
        title:      ar ? "دفتر متابعة العناية الفموية" : "Oral Care Tracking Booklet",
        subtitle:   ar ? "رحلتك نحو لثة صحية وابتسامة أجمل" : "Your journey to healthy gums and a better smile",
        intro:      ar ? "هذا الدفتر صُمّم خصيصًا لمساعدتك على الالتزام بتعليمات طبيبك وتحقيق أفضل صحة فموية."
                       : "This booklet was designed to help you follow your dentist's instructions and achieve better oral health.",
        name:       ar ? "الاسم" : "Name",
        num:        ar ? "رقم المريض" : "Patient No.",
        start:      ar ? "تاريخ البداية" : "Start date",
        nextVisit:  ar ? "موعد المراجعة" : "Next review",
        together:   ar ? "معًا نحو صحة فموية أفضل" : "Together toward better oral health",

        howTitle:   ar ? "كيف أستخدم هذا الدفتر؟" : "How do I use this booklet?",
        how: ar ? [
            "اتبع تعليمات طبيبك الشخصية المكتوبة في الورقة المرفقة.",
            "سجّل التزامك يوميًا في الجدول المخصص لذلك.",
            "قيّم حالة لثتك يوميًا بالنظر إلى نزف اللثة.",
            "راجع أهدافك الأسبوعية وحاول تحقيقها.",
            "كل أسبوع، راجع تقدمك واحتفل بإنجازك."
        ] : [
            "Follow your dentist's personal instructions on the attached sheet.",
            "Record your daily commitment in the tracking table.",
            "Check your gum condition daily by watching for bleeding.",
            "Review your weekly goals and work toward them.",
            "Each week, review your progress and celebrate it."
        ],
        howNote:    ar ? "الاستمرارية اليوم تصنع ابتسامتك غدًا" : "Consistency today builds your smile tomorrow",

        goalsTitle: ar ? "أهدافي الشخصية" : "My Personal Goals",
        goalsIntro: ar ? "هذه الأهداف مصممة لك بناءً على حالتك، حاول تحقيقها خلال الأسابيع القادمة."
                       : "These goals were tailored to your condition. Try to achieve them in the coming weeks.",
        mainGoal:   ar ? "هدفي اليومي الأساسي" : "My main daily goal",
        moreGoals:  ar ? "أهداف إضافية (إن وجدت)" : "Additional goals (if any)",
        goalTip:    ar ? "تذكّر: التحسين الصغير كل يوم يؤدي إلى نتائج كبيرة."
                       : "Remember: a small improvement each day leads to big results.",

        week:       ar ? "الأسبوع" : "Week",
        day:        ar ? "اليوم" : "Day",
        days: ar ? ["السبت","الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة"]
                 : ["Sat","Sun","Mon","Tue","Wed","Thu","Fri"],
        bleeding:   ar ? "نزف اللثة عند التفريش" : "Gum bleeding on brushing",
        bNo:        ar ? "لا" : "No",
        bLittle:    ar ? "قليل" : "Little",
        bMuch:      ar ? "كثير" : "Much",
        notes:      ar ? "ملاحظات" : "Notes",
        rate:       ar ? "تقييم الأسبوع" : "Week rating",
        excellent:  ar ? "ممتاز" : "Excellent",
        veryGood:   ar ? "جيد جدًا" : "Very good",
        good:       ar ? "جيد" : "Good",
        needs:      ar ? "بحاجة لتحسين" : "Needs improvement",

        aiInstructionsTitle: ar ? "تعليماتك الشخصية المولَّدة بالذكاء الاصطناعي" : "Your AI-Generated Personal Instructions",
        aiInstructionsSub:   ar ? "خطة مخصصة لك بناءً على حالتك الصحية وعاداتك اليومية"
                                 : "A plan tailored to your condition and daily habits",
        iconMouthwash: ar ? "غسول الفم" : "Mouthwash",
        iconFloss:     ar ? "استخدام الخيط" : "Floss",
        iconBrush:     ar ? "فرشاة الأسنان" : "Toothbrush",

        nextVisitReviewTitle: ar ? "تقييم الزيارة القادمة" : "Next Visit Review",
        clinicalResultsTitle: ar ? "النتائج السريرية" : "Clinical Results",
        piLabel:  ar ? "مؤشر اللويحة (PI)" : "Plaque Index (PI)",
        giLabel:  ar ? "مؤشر اللثة (GI)" : "Gingival Index (GI)",
        bopLabel: ar ? "نزف عند الفحص (BOP)" : "Bleeding on Probing (BOP)",
        doctorNotes: ar ? "ملاحظات الطبيب" : "Doctor's Notes",
        dateRangeLbl: ar ? "التاريخ" : "Date",

        reviewTitle:ar ? "مراجعة رحلتي" : "My Journey Review",
        proud:      ar ? "أكثر شيء أنا فخور به خلال هذه الأسابيع" : "What I am most proud of these weeks",
        challenges: ar ? "التحديات التي واجهتني" : "Challenges I faced",
        continueQ:  ar ? "ما الذي سأستمر به؟" : "What will I keep doing?",
        letter:     ar ? "رسالة لنفسي" : "A message to myself",

        youCan:     ar ? "أنت قادر على تحقيقها!" : "You can do it!",
        youCanSub:  ar ? "كل يوم تلتزم فيه خطوة نحو صحة أفضل وابتسامة أجمل"
                       : "Every day you commit is a step toward better health and a brighter smile",

        infoTitle:  ar ? "معلومات مهمة" : "Important Information",
        info: ar ? [
            "الاستمرارية على العناية الفموية هي سر صحة اللثة والأسنان.",
            "إذا لاحظت أي ألم شديد أو تورم أو نزف مستمر، راجع طبيبك.",
            "هذا الدفتر لا يغني عن المتابعة الدورية عند طبيب الأسنان."
        ] : [
            "Consistency in oral care is the key to healthy gums and teeth.",
            "If you notice severe pain, swelling, or persistent bleeding, see your dentist.",
            "This booklet does not replace regular dental check-ups."
        ],
        qrTitle:    ar ? "تعليمات مرئية" : "Visual Instructions",
        qrText:     ar ? "امسح رمز QR لمشاهدة فيديوهات تعليمية مخصصة لك، ولعرض تعليماتك الشخصية"
                       : "Scan the QR code to watch educational videos tailored for you and view your personal instructions",
        myTasks:    ar ? "مهامي اليومية" : "My Daily Tasks"
    };
}

// المهام التي تصبح أعمدة الجدول الأسبوعي. الأولوية:
// 1) تخصيص هذا المريض تحديدًا (يعدّله الطبيب المالك للسجل من زر "تعديل الدفتر")
// 2) تعليمات الذكاء الاصطناعي المولَّدة لهذا المريض
// 3) القالب الافتراضي العام (يعدّله المدير فقط من الإعدادات)
// 4) قائمة احتياطية مدمجة بالكود إن لم يوجد أي مما سبق
async function bookletTasks() {
    const rec = (App.current && App.current.record) || {};

    if (rec.bookletTasksOverride) {
        try {
            const custom = JSON.parse(rec.bookletTasksOverride);
            if (Array.isArray(custom) && custom.length > 0) return custom;
        } catch (e) {}
    }

    const r = (App.current && App.current.result) || {};
    const list = (r.instructions || []).slice(0, 4).map(i => ({
        title: i.title || "",
        times: (i.times || []).join(" • ")
    }));
    if (list.length > 0) return list;

    const ar = bookletLang() === "ar";

    const tmpl = await loadBookletTemplate();
    if (tmpl.length > 0) {
        return tmpl.slice(0, 4).map(row => ({
            title: (ar ? row.titleAr : row.title) || row.title || row.titleAr || "",
            times: row.times || ""
        }));
    }

    // احتياطي أخير إن لم يوجد قالب مدير ولا تعليمات مولَّدة
    return ar ? [
        { title: "تفريش الأسنان", times: "مرتان يوميًا" },
        { title: "استخدام خيط الأسنان", times: "مرة يوميًا" },
        { title: "غسول الفم / الغرغرة", times: "" },
        { title: "استعمال كاشط اللسان", times: "" }
    ] : [
        { title: "Brush Teeth", times: "Twice daily" },
        { title: "Use Dental Floss", times: "Once daily" },
        { title: "Mouthwash / Gargle", times: "" },
        { title: "Use Tongue Scraper", times: "" }
    ];
}

// ======== القالب الافتراضي العام لدفتر المتابعة (يديره المدير فقط) ========
// يُحمَّل مرة واحدة ويُخزَّن مؤقتًا؛ إن لم يوجد التبويب بعد بملف الشيت
// (أول استخدام قبل أن ينشئه أحد) نرجع قائمة فارغة بصمت ونستخدم الاحتياطي
async function loadBookletTemplate(force = false) {
    if (App.bookletTemplate && !force) return App.bookletTemplate;
    try {
        App.bookletTemplate = await readSheet(CONFIG.TABLES.bookletTemplate);
    } catch (e) {
        App.bookletTemplate = [];
    }
    return App.bookletTemplate;
}

// ======== جدول أسبوع واحد ========
function weekTable(n, S, tasks) {
    return `
    <div class="bk-week">
        <div class="bk-week-head">
            <span class="bk-week-num">${n}</span>
            <h3>${S.week} ${n}</h3>
            <span class="bk-week-range">${S.dateRangeLbl}: ____ / ____ / 20__ — ____ / ____ / 20__</span>
        </div>
        <table class="bk-table">
            <thead>
                <tr>
                    <th class="bk-day">${S.day}</th>
                    ${tasks.map(t => `<th>${escapeHtml(t.title)}${t.times ? `<span>${escapeHtml(t.times)}</span>` : ""}</th>`).join("")}
                    <th class="bk-bleed">${S.bleeding}<span>${S.bNo} / ${S.bLittle} / ${S.bMuch}</span></th>
                    <th class="bk-notes">${S.notes}</th>
                </tr>
            </thead>
            <tbody>
                ${S.days.map(d => `
                <tr>
                    <td class="bk-day">${d}</td>
                    ${tasks.map(() => `<td><span class="bk-circle"></span></td>`).join("")}
                    <td class="bk-bleed">
                        <span class="bk-circle"></span><span class="bk-circle"></span><span class="bk-circle"></span>
                    </td>
                    <td class="bk-notes"></td>
                </tr>`).join("")}
            </tbody>
        </table>
        <div class="bk-rate">
            <b>${S.rate} ${n}:</b>
            <span><span class="bk-box"></span> ${S.needs}</span>
            <span><span class="bk-box"></span> ${S.good}</span>
            <span><span class="bk-box"></span> ${S.veryGood}</span>
            <span><span class="bk-box"></span> ${S.excellent}</span>
        </div>
    </div>`;
}

// ======== بناء الدفتر كاملاً ========
async function buildBooklet() {
    const S = bookletStrings();
    const tasks = await bookletTasks();
    const p = (App.current && App.current.patient) || {};
    const rec = (App.current && App.current.record) || {};
    const r = (App.current && App.current.result) || {};
    const goals = r.goals || [];
    const P = CONFIG.PROJECT;

    const line = () => `<span class="bk-line"></span>`;

    const html = `
    <!-- صفحة 1: الغلاف -->
    <div class="bk-page bk-cover">
        <div class="bk-cover-top">
            <div class="bk-logo"><i class="fa-solid fa-tooth"></i><i class="fa-solid fa-shield-halved bk-shield"></i></div>
            <h1>${S.title}</h1>
            <p class="bk-sub">${S.subtitle}</p>
        </div>

        <p class="bk-intro">${S.intro}</p>

        <div class="bk-idcard">
            <p><b>${S.name}:</b> ${escapeHtml(p.fullName || "")} ${p.fullName ? "" : line()}</p>
            <p><b>${S.num}:</b> ${escapeHtml(rec.id || "")} ${rec.id ? "" : line()}</p>
            <p><b>${S.start}:</b> ${escapeHtml(today())}</p>
            <p><b>${S.nextVisit}:</b> ${escapeHtml(rec.followUpDate || "")} ${rec.followUpDate ? "" : line()}</p>
        </div>

        <div class="bk-cover-foot">
            <i class="fa-solid fa-tooth"></i> ${S.together}
            <span class="bk-brand">${escapeHtml(P.brand)}</span>
        </div>
    </div>

    <!-- صفحة 2: تعليماتك الشخصية + رمز QR للفيديوهات -->
    <div class="bk-page">
        <div class="bk-panel bk-instructions-panel">
            <div class="bk-panel-head"><i class="fa-solid fa-microchip"></i><h2>${S.aiInstructionsTitle}</h2></div>
            <p class="bk-panel-intro">${S.aiInstructionsSub}</p>
            <div class="bk-goalbox bk-tall"></div>
        </div>

        <div class="bk-panel bk-qr">
            <div class="bk-panel-head"><i class="fa-solid fa-mobile-screen"></i><h2>${S.qrTitle}</h2></div>
            <div class="bk-qr-body">
                <div id="bkQr"></div>
                <p>${S.qrText}</p>
            </div>
        </div>

        <div class="bk-icon-row">
            ${[
                { i: "fa-glass-water", t: S.iconMouthwash },
                { i: "fa-brush", t: S.iconFloss },
                { i: "fa-tooth", t: S.iconBrush }
            ].map(x => `<div class="bk-icon-item"><i class="fa-solid ${x.i}"></i><span>${x.t}</span></div>`).join("")}
        </div>
    </div>

    <!-- صفحة: طريقة الاستخدام + الأهداف -->
    <div class="bk-page">
        <div class="bk-panel">
            <div class="bk-panel-head"><i class="fa-solid fa-clipboard-list"></i><h2>${S.howTitle}</h2></div>
            ${S.how.map((x, i) => `
                <div class="bk-how"><span class="bk-how-num">${i + 1}</span><p>${x}</p></div>`).join("")}
            <p class="bk-note"><i class="fa-solid fa-heart"></i> ${S.howNote}</p>
        </div>

        <div class="bk-panel">
            <div class="bk-panel-head"><i class="fa-solid fa-bullseye"></i><h2>${S.goalsTitle}</h2></div>
            <p class="bk-panel-intro">${S.goalsIntro}</p>

            <p class="bk-label">${S.mainGoal}:</p>
            <div class="bk-goalbox">${escapeHtml(goals[0] || "")}</div>

            <p class="bk-label">${S.moreGoals}:</p>
            ${[1, 2, 3].map(i => `
                <p class="bk-goalline"><b>${i}.</b> ${escapeHtml(goals[i] || "")} ${goals[i] ? "" : line()}</p>`).join("")}

            <p class="bk-tip"><i class="fa-solid fa-lightbulb"></i> ${S.goalTip}</p>
        </div>
    </div>

    <!-- صفحات الأسابيع: أسبوعان في كل صفحة -->
    ${Array.from({ length: Math.ceil(BOOKLET_WEEKS / 2) }, (_, i) => `
        <div class="bk-page">
            ${weekTable(i * 2 + 1, S, tasks)}
            ${(i * 2 + 2) <= BOOKLET_WEEKS ? weekTable(i * 2 + 2, S, tasks) : ""}
        </div>`).join("")}

    <!-- الصفحة الأخيرة: تقييم الزيارة القادمة -->
    <div class="bk-page">
        <div class="bk-panel">
            <div class="bk-panel-head"><i class="fa-solid fa-flag-checkered"></i><h2>${S.nextVisitReviewTitle}</h2></div>
            <p><b>${S.nextVisit}:</b> ${escapeHtml(rec.followUpDate || "")} ${rec.followUpDate ? "" : line()}</p>

            <p class="bk-label">${S.clinicalResultsTitle}:</p>
            <div class="bk-clinical-row">
                <span><span class="bk-circle bk-circle-lg"></span> ${S.piLabel}</span>
                <span><span class="bk-circle bk-circle-lg"></span> ${S.giLabel}</span>
                <span><span class="bk-circle bk-circle-lg"></span> ${S.bopLabel}</span>
            </div>

            <p class="bk-label"><i class="fa-solid fa-notes-medical"></i> ${S.doctorNotes}:</p>
            <div class="bk-goalbox bk-tall"></div>
        </div>

        <div class="bk-cheer">
            <i class="fa-solid fa-tooth"></i>
            <b>${S.youCan}</b>
            <p>${S.youCanSub}</p>
        </div>

        <div class="bk-panel">
            <div class="bk-panel-head"><i class="fa-solid fa-circle-info"></i><h2>${S.infoTitle}</h2></div>
            <ul class="bk-info">${S.info.map(x => `<li>${x}</li>`).join("")}</ul>
        </div>

        <div class="bk-foot">
            ${escapeHtml(pick(P.universityEn, P.university))} — ${escapeHtml(pick(P.collegeEn, P.college))}
            <span class="bk-brand">${escapeHtml(P.brand)}</span>
        </div>
    </div>`;

    $("bookletArea").innerHTML = html;
    renderBookletQR();
    const editBtn = $("editBookletBtn");
    if (editBtn) editBtn.classList.toggle("hidden", !canEditRecord(rec));
    showPage("bookletPage");
}

// ======== تعديل مهام دفتر هذا المريض تحديدًا (الطبيب المالك للسجل فقط) ========
async function editBookletTasks() {
    const rec = (App.current && App.current.record) || {};
    if (!canEditRecord(rec)) return;

    const tasks = await bookletTasks();
    const rows = [0, 1, 2, 3].map(i => {
        const it = tasks[i] || { title: "", times: "" };
        return `
        <div class="form-group">
            <label>${t("taskLbl")} ${i + 1}</label>
            <input id="bkTaskTitle${i}" value="${escapeHtml(it.title)}">
            <input id="bkTaskTimes${i}" value="${escapeHtml(it.times)}" placeholder="${t("taskTimesPh")}" style="margin-top:6px;">
        </div>`;
    }).join("");

    openModal(t("editBooklet"), `
        <p class="modal-note">${t("editBookletNote")}</p>
        ${rows}
    `, async () => {
        const newTasks = [0, 1, 2, 3]
            .map(i => ({
                title: ($(`bkTaskTitle${i}`).value || "").trim(),
                times: ($(`bkTaskTimes${i}`).value || "").trim()
            }))
            .filter(t => t.title);
        if (newTasks.length === 0) return;

        await updateRow(CONFIG.TABLES.assessments, rec.id, {
            bookletTasksOverride: JSON.stringify(newTasks)
        });
        rec.bookletTasksOverride = JSON.stringify(newTasks);
        closeModal();
        buildBooklet();
    });
}

function renderBookletQR() {
    const box = $("bkQr");
    if (!box) return;
    box.innerHTML = "";
    const rec = App.current && App.current.record;
    if (!rec || !rec.id || typeof QRCode === "undefined") return;
    try {
        new QRCode(box, { text: patientPageUrl(rec.id, true), width: 96, height: 96,
                          correctLevel: QRCode.CorrectLevel.M });
    } catch (e) { box.textContent = "QR"; }
}

// طباعة الدفتر بنفس آلية الإطار المخفي (تعمل على iPhone و Android)
function printBooklet() {
    printElement("bookletArea", bookletStrings().title);
    // بعد إطلاق الطباعة مباشرة (لا يمكن الانتظار بثقة لاكتمال نافذة
    // الطباعة نفسها عبر المتصفحات)، نعرض شاشة الاكتمال وملخص القسم
    showAssessmentComplete();
}
