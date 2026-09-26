//==============================
// طبقة الاتصال بقاعدة البيانات (Google Apps Script)
//==============================

async function gsRequest(url, options = {}, timeoutMs = 13000) {
    // مهلة زمنية صريحة على كل طلب: بدونها قد يبقى المتصفح منتظرًا حتى مهلته
    // الافتراضية (قد تقارب دقيقة على شبكة متعثرة) قبل أن يفشل الطلب أصلاً
    // ويُتاح لآلية إعادة المحاولة أن تعمل. 13 ثانية كافية لعمليات القراءة/
    // الكتابة العادية حتى مع بطء بدء تشغيل Apps Script (Cold Start)، لكن
    // نداءات الذكاء الاصطناعي أبطأ بكثير فتمرّر timeoutMs أعلى (انظر callAI)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response;
    try {
        response = await fetch(url, { ...options, signal: controller.signal });
    } catch (networkErr) {
        const timedOut = networkErr && networkErr.name === "AbortError";
        throw new Error(typeof LANG !== "undefined" && LANG === "ar"
            ? (timedOut ? "انتهت مهلة الاتصال بالخادم، حاول مرة أخرى" : "تعذر الوصول إلى الخادم، تحقق من الاتصال بالإنترنت")
            : (timedOut ? "Server request timed out, please retry" : "Could not reach the server, check your internet connection"));
    } finally {
        clearTimeout(timeoutId);
    }

    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch (e) { body = null; }

    if (!response.ok) throw new Error((body && body.error) || `خطأ من الخادم (${response.status})`);
    if (body && body.error) throw new Error(body.error);
    return body;
}

// قراءة كل صفوف تبويب
async function readSheet(sheetName) {
    // كسر الكاش: بدون رقم فريد بآخر الرابط، قد يخزّن المتصفح رد هذا الطلب
    // (نفس الرابط دايمًا لنفس الشيت) ويرجّعه من كاشه المحلي حتى لو تغيّرت
    // البيانات فعليًا بالخادم — هذا كان يسبب ظهور بيانات قديمة (فيديوهات
    // فارغة مثلاً) رغم نجاح الحفظ الفعلي على الخادم
    const url = `${CONFIG.API}?sheet=${encodeURIComponent(sheetName)}&_=${Date.now()}`;
    const result = await gsRequest(url, { cache: "no-store" });
    return (result && Array.isArray(result.rows)) ? result.rows : [];
}

// Content-Type نصي مقصود لتفادي طلب OPTIONS التمهيدي الذي لا يدعمه Apps Script
function postBody(payload) {
    return {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
    };
}

// إعادة محاولة موحّدة لعمليات الكتابة: Apps Script قد يرفض طلبًا لحظيًا عند
// الازدحام، وإعادة المحاولة تحلّ ذلك دون أن يشعر المستخدم
async function writeWithRetry(payload, attempts = 3) {
    let lastErr = null;
    for (let i = 0; i < attempts; i++) {
        try {
            return await gsRequest(CONFIG.API, postBody(payload));
        } catch (err) {
            lastErr = err;
            console.warn(`محاولة كتابة ${i + 1}/${attempts} أخفقت:`, err.message);
            if (i < attempts - 1) await new Promise(r => setTimeout(r, 900 * (i + 1)));
        }
    }
    throw lastErr;
}

async function addRow(sheetName, data) {
    const result = await writeWithRetry({ sheet: sheetName, action: "add", data });
    if (result && result.row) Object.assign(data, result.row);
    return data;
}

async function updateRow(sheetName, id, data) {
    return await writeWithRetry({ sheet: sheetName, action: "update", id, data });
}

async function deleteRow(sheetName, id) {
    return await writeWithRetry({ sheet: sheetName, action: "delete", id });
}

// نداء الذكاء الاصطناعي عبر السكربت (المفتاح محفوظ على الخادم ولا يصل للمتصفح)
// ملاحظة مهمة: توليد تحليل المريض الكامل (JSON طويل بالشكل الموسّع — ملخص،
// تصنيف خطورة، مشاكل أولوية بأدلتها، تعليمات، أدوات عناية، أهداف، عوائق،
// تقييم كل فيديو، تفسير سريري، متابعة... حتى 4200 رمز) قد يستغرق أكثر من
// 90 ثانية بسهولة حتى مع نموذج قوي وسريع — لهذا نمنحه مهلة أطول بكثير
// (110 ثانية) من مهلة gsRequest القياسية المستخدمة للقراءة/الكتابة العادية،
// وإلا يُقطَع الطلب قبل أن يكمل النموذج توليد الرد فيظهر "Server request
// timed out" رغم أن الخادم والنموذج كانا لا يزالان يعملان فعليًا
async function callAI(prompt, options = {}) {
    const { system = "", temperature = 0.4, maxTokens = 1600, history = [] } = options;
    const result = await gsRequest(CONFIG.API, postBody({
        action: "ai", prompt, system, temperature, maxTokens, history, imageDataUrl: ""
    }), 110000);
    const text = result && result.text ? String(result.text).trim() : "";
    if (!text) throw new Error("لم يُرجع النموذج أي محتوى");
    return text;
}

