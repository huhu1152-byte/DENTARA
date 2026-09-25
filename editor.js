//==============================
// تعديل نتائج الذكاء الاصطناعي قبل الطباعة
// الطبيب هو صاحب القرار: كل ما يولّده المساعد مجرد مسودة قابلة للتعديل
//==============================

function openResultEditor() {
    const r = App.current && App.current.result;
    if (!r) return;
    if (!canEditRecord(App.current.record)) { showToast(t("notOwner"), "error"); return; }
    const ar = LANG === "ar";
    const risk = r.risk_assessment || {};

    const problems = (r.priority_problems || []).map(p => p.problem || "").join("\n");
    const factors = (risk.supporting_factors || []).join("\n");
    const ins = (r.personalized_instructions || []).map(i =>
        `${i.instruction_arabic || ""} | ${i.how_to_do_it_arabic || ""} | ${i.when || ""}`).join("\n");
    const aids = (r.oral_hygiene_aids || []).map(a =>
        `${a.aid || ""} | ${a.reason || ""} | ${a.how_to_use_arabic || ""}`).join("\n");
    const goals = (r.smart_goals || []).map(g =>
        `${g.goal_arabic || ""} | ${g.time_frame || ""}`).join("\n");
    const bar = (r.barriers_and_solutions || []).map(b => `${b.barrier || ""} | ${b.solution_arabic || ""}`).join("\n");

    const currentVideoIds = (r.recommended_videos || []).map(v => String(v.video_id));
    const vidOptions = (App.videos || []).filter(v => v.id).map(v => {
        const checked = currentVideoIds.includes(String(v.id)) ? "checked" : "";
        return `<label class="pick-item">
            <input type="checkbox" class="ed-vid" data-vid="${escapeHtml(v.id)}" ${checked}>
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
                    const sel = String(risk.level || "").toLowerCase().includes(v.toLowerCase()) ? "selected" : "";
                    return `<option value="${ar ? lbl : v}" ${sel}>${lbl}</option>`;
                }).join("")}
            </select></div>

        <div class="form-group"><label>${ar ? "عوامل داعمة للتصنيف" : "Supporting factors"}</label>
            <textarea id="ed_factors" rows="2">${escapeHtml(factors)}</textarea>
            <small>${ar ? "عامل واحد في كل سطر" : "One per line"}</small></div>

        <div class="form-group"><label>${t("topProblems")}</label>
            <textarea id="ed_problems" rows="3">${escapeHtml(problems)}</textarea>
            <small>${ar ? "مشكلة واحدة في كل سطر" : "One problem per line"}</small></div>

        <div class="form-group"><label>${t("instructions")}</label>
            <textarea id="ed_ins" rows="6">${escapeHtml(ins)}</textarea>
            <small>${ar
                ? "كل سطر تعليمة واحدة بالصيغة: التعليمة | طريقة التنفيذ | الأوقات"
                : "One per line: Instruction | How-to | Times"}</small></div>

        <div class="form-group"><label>${t("oralHygieneAids")}</label>
            <textarea id="ed_aids" rows="3">${escapeHtml(aids)}</textarea>
            <small>${ar ? "كل سطر: الأداة | السبب | طريقة الاستخدام" : "One per line: Aid | Reason | How-to"}</small></div>

        <div class="form-group"><label>${t("goals")}</label>
            <textarea id="ed_goals" rows="2">${escapeHtml(goals)}</textarea>
            <small>${ar ? "كل سطر: الهدف | المدة الزمنية" : "One per line: Goal | Time frame"}</small></div>

        <div class="form-group"><label>${t("barriers")}</label>
            <textarea id="ed_bar" rows="3">${escapeHtml(bar)}</textarea>
            <small>${ar ? "كل سطر: العائق | الحل" : "One per line: Barrier | Solution"}</small></div>

        <div class="form-group"><label>${t("motivation")}</label>
            <textarea id="ed_mot" rows="2">${escapeHtml(r.motivational_message_arabic || "")}</textarea></div>

        <div class="form-group"><label>${t("videos")}</label>
            ${vidOptions || `<p class="modal-note">${t("noVideosYet")}</p>`}</div>
    `, async () => {
        const lines = id => $(id).value.split("\n").map(s => s.trim()).filter(Boolean);
        const parts = (id, n) => lines(id).map(line => line.split("|").map(x => x.trim()));

        const newLevel = $("ed_risk").value;
        r.risk_assessment = { level: newLevel, supporting_factors: lines("ed_factors") };

        r.priority_problems = lines("ed_problems").map((problem, i) => {
            const orig = (r.priority_problems || [])[i] || {};
            return { priority: i + 1, problem, category: orig.category || "", evidence: orig.evidence || [], why_prioritized: orig.why_prioritized || "" };
        });

        r.personalized_instructions = parts("ed_ins").map(p => ({
            priority_problem: "", instruction_arabic: p[0] || "", how_to_do_it_arabic: p[1] || "",
            frequency: "", duration: "", when: p[2] || "", habit_tip_arabic: ""
        }));

        r.oral_hygiene_aids = parts("ed_aids").map(p => ({
            aid: p[0] || "", reason: p[1] || "", how_to_use_arabic: p[2] || "", frequency: "", precautions: ""
        }));

        r.smart_goals = parts("ed_goals").map((p, i) => ({
            goal_arabic: p[0] || "", measurement: "", time_frame: p[1] || "", related_priority: i + 1
        }));

        r.barriers_and_solutions = parts("ed_bar").map(p => ({
            barrier: p[0] || "", source: "Patient-reported", solution_arabic: p[1] || ""
        }));

        const chosenIds = Array.from(document.querySelectorAll(".ed-vid"))
            .filter(c => c.checked).map(c => c.dataset.vid);
        r.recommended_videos = chosenIds.map((vid, i) => {
            const orig = (r.recommended_videos || []).find(v => String(v.video_id) === String(vid)) || {};
            const v = App.videos.find(x => String(x.id) === String(vid)) || {};
            return { priority: i + 1, video_id: vid, title: v.title || orig.title || "", reason: orig.reason || "", related_problem: orig.related_problem || "" };
        });

        r.motivational_message_arabic = $("ed_mot").value.trim();

        // حفظ التعديلات على السجل نفسه في الشيت
        const rec = App.current.record;
        if (rec) {
            const update = {
                riskLevel: r.risk_assessment.level,
                riskFactors: r.risk_assessment.supporting_factors.join(" | "),
                priorityProblems: JSON.stringify(r.priority_problems),
                personalizedInstructions: JSON.stringify(r.personalized_instructions),
                oralHygieneAids: JSON.stringify(r.oral_hygiene_aids),
                smartGoals: JSON.stringify(r.smart_goals),
                barriersSolutions: JSON.stringify(r.barriers_and_solutions),
                recommendedVideos: JSON.stringify(r.recommended_videos),
                motivationalMessage: r.motivational_message_arabic,
                dentistReviewRequired: "no",
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
