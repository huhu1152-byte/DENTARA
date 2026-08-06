//==============================
// صفحة المريض العامة — تُفتح عبر رابط QR المطبوع على الورقة
// الرابط: <عنوان الموقع>?a=<معرّف التقييم>
//==============================

// رابط صفحة المريض لهذا التقييم (يُشفَّر داخل رمز QR)
function patientPageUrl(recordId) {
    const base = location.origin + location.pathname;
    return `${base}?a=${encodeURIComponent(recordId)}`;
}

// تحميل تقييم واحد فقط (بدون بقية بيانات النظام) لعرضه للمريض
async function openPatientView(recordId) {
    showPage("patientViewPage");
    $("pvBody").innerHTML = `<div class="pv-loading"><div class="spinner"></div><p>${t("loading")}</p></div>`;

    try {
        const [assessments, videos] = [
            await readSheetWithRetry(CONFIG.TABLES.assessments),
            await readSheetWithRetry(CONFIG.TABLES.videos)
        ];

        const rec = assessments.find(x => String(x.id) === String(recordId));
        if (!rec) {
            $("pvBody").innerHTML = `<div class="pv-error"><i class="fa-solid fa-circle-question"></i>
                <p>${LANG === "ar" ? "لم يُعثر على هذه الصفحة. تأكد من الرمز أو راجع طبيبك." : "This page was not found. Check the code or ask your dentist."}</p></div>`;
            return;
        }

        App.videos = videos;
        renderPatientView(rec);
    } catch (err) {
        console.error(err);
        $("pvBody").innerHTML = `<div class="pv-error"><i class="fa-solid fa-triangle-exclamation"></i>
            <p>${escapeHtml(err.message || "")}</p>
            <button class="btn-primary" onclick="openPatientView('${escapeHtml(recordId)}')">${t("retry")}</button></div>`;
    }
}

function renderPatientView(rec) {
    let instructions = [], barriers = [];
    try { instructions = JSON.parse(rec.instructions || "[]"); } catch (e) {}
    try { barriers = JSON.parse(rec.barriers || "[]"); } catch (e) {}

    const problems = String(rec.topProblems || "").split("|").map(s => s.trim()).filter(Boolean);
    const goals = String(rec.goals || "").split("|").map(s => s.trim()).filter(Boolean);
    const vids = String(rec.videoIds || "").split(",").map(s => s.trim()).filter(Boolean)
        .map(id => App.videos.find(v => String(v.id) === String(id))).filter(Boolean);

    const ar = LANG === "ar";
    const cls = riskClass(rec.riskLevel);

    $("pvBody").innerHTML = `
        <div class="pv-hero">
            <i class="fa-solid fa-tooth"></i>
            <h1>${ar ? "تعليمات العناية الخاصة بك" : "Your Personal Care Plan"}</h1>
            <p>${escapeHtml(rec.patientName || "")}</p>
        </div>

        <div class="pv-card risk-card ${cls}">
            <span>${t("riskLevel")}</span>
            <b>${escapeHtml(rec.riskLevel || "-")}</b>
            ${rec.riskReason ? `<p>${escapeHtml(rec.riskReason)}</p>` : ""}
        </div>

        ${rec.motivation ? `<div class="pv-motivation"><i class="fa-solid fa-heart"></i><p>${escapeHtml(rec.motivation)}</p></div>` : ""}

        ${problems.length ? `
        <div class="pv-card">
            <h3><i class="fa-solid fa-triangle-exclamation"></i> ${ar ? "ما يحتاج انتباهك" : "What Needs Your Attention"}</h3>
            ${problems.map((p, i) => `<div class="prob-row"><span class="prob-num">${i + 1}</span>${escapeHtml(p)}</div>`).join("")}
        </div>` : ""}

        <div class="pv-card">
            <h3><i class="fa-solid fa-list-check"></i> ${t("instructions")}</h3>
            <p class="pv-hint">${ar ? "اضغط على أي مهمة عند إنجازها — يُحفظ التأشير على جهازك." : "Tap a task when you complete it — your ticks are saved on this device."}</p>
            ${instructions.map((ins, i) => `
                <label class="pv-task" data-key="${escapeHtml(rec.id)}_${i}">
                    <input type="checkbox" onchange="savePvTick(this)">
                    <span class="pv-box"><i class="fa-solid fa-check"></i></span>
                    <span class="pv-task-body">
                        <b>${escapeHtml(ins.title || "")}</b>
                        <span>${escapeHtml(ins.detail || "")}</span>
                        ${(ins.times || []).length ? `<span class="pv-times"><i class="fa-solid fa-clock"></i> ${escapeHtml((ins.times || []).join(" • "))}</span>` : ""}
                    </span>
                </label>`).join("")}
        </div>

        ${goals.length ? `
        <div class="pv-card">
            <h3><i class="fa-solid fa-bullseye"></i> ${t("goals")}</h3>
            <ul class="goal-list">${goals.map(g => `<li>${escapeHtml(g)}</li>`).join("")}</ul>
        </div>` : ""}

        ${barriers.length ? `
        <div class="pv-card">
            <h3><i class="fa-solid fa-key"></i> ${t("barriers")}</h3>
            ${barriers.map(b => `<div class="barrier-row">
                <b><i class="fa-solid fa-circle-xmark"></i> ${escapeHtml(b.barrier || "")}</b>
                <p><i class="fa-solid fa-circle-check"></i> ${escapeHtml(b.solution || "")}</p></div>`).join("")}
        </div>` : ""}

        ${vids.length ? `
        <div class="pv-card">
            <h3><i class="fa-solid fa-video"></i> ${ar ? "فيديوهات تعليمية لك" : "Educational Videos For You"}</h3>
            ${vids.map(v => `
                <a class="pv-video" href="${escapeHtml(v.url)}" target="_blank" rel="noopener noreferrer">
                    <i class="fa-solid fa-circle-play"></i>
                    <span><b>${escapeHtml(v.title || "Video")}</b>${v.description ? `<span>${escapeHtml(v.description)}</span>` : ""}</span>
                    <i class="fa-solid fa-arrow-up-right-from-square pv-ext"></i>
                </a>`).join("")}
        </div>` : ""}

        <p class="pv-foot">
            ${escapeHtml(pick(CONFIG.PROJECT.universityEn, CONFIG.PROJECT.university))} —
            ${escapeHtml(pick(CONFIG.PROJECT.collegeEn, CONFIG.PROJECT.college))}<br>
            ${ar ? "هذه إرشادات توعوية ولا تغني عن مراجعة طبيبك." : "Educational guidance only — it does not replace your dentist."}
        </p>
        <p class="dev-credit">Developed by Hussein Mahmoud Shaker</p>`;

    restorePvTicks();
}

// ======== حفظ تأشير المريض محليًا على جهازه ========
// نحفظه في المتصفح لا في الشيت: التأشير خاص بالمريض وتحفيزي، ولا داعي
// لإرسال بياناته للخادم في كل ضغطة
function savePvTick(input) {
    const label = input.closest(".pv-task");
    if (!label) return;
    try { localStorage.setItem("pv_" + label.dataset.key, input.checked ? "1" : "0"); } catch (e) {}
    label.classList.toggle("pv-done", input.checked);
}

function restorePvTicks() {
    document.querySelectorAll(".pv-task").forEach(label => {
        let v = null;
        try { v = localStorage.getItem("pv_" + label.dataset.key); } catch (e) {}
        if (v === "1") {
            const cb = label.querySelector("input");
            if (cb) cb.checked = true;
            label.classList.add("pv-done");
        }
    });
}
