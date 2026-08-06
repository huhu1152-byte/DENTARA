//==============================
// الإعدادات: إدارة أسئلة الاستبيان والفيديوهات التعليمية
//==============================

function showSettings(tab = "questions") {
    showPage("settingsPage");
    document.querySelectorAll("#settingsTabs button").forEach(b => {
        b.classList.toggle("active-tab", b.dataset.tab === tab);
    });
    if (tab === "questions") renderQuestionsTab();
    else if (tab === "booklet") renderBookletTemplateTab();
    else renderVideosTab();
}

// ==========================================================
// الأسئلة
// ==========================================================
function renderQuestionsTab() {
    const body = $("settingsBody");
    const bySection = SECTIONS.map(s => ({
        section: s,
        items: App.questions.filter(q => (q.section || "dental") === s.key)
    }));
    const admin = isAdmin();

    body.innerHTML = `
        ${admin ? `
        <div class="settings-actions">
            <button onclick="openQuestionForm()"><i class="fa-solid fa-plus"></i> ${t("addQuestion")}</button>
            <button class="btn-ai" onclick="openSuggestQuestions()"><i class="fa-solid fa-wand-magic-sparkles"></i> ${t("suggestQ")}</button>
            ${App.questions.length === 0 ? `<button class="btn-alt" onclick="seedDefaultQuestions()"><i class="fa-solid fa-download"></i> ${t("importQ")}</button>` : ""}
        </div>` : `
        <p class="modal-note"><i class="fa-solid fa-lock"></i> ${t("questionsAdminOnly")}</p>`}

        ${App.questions.length === 0
            ? `<p class="empty-note">${t("noQYet")}</p>`
            : bySection.map(g => g.items.length === 0 ? "" : `
                <div class="settings-group">
                    <h3><i class="fa-solid ${g.section.icon}"></i> ${escapeHtml(sectionTitle(g.section))} <span>(${g.items.length})</span></h3>
                    ${g.items.map(q => `
                        <div class="q-item">
                            <div class="q-item-body">
                                <b>${escapeHtml(qText(q))}</b>
                                <span>${escapeHtml(typeLabel(q.type))}${qOptions(q).length ? " • " + escapeHtml(qOptions(q).join(", ")) : ""}</span>
                            </div>
                            ${admin ? `
                            <div class="q-item-actions">
                                <button class="mini-btn" onclick="openQuestionForm('${escapeHtml(q.id)}')"><i class="fa-solid fa-pen"></i></button>
                                <button class="mini-btn danger" onclick="deleteQuestion('${escapeHtml(q.id)}')"><i class="fa-solid fa-trash"></i></button>
                            </div>` : ""}
                        </div>`).join("")}
                </div>`).join("")}
    `;
}

function questionFormHtml(q = {}) {
    return `
        <label class="pick-item qf-same-lang">
            <input type="checkbox" id="qf_sameLang" onchange="toggleSameLang()">
            <div><b>${t("sameTextBothLang")}</b><span>${t("sameTextBothLangHint")}</span></div>
        </label>
        <div class="form-group"><label>${t("qTextEn")}</label>
            <textarea id="qf_text" rows="2" dir="ltr" oninput="syncSameLang('qf_text')">${escapeHtml(q.question || "")}</textarea></div>
        <div class="form-group" id="qf_textArWrap"><label>${t("qTextAr")}</label>
            <textarea id="qf_textAr" rows="2" dir="rtl">${escapeHtml(q.questionAr || "")}</textarea></div>
        <div class="form-group"><label>${t("section")}</label>
            <select id="qf_section">
                ${SECTIONS.map(s => `<option value="${s.key}" ${(q.section || "dental") === s.key ? "selected" : ""}>${escapeHtml(sectionTitle(s))}</option>`).join("")}
            </select></div>
        <div class="form-group"><label>${t("answerType")}</label>
            <select id="qf_type" onchange="toggleOptionsField()">
                ${Object.keys(QUESTION_TYPES).map(k => `<option value="${k}" ${(q.type || "text") === k ? "selected" : ""}>${escapeHtml(typeLabel(k))}</option>`).join("")}
            </select></div>
        <div class="form-group" id="qf_optionsWrap">
            <label>${t("optionsEn")}</label>
            <input id="qf_options" dir="ltr" value="${escapeHtml(q.options || "")}" placeholder="Always, Sometimes, Rarely" oninput="syncSameLang('qf_options')">
            <label style="margin-top:10px;" id="qf_optionsArLabel">${t("optionsAr")}</label>
            <input id="qf_optionsAr" dir="rtl" value="${escapeHtml(q.optionsAr || "")}" placeholder="دائمًا، أحيانًا، نادرًا">
            <small id="qf_optionsHint"></small>
        </div>
        <div class="form-group"><label>${t("order")}</label>
            <input id="qf_order" type="number" value="${escapeHtml(q.order || (App.questions.length + 1))}"></div>`;
}

