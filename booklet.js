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
        good:       ar ? "جيد" : "Good",
        needs:      ar ? "بحاجة لتحسين" : "Needs improvement",

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

// المهام التي تصبح أعمدة الجدول الأسبوعي (من تعليمات الطبيب المولّدة)
function bookletTasks() {
    const r = (App.current && App.current.result) || {};
    const list = (r.instructions || []).slice(0, 4).map(i => ({
        title: i.title || "",
        times: (i.times || []).join(" • ")
    }));
    if (list.length > 0) return list;

    // احتياطي إن لم تُولَّد تعليمات بعد
    const ar = bookletLang() === "ar";
    return ar ? [
        { title: "تفريش الأسنان", times: "مرتان يوميًا" },
        { title: "استخدام الخيط", times: "مرة يوميًا" },
        { title: "غسول الفم", times: "" }
    ] : [
        { title: "Brushing", times: "Twice daily" },
        { title: "Flossing", times: "Once daily" },
        { title: "Mouthwash", times: "" }
    ];
}

// ======== جدول أسبوع واحد ========
function weekTable(n, S, tasks) {
    return `
    <div class="bk-week">
        <div class="bk-week-head">
            <span class="bk-week-num">${n}</span>
            <h3>${S.week} ${n}</h3>
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
            <span><span class="bk-box"></span> ${S.excellent}</span>
            <span><span class="bk-box"></span> ${S.good}</span>
            <span><span class="bk-box"></span> ${S.needs}</span>
        </div>
    </div>`;
}

// ======== بناء الدفتر كاملاً ========
function buildBooklet() {
    const S = bookletStrings();
    const tasks = bookletTasks();
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
        </div>

        <div class="bk-cover-foot">
            <i class="fa-solid fa-tooth"></i> ${S.together}
            <span class="bk-brand">${escapeHtml(P.brand)}</span>
        </div>
    </div>

    <!-- صفحة 2: طريقة الاستخدام + الأهداف -->
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

    <!-- الصفحة الأخيرة: المراجعة والمعلومات -->
    <div class="bk-page">
        <div class="bk-panel">
            <div class="bk-panel-head"><i class="fa-solid fa-flag-checkered"></i><h2>${S.reviewTitle}</h2></div>
            ${[
                { i: "fa-star", t: S.proud },
                { i: "fa-mountain", t: S.challenges },
                { i: "fa-circle-check", t: S.continueQ }
            ].map(x => `
                <p class="bk-label"><i class="fa-solid ${x.i}"></i> ${x.t}:</p>
                <div class="bk-writelines">${line()}${line()}</div>`).join("")}
            <p class="bk-label"><i class="fa-solid fa-heart"></i> ${S.letter}:</p>
            <div class="bk-goalbox bk-tall"></div>
        </div>

        <div class="bk-cheer">
            <i class="fa-solid fa-tooth"></i>
            <b>${S.youCan}</b>
            <p>${S.youCanSub}</p>
        </div>

        <div class="bk-row">
            <div class="bk-panel bk-half">
                <div class="bk-panel-head"><i class="fa-solid fa-circle-info"></i><h2>${S.infoTitle}</h2></div>
                <ul class="bk-info">${S.info.map(x => `<li>${x}</li>`).join("")}</ul>
            </div>
            <div class="bk-panel bk-half bk-qr">
                <div class="bk-panel-head"><i class="fa-solid fa-mobile-screen"></i><h2>${S.qrTitle}</h2></div>
                <div class="bk-qr-body">
                    <div id="bkQr"></div>
                    <p>${S.qrText}</p>
                </div>
            </div>
        </div>

        <div class="bk-foot">
            ${escapeHtml(pick(P.universityEn, P.university))} — ${escapeHtml(pick(P.collegeEn, P.college))}
            <span class="bk-brand">${escapeHtml(P.brand)}</span>
        </div>
    </div>`;

    $("bookletArea").innerHTML = html;
    renderBookletQR();
    showPage("bookletPage");
}

function renderBookletQR() {
    const box = $("bkQr");
    if (!box) return;
    box.innerHTML = "";
    const rec = App.current && App.current.record;
    if (!rec || !rec.id || typeof QRCode === "undefined") return;
    try {
        new QRCode(box, { text: patientPageUrl(rec.id), width: 96, height: 96,
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
