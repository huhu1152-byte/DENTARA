var SPREADSHEET_ID = "1qIlpehx8SGaqfC2PmMeRVzoa7_xjK45-a3xG_Nr2GGg";

// ======== مفتاح الذكاء الاصطناعي (يبقى هنا على الخادم ولا يصل للمتصفح) ========
// !! تنبيه مهم قبل ما تحفظين: هذا مكانه الوحيد اللي لازم تحطين فيه مفتاحج
// الحقيقي (يبدأ بـ sk-ant-) — لا تنسخين هذا الملف فوق ملفج الحالي بالكامل
// وتنسين تعيدين لصق المفتاح الحقيقي مكان السطر تحت! خذي بس التعديلات
// الجديدة (دالة handleAIRequest) وادمجيها بملفج الحالي، أو الصقي الملف كامل
// وبعدين استبدلي السطر تحت بمفتاحج الحقيقي قبل الحفظ والنشر.
var CLAUDE_API_KEY = "ضعي مفتاح Anthropic API هنا (يبدأ بـ sk-ant-)";
var CLAUDE_MODEL = "claude-sonnet-4-6"; // Sonnet — أحدث نسخة متاحة بالـ API حاليًا
var CLAUDE_API_VERSION = "2023-06-01"; // ثابت مطلوب بكل طلب لـ Anthropic API

// ======== دالة اختبار: شغّليها من المحرر قبل النشر ========
function testAI() {
  var out = handleAIRequest({ prompt: "اكتب جملة ترحيب قصيرة جدًا بالعربية." });
  if (out.error) {
    Logger.log("❌ فشل: " + out.error);
  } else {
    Logger.log("✅ نجح! رد النموذج: " + out.text);
  }
  return out;
}

function testSheet() {
  var rows = sheetToObjects(getSheetOrThrow("Patients"));
  Logger.log("✅ عدد المرضى: " + rows.length);
  return rows.length;
}

