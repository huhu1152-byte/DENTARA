//==============================
// شاشات التعريف الأولى (تظهر مرة واحدة فقط لكل جهاز جديد) + عارض الصور
// المعلوماتية (من نحن / طريقة الاستخدام) المتاح دائمًا من الرأس
//==============================

const ONBOARD_KEY = "dcms_onboarded";

// صور "طريقة الاستخدام" لأول زيارة. كل صورة عندها زر مرسوم داخلها فعليًا
// (Continue / Start Assessment)، فبدل رسم زر إضافي فوقها نضع طبقة شفافة
// قابلة للنقر (hit-box) بالضبط فوق مكان الزر المرسوم — بالنسب المئوية من
// أبعاد الصورة نفسها (لا الشاشة) حتى تبقى دقيقة على كل حجم شاشة
const ONBOARD_IMAGES = [
    { src: "how-it-works-1.jpg", btn: { top: 87.7, left: 27.3, width: 43.0, height: 5.2 } },
    { src: "how-it-works-2.jpg", btn: { top: 85.6, left: 22.9, width: 54.5, height: 5.0 } }
];
let _onboardStep = 0;

function hasOnboarded() {
    try { return localStorage.getItem(ONBOARD_KEY) === "1"; } catch (e) { return true; }
}
function markOnboarded() {
    try { localStorage.setItem(ONBOARD_KEY, "1"); } catch (e) {}
}

function showOnboarding() {
    _onboardStep = 0;
    renderOnboardSlide();
    showPage("onboardPage");
}

function renderOnboardSlide() {
    const step = ONBOARD_IMAGES[_onboardStep];
    $("onboardImg").src = step.src;

    $("onboardDots").innerHTML = ONBOARD_IMAGES.map((_, i) =>
        `<span class="ob-dot ${i === _onboardStep ? "ob-dot-active" : ""}"></span>`).join("");

    // نضع طبقة النقر بنفس موضع الزر المرسوم داخل هذه الصورة تحديدًا
    const hit = $("onboardHitBtn");
    hit.style.top    = step.btn.top + "%";
    hit.style.left   = step.btn.left + "%";
    hit.style.width  = step.btn.width + "%";
    hit.style.height = step.btn.height + "%";
}

function onboardNext() {
    if (_onboardStep < ONBOARD_IMAGES.length - 1) {
        _onboardStep++;
        renderOnboardSlide();
    } else {
        finishOnboarding();
    }
}

function skipOnboarding() { finishOnboarding(); } // لم يعد هناك زر تخطٍّ بالواجهة، أُبقيها احتياطًا فقط

function finishOnboarding() {
    markOnboarded();
    // بعد سلايدي الشرح مباشرة إلى شاشة البداية splashPage (وفيها أسماء
    // الفريق أصلاً) — لا داعي لشاشة "من نحن" منفصلة هنا
    showPage("splashPage");
}

// ======== عارض "من نحن" / "طريقة الاستخدام" (متاح دائمًا من الرأس) ========
// src يقبل صورة وحدة (نص) أو مصفوفة صور (للتنقل بينها بالأسهم والنقاط)
let _infoImages = [];
let _infoStep = 0;

function showInfoImage(src) {
    _infoImages = Array.isArray(src) ? src : [src];
    _infoStep = 0;
    renderInfoSlide();
    showPage("infoImagePage");
}

function renderInfoSlide() {
    $("infoImageImg").src = _infoImages[_infoStep];
    const multi = _infoImages.length > 1;

    $("infoImageDots").innerHTML = multi ? _infoImages.map((_, i) =>
        `<span class="ob-dot ${i === _infoStep ? "ob-dot-active" : ""}"></span>`).join("") : "";
    $("infoImageDots").classList.toggle("hidden", !multi);

    $("infoImagePrevBtn").classList.toggle("hidden", !multi || _infoStep === 0);
    $("infoImageNextBtn").classList.toggle("hidden", !multi || _infoStep === _infoImages.length - 1);
}

function infoImageNext() {
    if (_infoStep < _infoImages.length - 1) { _infoStep++; renderInfoSlide(); }
}
function infoImagePrev() {
    if (_infoStep > 0) { _infoStep--; renderInfoSlide(); }
}
