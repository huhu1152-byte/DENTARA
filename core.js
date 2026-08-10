//==============================
// الحالة العامة والدوال المساعدة
//==============================

const App = {
    patients: [],
    assessments: [],
    questions: [],
    videos: [],
    // التقييم الجاري حاليًا
    current: null,
    // الطبيب المسجّل دخوله حاليًا (null قبل تسجيل الدخول)
    currentDoctor: null,
    _loaded: false
};

// ======== مساعدات عامة ========
function $(id) { return document.getElementById(id); }
function today() { return new Date().toISOString().split("T")[0]; }
function addDays(isoDate, days) {
    const d = new Date(isoDate + "T00:00:00");
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
}
function daysBetween(isoA, isoB) {
    const a = new Date(isoA + "T00:00:00"), b = new Date(isoB + "T00:00:00");
    return Math.round((b - a) / 86400000);
}
function nowStamp() { return new Date().toISOString().slice(0, 16).replace("T", " "); }
function uuid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function escapeHtml(str) {
    if (str === undefined || str === null) return "";
    return String(str)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function nl2br(str) { return escapeHtml(str).replace(/\n/g, "<br>"); }

function show(el) { if (el) el.classList.remove("hidden"); }
function hide(el) { if (el) el.classList.add("hidden"); }

function showPage(pageId) {
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    const page = $(pageId);
    if (page) page.classList.remove("hidden");
    window.scrollTo(0, 0);
}

// ======== التنبيهات ========
let toastTimer = null;
function showToast(message, type = "success") {
    const el = $("toast");
    if (!el) return;
    el.textContent = message;
    el.className = "toast " + type;
    show(el);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => hide(el), 3800);
}

// ======== النوافذ ========
let modalSaveHandler = null;

function openModal(title, bodyHtml, onSave, saveLabel) {
    $("modalTitle").textContent = title;
    $("modalBody").innerHTML = bodyHtml;
    const btn = $("modalSaveBtn");
    if (onSave) {
        show(btn);
        btn.textContent = saveLabel || t("save");
        modalSaveHandler = onSave;
    } else {
        hide(btn);
        modalSaveHandler = null;
    }
    show($("modal"));
}

function closeModal() {
    hide($("modal"));
    modalSaveHandler = null;
}

function showInfoModal(title, bodyHtml) { openModal(title, bodyHtml, null); }

// نافذة تأكيد قبل الإجراءات غير القابلة للتراجع
let confirmHandler = null;
function showConfirm(title, message, onYes) {
    $("confirmTitle").textContent = title;
    $("confirmMessage").innerHTML = message;
    confirmHandler = onYes;
    show($("confirmModal"));
}
function closeConfirm() { hide($("confirmModal")); confirmHandler = null; }

// ======== شاشة الانتظار ========
function showLoading(message) {
    $("loadingText").textContent = message || t("loading");
    show($("loadingOverlay"));
}
function hideLoading() { hide($("loadingOverlay")); }

// ======== تحميل البيانات ========
// نحاول أولاً طلبًا مجمّعًا واحدًا (?all=1) يرجّع الجداول الأربعة معًا —
// أسرع بكثير من 4 رحلات منفصلة للخادم، ويتفادى حد التزامن في Apps Script
// (كان يرفض بعض الطلبات الأربعة عشوائيًا عند وصولها معًا، فيظهر تبويب مثل
// Questions وكأنه "غير موجود" رغم وجوده فعلاً). إن كان الخادم لا يدعم
// ?all=1 بعد (نسخة قديمة من كود Apps Script)، نتراجع تلقائيًا للأسلوب
// القديم: تحميل كل تبويب على حدة بتدرّج بسيط بينها.
//
// سبب ظهور تنبيه "تعذر التحميل" أحيانًا وعمل الموقع طبيعي أحيانًا أخرى:
// Apps Script (النسخة المجانية) يحتاج وقتًا أطول لبدء التشغيل بعد فترة
// خمول (Cold Start)، وأحيانًا يرفض طلبات بسبب ازدحام لحظي — وهذا عابر
// وليس خللاً بالبيانات نفسها. لذا نعيد محاولة العملية كاملة (المجمّعة ثم
// الاحتياطية) مرتين إضافيتين بفاصل قصير قبل أن نُظهر التنبيه للمستخدم،
// فتُمتَص أغلب حالات البطء العابر دون أن يراها الطبيب إطلاقًا.
async function loadAllData(force = false) {
    if (App._loaded && !force) return;

    let lastErr = null;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            await _loadAllDataOnce();
            return;
        } catch (err) {
            lastErr = err;
            App._loaded = false;
            if (attempt < 2) {
                console.warn(`محاولة تحميل كاملة ${attempt + 1}/3 أخفقت، إعادة المحاولة:`, err.message);
                await new Promise(r => setTimeout(r, 1800 * (attempt + 1)));
            }
        }
    }
    throw lastErr;
}

