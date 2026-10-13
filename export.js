//==============================
// تصدير كل المرضى وإجاباتهم إلى ملف إكسل حقيقي (.xlsx)
//==============================
// نستخدم مكتبة SheetJS (XLSX) المحمّلة في index.html لبناء ملف Excel
// ثنائي حقيقي بثلاث ورقات عمل — هذا يفتح بثبات في Excel وGoogle Sheets
// وWPS وكل تطبيقات الجوال، بخلاف صيغة SpreadsheetML/XML القديمة التي
// رفضت تطبيقات Office الحديثة على الجوال فتحها.

async function exportAllToExcel() {
    if (!App.assessments || App.assessments.length === 0) {
        showToast(t("noRecords"), "error");
        return;
    }
    if (typeof XLSX === "undefined") {
        showInfoModal(t("saveFailed"), `<p>${LANG === "ar"
            ? "تعذّر تحميل مكتبة Excel، تأكد من اتصالك بالإنترنت وأعد المحاولة."
            : "Could not load the Excel library, check your connection and try again."}</p>`);
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
            sheet2: ar ? "التعليمات والأهداف" : "Instructions & Goals",
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

        // كل ورقة مبنية كمصفوفة صفوف (أول صف = العناوين)
        const sheet1 = [[L.patient, L.age, L.sex, L.date, L.risk, L.probs, L.vids, L.followUp, L.motiv]];
        const sheet2 = [[L.patient, L.type, L.content, L.howTo, L.when]];
        const sheet3 = [[L.patient, L.section, L.q, L.a]];

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
            const name = rec.patientName || "-";

            // ===== ورقة 1: ملخص المرضى =====
            sheet1.push([name, rec.age || "-", rec.gender || "-", rec.createdAt || "-",
                rec.riskLevel || L.notAn, probsJoined, vids, rec.followUpDate || "", rec.motivationalMessage || ""]);

            // ===== ورقة 2: التعليمات/الأدوات/الأهداف/العوائق =====
            ins.forEach(i => sheet2.push([name, L.typeIns, i.instruction_arabic || "", i.how_to_do_it_arabic || "", i.when || ""]));
            aids.forEach(a => sheet2.push([name, L.typeAid, a.aid || "", a.how_to_use_arabic || "", a.frequency || ""]));
            goals.forEach(g => sheet2.push([name, L.typeGoal, g.goal_arabic || "", "", g.time_frame || ""]));
            barr.forEach(b => sheet2.push([name, L.typeBarrier, b.barrier || "", b.solution_arabic || "", ""]));

            // ===== ورقة 3: إجابات الاستبيان، مرتبة حسب الأقسام =====
            SECTIONS.forEach(sec => {
                const qs = App.questions.filter(q => (q.section || "dental") === sec.key);
                qs.forEach(q => {
                    if (!answers[q.id] || !String(answers[q.id]).trim()) return;
                    sheet3.push([name, sectionTitle(sec), pick(q.question, q.questionAr), answers[q.id]]);
                });
            });
        });

        const wb = XLSX.utils.book_new();
        if (ar) wb.Workbook = { Views: [{ RTL: true }] };

        const addSheet = (name, rows, colWidths) => {
            const ws = XLSX.utils.aoa_to_sheet(rows);
            ws["!cols"] = colWidths.map(w => ({ wch: w }));
            ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: rows[0].length - 1 } }) };
            XLSX.utils.book_append_sheet(wb, ws, name);
        };

        addSheet(L.sheet1, sheet1, [20, 7, 9, 14, 13, 45, 30, 14, 45]);
        addSheet(L.sheet2, sheet2, [20, 14, 40, 40, 18]);
        addSheet(L.sheet3, sheet3, [20, 20, 45, 30]);

        const filename = "patients-record-" + today() + ".xlsx";
        XLSX.writeFile(wb, filename);

        showToast(ar ? `تم تصدير ${sorted.length} تقييمًا` : `Exported ${sorted.length} assessments`);
        hideLoading();
    } catch (err) {
        hideLoading();
        console.error(err);
        showInfoModal(t("saveFailed"), `<p>${escapeHtml(err.message || "")}</p>`);
    }
}

//==============================
// تصدير إجابات الاستبيان فقط (كل مريض، كل سؤال، كل جواب) — ملف إكسل منفصل
//==============================
async function exportAnswersToExcel() {
    if (!App.assessments || App.assessments.length === 0) {
        showToast(t("noRecords"), "error");
        return;
    }
    if (typeof XLSX === "undefined") {
        showInfoModal(t("saveFailed"), `<p>${LANG === "ar"
            ? "تعذّر تحميل مكتبة Excel، تأكد من اتصالك بالإنترنت وأعد المحاولة."
            : "Could not load the Excel library, check your connection and try again."}</p>`);
        return;
    }

    showLoading(t("loading"));

    try {
        if (!App.questions || App.questions.length === 0) {
            App.questions = await readSheetWithRetry(CONFIG.TABLES.questions);
            App.questions.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
        }

        const ar = LANG === "ar";
        const sorted = [...App.assessments].sort((a, b) =>
            String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

        const L = {
            sheet: ar ? "إجابات الاستبيان" : "Questionnaire Answers",
            patient: ar ? "المريض" : "Patient",
            age: ar ? "العمر" : "Age",
            sex: ar ? "الجنس" : "Sex",
            date: ar ? "تاريخ التقييم" : "Assessment date",
            section: ar ? "القسم" : "Section",
            q: ar ? "السؤال" : "Question",
            a: ar ? "الإجابة" : "Answer"
        };

        const rows = [[L.patient, L.age, L.sex, L.date, L.section, L.q, L.a]];

        sorted.forEach(rec => {
            let answers = {};
            try { answers = JSON.parse(rec.answers || "{}"); } catch (e) {}
            const name = rec.patientName || "-";

            SECTIONS.forEach(sec => {
                const qs = App.questions.filter(q => (q.section || "dental") === sec.key);
                qs.forEach(q => {
                    if (!answers[q.id] || !String(answers[q.id]).trim()) return;
                    rows.push([name, rec.age || "-", rec.gender || "-", rec.createdAt || "-",
                        sectionTitle(sec), pick(q.question, q.questionAr), answers[q.id]]);
                });
            });
        });

        const wb = XLSX.utils.book_new();
        if (ar) wb.Workbook = { Views: [{ RTL: true }] };

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws["!cols"] = [20, 7, 9, 14, 20, 45, 30].map(w => ({ wch: w }));
        ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: rows[0].length - 1 } }) };
        XLSX.utils.book_append_sheet(wb, ws, L.sheet);

        const filename = "patients-answers-" + today() + ".xlsx";
        XLSX.writeFile(wb, filename);

        showToast(ar ? `تم تصدير إجابات ${sorted.length} مريضًا` : `Exported answers for ${sorted.length} patients`);
        hideLoading();
    } catch (err) {
        hideLoading();
        console.error(err);
        showInfoModal(t("saveFailed"), `<p>${escapeHtml(err.message || "")}</p>`);
    }
}
