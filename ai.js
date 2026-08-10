//==============================
// محرك الذكاء الاصطناعي: تحليل الحالة، ترشيح الفيديو، اقتراح الأسئلة
//==============================

const AI_SAFETY = "You are an educational assistant in a teaching dental clinic. " +
                  "Do not diagnose diseases, do not prescribe medication, and do not suggest clinical procedures; " +
                  "limit yourself to home-care instructions and patient education. " +
                  "The final clinical decision always belongs to the treating dentist.";

// ======== بناء وصف الحالة من الإجابات ========
// نبني النص بالإنجليزية دائمًا (نص السؤال الأصلي) لأنه أدق للنموذج،
// بغض النظر عن لغة الواجهة التي يستخدمها الطبيب
function buildAnswersText(answers, questions) {
    const src = answers || (App.current || {}).answers || {};
    const qs = questions || App.questions;
    const lines = [];
    SECTIONS.forEach(section => {
        const inSection = qs.filter(q => (q.section || "dental") === section.key);
        const answered = inSection.filter(q => src[q.id] && String(src[q.id]).trim());
        if (answered.length === 0) return;
        lines.push(`\n[${section.en}]`);
        answered.forEach(q => lines.push(`- ${q.question || q.questionAr} => ${src[q.id]}`));
    });
    return lines.join("\n");
}

// ======== بناء قائمة الفيديوهات المرقّمة للنموذج ========
function buildVideoList() {
    return (App.videos || []).map((v, i) =>
        `${i}. العنوان: ${v.title || "بلا عنوان"}${v.description ? " | الوصف: " + v.description : ""}`
    ).join("\n");
}

// اختيار معرّفات الفيديوهات النهائية من فهارس النموذج. احتياطي مهم: نماذج
// الذكاء الاصطناعي (خصوصًا المجانية) أحيانًا تُرجع مصفوفة فارغة كسلًا رغم
// وجود فيديوهات متاحة فعلاً — بدل ما يبقى المريض بلا أي فيديو، نختار أول
// فيديو تلقائيًا كحد أدنى مضمون إن وُجدت فيديوهات ولم يختر النموذج شيئًا
function pickVideoIds(videoIndexes) {
    let ids = (videoIndexes || [])
        .map(i => (App.videos[Number(i)] || {}).id)
        .filter(Boolean);
    if (ids.length === 0 && (App.videos || []).length > 0) {
        ids = [App.videos[0].id].filter(Boolean);
    }
    return ids.join(",");
}

// ======== التحليل الرئيسي ========
// ======== الخطوة 1: حفظ الإجابات (قبل أي نداء للذكاء الاصطناعي) ========
// مهم: نحفظ أولاً حتى لا تضيع إجابات المريض إطلاقًا إن فشل نداء الذكاء
// الاصطناعي لأي سبب (انقطاع شبكة، تجاوز حصة، رد غير صالح).
async function saveAnswersFirst() {
    const p = App.current.patient;

    const patient = {
        id: uuid(),
        fullName: p.fullName,
        age: p.age,
        gender: p.gender || "",
        createdAt: today()
    };
    await addRow(CONFIG.TABLES.patients, patient);
    App.patients.push(patient);

    const record = {
        id: uuid(),
        patientId: patient.id,
        patientName: p.fullName,
        age: p.age,
        gender: p.gender || "",
        answers: JSON.stringify(App.current.answers),
        riskLevel: "",
        riskReason: "",
        topProblems: "",
        instructions: "",
        goals: "",
        barriers: "",
        motivation: "",
        videoIds: "",
        beforePhotoUrl: App.current.beforePhotoUrl || "",
        followUpDate: addDays(today(), 28),
        followUpCompleted: "no",
        analyzed: "no",
        createdBy: (App.currentDoctor && App.currentDoctor.id) || "",
        createdByName: (App.currentDoctor && App.currentDoctor.name) || "",
        createdAt: nowStamp()
    };
    await addRow(CONFIG.TABLES.assessments, record);
    App.assessments.unshift(record);

    App.current.record = record;
    App.current.patientRecord = patient;
    return record;
}

