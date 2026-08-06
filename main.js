//==============================
// نقطة الدخول والتنقل العام
//==============================

// ======== ملء شاشة البداية من الإعدادات ========
// شاشة البداية أصبحت صورة التصميم الرسمية، فلا نصوص تُحقن فيها
function renderSplash() { /* لا شيء — المحتوى داخل الصورة */ }

// ======== ترجمة العناصر الثابتة في HTML ========
function applyStaticStrings() {
    document.querySelectorAll("[data-t]").forEach(el => {
        el.textContent = t(el.dataset.t);
    });
    document.querySelectorAll("[data-tp]").forEach(el => {
        el.placeholder = t(el.dataset.tp);
    });
    $("langBtn").textContent = (LANG === "en") ? "ع" : "EN";
}

// ======== الدخول للتطبيق ========
// من شاشة البداية: إن كانت هناك جلسة محفوظة ندخل مباشرة، وإلا نعرض شاشة
// تسجيل الدخول أولاً (لا وصول لبيانات المرضى بلا حساب طبيب)
function handleSplashClick() {
    const session = getSession();
    if (!session || !session.id) { showPage("loginPage"); return; }

    // إن كانت البيانات محمَّلة أصلاً (تعني أننا نعرض الصورة كـ"من نحن" من
    // داخل التطبيق لا كبوابة دخول أولى)، النقر يرجع للرئيسية فقط
    if (App._loaded) { goHome(); return; }

    App.currentDoctor = session;
    enterApp();
}

// ======== عرض شاشة البداية كـ"من نحن" من داخل التطبيق ========
function showAboutSplash() {
    $("splashBackBtn").classList.remove("hidden");
    showPage("splashPage");
}

async function enterApp() {
    showLoading(t("loading"));
    // إن طال التحميل (بدء تشغيل السكربت لأول مرة بعد فترة خمول، أو شبكة
    // بطيئة)، نطمئن المستخدم أن الأمر طبيعي بدل تركه يظن أن الصفحة تجمّدت
    const slowHint = setTimeout(() => {
        const el = document.getElementById("loadingText");
        if (el) el.textContent = t("stillLoading");
    }, 4000);
    try {
        await loadAllData();
        clearTimeout(slowHint);
        hideLoading();
        goHome();
    } catch (err) {
        clearTimeout(slowHint);
        hideLoading();
        console.error(err);
        // نُدخل المستخدم للتطبيق رغم الخطأ حتى يستطيع الوصول للإعدادات وإصلاح المشكلة
        goHome();
        showInfoModal(t("notice"), `
            <p>${escapeHtml(err.message)}</p>
            <p style="margin-top:12px;font-size:13px;color:#666;">
                ${LANG === "ar"
                    ? "افتح ملف Google Sheets وأنشئ التبويبات الناقصة بنفس الأسماء بالضبط: <b>Patients</b>، <b>Assessments</b>، <b>Questions</b>، <b>Videos</b>، <b>Doctors</b>. يكفي إنشاؤها فارغة — سيضيف النظام الأعمدة تلقائيًا."
                    : "Open your Google Sheet and create the missing tabs with these exact names: <b>Patients</b>, <b>Assessments</b>, <b>Questions</b>, <b>Videos</b>, <b>Doctors</b>. Empty tabs are enough — columns are added automatically."}
            </p>`);
    }
}

// ======== الرئيسية ========
function goHome() {
    showPage("homePage");
    const n = (count, en, ar) => count > 0 ? `${count} ${LANG === "ar" ? ar : en}` : (LANG === "ar" ? "لا يوجد" : "None yet");
    $("homeCount").textContent  = n(App.assessments.length, "saved assessments", "تقييمًا محفوظًا");
    $("homeQCount").textContent = n(App.questions.length,   "questions",         "سؤالًا");
    $("homeVCount").textContent = n(App.videos.length,      "videos",            "فيديو");

    const doc = App.currentDoctor;
    const nameEl = $("welcomeDoctorName");
    if (nameEl) nameEl.textContent = doc ? doc.name : "";
    const adminCard = $("adminCard");
    if (adminCard) adminCard.classList.toggle("hidden", !isAdmin());
}

// ======== زر التالي: ينتقل أو يشغّل التحليل في الخطوة الأخيرة ========
function wizardNextOrFinish() {
    const sections = activeSections();
    if (App.current.step >= sections.length) runAIAnalysis();
    else wizardNext();
}

// ======== إعادة تحليل التقييم المعروض بلغة الواجهة الحالية ========
// مفيد عند تبديل اللغة: النتائج المحفوظة تبقى بلغة توليدها، وهذا الزر
// يعيد توليدها باللغة المختارة الآن
function reanalyzeCurrent() {
    const rec = App.current && App.current.record;
    if (!rec) { showToast(t("noRecords"), "error"); return; }
    showConfirm(t("reanalyze"), t("reanalyzeMsg"), () => retryAnalysis(rec.id));
}

// ======== تأكيد الخروج من الاستبيان ========
function confirmExitWizard() {
    showConfirm(t("exitTitle"), t("exitMsg"),
        () => { App.current = null; goHome(); });
}

// ======== الإقلاع ========
document.addEventListener("DOMContentLoaded", () => {
    applyLangDirection();
    applyStaticStrings();
    renderSplash();
    bindGlobalUI();

    // إن فُتح الرابط من رمز QR الخاص بمريض، نعرض صفحته مباشرة
    // بدل شاشة البداية الموجّهة للطبيب
    const rid = new URLSearchParams(location.search).get("a");
    if (rid) {
        document.body.classList.add("patient-mode");
        openPatientView(rid);
        return;
    }

    // إن كانت هناك جلسة محفوظة بالفعل، ندخل التطبيق مباشرة بلا المرور
    // بشاشة البداية في كل مرة — تبقى متاحة يدويًا عبر زر "من نحن"
    const session = getSession();
    if (session && session.id) {
        App.currentDoctor = session;
        enterApp();
        return;
    }

    // أول فتح للتطبيق إطلاقًا (لا جلسة ولم يسبق له رؤية شاشات التعريف):
    // نعرض الشرح التعليمي أولاً، ثم شاشة البداية العادية بعده
    if (!hasOnboarded()) {
        showOnboarding();
        return;
    }

    showPage("splashPage");
});
