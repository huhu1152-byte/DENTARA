//==============================
// تصدير كل المرضى وإجاباتهم إلى ملف Word
//==============================
// نبني مستند HTML بترويسة Word: يفتحه Word و Google Docs بشكل سليم،
// ولا يحتاج أي مكتبة خارجية.

async function exportAllToWord() {
    if (!App.assessments || App.assessments.length === 0) {
        showToast(t("noRecords"), "error");
        return;
    }

    showLoading(t("loading"));

    try {
        // نضمن توفّر الأسئلة لعرض نص كل سؤال مقابل إجابته
        if (!App.questions || App.questions.length === 0) {
            App.questions = await readSheetWithRetry(CONFIG.TABLES.questions);
            App.questions.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
        }

        const ar = LANG === "ar";
        const P = CONFIG.PROJECT;
        const sorted = [...App.assessments].sort((a, b) =>
            String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

        const L = {
            title:   ar ? "سجل المرضى والتقييمات" : "Patients & Assessments Record",
            gen:     ar ? "تاريخ التصدير" : "Exported on",
            count:   ar ? "عدد التقييمات" : "Total assessments",
            patient: ar ? "المريض" : "Patient",
            age:     ar ? "العمر" : "Age",
            sex:     ar ? "الجنس" : "Sex",
            date:    ar ? "تاريخ التقييم" : "Assessment date",
            risk:    ar ? "مستوى الخطورة" : "Risk level",
            probs:   ar ? "أهم المشاكل" : "Top problems",
            ins:     ar ? "التعليمات الشخصية" : "Personalized instructions",
            goals:   ar ? "الأهداف" : "Goals",
            barr:    ar ? "العوائق وحلولها" : "Barriers & solutions",
            motiv:   ar ? "الرسالة التحفيزية" : "Motivational message",
            vids:    ar ? "الفيديوهات المرشّحة" : "Recommended videos",
            answers: ar ? "إجابات الاستبيان" : "Questionnaire answers",
            q:       ar ? "السؤال" : "Question",
            a:       ar ? "الإجابة" : "Answer",
            none:    ar ? "لا يوجد" : "None",
            notAn:   ar ? "لم يُحلَّل بعد" : "Not analyzed yet"
        };

        const esc = escapeHtml;
        let body = `
        <h1>${esc(L.title)}</h1>
        <p class="sub">${esc(pick(P.universityEn, P.university))} — ${esc(pick(P.collegeEn, P.college))}</p>
        <p class="meta">${esc(L.gen)}: ${esc(nowStamp())} &nbsp;|&nbsp; ${esc(L.count)}: ${sorted.length}</p>
        <hr>`;

        sorted.forEach((rec, idx) => {
            let ins = [], barr = [], answers = {};
            try { ins = JSON.parse(rec.instructions || "[]"); } catch (e) {}
            try { barr = JSON.parse(rec.barriers || "[]"); } catch (e) {}
            try { answers = JSON.parse(rec.answers || "{}"); } catch (e) {}

            const probs = String(rec.topProblems || "").split("|").map(x => x.trim()).filter(Boolean);
            const goals = String(rec.goals || "").split("|").map(x => x.trim()).filter(Boolean);
            const vids = String(rec.videoIds || "").split(",").map(x => x.trim()).filter(Boolean)
                .map(id => (App.videos || []).find(v => String(v.id) === String(id)))
                .filter(Boolean).map(v => v.title || "");

            // صفوف الإجابات مرتبة حسب أقسام الاستبيان
            let answerRows = "";
            SECTIONS.forEach(sec => {
                const qs = App.questions.filter(q => (q.section || "dental") === sec.key);
                const answered = qs.filter(q => answers[q.id] && String(answers[q.id]).trim());
                if (answered.length === 0) return;
                answerRows += `<tr><td colspan="2" class="sec">${esc(sectionTitle(sec))}</td></tr>`;
                answered.forEach(q => {
                    answerRows += `<tr><td class="qc">${esc(pick(q.question, q.questionAr))}</td>
                                       <td>${esc(answers[q.id])}</td></tr>`;
                });
            });

            body += `
            <div class="rec">
                <h2>${idx + 1}. ${esc(rec.patientName || "-")}</h2>
                <table class="info">
                    <tr><th>${esc(L.age)}</th><td>${esc(rec.age || "-")}</td>
                        <th>${esc(L.sex)}</th><td>${esc(rec.gender || "-")}</td></tr>
                    <tr><th>${esc(L.date)}</th><td>${esc(rec.createdAt || "-")}</td>
                        <th>${esc(L.risk)}</th><td>${esc(rec.riskLevel || L.notAn)}</td></tr>
                </table>

                ${probs.length ? `<h3>${esc(L.probs)}</h3><ol>${probs.map(x => `<li>${esc(x)}</li>`).join("")}</ol>` : ""}

                ${ins.length ? `<h3>${esc(L.ins)}</h3><ol>${ins.map(i =>
                    `<li><b>${esc(i.title || "")}</b> — ${esc(i.detail || "")}${
                        (i.times || []).length ? ` <i>(${esc((i.times || []).join(", "))})</i>` : ""}</li>`).join("")}</ol>` : ""}

                ${goals.length ? `<h3>${esc(L.goals)}</h3><ul>${goals.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}

                ${barr.length ? `<h3>${esc(L.barr)}</h3><ul>${barr.map(b =>
                    `<li><b>${esc(b.barrier || "")}</b> → ${esc(b.solution || "")}</li>`).join("")}</ul>` : ""}

                ${rec.motivation ? `<h3>${esc(L.motiv)}</h3><p>${esc(rec.motivation)}</p>` : ""}

                ${vids.length ? `<h3>${esc(L.vids)}</h3><ul>${vids.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}

                <h3>${esc(L.answers)}</h3>
                ${answerRows
                    ? `<table class="ans"><tr><th>${esc(L.q)}</th><th>${esc(L.a)}</th></tr>${answerRows}</table>`
                    : `<p>${esc(L.none)}</p>`}
            </div>
            <br clear="all" style="page-break-before:always">`;
        });

        const dir = ar ? "rtl" : "ltr";
        const align = ar ? "right" : "left";
        const doc = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8">
<title>${esc(L.title)}</title>
<style>
  @page { size: A4; margin: 2cm; }
  body { font-family: Arial, sans-serif; font-size: 11pt; direction: ${dir}; text-align: ${align}; }
  h1 { color:#12294A; font-size:19pt; text-align:center; margin:0 0 4pt; }
  h2 { color:#1565C0; font-size:14pt; border-bottom:1.5pt solid #1565C0; padding-bottom:3pt; margin:14pt 0 8pt; }
  h3 { color:#10808A; font-size:11.5pt; margin:10pt 0 4pt; }
  p.sub { text-align:center; color:#1565C0; font-size:11pt; margin:0 0 3pt; }
  p.meta { text-align:center; color:#666; font-size:9.5pt; margin:0 0 10pt; }
  hr { border:none; border-top:1.5pt solid #10808A; margin-bottom:12pt; }
  table { border-collapse:collapse; width:100%; margin:5pt 0 8pt; }
  td, th { border:0.75pt solid #B9C6D4; padding:4pt 6pt; font-size:10pt; text-align:${align}; vertical-align:top; }
  th { background:#EAF3FC; color:#12294A; }
  table.info th { width:14%; } table.info td { width:36%; }
  table.ans td.qc { width:52%; color:#33414F; }
  td.sec { background:#12294A; color:#fff; font-weight:bold; font-size:10pt; }
  ol, ul { margin:3pt 0 6pt; padding-${ar ? "right" : "left"}:18pt; }
  li { margin-bottom:3pt; font-size:10.5pt; }
</style></head><body>${body}</body></html>`;

        const blob = new Blob(["\ufeff", doc], { type: "application/msword" });
        const url = URL.createObjectURL(blob);
        const filename = "patients-record-" + today() + ".doc";

        // iOS Safari يتجاهل خاصية download على روابط Blob تمامًا (يفتح الرابط
        // عاديًا أو لا يفعل شيئًا)، فلا طريقة موثوقة لتنزيل الملف تلقائيًا هناك.
        // الحل المعتمد: فتح الملف في تبويب جديد، فيعرضه Safari مع زر المشاركة
        // الذي يتيح "حفظ في الملفات" يدويًا — هذا يعمل بثبات على كل إصدارات iOS
        const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) ||
            (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); // آيباد الحديث يُعرِّف نفسه كـ Mac

        if (isIOS) {
            window.open(url, "_blank");
            showInfoModal(t("exportedTitle"), `<p>${t("exportedIOSHint")}</p>`);
        } else {
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showToast(ar ? `تم تصدير ${sorted.length} تقييمًا` : `Exported ${sorted.length} assessments`);
        }
        setTimeout(() => URL.revokeObjectURL(url), 20000);

        hideLoading();
    } catch (err) {
        hideLoading();
        console.error(err);
        // نافذة معلومات ثابتة بدل توست عابر: إن فشل التصدير لسبب غير متوقع
        // (مثل حظر المتصفح للتنزيل)، تبقى الرسالة ظاهرة حتى يقرأها المستخدم
        showInfoModal(t("saveFailed"), `<p>${escapeHtml(err.message || "")}</p>`);
    }
}
