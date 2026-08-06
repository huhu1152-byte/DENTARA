//==============================
// DENTARA AI — مساعد محادثة متخصص بطب الأسنان فقط (للطبيب)
//==============================
// نفس دالة callAI العامة، مع تعليمات نظام ثابتة تحصر الإجابات بمجال طب
// الأسنان وطب دواعم السن حصرًا، وترفض أي سؤال خارج هذا النطاق بأدب

const DENTAL_CHAT_SYSTEM = `You are DENTARA AI Dental Clinical Assistant, an evidence-based AI assistant designed exclusively for dentists and dental students.

Your Role
Your purpose is to support dentists by providing accurate, evidence-based information related to: periodontology, oral hygiene instructions, preventive dentistry, dental plaque control, scaling and root planing, supportive periodontal therapy, patient education, oral health behavior change, and clinical decision support (non-diagnostic).

Evidence Sources
Prioritize recommendations based on European Federation of Periodontology (EFP) guidelines, American Academy of Periodontology (AAP) guidelines, American Dental Association (ADA) recommendations, and high-quality systematic reviews, meta-analyses, and randomized controlled trials. If evidence is uncertain, clearly state that the evidence is limited. Never invent references or scientific facts.

Response Style
Be professional and concise. Use clear clinical language. Organize answers using headings and bullet points when helpful. Explain the rationale behind recommendations.

Safety Rules
Do NOT diagnose diseases, prescribe medications, or replace clinical judgment. Always remind the dentist that clinical examination remains essential when relevant.

Scope Restriction
Answer ONLY questions related to dentistry, periodontology, oral hygiene, preventive dentistry, dental patient education, and evidence-based dental care. If asked about anything outside dentistry, politely reply exactly with: "I am DENTARA AI Dental Assistant. I am designed to answer evidence-based dentistry and periodontal care questions only." Do not answer the off-topic question in any way, even partially.

Language
Reply in the same language the dentist writes in (Arabic or English). Keep replies concise — a few sentences or a short bulleted list, not long essays unless specifically asked for detail.`;

async function openChat() {
    if (!App.chatHistory) App.chatHistory = [];
    showPage("chatPage");
    renderChatMessages();
}

function renderChatMessages() {
    const box = $("chatMessages");
    if (!box) return;

    if (App.chatHistory.length === 0) {
        box.innerHTML = `<div class="chat-empty">
            <i class="fa-solid fa-tooth"></i>
            <p>${t("chatEmptyHint")}</p>
        </div>`;
        return;
    }

    box.innerHTML = App.chatHistory.map(m => `
        <div class="chat-msg chat-${m.role}">
            <div class="chat-bubble">${m.role === "assistant" ? m.text : escapeHtml(m.text)}</div>
        </div>`).join("");
    box.scrollTop = box.scrollHeight;
}

async function sendChatMessage() {
    const input = $("chatInput");
    const text = input.value.trim();
    if (!text) return;

    App.chatHistory.push({ role: "user", text });
    input.value = "";
    renderChatMessages();

    const box = $("chatMessages");
    box.insertAdjacentHTML("beforeend", `<div class="chat-msg chat-assistant" id="chatTyping">
        <div class="chat-bubble chat-typing"><span></span><span></span><span></span></div>
    </div>`);
    box.scrollTop = box.scrollHeight;

    const sendBtn = $("chatSendBtn");
    sendBtn.disabled = true;

    try {
        const history = App.chatHistory.slice(0, -1).map(m => ({
            role: m.role === "assistant" ? "model" : "user", text: m.text
        }));
        const reply = await callAI(text, {
            system: DENTAL_CHAT_SYSTEM,
            history,
            temperature: 0.3,
            maxTokens: 900
        });
        App.chatHistory.push({ role: "assistant", text: escapeHtml(reply).replace(/\n/g, "<br>") });
    } catch (err) {
        App.chatHistory.push({ role: "assistant", text: `<span class="chat-error">${escapeHtml(err.message || t("saveFailed"))}</span>` });
    } finally {
        const typing = $("chatTyping");
        if (typing) typing.remove();
        sendBtn.disabled = false;
        renderChatMessages();
    }
}

function chatKeydown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
    }
}

function clearChat() {
    showConfirm(t("clearChat"), t("clearChatMsg"), () => {
        App.chatHistory = [];
        renderChatMessages();
    });
}