async function _loadAllDataOnce() {
    const keys = ["patients", "assessments", "questions", "videos"];

    try {
        const batch = await gsRequest(`${CONFIG.API}?all=1&_=${Date.now()}`, { cache: "no-store" }, 20000);
        if (batch && batch.tables) {
            const failed = [];
            keys.forEach(k => {
                const rows = batch.tables[CONFIG.TABLES[k]];
                if (Array.isArray(rows)) App[k] = rows;
                else { App[k] = []; failed.push(CONFIG.TABLES[k]); }
            });
            App.questions.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
            App._loaded = true;
            if (failed.length > 0) {
                throw new Error(LANG === "ar"
                    ? `تعذر تحميل التبويبات التالية من ملف Google Sheets: ${failed.join("، ")}`
                    : `Could not load these tabs from Google Sheets: ${failed.join(", ")}`);
            }
            return;
        }
    } catch (batchErr) {
        console.warn("تعذر التحميل المجمّع، إعادة المحاولة تبويبًا تبويبًا:", batchErr.message);
    }

    // احتياطي (fallback): تحميل كل تبويب على حدة، كما كان سابقًا
    const results = await Promise.allSettled(keys.map((k, i) =>
        new Promise(resolve => setTimeout(resolve, i * 320))
            .then(() => readSheetWithRetry(CONFIG.TABLES[k]))
    ));

    const failed = [];
    results.forEach((res, i) => {
        const k = keys[i];
        if (res.status === "fulfilled") {
            App[k] = res.value;
        } else {
            App[k] = [];
            failed.push(CONFIG.TABLES[k]);
            console.error(`تعذر تحميل ${CONFIG.TABLES[k]}:`, res.reason);
        }
    });

    App.questions.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    App._loaded = true;

    if (failed.length > 0) {
        throw new Error(LANG === "ar"
            ? `تعذر تحميل التبويبات التالية من ملف Google Sheets: ${failed.join("، ")}`
            : `Could not load these tabs from Google Sheets: ${failed.join(", ")}`);
    }
}

// قراءة مع إعادة محاولة: تعالج الإخفاقات العابرة (ازدحام، انقطاع لحظي)
async function readSheetWithRetry(sheetName, attempts = 4) {
    let lastErr = null;
    for (let i = 0; i < attempts; i++) {
        try {
            return await readSheet(sheetName);
        } catch (err) {
            lastErr = err;
            // لا نعيد المحاولة إن كان التبويب غير موجود فعلاً — ذلك ليس خطأ عابرًا
            if (String(err.message || "").indexOf("لا يوجد تبويب") !== -1) throw err;
            console.warn(`محاولة ${i + 1}/${attempts} لتحميل ${sheetName} أخفقت:`, err.message);
            if (i < attempts - 1) await new Promise(r => setTimeout(r, 600 * (i + 1)));
        }
    }
    throw lastErr;
}

// ======== تحليل خيارات السؤال المخزّنة كنص ========
// تُحفظ الخيارات في خلية واحدة مفصولة بفاصلة، لأن الشيت لا يدعم المصفوفات
function parseOptions(raw) {
    if (!raw) return [];
    return String(raw).split(/[,،]/).map(s => s.trim()).filter(Boolean);
}

// ======== ربط الأحداث العامة ========
function bindGlobalUI() {
    $("modalSaveBtn").onclick = async () => {
        if (!modalSaveHandler) return;
        const btn = $("modalSaveBtn");
        const original = btn.textContent;
        btn.disabled = true;
        btn.textContent = t("saving");
        try {
            await modalSaveHandler();
        } catch (err) {
            console.error(err);
            showToast(err.message || t("saveFailed"), "error");
        } finally {
            btn.disabled = false;
            btn.textContent = original;
        }
    };

    $("modalCloseBtn").onclick = closeModal;
    $("confirmNoBtn").onclick = closeConfirm;
    $("confirmYesBtn").onclick = async () => {
        const fn = confirmHandler;
        closeConfirm();
        if (fn) {
            try { await fn(); }
            catch (err) {
                console.error(err);
                showToast(err.message || t("saveFailed"), "error");
            }
        }
    };

    // إغلاق النافذة عند الضغط خارجها
    $("modal").onclick = (e) => { if (e.target === $("modal")) closeModal(); };
}