// ======== استخراج JSON من رد النموذج ========
// النماذج المجانية لا تلتزم دائمًا بالصيغة: تضيف مقدمة، أو علامات ```،
// أو تقطع الرد في منتصفه عند بلوغ حد الرموز. هذه الدالة تستخرج وتصلح
// ما يمكن إصلاحه بدل إسقاط النتيجة بالكامل.
function extractJSON(raw) {
    let s = String(raw || "").replace(/```(?:json)?/gi, "").trim();
    const start = s.indexOf("{");
    if (start === -1) throw new Error("NO_JSON");
    s = s.slice(start);

    // مسح واحد نتتبع فيه الأقواس بمكدّس، لأن الإغلاق يتبع ترتيب الفتح عكسيًا
    const stack = [];
    let inStr = false, esc = false, endIdx = -1;
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (esc) { esc = false; continue; }
        if (c === "\\") { esc = true; continue; }
        if (c === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (c === "{" || c === "[") stack.push(c);
        else if (c === "}" || c === "]") {
            stack.pop();
            if (stack.length === 0) { endIdx = i; break; }
        }
    }

    // كائن مكتمل
    if (endIdx !== -1) {
        const whole = s.slice(0, endIdx + 1);
        try { return JSON.parse(whole); } catch (e) {}
        try { return JSON.parse(fixCommonJSON(whole)); } catch (e) {}
    }

    // رد مبتور (تجاوز حد الرموز maxTokens قبل ما يكمل التوليد): نتعمّد عدم
    // قبوله حتى لو نجحنا نصلّح الأقواس ونطلع JSON صالح شكليًا — لأن محتواه
    // فعليًا ناقص (جملة مقطوعة، أو حقل/قسم كامل مفقود بآخر الرد، متل قسم
    // الفيديوهات). قبوله بصمت كان يخفي المشكلة عن الطبيب بدل ما يعيد
    // المحاولة بحد رموز أعلى (انظر maxTokens += 400 بكل محاولة بـ
    // callAIJSON) — فنرمي خطأ صريح يفعّل إعادة المحاولة بدلاً من ذلك
    let t = s;
    if (inStr) t += '"';
    t = t.replace(/,\s*$/, "");
    t = t.replace(/,?\s*"[^"]*"\s*:\s*$/, "");
    t = t.replace(/[:,]\s*$/, "");
    for (let i = stack.length - 1; i >= 0; i--) t += (stack[i] === "{") ? "}" : "]";
    try { JSON.parse(fixCommonJSON(t)); throw new Error("TRUNCATED"); } catch (e) {
        if (e.message === "TRUNCATED") throw e;
    }

    throw new Error("BAD_JSON");
}

function fixCommonJSON(x) {
    return x
        .replace(/,\s*([}\]])/g, "$1")                    // فواصل زائدة
        .replace(/([{,]\s*)'([^']+)'\s*:/g, '$1"$2":')     // مفاتيح بعلامة مفردة
        .replace(/:\s*'([^']*)'/g, ': "$1"');              // قيم بعلامة مفردة
}

// نداء يطلب ردًا بصيغة JSON — نفرّق بوضوح بين نوعين مختلفين تمامًا من الفشل،
// لأن معاملتهم نفس المعاملة (إعادة محاولة تلقائية للاثنين) هي بالضبط السبب
// اللي كان يضاعف الكلفة الفعلية على حساب Anthropic بلا داعٍ:
//
// 1) فشل صيغة الرد (JSON غير صالح/مبتور بسبب قلة maxTokens) — هذا فشل حقيقي
//    بمخرجات النموذج نفسه (الرد وصل فعلاً وتم الدفع مقابله سواء نجح أو فشل)،
//    ومحاولة ثانية بحد رموز أعلى غالبًا تحله فعلاً — تستاهل ندفع كلفتها.
//    نعيد المحاولة لهذا النوع فقط، لغاية `attempts` مرات.
//
// 2) فشل شبكة/مهلة (انقطاع، تجميد التطبيق بالخلفية...) — لا نعرف هل الطلب
//    وصل فعلاً للخادم ونُفّذ (ودُفعت كلفته) أو لا؛ إعادته صامتة تلقائيًا قد
//    تعني دفع كلفة ثانية كاملة بلا أي ضمان فايدة إضافية. لهذا لا نعيد
//    المحاولة تلقائيًا إطلاقًا هنا — نرفع الخطأ فورًا ونترك القرار (وتكلفته)
//    بيد الطبيب عبر زر "إعادة التحليل" اليدوي.
async function callAIJSON(prompt, options = {}) {
    const attempts = options.attempts || 3;
    let lastErr = null;

    for (let i = 0; i < attempts; i++) {
        try {
            const raw = await callAI(prompt, {
                ...options,
                maxTokens: (options.maxTokens || 1600) + i * 800,
                system: (options.system || "") +
                    "\nReturn ONLY valid JSON. No prose, no markdown, no ``` fences. Start with { and end with }."
            });
            const parsed = extractJSON(raw);
            if (!parsed || typeof parsed !== "object") throw new Error("BAD_JSON");
            return parsed;
        } catch (err) {
            lastErr = err;
            const isNetworkErr = /تعذر الوصول|انتهت مهلة|reach the server|timed out/.test(err.message || "");
            if (isNetworkErr) {
                console.warn("AI request failed (network) — not auto-retrying:", err.message);
                throw err;
            }
            console.warn(`AI attempt ${i + 1}/${attempts} failed (format issue):`, err.message);
            if (i < attempts - 1) await new Promise(r => setTimeout(r, 1200));
        }
    }

    const msg = (lastErr && (lastErr.message === "BAD_JSON" || lastErr.message === "NO_JSON" || lastErr.message === "TRUNCATED"))
        ? (typeof t === "function" ? t("badFormat") : "The AI reply was not in a valid format")
        : (lastErr ? lastErr.message : "AI request failed");
    throw new Error(msg);
}

