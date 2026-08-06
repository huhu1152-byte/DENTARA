//==============================
// لوحة المدير: عرض وإدارة كل حسابات الأطباء (للمدير فقط)
//==============================
// ملاحظة أمان مقصودة: لا تُخزَّن كلمات المرور أبدًا كنص صريح، بل كبصمة
// SHA-256 غير قابلة للعكس — فلا يستطيع حتى المدير رؤية كلمة مرور أي طبيب،
// لكنه يستطيع "إعادة تعيينها" بكلمة جديدة دون معرفة القديمة، وهذا يحقق
// نفس الهدف العملي (استرجاع الوصول) دون تخزين أسرار قابلة للقراءة.

async function showAdminPanel() {
    if (!isAdmin()) return;
    showPage("adminPage");
    $("adminBody").innerHTML = `<div class="pv-loading"><div class="spinner"></div></div>`;

    try {
        const doctors = await readSheetWithRetry(CONFIG.TABLES.doctors);
        App.doctors = doctors;
        renderDoctorsList(doctors);
    } catch (err) {
        $("adminBody").innerHTML = `<p class="empty-note">${escapeHtml(err.message || "")}</p>`;
    }
}

function renderDoctorsList(doctors) {
    if (!doctors || doctors.length === 0) {
        $("adminBody").innerHTML = `<p class="empty-note">${t("noDoctors")}</p>`;
        return;
    }
    const sorted = [...doctors].sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
    $("adminBody").innerHTML = sorted.map(d => {
        const isMe = App.currentDoctor && String(d.id) === String(App.currentDoctor.id);
        return `
        <div class="q-item">
            <div class="q-item-body">
                <b>${escapeHtml(d.name || "-")} ${d.role === "admin" ? `<span class="admin-badge">${t("admin")}</span>` : ""}${isMe ? ` <span class="me-badge">${t("you")}</span>` : ""}</b>
                <span dir="ltr" style="unicode-bidi:plaintext;">@${escapeHtml(d.username || "")}</span>
                <span>${t("joined")}: ${escapeHtml(d.createdAt || "-")}</span>
            </div>
            <div class="q-item-actions admin-actions">
                <button class="mini-btn" onclick="openResetPassword('${escapeHtml(d.id)}')" aria-label="Reset password"><i class="fa-solid fa-key"></i></button>
                <button class="mini-btn" onclick="toggleDoctorRole('${escapeHtml(d.id)}')" aria-label="Toggle role"><i class="fa-solid fa-user-shield"></i></button>
                ${!isMe ? `<button class="mini-btn danger" onclick="deleteDoctorAccount('${escapeHtml(d.id)}')" aria-label="Delete"><i class="fa-solid fa-trash"></i></button>` : ""}
            </div>
        </div>`;
    }).join("");
}

// ======== إعادة تعيين كلمة مرور طبيب (بلا حاجة لمعرفة القديمة) ========
function openResetPassword(id) {
    const d = (App.doctors || []).find(x => String(x.id) === String(id));
    if (!d) return;
    openModal(t("resetPasswordTitle"), `
        <p class="modal-note">${t("resetPasswordFor")} <b>${escapeHtml(d.name)}</b></p>
        <div class="form-group"><label data-t="password"></label>
            <input id="rp_password" type="password" dir="ltr" autocomplete="new-password"></div>
    `, async () => {
        const pw = $("rp_password").value;
        if (!pw || pw.length < 4) { showToast(t("passwordShort"), "error"); return; }
        await updateRow(CONFIG.TABLES.doctors, d.id, { passwordHash: sha256Local(pw) });
        closeModal();
        showToast(t("passwordReset"));
    }, t("resetPasswordBtn"));
    applyStaticStrings();
}

// ======== ترقية/تخفيض صلاحية طبيب ========
function toggleDoctorRole(id) {
    const d = (App.doctors || []).find(x => String(x.id) === String(id));
    if (!d) return;
    const makeAdmin = d.role !== "admin";
    const msg = makeAdmin ? t("makeAdminMsg") : t("removeAdminMsg");
    showConfirm(t("changeRole"), `${msg} <b>${escapeHtml(d.name)}</b>؟`, async () => {
        const newRole = makeAdmin ? "admin" : "doctor";
        await updateRow(CONFIG.TABLES.doctors, d.id, { role: newRole });
        d.role = newRole;
        renderDoctorsList(App.doctors);
        showToast(t("updated"));
    });
}

// ======== حذف حساب طبيب ========
function deleteDoctorAccount(id) {
    const d = (App.doctors || []).find(x => String(x.id) === String(id));
    if (!d) return;
    showConfirm(t("deleteDoctorTitle"), `${t("deleteDoctorMsg")} <b>${escapeHtml(d.name)}</b>؟`, async () => {
        await deleteRow(CONFIG.TABLES.doctors, d.id);
        App.doctors = App.doctors.filter(x => String(x.id) !== String(id));
        renderDoctorsList(App.doctors);
        showToast(t("deleted"));
    });
}
