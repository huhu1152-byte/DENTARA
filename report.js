//==============================
// عرض النتائج + ورقة التعليمات القابلة للطباعة + كارت المتابعة
//==============================

// ======== شاشة النتائج داخل التطبيق ========
function renderResults(r) {
    const p = App.current.patient;
    const videos = pickedVideos(r);
    const level = r.riskLevel || "غير محدد";
    const cls = riskClass(level);

    $("resultsBody").innerHTML = `
        <div class="result-patient">
            <b>${escapeHtml(p.fullName)}</b>
            <span>${t("age")}: ${escapeHtml(p.age)}${p.gender ? " • " + escapeHtml(p.gender) : ""}</span>
        </div>

        ${renderFollowUpBanner()}

        ${(App.current.beforePhotoUrl || (App.current.record && App.current.record.beforePhotoUrl)) ? `
        <div class="res-section">
            <h3><i class="fa-solid fa-camera"></i> ${t("beforePhoto")}</h3>
            <img class="before-photo-img" src="${escapeHtml(App.current.beforePhotoUrl || App.current.record.beforePhotoUrl)}" alt="Before treatment">
        </div>` : ""}

        <div class="risk-card ${cls}">
            <span>${t("riskLevel")}</span>
            <b>${escapeHtml(level)}</b>
            ${r.riskReason ? `<p>${escapeHtml(r.riskReason)}</p>` : ""}
        </div>

        ${(r.aiReasoning || []).length ? `
        <button class="btn-ghost ai-why-btn" onclick="openAiReasoning()">
            <i class="fa-solid fa-brain"></i> ${t("whyAI")}
        </button>` : ""}

        ${(r.topProblems || []).length ? `
        <div class="res-section">
            <h3><i class="fa-solid fa-triangle-exclamation"></i> ${t("topProblems")}</h3>
            ${r.topProblems.map((t, i) => `
                <div class="prob-row"><span class="prob-num">${i + 1}</span>${escapeHtml(t)}</div>
            `).join("")}
        </div>` : ""}

        <div class="res-section">
            <h3><i class="fa-solid fa-list-check"></i> ${t("instructions")}</h3>
            ${(r.instructions || []).map(ins => `
                <div class="ins-row">
                    <b>${escapeHtml(ins.title || "")}</b>
                    <p>${escapeHtml(ins.detail || "")}</p>
                    ${(ins.times || []).length ? `<span class="ins-times"><i class="fa-solid fa-clock"></i> ${escapeHtml((ins.times || []).join("، "))}</span>` : ""}
                </div>`).join("")}
        </div>

        ${(r.goals || []).length ? `
        <div class="res-section">
            <h3><i class="fa-solid fa-bullseye"></i> ${t("goals")}</h3>
            <ul class="goal-list">${r.goals.map(g => `<li>${escapeHtml(g)}</li>`).join("")}</ul>
        </div>` : ""}

        ${(r.barriers || []).length ? `
        <div class="res-section">
            <h3><i class="fa-solid fa-key"></i> ${t("barriers")}</h3>
            ${r.barriers.map(b => `
                <div class="barrier-row">
                    <b><i class="fa-solid fa-circle-xmark"></i> ${escapeHtml(b.barrier || "")}</b>
                    <p><i class="fa-solid fa-circle-check"></i> ${escapeHtml(b.solution || "")}</p>
                </div>`).join("")}
        </div>` : ""}

        ${r.motivation ? `
        <div class="motivation-card">
            <i class="fa-solid fa-heart"></i>
            <p>${escapeHtml(r.motivation)}</p>
        </div>` : ""}

        ${videos.length ? `
        <div class="res-section">
            <h3><i class="fa-solid fa-video"></i> ${t("videos")}</h3>
            ${r.videoReason ? `<p class="video-reason">${escapeHtml(r.videoReason)}</p>` : ""}
            ${videos.map(v => `
                <div class="video-row">
                    <i class="fa-solid fa-circle-play"></i>
                    <div>
                        <b>${escapeHtml(v.title || "Video")}</b>
                        ${v.description ? `<span>${escapeHtml(v.description)}</span>` : ""}
                    </div>
                </div>`).join("")}
        </div>` : `
        <div class="res-section">
            <p style="color:#888;font-size:13px;">${t("noVideos")}</p>
        </div>`}
    `;

    show($("resultActions"));
    const owned = canEditRecord(App.current.record);
    const editBtn = $("editResultsBtn"), reBtn = $("reanalyzeBtn");
    if (editBtn) editBtn.classList.toggle("hidden", !owned);
    if (reBtn) reBtn.classList.toggle("hidden", !owned);
    showPage("resultsPage");
}