// ======== نقاط الدخول ========
function doGet(e) {
  try {
    // طلب مجمّع: يرجّع الجداول الأربعة بنداء واحد بدل أربعة، فيلغي مشكلة
    // رفض Apps Script للطلبات المتزامنة ويسرّع تحميل الموقع بشكل كبير
    if (e.parameter.all) {
      var names = ["Patients", "Assessments", "Questions", "Videos"];
      var tables = {};
      names.forEach(function (n) {
        try {
          tables[n] = sheetToObjects(getSheetOrThrow(n));
        } catch (err) {
          tables[n] = null; // يبقى غير موجود فعلاً إن فشل حتى هنا
        }
      });
      return jsonResponse({ tables: tables });
    }

    var sheetName = e.parameter.sheet;
    if (!sheetName) return jsonResponse({ error: "الرجاء تحديد اسم الشيت (sheet)" });
    return jsonResponse({ rows: sheetToObjects(getSheetOrThrow(sheetName)) });
  } catch (err) {
    return jsonResponse({ error: String(err.message || err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var body = JSON.parse(e.postData.contents);

    // طلبات الذكاء الاصطناعي لا تحتاج قفلًا ولا شيتًا
    if (body.action === "ai") return jsonResponse(handleAIRequest(body));
    if (body.action === "uploadVideo") return jsonResponse(handleVideoUpload(body));
    if (body.action === "login") return jsonResponse(handleLogin(body));
    if (body.action === "register") return jsonResponse(handleRegister(body));

    lock.waitLock(20000);
    if (!body.sheet) return jsonResponse({ error: "الرجاء تحديد اسم الشيت (sheet)" });
    var sheet = getSheetOrThrow(body.sheet);

    if (body.action === "add")
      return jsonResponse({ row: addRowToSheet(sheet, body.data || {}) });
    if (body.action === "update") {
      if (!body.id) return jsonResponse({ error: "معرّف الصف (id) مطلوب للتعديل" });
      return jsonResponse({ row: updateRowInSheet(sheet, Number(body.id), body.data || {}) });
    }
    if (body.action === "delete") {
      if (!body.id) return jsonResponse({ error: "معرّف الصف (id) مطلوب للحذف" });
      deleteRowInSheet(sheet, Number(body.id));
      return jsonResponse({ success: true });
    }
    return jsonResponse({ error: "إجراء غير معروف: " + body.action });
  } catch (err) {
    return jsonResponse({ error: String(err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

// ======== وسيط الذكاء الاصطناعي (Claude / Anthropic API) ========
//
// الفرق عن OpenAI اللي يهمّنا هنا:
// - نقطة النهاية: https://api.anthropic.com/v1/messages
// - المصادقة: هيدر x-api-key (مو Authorization: Bearer)، + هيدر إلزامي
//   anthropic-version يحدد نسخة الـ API
// - "system" حقل مستقل بمستوى الطلب، مو رسالة داخل مصفوفة messages
// - الصورة (إن وُجدت) تُرسل كـ content block من نوع "image" مع media_type
//   وbase64 مستخرجين من data URL، مو "image_url" متل OpenAI
// - حد الرموز: "max_tokens" (إلزامي بكل طلب)، مو "max_completion_tokens"
// - الرد: data.content مصفوفة من الأجزاء (blocks)، نلمّ أجزاء النوع "text"
//
// ======== Prompt Caching (توفير كلفة) ========
// نضيف "cache_control": {"type": "ephemeral"} بمستوى الطلب (top-level).
// الواجهة الأمامية (ai.js) صارت ترسل الجزء الثابت (المنهجية + شكل الـJSON
// المطلوب) بحقل body.system بشكل منفصل عن بيانات المريض المتغيّرة
// (body.prompt) خصيصًا لأجل هذا — فيصير هذا الجزء الثابت (~2500+ توكن) يُخزَّن
// بكاش Anthropic أول مرة، وأي تحليل جاي خلال نافذة الكاش (٥ دقايق افتراضيًا،
// تتجدد تلقائيًا مع كل استخدام) يدفع سعر أرخص بكثير على نفس الجزء بدل
// إعادة حسابه بالسعر الكامل من الصفر. هذا يفيد بالذات إعادات المحاولة
// (BAD_JSON/TRUNCATED) لأنها تصير خلال ثوانٍ من بعضها، فتقع كلها ضمن الكاش
function handleAIRequest(body) {
  if (!CLAUDE_API_KEY) return { error: "مفتاح الذكاء الاصطناعي غير مضبوط في السكربت" };

  var messages = [];

  (body.history || []).forEach(function (m) {
    messages.push({ role: m.role === "model" ? "assistant" : "user", content: m.text });
  });

  if (body.imageDataUrl) {
    var img = parseDataUrl(body.imageDataUrl);
    if (!img) return { error: "صيغة الصورة (imageDataUrl) غير صالحة" };
    messages.push({
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: img.mediaType, data: img.data } },
        { type: "text", text: body.prompt }
      ]
    });
  } else {
    messages.push({ role: "user", content: body.prompt });
  }

  var payload = {
    model: CLAUDE_MODEL,
    max_tokens: body.maxTokens || 700,
    messages: messages,
    // التخزين المؤقت التلقائي: يطبّق نقطة القطع تلقائيًا على آخر جزء قابل
    // للتخزين (هنا: نص system الثابت)، فما نحتاج نحدد يدويًا مكان القطع
    cache_control: { type: "ephemeral" }
  };
  if (body.system) payload.system = body.system;
  // Anthropic تدعم temperature (0 إلى 1)؛ نرسلها فقط إن كانت محددة صراحة
  if (body.temperature !== undefined && body.temperature !== null) {
    payload.temperature = body.temperature;
  }

  try {
    var res = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", {
      method: "post",
      contentType: "application/json",
      headers: {
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": CLAUDE_API_VERSION
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var code = res.getResponseCode();
    var raw = res.getContentText();
    var data = null;
    try { data = JSON.parse(raw); } catch (e) {}

    if (code !== 200) {
      var msg = (data && data.error && data.error.message) ? data.error.message : raw.slice(0, 200);
      return { error: "رمز " + code + ": " + msg };
    }
    if (data && data.error) return { error: data.error.message || "خطأ غير معروف" };

    // تسجيل استخدام الكاش بالـ Logs (مفيد للتأكد إنه فعلاً يشتغل): إذا
    // cache_read_input_tokens > 0 يعني الطلب هذا استفاد من كاش محفوظ من
    // طلب سابق فعلاً
    try {
      if (data && data.usage) {
        Logger.log("AI usage: input=" + data.usage.input_tokens +
          " cache_creation=" + (data.usage.cache_creation_input_tokens || 0) +
          " cache_read=" + (data.usage.cache_read_input_tokens || 0) +
          " output=" + data.usage.output_tokens);
      }
    } catch (e) {}

    var text = "";
    try {
      text = (data.content || [])
        .filter(function (block) { return block.type === "text"; })
        .map(function (block) { return block.text; })
        .join("\n");
    } catch (e) {}
    if (!text) return { error: "لم يرجع النموذج أي محتوى" };
    return { text: text };
  } catch (err) {
    return { error: "تعذر الاتصال: " + String(err.message || err) };
  }
}

// يفكّك data URL (زي "data:image/png;base64,AAAA...") إلى media_type وbase64
function parseDataUrl(dataUrl) {
  var match = String(dataUrl || "").match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mediaType: match[1], data: match[2] };
}

// ======== أدوات الشيت ========
function getSheetOrThrow(name) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    // بدل رفض الطلب بخطأ "لا يوجد تبويب بهذا الاسم"، ننشئ التبويب تلقائيًا
    // لو كان غير موجود. الأعمدة تُضاف لاحقًا تلقائيًا بواسطة ensureHeaders
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function getHeaders(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0];
}

// ينشئ أي عمود ناقص تلقائيًا بدل تجاهل الحقل بصمت
function ensureHeaders(sheet, data) {
  var headers = getHeaders(sheet);
  var missing = [];
  Object.keys(data).forEach(function (key) {
    if (key === "id") return;
    if (headers.indexOf(key) === -1 && missing.indexOf(key) === -1) missing.push(key);
  });
  if (missing.length > 0) {
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
    SpreadsheetApp.flush();
    headers = headers.concat(missing);
  }
  return headers;
}

function normalizeValue(v) {
  if (v instanceof Date) {
    var hasTime = v.getHours() !== 0 || v.getMinutes() !== 0 || v.getSeconds() !== 0;
    return Utilities.formatDate(v, Session.getScriptTimeZone(),
      hasTime ? "yyyy-MM-dd'T'HH:mm:ss" : "yyyy-MM-dd");
  }
  return v;
}

function sheetToObjects(sheet) {
  var lastRow = sheet.getLastRow(), lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol === 0) return [];
  var headers = getHeaders(sheet);
  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var rows = [];
  for (var i = 0; i < data.length; i++) {
    var obj = {}, empty = true;
    for (var c = 0; c < headers.length; c++) {
      if (!headers[c]) continue;
      obj[headers[c]] = normalizeValue(data[i][c]);
      if (data[i][c] !== "" && data[i][c] !== null) empty = false;
    }
    obj.id = i + 2;
    if (!empty) rows.push(obj);
  }
  return rows;
}

function addRowToSheet(sheet, data) {
  var headers = ensureHeaders(sheet, data);
  var rowValues = headers.map(function (h) {
    return (data[h] !== undefined && data[h] !== null) ? data[h] : "";
  });
  var targetRow = sheet.getLastRow() + 1;
  var range = sheet.getRange(targetRow, 1, 1, headers.length);
  // نص صرف قبل الكتابة: يمنع تحويل Google Sheets التلقائي لقيم مثل "4,5"
  // (أرقام فيديوهات مفصولة بفاصلة) إلى تاريخ
  range.setNumberFormat("@");
  range.setValues([rowValues]);
  var result = {};
  headers.forEach(function (h, i) { result[h] = rowValues[i]; });
  result.id = targetRow;
  return result;
}

function updateRowInSheet(sheet, id, data) {
  if (id < 2 || id > sheet.getLastRow()) throw new Error("الصف رقم " + id + " غير موجود");
  var headers = ensureHeaders(sheet, data);
  var range = sheet.getRange(id, 1, 1, headers.length);
  var current = range.getValues()[0];
  var newValues = headers.map(function (h, i) {
    return (data[h] !== undefined) ? data[h] : current[i];
  });
  range.setNumberFormat("@");
  range.setValues([newValues]);
  var result = {};
  headers.forEach(function (h, i) { result[h] = newValues[i]; });
  result.id = id;
  return result;
}

function deleteRowInSheet(sheet, id) {
  if (id < 2 || id > sheet.getLastRow()) throw new Error("الصف رقم " + id + " غير موجود");
  sheet.deleteRow(id);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ======== رفع فيديو مباشرة إلى Google Drive ========
function handleVideoUpload(body) {
  try {
    var bytes = Utilities.base64Decode(body.base64);
    var blob = Utilities.newBlob(bytes, body.mimeType || "video/mp4", body.filename || "video.mp4");
    var file = DriveApp.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return { url: "https://drive.google.com/file/d/" + file.getId() + "/preview" };
  } catch (err) {
    return { error: "رفع الفيديو فشل: " + String(err.message || err) };
  }
}

// ======== حسابات الأطباء ========
var INVITE_CODE = "DENTARA2026";

function handleLogin(body) {
  var rows = sheetToObjects(getSheetOrThrow("Doctors"));
  var match = rows.find(function (d) {
    return d.username === body.username && d.passwordHash === body.passwordHash;
  });
  if (!match) return { error: "اسم المستخدم أو كلمة المرور غير صحيحة" };
  return { doctor: { id: match.id, name: match.name, role: match.role || "doctor" } };
}

function handleRegister(body) {
  if (body.inviteCode !== INVITE_CODE) return { error: "رمز الدعوة غير صحيح" };
  var sheet = getSheetOrThrow("Doctors");
  var rows = sheetToObjects(sheet);
  if (rows.some(function (d) { return d.username === body.username; }))
    return { error: "اسم المستخدم مستخدم بالفعل" };

  var isFirst = rows.length === 0; // أول حساب يُسجَّل يصبح مديرًا تلقائيًا
  var row = addRowToSheet(sheet, {
    name: body.name, username: body.username,
    passwordHash: body.passwordHash,
    role: isFirst ? "admin" : "doctor",
    createdAt: new Date().toISOString().slice(0, 10)
  });
  return { doctor: { id: row.id, name: row.name, role: row.role } };
}
