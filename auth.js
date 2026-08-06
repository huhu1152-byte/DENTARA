//==============================
// نظام حسابات الأطباء: تسجيل دخول، تسجيل حساب جديد برمز دعوة، وصلاحيات
//==============================
// كل التحقق من كلمة المرور ورمز الدعوة يتم داخل Apps Script على الخادم،
// فلا رمز الدعوة ولا كلمات المرور تظهر أبدًا في كود الموقع العام.

const SESSION_KEY = "dcms_doctor_session";

// ======== تشفير كلمة المرور (SHA-256 محلي، بلا اعتماد على أي مكتبة خارجية) ========
function sha256Local(message) {
    function rightRotate(value, amount) { return (value >>> amount) | (value << (32 - amount)); }
    const utf8 = unescape(encodeURIComponent(String(message)));
    const bytes = [];
    for (let i = 0; i < utf8.length; i++) bytes.push(utf8.charCodeAt(i));
    const bitLength = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    const hiLen = Math.floor(bitLength / 0x100000000);
    const loLen = bitLength >>> 0;
    for (let i = 3; i >= 0; i--) bytes.push((hiLen >>> (8 * i)) & 0xff);
    for (let i = 3; i >= 0; i--) bytes.push((loLen >>> (8 * i)) & 0xff);
    const k = [
        0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
        0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
        0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
        0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
        0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
        0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
        0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
        0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    ];
    let h0=0x6a09e667,h1=0xbb67ae85,h2=0x3c6ef372,h3=0xa54ff53a,h4=0x510e527f,h5=0x9b05688c,h6=0x1f83d9ab,h7=0x5be0cd19;
    for (let chunkStart = 0; chunkStart < bytes.length; chunkStart += 64) {
        const w = new Array(64).fill(0);
        for (let i = 0; i < 16; i++) w[i] = (bytes[chunkStart+i*4]<<24)|(bytes[chunkStart+i*4+1]<<16)|(bytes[chunkStart+i*4+2]<<8)|(bytes[chunkStart+i*4+3]);
        for (let i = 16; i < 64; i++) {
            const s0 = rightRotate(w[i-15],7) ^ rightRotate(w[i-15],18) ^ (w[i-15]>>>3);
            const s1 = rightRotate(w[i-2],17) ^ rightRotate(w[i-2],19) ^ (w[i-2]>>>10);
            w[i] = (w[i-16] + s0 + w[i-7] + s1) | 0;
        }
        let a=h0,b=h1,c=h2,d=h3,e=h4,f=h5,g=h6,h=h7;
        for (let i = 0; i < 64; i++) {
            const S1 = rightRotate(e,6) ^ rightRotate(e,11) ^ rightRotate(e,25);
            const ch = (e & f) ^ (~e & g);
            const temp1 = (h + S1 + ch + k[i] + w[i]) | 0;
            const S0 = rightRotate(a,2) ^ rightRotate(a,13) ^ rightRotate(a,22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const temp2 = (S0 + maj) | 0;
            h=g; g=f; f=e; e=(d+temp1)|0; d=c; c=b; b=a; a=(temp1+temp2)|0;
        }
        h0=(h0+a)|0; h1=(h1+b)|0; h2=(h2+c)|0; h3=(h3+d)|0; h4=(h4+e)|0; h5=(h5+f)|0; h6=(h6+g)|0; h7=(h7+h)|0;
    }
    const toHex = n => (n >>> 0).toString(16).padStart(8, "0");
    return [h0,h1,h2,h3,h4,h5,h6,h7].map(toHex).join("");
}

// ======== حالة الجلسة ========
function getSession() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
}

function setSession(doctor) {
    App.currentDoctor = doctor;
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(doctor)); } catch (e) {}
}

function clearSession() {
    App.currentDoctor = null;
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
}

function isAdmin() {
    return !!(App.currentDoctor && App.currentDoctor.role === "admin");
}

// هل يملك الطبيب الحالي صلاحية تعديل/حذف هذا السجل؟
// المدير يملك صلاحية كاملة على كل السجلات؛ الطبيب العادي يملك صلاحية على
// سجلاته هو فقط. السجلات القديمة بلا createdBy (قبل تفعيل الحسابات) تبقى
// قابلة للتعديل من الجميع تفاديًا لقفل بيانات سابقة بلا مالك معروف
function canEditRecord(rec) {
    if (isAdmin()) return true;
    if (!rec || !rec.createdBy) return true;
    return App.currentDoctor && String(rec.createdBy) === String(App.currentDoctor.id);
}

// ======== تسجيل الدخول ========
async function submitLogin() {
    const username = $("li_username").value.trim();
    const password = $("li_password").value;
    if (!username || !password) { showToast(t("loginReq"), "error"); return; }

    const btn = $("loginBtn");
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = t("loading");

    try {
        const result = await gsRequest(CONFIG.API, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "login", username, passwordHash: sha256Local(password) })
        });
        if (!result || !result.doctor) throw new Error(t("loginFailed"));
        setSession(result.doctor);
        showToast(`${t("welcomeBack")} ${result.doctor.name}`);
        await enterApp();
    } catch (err) {
        showToast(err.message || t("loginFailed"), "error");
    } finally {
        btn.disabled = false;
        btn.textContent = original;
    }
}

// ======== تسجيل حساب طبيب جديد برمز دعوة ========
async function submitRegister() {
    const name = $("rg_name").value.trim();
    const username = $("rg_username").value.trim();
    const password = $("rg_password").value;
    const inviteCode = $("rg_invite").value.trim();

    if (!name || !username || !password || !inviteCode) { showToast(t("registerReq"), "error"); return; }
    if (password.length < 4) { showToast(t("passwordShort"), "error"); return; }

    const btn = $("registerBtn");
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = t("loading");

    try {
        const result = await gsRequest(CONFIG.API, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
                action: "register", name, username,
                passwordHash: sha256Local(password), inviteCode
            })
        });
        if (!result || !result.doctor) throw new Error(t("registerFailed"));
        setSession(result.doctor);
        showToast(`${t("welcomeNew")} ${result.doctor.name}`);
        await enterApp();
    } catch (err) {
        showToast(err.message || t("registerFailed"), "error");
    } finally {
        btn.disabled = false;
        btn.textContent = original;
    }
}

function showRegisterForm() { showPage("registerPage"); }
function showLoginForm() { showPage("loginPage"); }

function doLogout() {
    showConfirm(t("logout"), t("logoutMsg"), () => {
        clearSession();
        App._loaded = false;
        location.reload();
    });
}
