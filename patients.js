//==============================
// سجل المرضى والتقييمات السابقة + تذكير المتابعة
//==============================

let _patientFilterTab = "all";

function showPatients() {
    showPage("patientsPage");
    renderPatientsList();
}

// ======== حالة موعد المتابعة ========
// overdue: تجاوز الموعد | dueToday: اليوم | thisWeek: خلال أسبوع
// upcoming: بعيد | completed: أُنجزت المتابعة | none: لا موعد محدَّد
function followUpStatus(a) {
    if (String(a.followUpCompleted).toLowerCase() === "yes") return "completed";
    if (!a.followUpDate) return "none";
    const diff = daysBetween(today(), a.followUpDate);
    if (diff < 0) return "overdue";
    if (diff === 0) return "dueToday";
    if (diff <= 7) return "thisWeek";
    return "upcoming";
}

function followUpBadge(status) {
    const map = {
        overdue:  { icon: "🔴", cls: "fu-overdue" },
        dueToday: { icon: "🟡", cls: "fu-due" },
        thisWeek: { icon: "🟢", cls: "fu-week" },
        upcoming: { icon: "🔵", cls: "fu-upcoming" },
        completed:{ icon: "✅", cls: "fu-completed" },
    };
    const m = map[status];
    if (!m) return "";
    return `<span class="fu-badge ${m.cls}">${m.icon} ${t("fu_" + status)}</span>`;
}

function renderPatientsList(filter = "") {
    const term = filter.trim().toLowerCase();
    let list = App.assessments.filter(a => !term || String(a.patientName || "").toLowerCase().includes(term));

    if (_patientFilterTab === "due") {
        list = list.filter(a => ["dueToday", "thisWeek", "upcoming"].includes(followUpStatus(a)));
    } else if (_patientFilterTab === "overdue") {
        list = list.filter(a => followUpStatus(a) === "overdue");
    } else if (_patientFilterTab === "completed") {
        list = list.filter(a => followUpStatus(a) === "completed");
    }

    list = list.slice().sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    const body = $("patientsList");
    renderFilterTabs();

    if (App.assessments.length === 0) {
        body.innerHTML = `<p class="empty-note">${t("noRecords")}</p>`;
        return;
    }
    if (list.length === 0) {
        body.innerHTML = `<p class="empty-note">${t("noMatch")}</p>`;
        return;
    }

    body.innerHTML = list.map(a => {
        const level = a.riskLevel || "";
        const cls = riskClass(level);
        const owner = a.createdByName ? `<span class="pt-owner"><i class="fa-solid fa-user-doctor"></i> ${escapeHtml(a.createdByName)}</span>` : "";
        const canDelete = canEditRecord(a);
        const status = followUpStatus(a);
        return `
        <div class="pt-card">
            <div class="pt-card-click" onclick="viewAssessment('${escapeHtml(a.id)}')">
                <div class="pt-card-body">
                    <b>${escapeHtml(a.patientName || "-")}</b>
                    <span>${t("age")}: ${escapeHtml(a.age || "-")}${a.gender ? " • " + escapeHtml(a.gender) : ""}</span>
                    ${owner}
                    <span class="pt-date"><i class="fa-regular fa-clock"></i> ${escapeHtml(a.createdAt || "")}</span>
                    ${status !== "none" ? followUpBadge(status) : ""}
                </div>
                ${level
                    ? `<span class="pt-risk ${cls}">${escapeHtml(level)}</span>`
                    : `<span class="pt-risk pt-pending">${t("notAnalyzed")}</span>`}
                <i class="fa-solid fa-chevron-left pt-arrow"></i>
            </div>
            ${canDelete ? `<button class="pt-delete" onclick="event.stopPropagation(); deletePatientRecord('${escapeHtml(a.id)}')" aria-label="Delete"><i class="fa-solid fa-trash"></i></button>` : ""}
        </div>`;
    }).join("");
}

function renderFilterTabs() {
    const el = $("patientFilterTabs");
    if (!el) return;
    const tabs = [
        ["all", "fu_tabAll"], ["due", "fu_tabDue"], ["overdue", "fu_tabOverdue"], ["completed", "fu_tabCompleted"]
    ];
    el.innerHTML = tabs.map(([key, labelKey]) => `
        <button class="fu-tab ${_patientFilterTab === key ? "fu-tab-active" : ""}" onclick="setPatientFilterTab('${key}')">
            ${t(labelKey)}
        </button>`).join("");
}

// ======== صفحة التذكيرات المستقلة: كل مواعيد المتابعة مرتّبة حسب الأقرب ========
let _reminderFilterTab = "all";

function showReminders() {
    showPage("remindersPage");
    renderRemindersList();
}

function setReminderFilterTab(tab) {
    _reminderFilterTab = tab;
    renderRemindersList();
}

// عدد المواعيد الفعّالة (غير المنجزة) لعرضها كشارة على بطاقة الرئيسية
function activeReminderCount() {
    return App.assessments.filter(a => a.followUpDate &&
        ["overdue", "dueToday", "thisWeek"].includes(followUpStatus(a))).length;
}

function renderReminderTabs() {
    const el = $("reminderFilterTabs");
    if (!el) return;
    const tabs = [
        ["all", "fu_tabAll"], ["overdue", "fu_overdue"], ["dueToday", "fu_dueToday"],
        ["thisWeek", "fu_thisWeek"], ["upcoming", "fu_upcoming"], ["completed", "fu_tabCompleted"]
    ];
    el.innerHTML = tabs.map(([key, labelKey]) => `
        <button class="fu-tab ${_reminderFilterTab === key ? "fu-tab-active" : ""}" onclick="setReminderFilterTab('${key}')">
            ${t(labelKey)}
        </button>`).join("");
}