// ======== إبقاء الشاشة صاحية أثناء التحليل (يقلّل احتمال قطع نظام
// التشغيل للاتصال الشبكي بسبب قفل الشاشة التلقائي أثناء الانتظار الطويل)
// مدعومة بمعظم متصفحات أندرويد الحديثة؛ تُتجاهل بصمت إن كانت غير مدعومة
// (Safari/iOS مثلاً)، وهذا لا يضر — يبقى إعادة المحاولة التلقائية أعلاه
// هي خط الدفاع الأساسي في كل الأحوال
let _wakeLock = null;
async function requestWakeLock() {
    try {
        if ("wakeLock" in navigator) {
            _wakeLock = await navigator.wakeLock.request("screen");
        }
    } catch (e) { /* غير مدعومة أو رُفضت — تجاهل بصمت */ }
}
function releaseWakeLock() {
    try { if (_wakeLock) { _wakeLock.release(); _wakeLock = null; } } catch (e) {}
}


// ======== رفع ملف فيديو من جهاز الطبيب مباشرة إلى Google Drive ========
// يمر عبر نفس سكربت Apps Script (المرفق بصلاحية Drive)، فلا حاجة لأي خدمة
// تخزين خارجية أو تفويض إضافي من المتصفح
async function uploadVideoFile(file, onProgress) {
    const MAX_BYTES = 8 * 1024 * 1024; // 8 ميجابايت: حد عملي آمن لحجم الطلب عبر Apps Script
    if (file.size > MAX_BYTES) {
        throw new Error(typeof LANG !== "undefined" && LANG === "ar"
            ? "حجم الملف كبير جدًا (الحد الأقصى 8 ميجابايت). ارفعه على Google Drive أو YouTube والصق الرابط بدلاً من ذلك."
            : "File is too large (max 8MB). Upload it to Google Drive or YouTube instead and paste the link.");
    }

    const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
        reader.onerror = () => reject(new Error("File read failed"));
        reader.readAsDataURL(file);
    });

    if (onProgress) onProgress();

    // ملاحظة: طلب رفع الملف قد يستغرق أطول من الطلبات العادية (10 ثوانٍ)،
    // لذا نستخدم مهلة أطول مخصصة له بدل gsRequest القياسية
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    let response;
    try {
        response = await fetch(CONFIG.API, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
                action: "uploadVideo",
                filename: file.name,
                mimeType: file.type || "video/mp4",
                base64
            }),
            signal: controller.signal
        });
    } catch (err) {
        const timedOut = err && err.name === "AbortError";
        throw new Error(typeof LANG !== "undefined" && LANG === "ar"
            ? (timedOut ? "انتهت مهلة الرفع، جرّب ملفًا أصغر أو اتصالاً أفضل" : "تعذر رفع الملف، تحقق من الاتصال")
            : (timedOut ? "Upload timed out, try a smaller file or better connection" : "Could not upload the file, check your connection"));
    } finally {
        clearTimeout(timeoutId);
    }

    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch (e) {}
    if (!response.ok) throw new Error((body && body.error) || `Server error (${response.status})`);
    if (body && body.error) throw new Error(body.error);
    if (!body || !body.url) throw new Error("Upload succeeded but no link was returned");
    return body.url;
}