// تصنيف مستوى الخطورة بصرف النظر عن لغة الرد
// ======== شريط موعد المتابعة في شاشة النتائج ========
function renderFollowUpBanner() {
    const rec = App.current.record;
    if (!rec || !rec.followUpDate) return "";

    const status = followUpStatus(rec);
    if (status === "none") return "";

    const canStart = canEditRecord(rec);
    return `
        <div class="fu-banner fu-banner-${status}">
            <div class="fu-banner-text">
                ${followUpBadge(status)}
                <span class="fu-banner-date"><i class="fa-regular fa-calendar"></i> ${t("scheduledDate")}: ${escapeHtml(rec.followUpDate)}</span>
            </div>
            ${canStart && status !== "completed" ? `
            <button class="btn-primary fu-start-btn" onclick="startFollowUp('${escapeHtml(rec.id)}')">
                <i class="fa-solid fa-rotate"></i> ${t("startFollowUp")}
            </button>` : ""}
        </div>`;
}

// ======== نافذة "لماذا اقترح الذكاء الاصطناعي هذا؟" ========
function openAiReasoning() {
    const r = App.current.result;
    if (!r || !(r.aiReasoning || []).length) return;

    const titles = (r.instructions || []).map(i => i.title).filter(Boolean);
    openModal(t("whyAITitle"), `
        <p class="modal-note">${t("whyAIIntro")}</p>
        ${r.aiReasoning.map((reason, i) => `
            <div class="bk-how"><span class="bk-how-num">${i + 1}</span><p>${escapeHtml(reason)}</p></div>`).join("")}
        ${titles.length ? `
        <div class="ai-therefore">
            <b>${t("thereforeRecommends")}</b>
            <ul>${titles.map(x => `<li>✓ ${escapeHtml(x)}</li>`).join("")}</ul>
        </div>` : ""}
    `, null);
}

function riskClass(level) {
    const l = String(level || "").toLowerCase();
    if (l.includes("high") || l.includes("مرتفع")) return "risk-high";
    if (l.includes("moderate") || l.includes("medium") || l.includes("متوسط")) return "risk-mid";
    return "risk-low";
}

// شاشة سجل محفوظ لم يُحلَّل بعد (أو فشل تحليله) — الإجابات في أمان
function showResultsUnanalyzed(record, err) {
    const owned = canEditRecord(record);
    $("resultsBody").innerHTML = `
        <div class="result-patient">
            <b>${escapeHtml(record.patientName || "")}</b>
            <span>${t("age")}: ${escapeHtml(record.age || "-")}${record.gender ? " • " + escapeHtml(record.gender) : ""}</span>
        </div>
        <div class="unanalyzed-card">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <b>${t("aiFailed")}</b>
            ${err ? `<p class="unanalyzed-reason"><b>${t("reason")}:</b> ${escapeHtml(err.message || "")}</p>` : ""}
            <p class="unanalyzed-safe"><i class="fa-solid fa-shield-halved"></i> ${t("answersSafe")}</p>
            ${owned ? `
            <button class="btn-primary" onclick="retryAnalysis('${escapeHtml(record.id)}')">
                <i class="fa-solid fa-rotate-right"></i> ${t("retry")}
            </button>` : `<p class="unanalyzed-reason">${t("notOwner")}</p>`}
        </div>`;
    hide($("resultActions"));
    showPage("resultsPage");
}

