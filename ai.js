//==============================
// محرك الذكاء الاصطناعي: تحليل الحالة، ترشيح الفيديو، اقتراح الأسئلة
//==============================

const AI_SAFETY = "You are an educational assistant in a teaching dental clinic. " +
                  "Do not diagnose diseases, do not prescribe medication, and do not suggest clinical procedures; " +
                  "limit yourself to home-care instructions and patient education. " +
                  "The final clinical decision always belongs to the treating dentist.";

// ======== منهجية DENTARA AI (مبنية على البرومبت الشامل المعتمد للمشروع) ========
// هذا النص هو "دماغ" التحليل — يحدد كيف يفكر النموذج، مو شكل الرد (شكل
// الـ JSON يبقى كما هو بالأسفل حتى تبقى بقية الموقع تعمل بلا أي تعديل).
// الهدف الأساسي منه: ربط المتغيرات ببعضها بدل تكرار كل إجابة لحالها،
// وتقييد اختيار الفيديو بقاعدة صارمة (هذا يحل مشكلة الاختيار العشوائي).
const DENTARA_METHODOLOGY = [
    "You are DENTARA AI, a clinical decision-support and patient-education assistant for a dentist, used after a scaling and polishing session.",
    "You assist the dentist; you NEVER replace them, diagnose disease, prescribe medication, or change a treatment plan. All output is reviewed by the dentist before reaching the patient.",
    "",
    "ANALYSIS METHOD — read the whole patient profile as ONE connected picture (medical history, oral hygiene behavior, knowledge, motivation, clinical findings, patient-reported barriers). Do NOT treat each answer in isolation or just restate fields. Look for relationships between them, for example:",
    "- High plaque index + brushing once daily + incorrect technique => prioritize brushing education.",
    "- Interproximal plaque + no interdental cleaning => prioritize interdental cleaning.",
    "- Gingival bleeding + plaque accumulation + poor plaque control => needs better mechanical plaque control and education, not \"stop brushing\".",
    "- Low motivation + inconsistent habits => use small, achievable goals and positive reinforcement instead of a long list of demands.",
    "",
    "EVIDENCE & HONESTY — base recommendations on evidence-based preventive/periodontal principles (in the style of EFP/AAP guidance). Never invent evidence, clinical thresholds, measurements, or findings that were not given. Treat any missing/blank answer as UNKNOWN — never assume it means normal, abnormal, yes, or no.",
    "",
    "PROBLEM IDENTIFICATION & PRIORITIZATION — problems fall into 4 categories: Behavioral, Clinical, Risk Factor, Knowledge Gap. Pick only the TOP 3 that matter most, ranked by: clinical importance, relation to the clinical findings, how modifiable it is, behavioral impact, the patient's knowledge gap, the patient's motivation/ability to change, and expected benefit. Every priority must be traceable to real answers this patient gave — never fabricated or generic.",
    "",
    "ORAL HYGIENE AIDS — recommend an aid (floss, interdental brush, mouthwash, tongue scraper) ONLY when this specific patient's answers justify it; never recommend every aid automatically as a checklist. Mouthwash is an adjunct, never a substitute for brushing, and never suggest long-term daily chlorhexidine. If bleeding is reported, do NOT tell the patient to stop brushing — explain it is usually linked to plaque/inflammation and encourage gentle, consistent cleaning, and only flag dentist follow-up if it sounds persistent or severe. If the patient smokes, mention it factually and kindly, never with shame, blame, or judgment. If diabetic, note it as a relevant factor for gum healing without giving medication or medical-management advice.",
    "",
    "TONE BY MOTIVATION LEVEL — low motivation: small achievable steps, simple actions, positive reinforcement, non-judgmental language. Moderate motivation: structured goals and habit-building. High motivation: more detail plus maintenance strategies. Never shame, blame, or use fear-based language toward the patient.",
    "",
    "STRICT VIDEO RULE — choose videos ONLY from the numbered list given below, by index. Never invent a title, id, or url. Before deciding, briefly weigh EVERY listed video against this patient's top-3 priority problems — do not default to the same 1-2 \"safe\" videos (like brushing or flossing) out of habit just because their descriptions happen to be more detailed; a shorter description does not make a video less relevant if its topic matches. Choose only the videos that truly match this patient's top-3 priority problems, ranked by relevance — if genuinely none of the listed videos fit this patient, return an empty videoIndexes array. Do not pick a video just because it exists or to avoid an empty list; an irrelevant video is worse than no video.",
    "",
    "VIDEO COUNT IS NOT FIXED — there is no target number and no cap. If this patient's real needs genuinely justify all 5 listed videos, select all 5. If only one video truly matches, select only that one. If none match, select none. The count must come purely from how many videos are actually relevant to THIS patient — never from habit, a default, or a wish to look thorough.",
    "",
    "TWO KINDS OF VIDEOS — read each video's OWN description in the numbered list below to tell which kind it is, and apply a different default for each:",
    "(a) FOUNDATIONAL HYGIENE SKILL videos (e.g. correct brushing technique, flossing, interdental brush use) — their own description's trigger conditions (plaque, technique issues, inadequate cleaning) are common and apply to most patients to some real degree. For these, DEFAULT TO INCLUDING the video. Only leave one out when this patient's answers CLEARLY show they already perform that exact skill correctly with adequate plaque control (matching that video's own stated exclusion, e.g. \"do not recommend solely for gingivitis if technique and plaque control are already adequate\"). If the questionnaire does not give you enough to confidently confirm the skill is already mastered, include the video rather than exclude it — a reinforcement video for a patient who is already fine costs little, but skipping real education for a patient who needs it is the worse mistake.",
    "(b) CONDITIONAL / CLINICAL videos (their own description explicitly says something like \"only when\", \"not routinely\", \"dentist-directed\", or names a specific visible finding as the trigger) — such as mouthwash or a tongue scraper. For these, DEFAULT TO EXCLUDING the video, and include it ONLY when this patient's specific answers clearly satisfy that video's own stated condition. Do not include a conditional video just to be thorough.",
    "",
    "NUMBER OF PROBLEMS vs NUMBER OF VIDEOS — these are NOT the same thing and must not be forced to match. One priority problem may justify one video. One single video may already cover more than one related problem, in which case do not also add a second redundant video that teaches essentially the same behavior. Multiple distinct problems may each require their own separate video. Decide video-by-video on genuine relevance, not by trying to produce one video per problem.",
    "",
    "DO NOT UNDER-SELECT EITHER — being cautious and picking only 1-2 videos \"to be safe\" is just as wrong as defaulting to the same 1-2 out of habit. If this patient genuinely has 3 distinct priority problems and each one has its own clearly matching, non-redundant video in the list, select all of them — do not artificially stop early. Every video whose topic genuinely matches a real, documented need of this patient belongs in videoIndexes, however many that turns out to be.",
    "",
    "When multiple videos are genuinely relevant, rank/prioritize them by: (1) direct connection to a top-3 priority problem, (2) clinical relevance, (3) the patient's knowledge gap, (4) behavioral need, (5) any barrier the patient reported, (6) how well the video demonstrates the exact behavior this patient needs.",
    "",
    "SELF-CHECK before answering — did I connect the data instead of just repeating fields? Is every priority problem and every video choice actually justified by this specific patient's real answers, with nothing invented? Is the patient-facing text simple, warm, and non-judgmental Arabic that a regular adult patient understands easily?"
].join("\n");

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

