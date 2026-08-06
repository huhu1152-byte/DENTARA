//==============================
// مركز المعرفة (DENTARA AI Knowledge Center)
// يحلّل كل التقييمات المحفوظة معًا (لا مريضًا واحدًا) ليستخرج أنماطًا عامة:
// أكثر عوامل الخطورة، أكثر المشاكل السلوكية، أكثر التوصيات، وأكثر
// الفيديوهات التي رشّحها الذكاء الاصطناعي — مصدر معرفة تراكمي للقسم
//==============================

async function showInsights() {
    showPage("insightsPage");
    $("insightsBody").innerHTML = `<div class="pv-loading"><div class="spinner"></div></div>`;

    try {
        if (!App._loaded) await loadAllData();
        renderInsights();
    } catch (err) {
        $("insightsBody").innerHTML = `<p class="empty-note">${escapeHtml(err.message || "")}</p>`;
    }
}

// ======== عدّاد تكرار عام: يزيد قيمة كل عنصر في خريطة ========
function bump(map, key) {
    if (!key) return;
    const k = String(key).trim();
    if (!k) return;
    map.set(k, (map.get(k) || 0) + 1);
}

// ======== ترتيب خريطة التكرار تنازليًا وأخذ أعلى n ========
function topN(map, n) {
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

function computeInsights() {
    const list = App.assessments.filter(a => String(a.analyzed).toLowerCase() === "yes");
    const total = list.length;

    const riskCounts = { high: 0, moderate: 0, low: 0 };
    const problemsMap = new Map();
    const instructionsMap = new Map();
    const videoMap = new Map();
    let smokerCount = 0, diabeticCount = 0;

    list.forEach(a => {
        const lvl = String(a.riskLevel || "").toLowerCase();
        if (lvl.includes("high") || lvl.includes("مرتفع")) riskCounts.high++;
        else if (lvl.includes("moderate") || lvl.includes("medium") || lvl.includes("متوسط")) riskCounts.moderate++;
        else if (lvl) riskCounts.low++;

        String(a.topProblems || "").split("|").forEach(p => bump(problemsMap, p));

        try {
            (JSON.parse(a.instructions || "[]")).forEach(ins => bump(instructionsMap, ins.title));
        } catch (e) {}

        String(a.videoIds || "").split(",").forEach(id => {
            const v = App.videos.find(x => String(x.id) === String(id.trim()));
            if (v) bump(videoMap, v.title);
        });

        try {
            const answers = JSON.parse(a.answers || "{}");
            Object.values(answers).forEach(v => {
                const s = String(v).toLowerCase();
                if (s.includes("currently smoking") || s.includes("أدخن حاليًا")) smokerCount++;
                if (s === "yes" && false) {} // محجوزة للتوسعة
            });
        } catch (e) {}
    });

    return {
        total,
        riskCounts,
        topProblems: topN(problemsMap, 5),
        topInstructions: topN(instructionsMap, 5),
        topVideos: topN(videoMap, 5),
        smokerCount
    };
}

function pct(n, total) { return total > 0 ? Math.round((n / total) * 100) : 0; }

function renderInsights() {
    const ar = LANG === "ar";
    const d = computeInsights();

    if (d.total === 0) {
        $("insightsBody").innerHTML = `<p class="empty-note">${t("noInsightsYet")}</p>`;
        return;
    }

    const rankList = (items, icon) => items.length ? `
        <div class="ins-rank">
            ${items.map(([label, count], i) => `
                <div class="ins-rank-row">
                    <span class="ins-medal">${["🥇","🥈","🥉","4","5"][i] || (i+1)}</span>
                    <span class="ins-rank-label">${escapeHtml(label)}</span>
                    <span class="ins-rank-count">${count} <small>(${pct(count, d.total)}%)</small></span>
                </div>`).join("")}
        </div>` : `<p class="empty-note">${t("noDataYet")}</p>`;

    $("insightsBody").innerHTML = `
        <div class="ins-hero">
            <i class="fa-solid fa-brain"></i>
            <h2>${t("knowledgeCenter")}</h2>
            <p>${t("knowledgeCenterD")}</p>
        </div>

        <div class="ins-stats-grid">
            <div class="ins-stat">
                <i class="fa-solid fa-users"></i>
                <b>${d.total}</b>
                <span>${t("totalAssessed")}</span>
            </div>
            <div class="ins-stat ins-high">
                <i class="fa-solid fa-shield-halved"></i>
                <b>${d.riskCounts.high}</b>
                <span>${t("highRisk")} — ${pct(d.riskCounts.high, d.total)}%</span>
            </div>
            <div class="ins-stat ins-mid">
                <i class="fa-solid fa-shield"></i>
                <b>${d.riskCounts.moderate}</b>
                <span>${t("moderateRiskS")} — ${pct(d.riskCounts.moderate, d.total)}%</span>
            </div>
            <div class="ins-stat ins-low">
                <i class="fa-solid fa-shield-check"></i>
                <b>${d.riskCounts.low}</b>
                <span>${t("lowRiskS")} — ${pct(d.riskCounts.low, d.total)}%</span>
            </div>
        </div>

        <div class="ins-section">
            <h3><i class="fa-solid fa-triangle-exclamation"></i> ${t("topRiskFactors")}</h3>
            ${rankList(d.topProblems)}
        </div>

        <div class="ins-section">
            <h3><i class="fa-solid fa-list-check"></i> ${t("topRecommendations")}</h3>
            ${rankList(d.topInstructions)}
        </div>

        <div class="ins-section">
            <h3><i class="fa-solid fa-video"></i> ${t("topVideos")}</h3>
            ${rankList(d.topVideos)}
        </div>

        <div class="ins-note">
            <i class="fa-solid fa-lightbulb"></i>
            <p>${t("knowledgeCenterNote")}</p>
        </div>

        <button class="btn-ghost" onclick="exportAllToWord()">
            <i class="fa-solid fa-file-word"></i> ${t("exportWord")}
        </button>
    `;
}
