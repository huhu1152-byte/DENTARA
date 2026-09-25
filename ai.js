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
    "EVIDENCE & HONESTY — base recommendations on evidence-based preventive/periodontal principles (in the style of EFP/AAP guidance). Never invent evidence, clinical thresholds, measurements, or findings that were not given. Treat any missing/blank answer as UNKNOWN — never assume it means normal, abnormal, yes, or no. If a piece of information needed for a confident recommendation is genuinely missing, list it in missing_information instead of guessing.",
    "",
    "PROBLEM IDENTIFICATION & PRIORITIZATION — problems fall into 4 categories: Behavioral, Clinical, Risk Factor, Knowledge Gap. Pick only the TOP 3 that matter most, ranked by: clinical importance, relation to the clinical findings, how modifiable it is, behavioral impact, the patient's knowledge gap, the patient's motivation/ability to change, and expected benefit. Every priority must be traceable to real answers this patient gave (list them in its evidence array) — never fabricated or generic.",
    "",
    "ORAL HYGIENE AIDS — recommend an aid (floss, interdental brush, mouthwash, tongue scraper) ONLY when this specific patient's answers justify it; never recommend every aid automatically as a checklist. Mouthwash is an adjunct, never a substitute for brushing, and never suggest long-term daily chlorhexidine. If bleeding is reported, do NOT tell the patient to stop brushing — explain it is usually linked to plaque/inflammation and encourage gentle, consistent cleaning, and only flag dentist follow-up if it sounds persistent or severe. If the patient smokes, mention it factually and kindly, never with shame, blame, or judgment. If diabetic, note it as a relevant factor for gum healing without giving medication or medical-management advice.",
    "",
    "TONE BY MOTIVATION LEVEL — low motivation: small achievable steps, simple actions, positive reinforcement, non-judgmental language. Moderate motivation: structured goals and habit-building. High motivation: more detail plus maintenance strategies. Never shame, blame, or use fear-based language toward the patient.",
    "",
    "STRICT VIDEO RULE — choose videos ONLY from the numbered list given below, by their exact leading index number (0, 1, 2, ...). Never invent a title, id, url, or index. Before deciding, briefly weigh EVERY listed video against this patient's top-3 priority problems — do not default to the same 1-2 \"safe\" videos (like brushing or flossing) out of habit just because their descriptions happen to be more detailed; a shorter description does not make a video less relevant if its topic matches. Choose only the videos that truly match this patient's top-3 priority problems, ranked by relevance — if genuinely none of the listed videos fit this patient, return an empty recommended_videos array. Do not pick a video just because it exists or to avoid an empty list; an irrelevant video is worse than no video.",
    "",
    "VIDEO COUNT IS NOT FIXED — there is no target number and no cap. If this patient's real needs genuinely justify all listed videos, select all of them. If only one video truly matches, select only that one. If none match, select none. The count must come purely from how many videos are actually relevant to THIS patient — never from habit, a default, or a wish to look thorough. All recommended videos live together in ONE list (recommended_videos) — there is no per-week video assignment and no weekly cap.",
    "",
    "TWO KINDS OF VIDEOS — read each video's OWN description in the numbered list below to tell which kind it is, and apply a different default for each:",
    "(a) FOUNDATIONAL HYGIENE SKILL videos (e.g. correct brushing technique, flossing, interdental brush use) — their own description's trigger conditions (plaque, technique issues, inadequate cleaning) are common and apply to most patients to some real degree. For these, DEFAULT TO INCLUDING the video. Only leave one out when this patient's answers CLEARLY show they already perform that exact skill correctly with adequate plaque control (matching that video's own stated exclusion, e.g. \"do not recommend solely for gingivitis if technique and plaque control are already adequate\"). If the questionnaire does not give you enough to confidently confirm the skill is already mastered, include the video rather than exclude it — a reinforcement video for a patient who is already fine costs little, but skipping real education for a patient who needs it is the worse mistake.",
    "(b) CONDITIONAL / CLINICAL videos (their own description explicitly says something like \"only when\", \"not routinely\", \"dentist-directed\", or names a specific visible finding as the trigger) — such as mouthwash or a tongue scraper. For these, DEFAULT TO EXCLUDING the video, and include it ONLY when this patient's specific answers clearly satisfy that video's own stated condition. Do not include a conditional video just to be thorough.",
    "",
    "NUMBER OF PROBLEMS vs NUMBER OF VIDEOS — these are NOT the same thing and must not be forced to match. One priority problem may justify one video. One single video may already cover more than one related problem, in which case do not also add a second redundant video that teaches essentially the same behavior. Multiple distinct problems may each require their own separate video. Decide video-by-video on genuine relevance, not by trying to produce one video per problem.",
    "",
    "DO NOT UNDER-SELECT EITHER — being cautious and picking only 1-2 videos \"to be safe\" is just as wrong as defaulting to the same 1-2 out of habit. If this patient genuinely has 3 distinct priority problems and each one has its own clearly matching, non-redundant video in the list, select all of them — do not artificially stop early. Every video whose topic genuinely matches a real, documented need of this patient belongs in recommended_videos, however many that turns out to be.",
    "",
    "When multiple videos are genuinely relevant, rank/prioritize them (the \"priority\" number in recommended_videos, 1 = most important) by: (1) direct connection to a top-3 priority problem, (2) clinical relevance, (3) the patient's knowledge gap, (4) behavioral need, (5) any barrier the patient reported, (6) how well the video demonstrates the exact behavior this patient needs.",
    "",
    "SELF-CHECK before answering — did I connect the data instead of just repeating fields? Is every priority problem, instruction, aid, and video choice actually justified by this specific patient's real answers, with nothing invented? Is the patient-facing Arabic text simple, warm, and non-judgmental, easy for a regular Iraqi adult patient to understand? Is the dentist-facing text (dentist_summary, why_prioritized) concise, clinical, and traceable, in English?"
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