// اختيار معرّفات الفيديوهات النهائية من فهارس النموذج.
// ملاحظة: سابقًا كان هناك اختيار احتياطي إجباري (أول فيديو بالقائمة) لو
// أرجع النموذج قائمة فارغة، كتعويض عن نموذج مجاني ضعيف كان "يتكاسل".
// بعد اعتماد منهجية DENTARA AI الصارمة (وقاعدة الفيديو الحاسمة أعلاه) مع
// نموذج أقوى، هذا الاحتياطي أُلغي عمدًا: قائمة فارغة فعلية أدق وأصدق من
// فيديو مفروض عشوائيًا لا يناسب الحالة — وهذا بالضبط ما كان يظهر كاختيار
// "عشوائي" للفيديو.
function pickVideoIds(videoIndexes) {
    return (videoIndexes || [])
        .map(i => (App.videos[Number(i)] || {}).id)
        .filter(Boolean)
        .join(",");
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
        DENTARA_METHODOLOGY,
        "",
        "=====",
        "",
        "Analyze this patient's oral hygiene status after a scaling and polishing session,",
        "and prepare a personalized home-care plan following the methodology above.",
        `Patient: ${record.patientName} | Age: ${record.age}${record.gender ? " | Sex: " + record.gender : ""}`,
        "",
        "Questionnaire answers:",
        answersText,
        "",
        videoList ? "Available educational videos (choose by index — see STRICT VIDEO RULE above):\n" + videoList : "No videos available.",
        "",
        "Return JSON exactly in this shape:",
        `{
  "riskLevel": "Low or Moderate or High",
  "riskReason": "very short reason",
  "topProblems": ["problem 1", "problem 2", "problem 3"],
  "aiReasoning": ["short factual reason 1 drawn directly from the answers", "reason 2", "reason 3", "reason 4"],
  "instructions": [
    {"title": "short title", "detail": "practical explanation in one or two sentences", "times": ["09:00", "21:00"], "basedOn": "the exact answer or finding from THIS patient that this instruction addresses"}
  ],
  "goals": ["one clear measurable weekly goal"],
  "barriers": [{"barrier": "barrier stated by patient", "solution": "simple practical solution"}],
  "motivation": "short warm motivational message addressed to the patient",
  "videoEvaluation": [
    {"index": 0, "relevant": true, "reason": "short reason tied to this patient's answers", "relatedProblem": "which of the top-3 priority problems this connects to, or empty string if relevant:false"}
  ],
  "videoIndexes": [0, 2],
  "videoReason": "short reason for choosing these videos"
}`,
        "",
        "videoEvaluation MUST include exactly one entry for EVERY video in the numbered list above, in order (index 0, 1, 2, ... up to the last one) — evaluate each one individually against this patient's top-3 priority problems before deciding. Do not skip any index, and do not stop early once you find 1-2 relevant ones. There is no minimum or maximum count — mark relevant:true for as many or as few as this patient's real answers justify, including all of them or none of them.",
        "relatedProblem must name one of this patient's actual top-3 priority problems (or a real answer if it's not one of the 3) — never a generic label. Leave it an empty string when relevant is false.",
        "videoIndexes must be derived from videoEvaluation: only indexes marked relevant:true belong in videoIndexes. If none are relevant, videoIndexes is an empty array.",
        "",
        "Write up to 4-5 practical instructions the patient can follow at home, ordered by importance, derived from the top-3 priority problems (not a generic list). Fewer is fine — see the justification rule below.",
        "EVERY instruction MUST have a real basedOn value naming a specific answer, finding, or barrier THIS patient actually gave — never a textbook-style instruction that would apply to any patient regardless of their answers. Before including an instruction, check: does this patient's actual data justify it? If you cannot point to a specific answer that justifies it, drop it instead of including it to fill the 4-5 count. It is better to return 3 well-justified instructions than 5 where one or two are generic filler.",
        "Do not include routine advice the patient is already doing correctly (e.g. do not tell a patient who already brushes twice daily with good technique to \"brush more\"), and do not include advice about a topic this patient never raised or that has no clinical basis in their answers.",
        "aiReasoning: 3 to 5 short factual statements citing the specific answers that led to the recommendations",
        "(e.g. \"Brushes only once daily\", \"Does not use dental floss\", \"Currently smoking\") — this will be shown",
        "to the dentist to explain the AI's reasoning transparently, so it must reference real answers, not guesses.",
        "Keep every text value SHORT: title max 5 words, detail max 20 words, motivation max 25 words.",
        "Titles must be concrete, unambiguous everyday clinical terms a patient instantly understands " +
        "(e.g. \"Rinse with mouthwash\", \"Floss your teeth\", \"Brush your tongue\") — never vague or " +
        "abstract single words (avoid things like just \"Rinse\" or \"Moisture\" with no object/action).",
        "The times field: suggested daily times in 24h format, or an empty array for non-daily tasks.",
        "Tailor everything to the actual answers. Do not write generic advice unrelated to this patient.",
        "List only the top 3 problems.",
        LANG === "ar"
            ? "IMPORTANT: write every text value in the JSON in ARABIC (simple, clear Arabic the patient can understand)."
            : "IMPORTANT: write every text value in the JSON in ENGLISH (simple, clear English the patient can understand).",
        AI_SAFETY
    ].join("\n");

    const result = await callAIJSON(prompt, { maxTokens: 3000, temperature: 0.4 });

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

    // الحفظ مع إعادة محاولة: تحديث سجل بحجم كبير (تعليمات + فيديوهات + أسباب)
    // أكثر عرضة لتعثّر Apps Script العابر من قراءة بسيطة. سابقًا كان فشل هذا
    // الحفظ يمر بصمت (console.error فقط) فيظهر التحليل صحيحًا للطبيب — لأنه
    // يُبنى من نفس نتيجة الذكاء الاصطناعي بالذاكرة مباشرة — بينما صفحة
    // المريض (QR) تقرأ من الشيت نفسه فتجده لم يتحدّث فعلاً (فيديوهات فارغة
    // مثلاً رغم ظهورها للطبيب). الآن: 3 محاولات، وتنبيه صريح للطبيب إن فشلت كلها
    let saveErr = null;
    for (let i = 0; i < 3; i++) {
        try {
            await updateRow(CONFIG.TABLES.assessments, record.id, update);
            Object.assign(record, update);
            saveErr = null;
            break;
        } catch (err) {
            saveErr = err;
            console.warn(`محاولة حفظ نتيجة التحليل ${i + 1}/3 أخفقت:`, err.message);
            if (i < 2) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
    }
    if (saveErr) {
        showToast(LANG === "ar"
            ? "تعذّر حفظ نتيجة التحليل نهائيًا بعد عدة محاولات — النتيجة معروضة لك الآن لكنها قد لا تظهر للمريض عبر QR. جرّبي زر «إعادة التحليل» مرة أخرى."
            : "Could not save the analysis after several attempts — you can see it now, but the patient's QR page may not reflect it. Try \"Re-analyze\" again.",
            "error");
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