// خيار "نفس النص للغتين": يخفي حقل الترجمة العربية ويستخدم النص الإنجليزي
// نفسه للحقلين عند الحفظ — مفيد لأسئلة رقمية أو قيم فحص سريري لا تحتاج ترجمة
function toggleSameLang() {
    const same = $("qf_sameLang").checked;
    const wrap = $("qf_textArWrap");
    const optLabel = $("qf_optionsArLabel");
    const optAr = $("qf_optionsAr");
    if (same) { hide(wrap); if (optLabel) hide(optLabel); if (optAr) hide(optAr); syncSameLang("qf_text"); syncSameLang("qf_options"); }
    else { show(wrap); if (optLabel) show(optLabel); if (optAr) show(optAr); }
}
function syncSameLang(sourceId) {
    if (!$("qf_sameLang") || !$("qf_sameLang").checked) return;
    if (sourceId === "qf_text" && $("qf_textAr")) $("qf_textAr").value = $("qf_text").value;
    if (sourceId === "qf_options" && $("qf_optionsAr")) $("qf_optionsAr").value = $("qf_options").value;
}

function toggleOptionsField() {
    const type = $("qf_type").value;
    const wrap = $("qf_optionsWrap");
    const hint = $("qf_optionsHint");
    if (type === "radio" || type === "multi") {
        show(wrap);
        hint.textContent = LANG === "ar" ? "اكتب كل الخيارات مفصولة بفاصلة." : "List all options separated by commas.";
    } else if (type === "scale") {
        show(wrap);
        hint.textContent = LANG === "ar" ? "اكتب طرفَي المقياس فقط." : "Write only the two ends of the scale.";
    } else {
        hide(wrap);
    }
}

function openQuestionForm(id = null) {
    if (!isAdmin()) { showToast(t("questionsAdminOnly"), "error"); return; }
    const q = id ? App.questions.find(x => String(x.id) === String(id)) : {};
    if (id && !q) return;

    openModal(id ? t("editQuestion") : t("addQuestion"), questionFormHtml(q), async () => {
        if ($("qf_sameLang") && $("qf_sameLang").checked) { syncSameLang("qf_text"); syncSameLang("qf_options"); }
        const question = $("qf_text").value.trim();
        const questionAr = $("qf_textAr").value.trim();
        // يكفي أحد النصين: الواجهة ترجع تلقائيًا للمتوفر منهما
        if (!question && !questionAr) { showToast(t("qReq"), "error"); return; }

        const data = {
            question,
            questionAr,
            section: $("qf_section").value,
            type: $("qf_type").value,
            options: $("qf_options").value.trim(),
            optionsAr: $("qf_optionsAr").value.trim(),
            order: $("qf_order").value.trim() || "0"
        };

        if (id) {
            await updateRow(CONFIG.TABLES.questions, q.id, data);
            Object.assign(q, data);
        } else {
            const row = { id: uuid(), ...data, createdAt: today() };
            await addRow(CONFIG.TABLES.questions, row);
            App.questions.push(row);
        }
        App.questions.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
        closeModal();
        renderQuestionsTab();
        showToast(id ? t("updated") : t("added"));
    }, id ? t("save") : t("add"));

    toggleOptionsField();
    if (id && q.question && q.question === q.questionAr) {
        $("qf_sameLang").checked = true;
        toggleSameLang();
    }
}