function renderRemindersList() {
    // فقط السجلات التي فيها موعد متابعة محدَّد أصلاً
    let list = App.assessments.filter(a => a.followUpDate);

    if (_reminderFilterTab === "all") {
        list = list.filter(a => followUpStatus(a) !== "completed");
    } else {
        list = list.filter(a => followUpStatus(a) === _reminderFilterTab);
    }

    // ترتيب حسب الأقرب: الأقدم/الأكثر تأخرًا أولاً، ثم الأقرب فالأقرب زمنيًا
    list = list.slice().sort((a, b) => String(a.followUpDate || "").localeCompare(String(b.followUpDate || "")));

    renderReminderTabs();

    const body = $("remindersList");
    if (list.length === 0) {
        body.innerHTML = `<p class="empty-note">${t("noReminders")}</p>`;
        return;
    }

    body.innerHTML = list.map(a => {
        const status = followUpStatus(a);
        const owner = a.createdByName ? `<span class="pt-owner"><i class="fa-solid fa-user-doctor"></i> ${escapeHtml(a.createdByName)}</span>` : "";
        return `
        <div class="pt-card">
            <div class="pt-card-click" onclick="viewAssessment('${escapeHtml(a.id)}')">
                <div class="pt-card-body">
                    <b>${escapeHtml(a.patientName || "-")}</b>
                    <span>${t("age")}: ${escapeHtml(a.age || "-")}${a.gender ? " • " + escapeHtml(a.gender) : ""}</span>
                    ${owner}
                    <span class="pt-date"><i class="fa-regular fa-calendar"></i> ${t("scheduledDate")}: ${escapeHtml(a.followUpDate)}</span>
                    ${followUpBadge(status)}
                </div>
                <i class="fa-solid fa-chevron-left pt-arrow"></i>
            </div>
        </div>`;
    }).join("");
}

function setPatientFilterTab(tab) {
    _patientFilterTab = tab;
    renderPatientsList($("ptSearch") ? $("ptSearch").value : "");
}

// ======== فتح تقييم محفوظ ========
function viewAssessment(id) {
    const a = App.assessments.find(x => String(x.id) === String(id));
    if (!a) return;

    if (!a.riskLevel || String(a.analyzed).toLowerCase() === "no") {
        showResultsUnanalyzed(a, null);
        return;
    }

    let instructions = [], barriers = [], answers = {}, aiReasoning = [];
    try { instructions = JSON.parse(a.instructions || "[]"); } catch (e) {}
    try { barriers = JSON.parse(a.barriers || "[]"); } catch (e) {}
    try { answers = JSON.parse(a.answers || "{}"); } catch (e) {}
    try { aiReasoning = JSON.parse(a.aiReasoning || "[]"); } catch (e) {}

    const videoIds = String(a.videoIds || "").split(",").map(s => s.trim()).filter(Boolean);
    const videoIndexes = videoIds
        .map(vid => App.videos.findIndex(v => String(v.id) === String(vid)))
        .filter(i => i !== -1);

    App.current = {
        patient: { fullName: a.patientName, age: a.age, gender: a.gender },
        answers,
        record: a,
        result: {
            riskLevel: a.riskLevel || "",
            riskReason: a.riskReason || "",
            topProblems: String(a.topProblems || "").split("|").map(s => s.trim()).filter(Boolean),
            instructions,
            goals: String(a.goals || "").split("|").map(s => s.trim()).filter(Boolean),
            barriers,
            motivation: a.motivation || "",
            videoIndexes,
            videoReason: "",
            aiReasoning
        }
    };

    renderResults(App.current.result);
}

// ======== حذف مريض ========
async function deletePatientRecord(id) {
    const rec = App.assessments.find(x => String(x.id) === String(id));
    if (!rec) return;
    if (!canEditRecord(rec)) { showToast(t("notOwner"), "error"); return; }

    showConfirm(t("deletePatient"), `${t("deletePatientMsg")} <b>${escapeHtml(rec.patientName || "")}</b>؟`, async () => {
        try {
            await deleteRow(CONFIG.TABLES.assessments, rec.id);
            App.assessments = App.assessments.filter(x => String(x.id) !== String(id));
            showToast(t("deleted"));
            goHome();
            showPatients();
        } catch (err) {
            console.error(err);
            showToast(err.message || t("saveFailed"), "error");
        }
    });
}

// ======== بدء تقييم متابعة لنفس المريض ========
// يملأ بيانات المريض تلقائيًا، ويؤشّر السجل الأصلي كمُنجَز عند البدء
async function startFollowUp(recordId) {
    const rec = App.assessments.find(x => String(x.id) === String(recordId));
    if (!rec) return;

    try {
        await updateRow(CONFIG.TABLES.assessments, rec.id, { followUpCompleted: "yes" });
        rec.followUpCompleted = "yes";
    } catch (err) {
        console.error("تعذر تحديث حالة المتابعة:", err);
    }

    App.current = { patient: {}, answers: {}, step: 0 };
    showPage("patientInfoPage");
    $("pi_name").value = rec.patientName || "";
    $("pi_age").value = rec.age || "";
    $("pi_gender").value = rec.gender || "";
}
