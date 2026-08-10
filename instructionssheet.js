//==============================
// ورقة التعليمات المختصرة — صفحة واحدة فقط تُطبع وتُضاف لدفتر الالتزام
// الأسبوعي الجاهز مسبقًا (لا تحل محله، هي ورقة إضافية مرفقة معه)
//==============================

// اختيار أيقونة مناسبة لعنوان التعليمة بمطابقة كلمات مفتاحية بسيطة
function instructionIcon(title) {
    const s = String(title || "").toLowerCase();
    if (/فرشاة|تفريش|فرك|brush/.test(s)) return "fa-tooth";
    if (/خيط|floss/.test(s)) return "fa-hand-dots";
    if (/غسول|مضمضة|rinse|mouthwash/.test(s)) return "fa-glass-water";
    if (/لسان|tongue/.test(s)) return "fa-tooth";
    if (/طبيب|مراجعة|زيارة|visit|dentist/.test(s)) return "fa-calendar-check";
    if (/سكر|حلويات|غذاء|sugar|diet/.test(s)) return "fa-utensils";
    return "fa-circle-check";
}

function instructionsSheetStrings() {
    const ar = bookletLang() === "ar";
    const P = CONFIG.PROJECT;
    return {
        ar,
        brand: P.brand,
        tagline: ar ? "منصة ذكية لتعليمات العناية بالفم" : "Smart platform for oral care instructions",
        patientLbl: ar ? "اسم المريض" : "Patient Name",
        visitDateLbl: ar ? "تاريخ الزيارة" : "Visit Date",
        doctorLbl: ar ? "اسم الطبيب" : "Doctor Name",
        title: ar ? "تعليمات العناية بالفم المخصصة لك" : "Your Personalized Oral Care Instructions",
        subtitle: ar ? "اتبع هذه التعليمات يوميًا للحفاظ على صحة فمك ولثتك"
                     : "Follow these instructions daily to keep your mouth and gums healthy",
        dailyTitle: ar ? "التعليمات اليومية" : "Daily Care Instructions",
        videosTitle: ar ? "شاهد فيديوهاتك التعليمية الشخصية" : "Watch Your Personal Educational Videos",
        scanHint: ar ? "امسح رمز QR لمشاهدة الفيديوهات التعليمية المخصصة لك"
                     : "Scan the QR code to watch educational videos tailored for you",
        howTitle: ar ? "كيف تفتح رمز QR؟" : "How to scan the QR code?",
        how: ar ? [
            "افتح كاميرا الهاتف أو تطبيق مسح QR",
            "وجّه الكاميرا نحو رمز QR",
            "اضغط على الرابط الذي يظهر على الشاشة",
            "ستفتح الصفحة تلقائيًا لمشاهدة الفيديوهات"
        ] : [
            "Open your phone camera or a QR scanner app",
            "Point the camera at the QR code",
            "Tap the link that appears on screen",
            "The page opens automatically to watch the videos"
        ],
        disclaimer: ar ? "هذه التعليمات مبنية على تقييم حالتك وتوصيات طبيب الأسنان. في حال وجود أي ألم أو مشكلة لا تتردد بمراجعة طبيبك."
                       : "These instructions are based on your assessment and your dentist's recommendations. If you notice any pain or issue, don't hesitate to see your dentist.",
        thanks: ar ? "شكرًا لالتزامك... نحن معك في رحلتك لصحة فم أفضل" : "Thank you for your commitment... we're with you on your journey to better oral health"
    };
}

async function buildInstructionsSheet() {
    const S = instructionsSheetStrings();
    const p = (App.current && App.current.patient) || {};
    const rec = (App.current && App.current.record) || {};
    const r = (App.current && App.current.result) || {};
    const instructions = (r.instructions || []).slice(0, 6);
    const P = CONFIG.PROJECT;
    const doctorName = rec.createdByName || (App.currentDoctor && App.currentDoctor.name) || "";

    const html = `
    <div class="is-page">
        <div class="is-head">
            <div class="is-brand">
                <i class="fa-solid fa-tooth"></i>
                <div>
                    <b>${escapeHtml(S.brand)} <span class="is-ai-badge">AI</span></b>
                    <span>${S.tagline}</span>
                </div>
            </div>
            <div class="is-fields">
                <p><b>${S.patientLbl}:</b> ${escapeHtml(p.fullName || rec.patientName || "")}</p>
                <p><b>${S.visitDateLbl}:</b> ${escapeHtml(today())}</p>
                <p><b>${S.doctorLbl}:</b> ${escapeHtml(doctorName)}</p>
            </div>
        </div>

        <div class="is-title">
            <i class="fa-solid fa-tooth"></i>
            <h1>${S.title}</h1>
        </div>
        <p class="is-subtitle">${S.subtitle}</p>

        <div class="is-cols">
            <div class="is-col-daily">
                <div class="is-col-head">${S.dailyTitle}</div>
                ${instructions.map((ins, i) => `
                    <div class="is-item">
                        <div class="is-item-icon"><i class="fa-solid ${instructionIcon(ins.title)}"></i></div>
                        <div>
                            <b>${i + 1}. ${escapeHtml(ins.title || "")}</b>
                            ${ins.detail ? `<p>${escapeHtml(ins.detail)}</p>` : ""}
                        </div>
                    </div>`).join("")}
            </div>

            <div class="is-col-qr">
                <div class="is-col-head is-col-head-dark">${S.videosTitle}</div>
                <p class="is-qr-hint">${S.scanHint}</p>
                <div id="isQr" class="is-qr-box"></div>

                <div class="is-how">
                    <p class="is-how-title">${S.howTitle}</p>
                    ${S.how.map((step, i) => `
                        <div class="is-how-row">
                            <span class="is-how-num">${i + 1}</span>
                            <span>${step}</span>
                        </div>`).join("")}
                </div>
            </div>
        </div>

        <div class="is-warn">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <p>${S.disclaimer}</p>
        </div>

        <div class="is-foot">
            <i class="fa-solid fa-tooth"></i>
            <span>${escapeHtml(S.brand)}</span> — ${escapeHtml(S.thanks)}
        </div>
    </div>`;

    $("instructionsSheetArea").innerHTML = html;

    const box = $("isQr");
    if (box && rec.id && typeof QRCode !== "undefined") {
        try {
            new QRCode(box, { text: patientPageUrl(rec.id, true), width: 128, height: 128,
                              correctLevel: QRCode.CorrectLevel.M });
        } catch (e) { box.textContent = "QR"; }
    }

    showPage("instructionsSheetPage");
}

function printInstructionsSheet() {
    printElement("instructionsSheetArea", instructionsSheetStrings().title);
}
