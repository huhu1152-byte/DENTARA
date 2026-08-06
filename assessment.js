//==============================
// التقييم: إدخال بيانات المريض ثم الاستبيان خطوة بخطوة
//==============================

// ======== بدء تقييم جديد ========
function startNewAssessment() {
    App.current = { patient: {}, answers: {}, step: 0 };
    showPage("patientInfoPage");
    $("pi_name").value = "";
    $("pi_age").value = "";
    $("pi_gender").value = "";
    $("pi_name").focus();
}

// ======== حفظ بيانات المريض والانتقال للاستبيان ========
function submitPatientInfo() {
    const name = $("pi_name").value.trim();
    const age = $("pi_age").value.trim();
    const gender = $("pi_gender").value;

    if (!name) { showToast(t("nameReq"), "error"); $("pi_name").focus(); return; }
    if (!age) { showToast(t("ageReq"), "error"); $("pi_age").focus(); return; }

    App.current.patient = { fullName: name, age, gender };

    const sections = activeSections();
    if (sections.length === 0) {
        showToast(t("noQuestions"), "error");
        return;
    }

    App.current.step = 0;
    showPage("wizardPage");
    renderStep();
}

// الأقسام التي تحتوي أسئلة فعليًا (نتخطى الفارغة تلقائيًا)
function activeSections() {
    return SECTIONS.filter(s => App.questions.some(q => (q.section || "dental") === s.key));
}

// نص السؤال حسب اللغة الحالية
function qText(q) { return pick(q.question, q.questionAr); }

// خيارات السؤال حسب اللغة الحالية، مع الرجوع للإنجليزية إن نقصت الترجمة
function qOptions(q) {
    const en = parseOptions(q.options);
    const ar = parseOptions(q.optionsAr);
    if (LANG === "ar" && ar.length > 0) return ar;
    return en.length > 0 ? en : ar;
}

// ======== عرض خطوة واحدة من الاستبيان ========
function renderStep() {
    // إعادة التمرير لأعلى الصفحة عند كل خطوة. مهم بشكل خاص على iOS Safari:
    // استبدال innerHTML لا يعيد ضبط موضع التمرير تلقائيًا هناك كما يحدث على
    // Android/Chrome، فيبقى المستخدم في منتصف الصفحة أو أسفلها بعد الانتقال
    resetScrollTop();

    const sections = activeSections();
    const total = sections.length + 1; // +1 لخطوة المراجعة
    const idx = App.current.step;

    // خطوة المراجعة الأخيرة
    if (idx >= sections.length) { renderReviewStep(total); return; }

    const section = sections[idx];
    const questions = App.questions.filter(q => (q.section || "dental") === section.key);
    const percent = Math.round(((idx + 1) / total) * 100);

    $("wizardProgressBar").style.width = percent + "%";
    $("wizardStepLabel").textContent = `${t("step")} ${idx + 1} ${t("of")} ${total}`;
    $("wizardPercent").textContent = percent + "%";

    $("wizardBody").innerHTML = `
        <h2 class="step-title"><i class="fa-solid ${section.icon}"></i> ${escapeHtml(sectionTitle(section))}</h2>
        ${questions.map((q, i) => renderQuestion(q, i + 1)).join("")}
    `;

    $("wizardBackBtn").textContent = idx === 0 ? t("backHome") : t("back");
    $("wizardNextBtn").innerHTML = `${t("next")} <i class="fa-solid fa-arrow-${LANG === "ar" ? "left" : "right"}"></i>`;

    restoreAnswers(questions);
}