// الفيديوهات التي اختارها النموذج بالأرقام
function pickedVideos(r) {
    return (r.videoIndexes || [])
        .map(i => App.videos[Number(i)])
        .filter(Boolean);
}

// ======== شاشة اكتمال التقييم + ملخص القسم (بعد الطباعة) ========
async function showAssessmentComplete() {
    showPage("completePage");
    $("completeBody").innerHTML = `<div class="pv-loading"><div class="spinner"></div></div>`;
    try {
        if (!App._loaded) await loadAllData();
        renderAssessmentComplete();
    } catch (err) {
        $("completeBody").innerHTML = `<p class="empty-note">${escapeHtml(err.message || "")}</p>`;
    }
}

// متوسط مؤشر اللويحة الجرثومية عبر كل التقييمات (يبحث عن سؤال PI بالاسم
// لأن معرّف السؤال يُولَّد ديناميكيًا من شيت الأسئلة)
function computePlaqueAverage(list) {
    const piQ = App.questions.find(q => {
        const en = String(q.question || "").toLowerCase();
        const ar = String(q.questionAr || "");
        return en.includes("plaque index") || ar.includes("اللويحة");
    });
    if (!piQ) return null;

    let sum = 0, count = 0;
    list.forEach(a => {
        try {
            const answers = JSON.parse(a.answers || "{}");
            const val = parseFloat(String(answers[piQ.id] || "").replace(",", "."));
            if (!isNaN(val)) { sum += val; count++; }
        } catch (e) {}
    });
    return count > 0 ? (sum / count) : null;
}

function renderAssessmentComplete() {
    const list = App.assessments.filter(a => String(a.analyzed).toLowerCase() === "yes");
    const total = list.length;
    const riskCounts = { high: 0, moderate: 0, low: 0 };
    const problemsMap = new Map();

    list.forEach(a => {
        const lvl = String(a.riskLevel || "").toLowerCase();
        if (lvl.includes("high") || lvl.includes("مرتفع")) riskCounts.high++;
        else if (lvl.includes("moderate") || lvl.includes("medium") || lvl.includes("متوسط")) riskCounts.moderate++;
        else if (lvl) riskCounts.low++;

        String(a.topProblems || "").split("|").forEach(p => bump(problemsMap, p));
    });

    const topFinding = topN(problemsMap, 1)[0];
    const avgPI = computePlaqueAverage(list);

    $("completeBody").innerHTML = `
        <div class="cs-hero">
            <div class="cs-check"><i class="fa-solid fa-check"></i></div>
            <h2>${t("assessmentCompleteTitle")}</h2>
            <p>${t("assessmentCompleteSub")}</p>
        </div>

        <div class="cs-section-head">
            <i class="fa-solid fa-chart-column"></i>
            <div>
                <h3>${t("departmentSummary")}</h3>
                <span>${t("departmentSummaryD")}</span>
            </div>
        </div>

        <div class="cs-stats-grid">
            <div class="cs-stat">
                <i class="fa-solid fa-users"></i>
                <b>${total}</b>
                <span>${t("totalPatients")}</span>
                <small>${t("assessedLbl")}</small>
            </div>
            <div class="cs-stat cs-high">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <b>${riskCounts.high}</b>
                <span>${t("highRisk")}</span>
                <small>${pct(riskCounts.high, total)}% ${t("ofTotal")}</small>
            </div>
            <div class="cs-stat cs-mid">
                <i class="fa-solid fa-shield"></i>
                <b>${riskCounts.moderate}</b>
                <span>${t("moderateRiskS")}</span>
                <small>${pct(riskCounts.moderate, total)}% ${t("ofTotal")}</small>
            </div>
            <div class="cs-stat cs-low">
                <i class="fa-solid fa-shield-check"></i>
                <b>${riskCounts.low}</b>
                <span>${t("lowRiskS")}</span>
                <small>${pct(riskCounts.low, total)}% ${t("ofTotal")}</small>
            </div>
        </div>

        <div class="cs-info-row">
            <div class="cs-info-card">
                <i class="fa-solid fa-tooth"></i>
                <div>
                    <span>${t("mostCommonFinding")}</span>
                    <b>${topFinding ? escapeHtml(topFinding[0]) : "—"}</b>
                    ${topFinding ? `<small>${topFinding[1]} ${t("patientsLbl")} (${pct(topFinding[1], total)}%)</small>` : ""}
                </div>
            </div>
            <div class="cs-info-card">
                <i class="fa-solid fa-chart-line"></i>
                <div>
                    <span>${t("avgPlaqueIndex")}</span>
                    <b>${avgPI !== null ? avgPI.toFixed(1) : "—"}</b>
                    <small>${t("acrossAllPatients")}</small>
                </div>
            </div>
        </div>

        <div class="cs-note">
            <i class="fa-solid fa-circle-info"></i>
            <p>${t("csNote")}</p>
        </div>
    `;
}