// ======== بناء قائمة الفيديوهات المرقّمة للنموذج (فهرس موثوق + id حقيقي) ========
function buildVideoList() {
    return (App.videos || []).filter(v => v.id).map((v, i) =>
        `${i}. video_id: ${v.id} | العنوان: ${v.title || "بلا عنوان"}${v.description ? " | الوصف: " + v.description : ""}`
    ).join("\n");
}

// قائمة الفيديوهات المتاحة بنفس ترتيب buildVideoList بالضبط (index يطابق
// نفس index المُرقَّم بالنص أعلاه) — نعتمد عليها لاستخراج id الحقيقي
function videoListArray() {
    return (App.videos || []).filter(v => v.id);
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
        patientSummaryAr: "",
        dentistSummary: "",
        riskLevel: "",
        riskFactors: "",
        priorityProblems: "",
        personalizedInstructions: "",
        oralHygieneAids: "",
        smartGoals: "",
        barriersSolutions: "",
        recommendedVideos: "",
        motivationalMessage: "",
        followUp: "",
        missingInformation: "",
        dentistReviewRequired: "",
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
  "patient_summary": {"arabic": "short warm Arabic summary of this patient's oral hygiene status", "dentist_summary": "short clinical English summary for the dentist"},
  "risk_assessment": {"level": "Low or Moderate or High", "supporting_factors": ["short factor 1", "factor 2"]},
  "priority_problems": [
    {"priority": 1, "problem": "short problem name", "category": "Behavioral or Clinical or Risk Factor or Knowledge Gap", "evidence": ["exact answer(s) supporting this"], "why_prioritized": "one short sentence"}
  ],
  "personalized_instructions": [
    {"priority_problem": "must match one of the priority_problems.problem values above", "instruction_arabic": "short imperative instruction in Arabic", "how_to_do_it_arabic": "one or two sentence practical how-to in Arabic", "frequency": "e.g. مرتين يوميًا", "duration": "e.g. دقيقتين", "when": "e.g. 09:00, 21:00 or empty string if not time-based", "habit_tip_arabic": "one short practical tip to help the habit stick"}
  ],
  "oral_hygiene_aids": [
    {"aid": "e.g. خيط الأسنان", "reason": "why this patient specifically needs it", "how_to_use_arabic": "short how-to in Arabic", "frequency": "e.g. مرة يوميًا", "precautions": "short caution if any, else empty string"}
  ],
  "smart_goals": [
    {"goal_arabic": "one clear measurable goal in Arabic", "measurement": "how success is measured", "time_frame": "e.g. خلال أسبوع", "related_priority": 1}
  ],
  "barriers_and_solutions": [
    {"barrier": "barrier stated by patient", "source": "Patient-reported or AI-inferred potential barrier", "solution_arabic": "simple practical solution in Arabic"}
  ],
  "video_evaluation": [
    {"index": 0, "relevant": true, "reason": "short reason tied to this patient's answers", "related_problem": "which priority_problems.problem this connects to, or empty string if relevant:false"}
  ],
  "recommended_videos": [
    {"priority": 1, "index": 0, "reason": "why this patient specifically needs it", "related_problem": "which priority_problems.problem this addresses"}
  ],
  "motivational_message_arabic": "short warm motivational message addressed to the patient, max 25 words",
  "follow_up": {"recommended": true, "time_frame": "4 weeks", "reason": "short reason", "reassessment_points": ["what should be reassessed"]},
  "missing_information": ["short description of any information that was genuinely missing/blank and limited this analysis"]
}`,
        "",
        "video_evaluation MUST include exactly one entry for EVERY index in the numbered list above (0, 1, 2, ... up to the last one, in order) — evaluate each one individually against this patient's top-3 priority problems before deciding. Do not skip any index, and do not stop early once you find 1-2 relevant ones. There is no minimum or maximum count — mark relevant:true for as many or as few as this patient's real answers justify, including all of them or none of them.",
        "related_problem (in video_evaluation and recommended_videos) must name one of this patient's actual priority_problems.problem values — never a generic label. Leave it an empty string when not applicable.",
        "recommended_videos must be derived from video_evaluation: only indexes marked relevant:true belong in recommended_videos, using the exact same index number (never invented — must be a real index from the numbered list above). If none are relevant, recommended_videos is an empty array. All recommended videos go in this ONE list — there is no weekly video assignment.",
        "",
        "priority_problems: list only the top 3, each with real evidence quoted/paraphrased from the actual answers, and a short why_prioritized — this doubles as the dentist-facing explanation for the recommendation, so make it genuinely traceable to the answers (no separate explainability section is generated, to keep the response fast).",
        "personalized_instructions: write up to 4-5, each tied to one of the top-3 priority_problems via the priority_problem field. Before including one, check: does this patient's actual data justify it? If you cannot point to a specific answer that justifies it, drop it instead of including it to fill the count — better 3 well-justified instructions than 5 with generic filler. Do not include routine advice the patient is already doing correctly, and do not include advice about a topic this patient never raised.",
        "oral_hygiene_aids: only include an aid when this patient's answers genuinely justify it (see ORAL HYGIENE AIDS rule above) — an empty array is correct when no aid is currently justified.",
        "smart_goals: 1 to 2 goals, each concrete and measurable, linked to a priority via related_priority (the problem's priority number, 1-3).",
        "missing_information: only real gaps that limited this specific analysis (e.g. a relevant question left blank). Empty array if nothing relevant is missing — do not invent gaps just to fill this field.",
        "follow_up: recommended should normally be true with time_frame \"4 weeks\" (the study protocol's default), unless this patient's data gives a clear reason to say otherwise.",
        "Keep every text value SHORT and natural — an instruction_arabic/goal_arabic/aid reason a patient or dentist can read in a few seconds, not a paragraph.",
        "instruction_arabic and aid titles must be concrete, unambiguous everyday clinical terms a patient instantly understands (e.g. \"استخدمي غسول الفم\", \"نظّفي بالخيط\") — never vague or abstract single words.",
        "Tailor everything to the actual answers. Do not write generic advice unrelated to this patient.",
        LANG === "ar"
            ? "IMPORTANT: write every patient-facing text value (patient_summary.arabic, personalized_instructions, oral_hygiene_aids, smart_goals, barriers_and_solutions.solution_arabic, motivational_message_arabic) in ARABIC (simple, clear Arabic the patient can understand). Keep dentist_summary in English as specified."
            : "IMPORTANT: patient-facing Arabic fields must still be written in Arabic regardless of the interface language, since the patient reads Arabic. Keep dentist_summary in English as specified.",
        AI_SAFETY
    ].join("\n");

    const result = await callAIJSON(prompt, { maxTokens: 3400, temperature: 0.4 });

    // نحول كل فهرس (index) رجعه النموذج لـ video_id/title حقيقيين من مصدر
    // موثوق (App.videos)، بدل تصديق أي نص id ينسخه النموذج حرفيًا — نسخ
    // معرّف UUID طويل عشوائي عرضة لخطأ نسخ بسيط يفشّل المطابقة، فيرجع فيديو
    // "صحيح" لكن يُستبعد بالغلط. الفهرس الرقمي (0، 1، 2...) نسخه موثوق 100%
    const videos = videoListArray();
    const recommendedVideos = (result.recommended_videos || [])
        .map(v => ({ ...v, index: Number(v && v.index) }))
        .filter(v => Number.isInteger(v.index) && videos[v.index])
        .map(v => {
            const src = videos[v.index];
            return {
                priority: v.priority || 0,
                video_id: src.id,
                title: src.title || "",
                reason: v.reason || "",
                related_problem: v.related_problem || ""
            };
        });

    // حفظ نتيجة التحليل على نفس السجل المحفوظ مسبقًا
    // instrLang: نحفظ لغة توليد التعليمات نفسها، لأن اللغة الحالية للواجهة
    // (LANG) قد تتغيّر لاحقًا عند عرض/طباعة الدفتر، فتُخلط الأعمدة المولَّدة
    // بلغة قديمة مع نصوص الدفتر الثابتة بلغة جديدة — نستخدم هذا الحقل لاحقًا
    // لعرض الدفتر بأكمله بنفس لغة التحليل الأصلية بدل لغة الواجهة اللحظية
    const update = {
        patientSummaryAr: (result.patient_summary || {}).arabic || "",
        dentistSummary: (result.patient_summary || {}).dentist_summary || "",
        riskLevel: (result.risk_assessment || {}).level || "",
        riskFactors: ((result.risk_assessment || {}).supporting_factors || []).join(" | "),
        priorityProblems: JSON.stringify(result.priority_problems || []),
        personalizedInstructions: JSON.stringify(result.personalized_instructions || []),
        oralHygieneAids: JSON.stringify(result.oral_hygiene_aids || []),
        smartGoals: JSON.stringify(result.smart_goals || []),
        barriersSolutions: JSON.stringify(result.barriers_and_solutions || []),
        recommendedVideos: JSON.stringify(recommendedVideos),
        motivationalMessage: result.motivational_message_arabic || "",
        followUp: JSON.stringify(result.follow_up || {}),
        missingInformation: JSON.stringify(result.missing_information || []),
        dentistReviewRequired: "yes",
        analyzed: "yes",
        instrLang: LANG
    };
    result.recommended_videos = recommendedVideos; // نسخة السجل بالذاكرة تطابق ما حُفظ فعليًا

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