// ======== رسم سؤال واحد حسب نوعه ========
function renderQuestion(q, num) {
    const id = "q_" + q.id;
    const opts = qOptions(q);
    let field = "";

    switch (q.type) {
        case "yesno":
            field = `
                <div class="opt-row">
                    <label class="opt"><input type="radio" name="${id}" value="Yes"> ${t("yes")}</label>
                    <label class="opt"><input type="radio" name="${id}" value="No"> ${t("no")}</label>
                </div>
                <input class="q-detail hidden" id="${id}_detail" placeholder="${t('detailsP')}">`;
            break;

        case "radio":
            field = `<div class="opt-col">${opts.map(o => `
                <label class="opt"><input type="radio" name="${id}" value="${escapeHtml(o)}"> ${escapeHtml(o)}</label>
            `).join("")}</div>`;
            break;

        case "multi":
            field = `<div class="opt-col">${opts.map(o => `
                <label class="opt"><input type="checkbox" name="${id}" value="${escapeHtml(o)}"> ${escapeHtml(o)}</label>
            `).join("")}</div>`;
            break;

        case "scale":
            field = `
                <div class="scale-row">
                    ${Array.from({ length: 11 }, (_, n) => `
                        <label class="scale-item">
                            <input type="radio" name="${id}" value="${n}">
                            <span>${n}</span>
                        </label>`).join("")}
                </div>
                <div class="scale-ends"><span>${escapeHtml(opts[0] || "")}</span><span>${escapeHtml(opts[1] || "")}</span></div>`;
            break;

        case "likert":
            field = `<div class="likert-row">${LIKERT.map(l => `
                <label class="likert-item">
                    <input type="radio" name="${id}" value="${l.v}">
                    <span><b>${l.v}</b>${escapeHtml(pick(l.en, l.ar))}</span>
                </label>`).join("")}</div>`;
            break;

        default: // text
            field = `<textarea id="${id}" rows="2" placeholder="${t('typeHere')}"></textarea>`;
    }

    return `
        <div class="q-card" data-qid="${escapeHtml(q.id)}" data-qtype="${escapeHtml(q.type || "text")}">
            <p class="q-text"><span class="q-num">${num}</span> ${escapeHtml(qText(q))}</p>
            ${field}
        </div>`;
}

// ======== جمع إجابات الخطوة الحالية ========
function collectStepAnswers() {
    document.querySelectorAll("#wizardBody .q-card").forEach(card => {
        const qid = card.dataset.qid;
        const type = card.dataset.qtype;
        const id = "q_" + qid;

        if (type === "text") {
            const el = $(id);
            App.current.answers[qid] = el ? el.value.trim() : "";
        } else if (type === "multi") {
            const picked = Array.from(card.querySelectorAll(`input[name="${id}"]:checked`)).map(c => c.value);
            App.current.answers[qid] = picked.join("، ");
        } else {
            const checked = card.querySelector(`input[name="${id}"]:checked`);
            let value = checked ? checked.value : "";
            // نضم تفاصيل "نعم" للإجابة حتى تصل للذكاء الاصطناعي كاملة
            if (type === "yesno" && value === "Yes") {
                const detail = $(id + "_detail");
                if (detail && detail.value.trim()) value += " - " + detail.value.trim();
            }
            App.current.answers[qid] = value;
        }
    });
}

// ======== استرجاع الإجابات عند التنقل بين الخطوات ========
function restoreAnswers(questions) {
    questions.forEach(q => {
        const saved = App.current.answers[q.id];
        if (!saved) return;
        const id = "q_" + q.id;

        if (q.type === "text") {
            const el = $(id);
            if (el) el.value = saved;
        } else if (q.type === "multi") {
            const values = saved.split("،").map(s => s.trim());
            document.querySelectorAll(`input[name="${id}"]`).forEach(cb => {
                cb.checked = values.includes(cb.value);
            });
        } else {
            let value = saved, detail = "";
            if (q.type === "yesno" && saved.startsWith("Yes - ")) {
                value = "Yes";
                detail = saved.slice(6);
            }
            const input = document.querySelector(`input[name="${id}"][value="${CSS.escape(value)}"]`);
            if (input) input.checked = true;
            if (detail) {
                const d = $(id + "_detail");
                if (d) { d.value = detail; show(d); }
            }
        }
    });

    // إظهار حقل التفاصيل تلقائيًا عند اختيار "نعم"
    document.querySelectorAll('#wizardBody .q-card[data-qtype="yesno"]').forEach(card => {
        const id = "q_" + card.dataset.qid;
        const detail = $(id + "_detail");
        if (!detail) return;
        card.querySelectorAll(`input[name="${id}"]`).forEach(radio => {
            radio.addEventListener("change", () => {
                if (radio.value === "Yes" && radio.checked) show(detail);
                else { hide(detail); detail.value = ""; }
            });
        });
    });
}

