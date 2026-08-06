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
    const url = `${CONFIG.API}?sheet=${encodeURIComponent(sheetName)}`;
    const result = await gsRequest(url);
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
// ملاحظة مهمة: توليد تحليل المريض الكامل (JSON طويل، حتى 2600+ رمز) على
// نموذج مجاني عبر OpenRouter قد يستغرق أكثر من 13 ثانية بسهولة — لهذا نمنحه
// مهلة أطول بكثير (55 ثانية) من مهلة gsRequest القياسية المستخدمة للقراءة/
// الكتابة العادية، وإلا يُقطَع الطلب قبل أن يكمل النموذج توليد الرد فيظهر
// "Server request timed out" رغم أن الخادم كان لا يزال يعمل فعليًا
async function callAI(prompt, options = {}) {
    const { system = "", temperature = 0.4, maxTokens = 1600, history = [] } = options;
    const result = await gsRequest(CONFIG.API, postBody({
        action: "ai", prompt, system, temperature, maxTokens, history, imageDataUrl: ""
    }), 55000);
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

    // رد مبتور: نغلق ما تبقى مفتوحًا
    let t = s;
    if (inStr) t += '"';
    t = t.replace(/,\s*$/, "");
    t = t.replace(/,?\s*"[^"]*"\s*:\s*$/, "");
    t = t.replace(/[:,]\s*$/, "");
    for (let i = stack.length - 1; i >= 0; i--) t += (stack[i] === "{") ? "}" : "]";
    try { return JSON.parse(fixCommonJSON(t)); } catch (e) {}

    throw new Error("BAD_JSON");
}

function fixCommonJSON(x) {
    return x
        .replace(/,\s*([}\]])/g, "$1")                    // فواصل زائدة
        .replace(/([{,]\s*)'([^']+)'\s*:/g, '$1"$2":')     // مفاتيح بعلامة مفردة
        .replace(/:\s*'([^']*)'/g, ': "$1"');              // قيم بعلامة مفردة
}

// نداء يطلب ردًا بصيغة JSON، مع إعادة محاولة تلقائية.
// السبب: الموجّه المجاني قد يختار نموذجًا ضعيفًا في محاولة ويختار غيره في
// التالية، فإعادة المحاولة وحدها تحل أغلب الإخفاقات دون تدخل المستخدم.
async function callAIJSON(prompt, options = {}) {
    const attempts = options.attempts || 3;
    let lastErr = null;

    for (let i = 0; i < attempts; i++) {
        try {
            const raw = await callAI(prompt, {
                ...options,
                // نرفع الحد قليلاً في كل محاولة لتقليل احتمال البتر
                maxTokens: (options.maxTokens || 1600) + i * 400,
                system: (options.system || "") +
                    "\nReturn ONLY valid JSON. No prose, no markdown, no ``` fences. Start with { and end with }."
            });
            const parsed = extractJSON(raw);
            if (!parsed || typeof parsed !== "object") throw new Error("BAD_JSON");
            return parsed;
        } catch (err) {
            lastErr = err;
            console.warn(`AI attempt ${i + 1}/${attempts} failed:`, err.message);
            // مهلة قصيرة قبل المحاولة التالية (تخفّف حدود المعدّل أيضًا)
            if (i < attempts - 1) await new Promise(r => setTimeout(r, 1200));
        }
    }

    const msg = (lastErr && (lastErr.message === "BAD_JSON" || lastErr.message === "NO_JSON"))
        ? (typeof t === "function" ? t("badFormat") : "The AI reply was not in a valid format")
        : (lastErr ? lastErr.message : "AI request failed");
    throw new Error(msg);
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
