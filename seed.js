//==============================
// الأسئلة الافتراضية — منقولة حرفيًا من تصميم المشروع، بالإنجليزية والعربية
//==============================
// s = القسم | t = النوع | q/qa = نص السؤال | o/oa = الخيارات

const DEFAULT_QUESTIONS = [
    // ===== 1. Demographic Information =====
    { s: "demographic", t: "radio",
      q: "Sex", qa: "الجنس",
      o: "Male, Female", oa: "ذكر، أنثى" },
    { s: "demographic", t: "radio",
      q: "Educational Level", qa: "المستوى التعليمي",
      o: "Cannot read or write, Primary school, Intermediate school, Secondary school, College / University, Postgraduate",
      oa: "لا أجيد القراءة والكتابة، ابتدائية، متوسطة، إعدادية، كلية / جامعة، دراسات عليا" },

    // ===== 2. Medical History =====
    { s: "medical", t: "yesno",
      q: "Do you have any chronic disease?", qa: "هل تعاني من أي مرض مزمن؟" },
    { s: "medical", t: "yesno",
      q: "Do you have diabetes?", qa: "هل تعاني من السكري؟" },
    { s: "medical", t: "radio",
      q: "Is your blood sugar usually under control?", qa: "هل مستوى السكر في دمك منضبط عادة؟",
      o: "Yes, No, I don't know", oa: "نعم، لا، لا أعرف" },
    { s: "medical", t: "radio",
      q: "Do you smoke?", qa: "هل تدخّن؟",
      o: "Never, I used to smoke and quit, Currently smoking", oa: "لا أدخن، كنت أدخن وتوقفت، أدخن حاليًا" },
    { s: "medical", t: "text",
      q: "If current smoker, cigarettes per day", qa: "إن كنت مدخنًا حاليًا، كم سيجارة في اليوم؟" },
    { s: "medical", t: "yesno",
      q: "Do you take any medications regularly?", qa: "هل تتناول أي أدوية بانتظام؟" },

    // ===== 3. Dental History =====
    { s: "dental", t: "radio",
      q: "How often do you visit the dentist?", qa: "كم مرة تزور طبيب الأسنان؟",
      o: "Every 6 months, Once a year, Only when I have pain or a problem, Never",
      oa: "كل 6 أشهر، مرة في السنة، فقط عند الألم أو وجود مشكلة، أبدًا" },
    { s: "dental", t: "radio",
      q: "When was your last dental visit?", qa: "متى كانت آخر زيارة لطبيب الأسنان؟",
      o: "Within the last 6 months, 6-12 months ago, More than 1 year ago, I don't remember",
      oa: "خلال آخر 6 أشهر، من 6 إلى 12 شهرًا، أكثر من سنة، لا أتذكر" },
    { s: "dental", t: "radio",
      q: "Have you ever received oral hygiene instructions from a dentist?",
      qa: "هل سبق أن تلقيت تعليمات للعناية الفموية من طبيب أسنان؟",
      o: "Yes, No, I don't remember", oa: "نعم، لا، لا أتذكر" },
    { s: "dental", t: "radio",
      q: "If yes, how often did you follow those instructions?",
      qa: "إن كانت الإجابة نعم، إلى أي مدى كنت تلتزم بهذه التعليمات؟",
      o: "Always, Often, Sometimes, Rarely, Never",
      oa: "دائمًا، غالبًا، أحيانًا، نادرًا، أبدًا" },
    { s: "dental", t: "multi",
      q: "If sometimes/rarely/never: what was the main reason?",
      qa: "إذا اخترت (أحيانًا / نادرًا / أبدًا): ما السبب الرئيسي؟",
      o: "I forgot, I did not have time, I did not understand the instructions, I did not feel it was important, It was difficult to apply, It caused me pain or discomfort, Other reason",
      oa: "نسيت، لم يكن لدي وقت، لم أفهم التعليمات، لم أشعر بأنها مهمة، كانت صعبة التطبيق، سببت لي ألمًا أو انزعاجًا، سبب آخر" },

    // ===== 4. Oral Hygiene Habits =====
    { s: "habits", t: "radio",
      q: "How many times do you brush your teeth each day?", qa: "كم مرة تفرّش أسنانك يوميًا؟",
      o: "Less than once a day, Once a day, Twice a day, Three or more times a day",
      oa: "أقل من مرة في اليوم، مرة واحدة، مرتين، ثلاث مرات أو أكثر" },
    { s: "habits", t: "radio",
      q: "How long do you usually brush your teeth?", qa: "كم من الوقت تستغرق في تفريش أسنانك؟",
      o: "Less than 1 minute, 1-2 minutes, More than 2 minutes, I don't know",
      oa: "أقل من دقيقة، من دقيقة إلى دقيقتين، أكثر من دقيقتين، لا أعرف" },
    { s: "habits", t: "radio",
      q: "What type of toothbrush do you use?", qa: "ما نوع فرشاة الأسنان التي تستخدمها؟",
      o: "Soft, Medium, Hard", oa: "ناعمة، متوسطة، قاسية" },
    { s: "habits", t: "yesno",
      q: "Do you use an electric toothbrush?", qa: "هل تستخدم فرشاة أسنان كهربائية؟" },
    { s: "habits", t: "radio",
      q: "Where did you learn the correct brushing technique?",
      qa: "من أين تعلمت الطريقة الصحيحة لتنظيف الأسنان؟",
      o: "Dentist, A family member, School, Internet or social media, I taught myself, No one taught me",
      oa: "طبيب الأسنان، أحد أفراد العائلة، المدرسة، الإنترنت أو وسائل التواصل الاجتماعي، تعلمتها بنفسي، لم يعلمني أحد" },
    { s: "habits", t: "radio",
      q: "How often do you replace your toothbrush?",
      qa: "كم مرة تستبدل فرشاة الأسنان؟",
      o: "Every 3 months or less, Every 4-6 months, More than 6 months, Only when it wears out, I don't remember",
      oa: "كل 3 أشهر أو أقل، كل 4 إلى 6 أشهر، أكثر من 6 أشهر، فقط عند تلفها، لا أتذكر" },
    { s: "habits", t: "radio",
      q: "Do you clean your tongue?", qa: "هل تنظف لسانك؟",
      o: "Daily, Sometimes, Never", oa: "يوميًا، أحيانًا، أبدًا" },
    { s: "habits", t: "radio",
      q: "Do you use dental floss?", qa: "هل تستخدم خيط الأسنان؟",
      o: "Daily, Sometimes, Never", oa: "يوميًا، أحيانًا، أبدًا" },
    { s: "habits", t: "multi",
      q: "If never: what is the reason you do not use dental floss?",
      qa: "إذا كانت الإجابة (أبدًا): ما سبب عدم استخدامك لخيط الأسنان؟",
      o: "I don't know how to use it, My gums bleed, I don't have time, It is difficult to use, I don't think it is necessary, Other reason",
      oa: "لا أعرف كيفية استخدامه، تنزف لثتي، ليس لدي وقت، يصعب استخدامه، لا أعتقد أنه ضروري، سبب آخر" },
    { s: "habits", t: "radio",
      q: "Do you use an interdental brush?", qa: "هل تستخدم فرشاة تنظيف ما بين الأسنان؟",
      o: "Daily, Sometimes, Never", oa: "يوميًا، أحيانًا، أبدًا" },
    { s: "habits", t: "radio",
      q: "Do you use mouthwash?", qa: "هل تستخدم غسول الفم؟",
      o: "Daily, Sometimes, Never", oa: "يوميًا، أحيانًا، أبدًا" },

    // ===== 5. Diet & Knowledge =====
    { s: "diet", t: "radio",
      q: "How often do you eat sugary snacks?", qa: "كم مرة تتناول الوجبات الخفيفة السكرية؟",
      o: "Never, Rarely, Sometimes, Often, Very often", oa: "أبدًا، نادرًا، أحيانًا، غالبًا، كثيرًا جدًا" },
    { s: "diet", t: "likert",
      q: "Bleeding gums during brushing is normal.", qa: "نزف اللثة أثناء تنظيف الأسنان أمر طبيعي." },
    { s: "diet", t: "likert",
      q: "Gum disease may lead to tooth loss.", qa: "قد يؤدي مرض اللثة إلى فقدان الأسنان." },
    { s: "diet", t: "likert",
      q: "Brushing alone cleans between the teeth.", qa: "تنظيف الأسنان بالفرشاة وحده ينظف ما بين الأسنان." },
    { s: "diet", t: "likert",
      q: "Smoking increases the risk of gum disease.", qa: "يزيد التدخين من خطر الإصابة بمرض اللثة." },
    { s: "diet", t: "likert",
      q: "Diabetes increases the risk of gum disease.", qa: "يزيد مرض السكري من خطر الإصابة بمرض اللثة." },
    { s: "diet", t: "likert",
      q: "Teeth should be brushed for about two minutes.", qa: "ينبغي أن يستغرق تنظيف الأسنان حوالي دقيقتين." },

    // ===== 6. Motivation =====
    { s: "motivation", t: "scale",
      q: "How important is keeping your gums healthy?", qa: "ما مدى أهمية الحفاظ على لثة سليمة بالنسبة لك؟",
      o: "Not important at all, Very important", oa: "غير مهم إطلاقًا، مهم جدًا" },
    { s: "motivation", t: "scale",
      q: "How confident are you that you can improve your oral hygiene?",
      qa: "ما مدى ثقتك بقدرتك على تحسين عنايتك الفموية؟",
      o: "Not confident at all, Very confident", oa: "غير واثق إطلاقًا، واثق جدًا" },
    { s: "motivation", t: "scale",
      q: "How willing are you to commit to the personalized instructions you will receive?",
      qa: "ما مدى استعدادك للالتزام بالتعليمات الشخصية التي ستتلقاها؟",
      o: "Not willing at all, Very willing", oa: "غير مستعد، مستعد جدًا" },

    // ===== 7. Barriers =====
    { s: "barriers", t: "multi",
      q: "What prevents you from maintaining good oral hygiene? (Check all that apply)",
      qa: "ما الذي يمنعك من الحفاظ على عناية فموية جيدة؟ (اختر كل ما ينطبق)",
      o: "Forgetfulness, Lack of time, Pain or discomfort during brushing, Bleeding gums, I do not know the correct brushing technique, Difficulty using dental floss, Lack of motivation, Other reason, No barriers",
      oa: "النسيان، ضيق الوقت، الألم أو الانزعاج أثناء تنظيف الأسنان، نزف اللثة، لا أعرف الطريقة الصحيحة لتنظيف الأسنان، صعوبة استخدام خيط الأسنان، قلة الدافع، سبب آخر، لا توجد عوائق" },

    // ===== 8. Patient Goal =====
    { s: "goal", t: "radio",
      q: "What is your main oral health concern?", qa: "ما أكثر مشكلة تزعجك في فمك؟",
      o: "Bleeding gums, Bad breath, I feel my teeth are not clean, Swollen gums, Sensitive teeth, Loose teeth, Other",
      oa: "نزف اللثة، رائحة الفم، أشعر بأن أسناني غير نظيفة، تورم اللثة، حساسية الأسنان، تخلخل الأسنان، أخرى" },
    { s: "goal", t: "text",
      q: "What would you most like to improve before your next visit?",
      qa: "ما الذي تود تحسينه أكثر قبل زيارتك القادمة؟" },

    // ===== 9. Clinical Examination (Dentist Only) =====
    { s: "clinical", t: "text",
      q: "Plaque Index (PI)", qa: "مؤشر اللويحة الجرثومية (PI)" },
    { s: "clinical", t: "text",
      q: "Gingival Index (GI)", qa: "مؤشر اللثة (GI)" },
    { s: "clinical", t: "text",
      q: "Bleeding on Probing (BOP)", qa: "النزف عند السبر (BOP)" },
    { s: "clinical", t: "multi",
      q: "Plaque Distribution (Check all that apply)", qa: "توزّع اللويحة الجرثومية (اختر كل ما ينطبق)",
      o: "Generalized, Localized, Anterior, Posterior, Buccal, Lingual, Interproximal",
      oa: "معمم، موضعي، أمامي، خلفي، دهليزي، لساني، بين الأسنان" },
    { s: "clinical", t: "radio",
      q: "Calculus", qa: "الجير",
      o: "None, Mild, Moderate, Heavy", oa: "لا يوجد، خفيف، متوسط، كثيف" },
    { s: "clinical", t: "radio",
      q: "Periodontal Diagnosis", qa: "التشخيص اللثوي",
      o: "Gingivitis, Stage I Periodontitis, Stage II Periodontitis, Stage III Periodontitis, Stage IV Periodontitis",
      oa: "التهاب لثة، التهاب دواعم المرحلة الأولى، المرحلة الثانية، المرحلة الثالثة، المرحلة الرابعة" },
    { s: "clinical", t: "text",
      q: "Dentist Notes (Optional)", qa: "ملاحظات الطبيب (اختياري)" }
];