function deleteQuestion(id) {
    if (!isAdmin()) { showToast(t("questionsAdminOnly"), "error"); return; }
    const q = App.questions.find(x => String(x.id) === String(id));
    if (!q) return;
    showConfirm(t("confirmDel"), `<b>${escapeHtml(qText(q))}</b>`, async () => {
        await deleteRow(CONFIG.TABLES.questions, q.id);
        App.questions = App.questions.filter(x => String(x.id) !== String(id));
        renderQuestionsTab();
        showToast(t("deleted"));
    });
}

// ======== اقتراح أسئلة بالذكاء الاصطناعي ========
function openSuggestQuestions() {
    if (!isAdmin()) { showToast(t("questionsAdminOnly"), "error"); return; }
    openModal(t("suggestQ"), `
        <div class="form-group"><label>${t("goalQ")}</label>
            <input id="sq_goal" placeholder="e.g. Assess brushing habits and knowledge of gum disease"></div>
        <div class="form-group"><label>${t("section")}</label>
            <select id="sq_section">${SECTIONS.map(s => `<option value="${s.key}">${escapeHtml(sectionTitle(s))}</option>`).join("")}</select></div>
        <div class="form-group"><label>${t("count")}</label>
            <select id="sq_count"><option>5</option><option selected>8</option><option>12</option></select></div>
    `, async () => {
        const goal = $("sq_goal").value.trim();
        if (!goal) { showToast(t("qReq"), "error"); return; }
        const section = $("sq_section").value;
        const count = $("sq_count").value;
        closeModal();
        showLoading(t("loading"));
        try {
            const res = await suggestQuestions(goal, section, count);
            hideLoading();
            showSuggestedQuestions(res.questions || [], section);
        } catch (err) {
            hideLoading();
            showInfoModal(t("aiFailed"), `<p>${escapeHtml(err.message || "خطأ غير معروف")}</p>`);
        }
    }, t("suggest"));
}

function showSuggestedQuestions(list, section) {
    if (list.length === 0) { showInfoModal(t("notice"), "<p>No questions were suggested. Try a clearer goal.</p>"); return; }

    openModal(t("suggested"), `
        <p class="modal-note">${t("pickHint")}</p>
        ${list.map((q, i) => `
            <label class="pick-item">
                <input type="checkbox" class="sq-check" data-idx="${i}" checked>
                <div>
                    <b>${escapeHtml(pick(q.question, q.questionAr) || "")}</b>
                    <span>${escapeHtml(typeLabel(q.type))}${q.options ? " • " + escapeHtml(q.options) : ""}</span>
                </div>
            </label>`).join("")}
    `, async () => {
        const chosen = Array.from(document.querySelectorAll(".sq-check"))
            .filter(c => c.checked).map(c => list[Number(c.dataset.idx)]);
        if (chosen.length === 0) { showToast(t("noneChosen"), "error"); return; }

        let order = App.questions.length;
        let added = 0;
        for (const q of chosen) {
            try {
                order++;
                const row = {
                    id: uuid(),
                    question: q.question || "",
                    questionAr: q.questionAr || "",
                    section,
                    type: QUESTION_TYPES[q.type] ? q.type : "text",
                    options: q.options || "",
                    optionsAr: q.optionsAr || "",
                    order: String(order),
                    createdAt: today()
                };
                await addRow(CONFIG.TABLES.questions, row);
                App.questions.push(row);
                added++;
            } catch (err) { console.error("تعذر إضافة سؤال:", err); }
        }
        App.questions.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
        closeModal();
        renderQuestionsTab();
        showToast(added > 0 ? `تمت إضافة ${added} سؤالًا` : "تعذر الإضافة", added > 0 ? "success" : "error");
    }, t("addPicked"));
}

