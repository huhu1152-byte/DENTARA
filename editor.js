//==============================
// تعديل نتائج الذكاء الاصطناعي قبل الطباعة
// الطبيب هو صاحب القرار: كل ما يولّده المساعد مجرد مسودة قابلة للتعديل
//==============================

function openResultEditor() {
    const r = App.current && App.current.result;
    if (!r) return;
    if (!canEditRecord(App.current.record)) { showToast(t("notOwner"), "error"); return; }
    const ar = LANG === "ar";

    const problems = (r.topProblems || []).join("\n");
    const goals = (r.goals || []).join("\n");
    const ins = (r.instructions || []).map(i =>
        `${i.title || ""} | ${i.detail || ""} | ${(i.times || []).join(",")}`).join("\n");
    const bar = (r.barriers || []).map(b => `${b.barrier || ""} | ${b.solution || ""}`).join("\n");

    const vidOptions = (App.videos || []).map((v, i) => {
        const checked = (r.videoIndexes || []).map(Number).includes(i) ? "checked" : "";
        return `<label class="pick-item">
            <input type="checkbox" class="ed-vid" data-idx="${i}" ${checked}>
            <div><b>${escapeHtml(v.title || "")}</b>
            ${v.description ? `<span>${escapeHtml(v.description)}</span>` : ""}</div>
        </label>`;
    }).join("");

    openModal(ar ? "تعديل نتائج التقييم" : "Edit Assessment Results", `
        <p class="modal-note">${ar
            ? "كل ما يولّده المساعد مجرد اقتراح — عدّله كما تراه مناسبًا قبل الطباعة."
            : "Everything the assistant generates is a suggestion — adjust it as you see fit before printing."}</p>

        <div class="form-group"><label>${t("riskLevel")}</label>
            <select id="ed_risk">
                ${["Low", "Moderate", "High"].map(v => {
                    const lbl = ar ? { Low: "منخفض", Moderate: "متوسط", High: "مرتفع" }[v] : v;
                    const sel = String(r.riskLevel || "").toLowerCase().includes(v.toLowerCase()) ? "selected" : "";
                    return `<option value="${ar ? lbl : v}" ${sel}>${lbl}</option>`;
                }).join("")}
            </select></div>

        <div class="form-group"><label>${ar ? "سبب التصنيف" : "Risk reason"}</label>
            <input id="ed_riskReason" value="${escapeHtml(r.riskReason || "")}"></div>

        <div class="form-group"><label>${t("topProblems")}</label>
            <textarea id="ed_problems" rows="3">${escapeHtml(problems)}</textarea>
            <small>${ar ? "مشكلة واحدة في كل سطر" : "One problem per line"}</small></div>

        <div class="form-group"><label>${t("instructions")}</label>
            <textarea id="ed_ins" rows="6">${escapeHtml(ins)}</textarea>
            <small>${ar
                ? "كل سطر تعليمة واحدة بالصيغة: العنوان | الشرح | الأوقات مفصولة بفاصلة"
                : "One per line: Title | Detail | times,comma,separated"}</small></div>

        <div class="form-group"><label>${t("goals")}</label>
            <textarea id="ed_goals" rows="2">${escapeHtml(goals)}</textarea>
            <small>${ar ? "هدف واحد في كل سطر" : "One goal per line"}</small></div>

        <div class="form-group"><label>${t("barriers")}</label>
            <textarea id="ed_bar" rows="3">${escapeHtml(bar)}</textarea>
            <small>${ar ? "كل سطر: العائق | الحل" : "One per line: Barrier | Solution"}</small></div>

        <div class="form-group"><label>${t("motivation")}</label>
            <textarea id="ed_mot" rows="2">${escapeHtml(r.motivation || "")}</textarea></div>

        <div class="form-group"><label>${t("videos")}</label>
            ${vidOptions || `<p class="modal-note">${t("noVideosYet")}</p>`}</div>
    `, async () => {
        const lines = id => $(id).value.split("\n").map(s => s.trim()).filter(Boolean);

        r.riskLevel = $("ed_risk").value;
        r.riskReason = $("ed_riskReason").value.trim();
        r.topProblems = lines("ed_problems");
        r.goals = lines("ed_goals");
        r.motivation = $("ed_mot").value.trim();

        r.instructions = lines("ed_ins").map(line => {
            const p = line.split("|").map(x => x.trim());
            return {
                title: p[0] || "",
                detail: p[1] || "",
                times: (p[2] || "").split(/[,،]/).map(x => x.trim()).filter(Boolean)
            };
        });

        r.barriers = lines("ed_bar").map(line => {
            const p = line.split("|").map(x => x.trim());
            return { barrier: p[0] || "", solution: p[1] || "" };
        });

        r.videoIndexes = Array.from(document.querySelectorAll(".ed-vid"))
            .filter(c => c.checked).map(c => Number(c.dataset.idx));

        // حفظ التعديلات على السجل نفسه في الشيت
        const rec = App.current.record;
        if (rec) {
            const update = {
                riskLevel: r.riskLevel,
                riskReason: r.riskReason,
                topProblems: r.topProblems.join(" | "),
                instructions: JSON.stringify(r.instructions),
                goals: r.goals.join(" | "),
                barriers: JSON.stringify(r.barriers),
                motivation: r.motivation,
                videoIds: r.videoIndexes.map(i => (App.videos[i] || {}).id).filter(Boolean).join(","),
                analyzed: "yes"
            };
            try {
                await updateRow(CONFIG.TABLES.assessments, rec.id, update);
                Object.assign(rec, update);
            } catch (err) {
                console.error(err);
                showToast(t("saveFailed"), "error");
            }
        }

        closeModal();
        renderResults(r);
        showToast(t("updated"));
    }, t("save"));
}
