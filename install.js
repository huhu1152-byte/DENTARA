//==============================
// تثبيت التطبيق كاختصار على الشاشة الرئيسية (أندرويد/سطح المكتب تلقائيًا،
// آيفون بخطوات يدوية موضّحة لأن Safari لا يوفّر واجهة برمجية لذلك)
//==============================

let deferredInstallPrompt = null;

// المتصفحات التي تدعمه (Chrome/Edge على أندرويد وسطح المكتب) تُطلق هذا
// الحدث عندما يستوفي الموقع شروط التثبيت (manifest.json + عامل خدمة
// اختياري)؛ نلتقطه ونؤجله لعرضه عند ضغط المستخدم على زر "تثبيت التطبيق"
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
});

function openInstallGuide() {
    const ar = LANG === "ar";

    // مسار مباشر: المتصفح يدعم التثبيت الأصلي (أندرويد / كروم على الحاسوب)
    if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.finally(() => { deferredInstallPrompt = null; });
        return;
    }

    // لا دعم برمجي متاح (آيفون دائمًا، أو متصفح لا يدعم الميزة): نعرض خطوات يدوية
    const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    const steps = isIOS ? (ar ? [
        "اضغط زر المشاركة (المربع وسهم للأعلى) في أسفل شاشة Safari",
        "مرّر لأسفل واختر \"إضافة إلى الشاشة الرئيسية\"",
        "اضغط \"إضافة\" أعلى يمين الشاشة"
    ] : [
        "Tap the Share button (square with an arrow) in Safari's toolbar",
        "Scroll down and choose \"Add to Home Screen\"",
        "Tap \"Add\" at the top right"
    ]) : (ar ? [
        "اضغط قائمة المتصفح (⋮ ثلاث نقاط) أعلى يمين الشاشة",
        "اختر \"إضافة إلى الشاشة الرئيسية\" أو \"تثبيت التطبيق\"",
        "أكّد الإضافة"
    ] : [
        "Tap the browser menu (⋮ three dots) at the top right",
        "Choose \"Add to Home Screen\" or \"Install App\"",
        "Confirm"
    ]);

    openModal(t("installTitle"), `
        <p class="modal-note">${t("installIntro")}</p>
        ${steps.map((s, i) => `
            <div class="bk-how"><span class="bk-how-num">${i + 1}</span><p>${s}</p></div>`).join("")}
        <p class="modal-note" style="margin-top:14px;">${t("installNote")}</p>
    `, null);
}