// ======== الخطوة 2: التحليل بالذكاء الاصطناعي ========
async function analyzeRecord(record, answers) {
    const videoList = buildVideoList();
    const answersText = buildAnswersText(answers);

    const prompt = [
        "Analyze this patient's oral hygiene status after a scaling and polishing session,",
        "and prepare a personalized home-care plan.",
        `Patient: ${record.patientName} | Age: ${record.age}${record.gender ? " | Sex: " + record.gender : ""}`,
        "",
        "Questionnaire answers:",
        answersText,
        "",
        videoList ? "Available educational videos (choose by index):\n" + videoList : "No videos available.",
        "",
        "Return JSON exactly in this shape:",
        `{
  "riskLevel": "Low or Moderate or High",
  "riskReason": "very short reason",
  "topProblems": ["problem 1", "problem 2", "problem 3"],
  "aiReasoning": ["short factual reason 1 drawn directly from the answers", "reason 2", "reason 3", "reason 4"],
  "instructions": [
    {"title": "short title", "detail": "practical explanation in one or two sentences", "times": ["09:00", "21:00"]}
  ],
  "goals": ["one clear measurable weekly goal"],
  "barriers": [{"barrier": "barrier stated by patient", "solution": "simple practical solution"}],
  "motivation": "short warm motivational message addressed to the patient",
  "videoIndexes": [0, 2],
  "videoReason": "short reason for choosing these videos"
}`,
        "",
        "Write 4 to 5 practical instructions the patient can follow at home, ordered by importance.",
        "aiReasoning: 3 to 5 short factual statements citing the specific answers that led to the recommendations",
        "(e.g. \"Brushes only once daily\", \"Does not use dental floss\", \"Currently smoking\") — this will be shown",
        "to the dentist to explain the AI's reasoning transparently, so it must reference real answers, not guesses.",
        "Keep every text value SHORT: title max 5 words, detail max 20 words, motivation max 25 words.",
        "Titles must be concrete, unambiguous everyday clinical terms a patient instantly understands " +
        "(e.g. \"Rinse with mouthwash\", \"Floss your teeth\", \"Brush your tongue\") — never vague or " +
        "abstract single words (avoid things like just \"Rinse\" or \"Moisture\" with no object/action).",
        "The times field: suggested daily times in 24h format, or an empty array for non-daily tasks.",
        "Tailor everything to the actual answers. Do not write generic advice unrelated to this patient.",
        "List only the top 3 problems. If any videos are listed above, you MUST choose at least 1 (and up to 3) " +
        "of the most relevant ones by index — never return an empty videoIndexes array when videos are available.",
        LANG === "ar"
            ? "IMPORTANT: write every text value in the JSON in ARABIC (simple, clear Arabic the patient can understand)."
            : "IMPORTANT: write every text value in the JSON in ENGLISH (simple, clear English the patient can understand).",
        AI_SAFETY
    ].join("\n");

    const result = await callAIJSON(prompt, { maxTokens: 2600, temperature: 0.4 });

    // حفظ نتيجة التحليل على نفس السجل المحفوظ مسبقًا
    // instrLang: نحفظ لغة توليد التعليمات نفسها، لأن اللغة الحالية للواجهة
    // (LANG) قد تتغيّر لاحقًا عند عرض/طباعة الدفتر، فتُخلط الأعمدة المولَّدة
    // بلغة قديمة مع نصوص الدفتر الثابتة بلغة جديدة — نستخدم هذا الحقل لاحقًا
    // لعرض الدفتر بأكمله بنفس لغة التحليل الأصلية بدل لغة الواجهة اللحظية
    const update = {
        riskLevel: result.riskLevel || "",
        riskReason: result.riskReason || "",
        topProblems: (result.topProblems || []).join(" | "),
        aiReasoning: JSON.stringify(result.aiReasoning || []),
        instructions: JSON.stringify(result.instructions || []),
        goals: (result.goals || []).join(" | "),
        barriers: JSON.stringify(result.barriers || []),
        motivation: result.motivation || "",
        videoIds: pickVideoIds(result.videoIndexes),
        analyzed: "yes",
        instrLang: LANG
    };

    try {
        await updateRow(CONFIG.TABLES.assessments, record.id, update);
        Object.assign(record, update);
    } catch (err) {
        // النتيجة معروضة للطبيب حتى لو تعذّر حفظها
        console.error("Could not save AI result:", err);
    }

    return result;
}