// ======== التنقل ========
function wizardNext() {
    collectStepAnswers();
    App.current.step++;
    renderStep();
}

function wizardBack() {
    if (App.current.step === 0) { goHome(); return; }
    collectStepAnswers();
    App.current.step--;
    renderStep();
}

// ======== خطوة المراجعة ========
function renderReviewStep(total) {
    $("wizardProgressBar").style.width = "100%";
    $("wizardStepLabel").textContent = `${t("step")} ${total} ${t("of")} ${total}`;
    $("wizardPercent").textContent = "100%";

    const p = App.current.patient;
    const sections = activeSections();

    const answered = Object.values(App.current.answers).filter(v => v && String(v).trim()).length;
    const totalQ = App.questions.length;

    $("wizardBody").innerHTML = `
        <h2 class="step-title"><i class="fa-solid fa-clipboard-check"></i> ${t("review")}</h2>

        <div class="review-patient">
            <b>${escapeHtml(p.fullName)}</b>
            <span>${t("age")}: ${escapeHtml(p.age)}${p.gender ? " • " + escapeHtml(p.gender) : ""}</span>
        </div>

        <div class="review-summary">
            <i class="fa-solid fa-circle-info"></i>
            ${t("answered")} <b>${answered}</b> ${t("outOf")} <b>${totalQ}</b> ${t("questionsW")}.
            ${answered < totalQ ? t("someLeft") : t("allDone")}
        </div>

        ${sections.map(s => {
            const qs = App.questions.filter(q => (q.section || "dental") === s.key);
            const done = qs.filter(q => App.current.answers[q.id] && String(App.current.answers[q.id]).trim()).length;
            return `
            <div class="review-row ${done === qs.length ? "review-done" : "review-partial"}">
                <i class="fa-solid ${done === qs.length ? "fa-circle-check" : "fa-circle-half-stroke"}"></i>
                <span>${escapeHtml(sectionTitle(s))}</span>
                <b>${done}/${qs.length}</b>
            </div>`;
        }).join("")}

        <div class="review-photo">
            <h3><i class="fa-solid fa-camera"></i> ${t("beforePhoto")}</h3>
            <p class="modal-note">${t("beforePhotoHint")}</p>
            <input type="file" id="rv_photo" accept="image/*" onchange="handleBeforePhotoPick()">
            <div id="rv_photoStatus" class="upload-status hidden"></div>
            <img id="rv_photoPreview" class="review-photo-preview hidden">
        </div>
    `;

    $("wizardBackBtn").textContent = t("back");
    $("wizardNextBtn").innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> ${t("saveAnalyze")}`;

    // إن كانت الصورة قد رُفعت مسبقًا (عودة من خطوة لاحقة)، نعرض معاينتها
    if (App.current.beforePhotoUrl) {
        const prev = $("rv_photoPreview");
        if (prev) { prev.src = App.current.beforePhotoUrl; show(prev); }
        const st = $("rv_photoStatus");
        if (st) { show(st); st.textContent = t("uploadDone"); st.classList.remove("upload-error"); }
    }
}

// ======== رفع صورة أسنان المريض قبل العلاج ========
async function handleBeforePhotoPick() {
    const input = $("rv_photo");
    const file = input && input.files && input.files[0];
    if (!file) return;

    const statusEl = $("rv_photoStatus");
    const preview = $("rv_photoPreview");
    show(statusEl);
    statusEl.classList.remove("upload-error");
    statusEl.textContent = t("uploading");
    hide(preview);

    try {
        const url = await uploadVideoFile(file); // الدالة عامة، تصلح لأي نوع ملف
        App.current.beforePhotoUrl = url;
        statusEl.textContent = t("uploadDone");
        preview.src = url;
        show(preview);
    } catch (err) {
        statusEl.textContent = err.message || t("saveFailed");
        statusEl.classList.add("upload-error");
    }
}


// إعادة ضبط التمرير لأعلى الصفحة بأكثر من طريقة معًا لضمان عملها على كل
// المتصفحات (iOS Safari تحديدًا لا يستجيب دائمًا لـ window.scrollTo وحدها)
function resetScrollTop() {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const page = document.querySelector("#wizardPage");
    if (page) page.scrollTop = 0;
}