// ==========================================================
// الفيديوهات
// ==========================================================
function renderVideosTab() {
    const body = $("settingsBody");
    body.innerHTML = `
        <div class="settings-actions">
            <button onclick="openVideoForm()"><i class="fa-solid fa-plus"></i> ${t("addVideo")}</button>
        </div>
        <p class="modal-note" style="margin-bottom:14px;">
            <i class="fa-solid fa-circle-info"></i>
            ${t("videoHint")}
        </p>
        ${App.videos.length === 0
            ? `<p class="empty-note">${t("noVideosYet")}</p>`
            : App.videos.map(v => `
                <div class="q-item">
                    <div class="q-item-body">
                        <b>${escapeHtml(v.title || "بلا عنوان")}</b>
                        ${v.description ? `<span>${escapeHtml(v.description)}</span>` : `<span style="color:#c62828;">${t("noDesc")}</span>`}
                        ${v.url ? `<a href="${escapeHtml(v.url)}" target="_blank" rel="noopener noreferrer" class="v-link">${t("openLink")}</a>` : ""}
                    </div>
                    <div class="q-item-actions">
                        <button class="mini-btn" onclick="openVideoForm('${escapeHtml(v.id)}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="mini-btn danger" onclick="deleteVideo('${escapeHtml(v.id)}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>`).join("")}
    `;
}

function openVideoForm(id = null) {
    const v = id ? App.videos.find(x => String(x.id) === String(id)) : {};
    if (id && !v) return;

    openModal(id ? t("editVideo") : t("addVideo"), `
        <div class="form-group"><label>${t("videoTitle")}</label>
            <input id="vf_title" value="${escapeHtml(v.title || "")}" placeholder="e.g. Correct Brushing Technique"></div>
        <div class="form-group"><label>${t("videoUrl")}</label>
            <input id="vf_url" dir="ltr" value="${escapeHtml(v.url || "")}" placeholder="https://...">
            <small>${t("uploadHint")}</small></div>
        <div class="form-group">
            <label>${t("orUpload")}</label>
            <input type="file" id="vf_file" accept="video/*">
            <small>${t("uploadFileHint")}</small>
            <div id="vf_uploadStatus" class="upload-status hidden"></div>
        </div>
        <div class="form-group"><label>${t("videoDesc")}</label>
            <textarea id="vf_desc" rows="3" placeholder="${t("videoDescP")}">${escapeHtml(v.description || "")}</textarea></div>
    `, async () => {
        const title = $("vf_title").value.trim();
        let url = $("vf_url").value.trim();
        const fileInput = $("vf_file");
        const file = fileInput && fileInput.files && fileInput.files[0];

        if (!title) { showToast(t("titleReq"), "error"); return; }
        if (!url && !file) { showToast(t("urlReq"), "error"); return; }

        if (file) {
            const statusEl = $("vf_uploadStatus");
            if (statusEl) { show(statusEl); statusEl.classList.remove("upload-error"); statusEl.textContent = t("uploading"); }
            try {
                url = await uploadVideoFile(file);
            } catch (err) {
                if (statusEl) { statusEl.textContent = err.message; statusEl.classList.add("upload-error"); }
                throw err; // يوقف الحفظ ويعرض الخطأ عبر معالج النافذة العام
            }
            if (statusEl) { statusEl.textContent = t("uploadDone"); }
        }

        const data = { title, url: normalizeVideoUrl(url), description: $("vf_desc").value.trim() };
        if (id) {
            await updateRow(CONFIG.TABLES.videos, v.id, data);
            Object.assign(v, data);
        } else {
            const row = { id: uuid(), ...data, createdAt: today() };
            await addRow(CONFIG.TABLES.videos, row);
            App.videos.push(row);
        }
        closeModal();
        renderVideosTab();
        showToast(id ? t("updated") : t("added"));
    }, id ? t("save") : t("add"));
}

function deleteVideo(id) {
    const v = App.videos.find(x => String(x.id) === String(id));
    if (!v) return;
    showConfirm(t("confirmDel"), `<b>${escapeHtml(v.title)}</b>`, async () => {
        await deleteRow(CONFIG.TABLES.videos, v.id);
        App.videos = App.videos.filter(x => String(x.id) !== String(id));
        renderVideosTab();
        showToast(t("deleted"));
    });
}


// ======== تحويل روابط الرفع إلى روابط مشاهدة مباشرة ========
// الطبيب يرفع الفيديو على Google Drive ثم ينسخ رابط المشاركة؛ هذا الرابط
// لا يُشغّل الفيديو مباشرة، فنحوّله تلقائيًا لصيغة المعاينة القابلة للتشغيل.
function normalizeVideoUrl(url) {
    const u = String(url || "").trim();
    if (!u) return u;

    // Google Drive: .../file/d/<ID>/view  →  .../file/d/<ID>/preview
    const drive = u.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
    if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;

    // Drive بصيغة open?id=<ID>
    const driveOpen = u.match(/drive\.google\.com\/open\?id=([\w-]+)/);
    if (driveOpen) return `https://drive.google.com/file/d/${driveOpen[1]}/preview`;

    return u;
}

// ==========================================================
// القالب الافتراضي لدفتر المتابعة (يعدّله المدير فقط)
// ==========================================================
async function renderBookletTemplateTab() {
    const body = $("settingsBody");
    body.innerHTML = `<div class="pv-loading"><div class="spinner"></div></div>`;

    const rows = await loadBookletTemplate(true);
    const admin = isAdmin();
    const items = [0, 1, 2, 3].map(i => rows[i] || { title: "", titleAr: "", times: "" });

    body.innerHTML = `
        <p class="modal-note"><i class="fa-solid ${admin ? "fa-circle-info" : "fa-lock"}"></i> ${t(admin ? "bookletTemplateNote" : "bookletTemplateAdminOnly")}</p>
        ${items.map((it, i) => `
            <div class="settings-group">
                <h3>${t("taskLbl")} ${i + 1}</h3>
                <div class="form-group">
                    <label>${t("titleEnLbl")}</label>
                    <input id="bt_en_${i}" value="${escapeHtml(it.title)}" ${admin ? "" : "disabled"}>
                </div>
                <div class="form-group">
                    <label>${t("titleArLbl")}</label>
                    <input id="bt_ar_${i}" value="${escapeHtml(it.titleAr)}" ${admin ? "" : "disabled"}>
                </div>
                <div class="form-group">
                    <label>${t("taskTimesPh")}</label>
                    <input id="bt_tm_${i}" value="${escapeHtml(it.times)}" ${admin ? "" : "disabled"}>
                </div>
            </div>`).join("")}
        ${admin ? `<button class="btn-primary" onclick="saveBookletTemplate()"><i class="fa-solid fa-floppy-disk"></i> ${t("save")}</button>` : ""}
    `;
}

async function saveBookletTemplate() {
    const newRows = [0, 1, 2, 3].map(i => ({
        title: ($(`bt_en_${i}`).value || "").trim(),
        titleAr: ($(`bt_ar_${i}`).value || "").trim(),
        times: ($(`bt_tm_${i}`).value || "").trim()
    })).filter(r => r.title || r.titleAr);

    const existing = await loadBookletTemplate();
    try {
        for (const row of existing) {
            if (row.id) await deleteRow(CONFIG.TABLES.bookletTemplate, row.id);
        }
        for (const row of newRows) {
            await addRow(CONFIG.TABLES.bookletTemplate, row);
        }
        App.bookletTemplate = null;
        await loadBookletTemplate(true);
        showToast(t("updated"));
    } catch (err) {
        showToast(err.message || String(err));
    }
}