// ======== التدفق الكامل من شاشة المراجعة ========
async function runAIAnalysis() {
    collectStepAnswers();

    const answersText = buildAnswersText();
    if (!answersText.trim()) { showToast(t("noAnswers"), "error"); return; }

    showPage("processingPage");
    $("processingTitle").textContent = t("savingData");

    // 1) الحفظ أولاً
    let record;
    try {
        record = await saveAnswersFirst();
    } catch (err) {
        console.error(err);
        showPage("wizardPage");
        renderStep();
        showInfoModal(t("saveFailed"), `<p>${escapeHtml(err.message || "")}</p>`);
        return;
    }

    // 2) ثم التحليل
    $("processingTitle").textContent = t("analyzing");
    try {
        const result = await analyzeRecord(record, App.current.answers);
        App.current.result = result;
        renderResults(result);
    } catch (err) {
        console.error(err);
        showResultsUnanalyzed(record, err);
    }
}

// ======== إعادة تحليل سجل محفوظ ========
async function retryAnalysis(recordId) {
    const record = App.assessments.find(x => String(x.id) === String(recordId));
    if (!record) return;

    let answers = {};
    try { answers = JSON.parse(record.answers || "{}"); } catch (e) { answers = {}; }

    App.current = {
        patient: { fullName: record.patientName, age: record.age, gender: record.gender },
        answers,
        record
    };

    showPage("processingPage");
    $("processingTitle").textContent = t("analyzing");

    try {
        // نعيد تحميل الأسئلة والفيديوهات بالقوة قبل إعادة التحليل: لو كانت
        // فارغة أو غير محدَّثة وقت أول تحليل (تحميل لم يكتمل مثلاً)، هذا
        // يضمن أن النموذج يرى القائمة الكاملة والحالية فعلاً هذه المرة
        await loadAllData(true);
        const result = await analyzeRecord(record, answers);
        App.current.result = result;
        renderResults(result);
    } catch (err) {
        console.error(err);
        showResultsUnanalyzed(record, err);
    }
}

// ======== اقتراح أسئلة للاستبيان ========
async function suggestQuestions(goal, section, count) {
    const existing = App.questions.map(q => "- " + (q.question || q.questionAr)).join("\n");

    const prompt = [
        "Suggest questions for a questionnaire the dentist fills with the patient after a scaling and polishing session.",
        `Goal of the questions: ${goal}`,
        `Section: ${(SECTIONS.find(s => s.key === section) || {}).en || section}`,
        `Number required: ${count}`,
        existing ? "Existing questions (do not repeat them):\n" + existing : "No existing questions.",
        "",
        "Return JSON in this shape:",
        `{"questions":[{"question":"question text in English","questionAr":"نص السؤال بالعربية","type":"yesno|text|radio|multi|scale|likert","options":"opt1, opt2, opt3","optionsAr":"خيار1، خيار2، خيار3"}]}`,
        "",
        "Types: yesno for yes/no, text for open answer, radio for single choice, multi for multiple choice,",
        "scale for a 0-10 scale, likert for agreement (Strongly Agree to Strongly Disagree).",
        "The options fields are required only for radio and multi (comma separated), and for scale (the two ends only).",
        "Always provide BOTH the English text and the Arabic translation for every question and its options.",
        AI_SAFETY
    ].join("\n");

    return await callAIJSON(prompt, { maxTokens: 1800 });
}