async function seedDefaultQuestions() {
    if (!isAdmin()) { showToast(t("questionsAdminOnly"), "error"); return; }
    showConfirm(t("importQ"),
        LANG === "ar"
            ? `سيتم إضافة <b>${DEFAULT_QUESTIONS.length}</b> سؤالًا جاهزًا بالإنجليزية والعربية. هل تريد المتابعة؟`
            : `This will add <b>${DEFAULT_QUESTIONS.length}</b> ready questions in both English and Arabic. Continue?`,
        async () => {
            showLoading(t("loading"));
            let added = 0, failed = 0;
            for (let i = 0; i < DEFAULT_QUESTIONS.length; i++) {
                const d = DEFAULT_QUESTIONS[i];
                try {
                    const row = {
                        id: uuid(),
                        question: d.q,
                        questionAr: d.qa || "",
                        section: d.s,
                        type: d.t,
                        options: d.o || "",
                        optionsAr: d.oa || "",
                        order: String(i + 1),
                        createdAt: today()
                    };
                    await addRow(CONFIG.TABLES.questions, row);
                    App.questions.push(row);
                    added++;
                    $("loadingText").textContent = `${added} / ${DEFAULT_QUESTIONS.length}`;
                    // مهلة قصيرة بين الطلبات: تمنع رفض Apps Script عند تتابع
                    // عشرات الطلبات السريعة
                    await new Promise(r => setTimeout(r, 220));
                } catch (err) {
                    failed++;
                    console.error("Could not add question:", d.q, err);
                }
            }
            App.questions.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
            hideLoading();
            renderQuestionsTab();
            showToast(failed === 0 ? `${added} ${t("questionsW")}` : `${added} ok / ${failed} failed`,
                      failed === 0 ? "success" : "error");
        });
}
