//==============================
// تصدير كل المرضى وإجاباتهم إلى ملف إكسل
//==============================
// نبني ملف SpreadsheetML (صيغة Excel XML الأصلية) يفتحه Excel مباشرة
// بثلاث ورقات عمل، بدون أي مكتبة خارجية ونفس أسلوب تصدير Word السابق.

// تهرّب نص لاستخدامه داخل XML (نفس محارف HTML الخاصة: & < > " ')
function escXml(s) {
    return escapeHtml(s == null ? "" : String(s));
}

function xlCell(value, type) {
    const v = (value === null || value === undefined) ? "" : String(value);
    return `<Cell><Data ss:Type="${type || "String"}">${escXml(v)}</Data></Cell>`;
}

function xlHeaderCell(value) {
    return `<Cell ss:StyleID="Header"><Data ss:Type="String">${escXml(value)}</Data></Cell>`;
}

function xlRow(cells) {
    return `<Row>${cells.join("")}</Row>`;
}

function xlSheet(name, rows, rtl) {
    return `
 <Worksheet ss:Name="${escXml(name)}">
  ${rtl ? `<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><RightToLeft/></WorksheetOptions>` : ""}
  <Table>
   ${rows.join("\n   ")}
  </Table>
 </Worksheet>`;
}

async function exportAllToExcel() {
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
        const sorted = [...App.assessments].sort((a, b) =>
            String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

        const L = {
            sheet1: ar ? "ملخص المرضى" : "Patients Summary",
            sheet2: ar ? "التعليمات والأهداف والعوائق" : "Instructions, Goals & Barriers",
            sheet3: ar ? "إجابات الاستبيان" : "Questionnaire Answers",
            patient: ar ? "المريض" : "Patient",
            age: ar ? "العمر" : "Age",
            sex: ar ? "الجنس" : "Sex",
            date: ar ? "تاريخ التقييم" : "Assessment date",
            risk: ar ? "مستوى الخطورة" : "Risk level",
            probs: ar ? "أهم المشاكل" : "Top problems",
            followUp: ar ? "موعد المتابعة" : "Follow-up date",
            motiv: ar ? "الرسالة التحفيزية" : "Motivational message",
            vids: ar ? "الفيديوهات المرشّحة" : "Recommended videos",
            type: ar ? "النوع" : "Type",
            content: ar ? "التفصيل" : "Content",
            howTo: ar ? "طريقة التنفيذ" : "How-to",
            when: ar ? "الوقت" : "When",
            section: ar ? "القسم" : "Section",
            q: ar ? "السؤال" : "Question",
            a: ar ? "الإجابة" : "Answer",
            typeIns: ar ? "تعليمة" : "Instruction",
            typeAid: ar ? "أداة نظافة" : "Hygiene aid",
            typeGoal: ar ? "هدف" : "Goal",
            typeBarrier: ar ? "عائق / حل" : "Barrier / solution",
            notAn: ar ? "لم يُحلَّل بعد" : "Not analyzed yet"
        };

        // ===== ورقة 1: ملخص المرضى =====
        const sheet1Rows = [xlRow([
            xlHeaderCell(L.patient), xlHeaderCell(L.age), xlHeaderCell(L.sex),
            xlHeaderCell(L.date), xlHeaderCell(L.risk), xlHeaderCell(L.probs),
            xlHeaderCell(L.vids), xlHeaderCell(L.followUp), xlHeaderCell(L.motiv)
        ])];

        // ===== ورقة 2: التعليمات/الأهداف/العوائق (شكل طويل) =====
        const sheet2Rows = [xlRow([
            xlHeaderCell(L.patient), xlHeaderCell(L.type), xlHeaderCell(L.content),
            xlHeaderCell(L.howTo), xlHeaderCell(L.when)
        ])];

        // ===== ورقة 3: إجابات الاستبيان (شكل طويل) =====
        const sheet3Rows = [xlRow([
            xlHeaderCell(L.patient), xlHeaderCell(L.section), xlHeaderCell(L.q), xlHeaderCell(L.a)
        ])];

        sorted.forEach(rec => {
            let ins = [], aids = [], goals = [], barr = [], probs = [], recommendedVideos = [], answers = {};
            try { ins = JSON.parse(rec.personalizedInstructions || "[]"); } catch (e) {}
            try { aids = JSON.parse(rec.oralHygieneAids || "[]"); } catch (e) {}
            try { goals = JSON.parse(rec.smartGoals || "[]"); } catch (e) {}
            try { barr = JSON.parse(rec.barriersSolutions || "[]"); } catch (e) {}
            try { probs = JSON.parse(rec.priorityProblems || "[]"); } catch (e) {}
            try { recommendedVideos = JSON.parse(rec.recommendedVideos || "[]"); } catch (e) {}
            try { answers = JSON.parse(rec.answers || "{}"); } catch (e) {}

            const vids = recommendedVideos
                .map(rv => (App.videos || []).find(v => String(v.id) === String(rv.video_id)))
                .filter(Boolean).map(v => v.title || "").join("، ");
            const probsJoined = probs.map(p => p.problem).filter(Boolean).join("، ");

            // صف 1: الملخص
            sheet1Rows.push(xlRow([
                xlCell(rec.patientName || "-"), xlCell(rec.age || "-"), xlCell(rec.gender || "-"),
                xlCell(rec.createdAt || "-"), xlCell(rec.riskLevel || L.notAn), xlCell(probsJoined),
                xlCell(vids), xlCell(rec.followUpDate || ""), xlCell(rec.motivationalMessage || "")
            ]));

            // صف 2: التعليمات/الأدوات/الأهداف/العوائق
            ins.forEach(i => sheet2Rows.push(xlRow([
                xlCell(rec.patientName || "-"), xlCell(L.typeIns),
                xlCell(i.instruction_arabic || ""), xlCell(i.how_to_do_it_arabic || ""), xlCell(i.when || "")
            ])));
            aids.forEach(a => sheet2Rows.push(xlRow([
                xlCell(rec.patientName || "-"), xlCell(L.typeAid),
                xlCell(a.aid || ""), xlCell(a.how_to_use_arabic || ""), xlCell(a.frequency || "")
            ])));
            goals.forEach(g => sheet2Rows.push(xlRow([
                xlCell(rec.patientName || "-"), xlCell(L.typeGoal),
                xlCell(g.goal_arabic || ""), xlCell(""), xlCell(g.time_frame || "")
            ])));
            barr.forEach(b => sheet2Rows.push(xlRow([
                xlCell(rec.patientName || "-"), xlCell(L.typeBarrier),
                xlCell(b.barrier || ""), xlCell(b.solution_arabic || ""), xlCell("")
            ])));

            // صف 3: إجابات الاستبيان، مرتبة حسب الأقسام
            SECTIONS.forEach(sec => {
                const qs = App.questions.filter(q => (q.section || "dental") === sec.key);
                qs.forEach(q => {
                    if (!answers[q.id] || !String(answers[q.id]).trim()) return;
                    sheet3Rows.push(xlRow([
                        xlCell(rec.patientName || "-"), xlCell(sectionTitle(sec)),
                        xlCell(pick(q.question, q.questionAr)), xlCell(answers[q.id])
                    ]));
                });
            });
        });

        const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#12294A"/>
   <Interior ss:Color="#EAF3FC" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 ${xlSheet(L.sheet1, sheet1Rows, ar)}
 ${xlSheet(L.sheet2, sheet2Rows, ar)}
 ${xlSheet(L.sheet3, sheet3Rows, ar)}
</Workbook>`;

        const blob = new Blob(["﻿", workbook], { type: "application/vnd.ms-excel" });
        const url = URL.createObjectURL(blob);
        const filename = "patients-record-" + today() + ".xls";

        // نفس قيود iOS Safari الموجودة في تصدير Word: روابط Blob مع download
        // تُتجاهَل تمامًا، فنفتح الملف في تبويب جديد مع تلميح للحفظ اليدوي
        const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) ||
            (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

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
        showInfoModal(t("saveFailed"), `<p>${escapeHtml(err.message || "")}</p>`);
    }
}