// ======== بناء ورقة الطباعة ========
function printElement(areaId, title) {
    const area = $(areaId);
    if (!area || !area.innerHTML.trim()) { window.print(); return; }

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map(el => el.outerHTML).join("\n");

    const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    // نضيف سكربتًا صغيرًا يستدعي الطباعة تلقائيًا من داخل الصفحة الجديدة نفسها
    // (لا من الصفحة الأصلية) — هذا هو الفارق الحاسم: استدعاء print() المرتبط
    // مباشرة بتحميل الصفحة الخاصة به يعمل بثبات على iOS، بخلاف استدعائه من
    // إطار iframe مخفي بعد تأخير زمني من صفحة أخرى (ما كان يفشل بصمت)
    const html = `<!DOCTYPE html>
<html lang="${LANG}" dir="${LANG === "ar" ? "rtl" : "ltr"}">
<head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title || "")}</title>
${styles}
<style>
  body { background:#fff; margin:0; padding:0; }
  .sheet { box-shadow:none; border:none; margin:0 0 8mm; padding:0; max-width:100%; page-break-after:always; }
  .sheet:last-child { page-break-after:auto; }
  .bk-page { box-shadow:none; border:none; margin:0; page-break-after:always; }
  .bk-page:last-child { page-break-after:auto; }
  @page { size:A4; margin:10mm; }
</style>
</head>
<body>${area.innerHTML}
<script>window.onload = function () { setTimeout(function () { window.print(); }, 300); };<\/script>
</body></html>`;

    if (isIOS) {
        // iOS Safari يرفض غالبًا تشغيل الطباعة من داخل iframe مخفي. نفتح
        // الصفحة في تبويب كامل بدلاً من ذلك (نفس الأسلوب الناجح مع Word)،
        // وتستدعي هي نفسها الطباعة فور اكتمال تحميلها
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 20000);
        showInfoModal(t("exportedTitle"), `<p>${t("printIOSHint")}</p>`);
        return;
    }

    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
    document.body.appendChild(frame);

    const doc = frame.contentWindow.document;
    doc.open(); doc.write(html); doc.close();

    const go = () => {
        try { frame.contentWindow.focus(); frame.contentWindow.print(); }
        catch (e) { console.warn("iframe print failed, falling back:", e); window.print(); }
        setTimeout(() => { try { document.body.removeChild(frame); } catch (e) {} }, 2000);
    };
    if (frame.contentWindow.document.readyState === "complete") setTimeout(go, 700);
    else frame.onload = () => setTimeout(go, 700);
}

