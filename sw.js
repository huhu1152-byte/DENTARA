// عامل خدمة بسيط — لا يخزّن أي شيء ولا يتدخّل بأي طلب، وجوده فقط
// يلبّي شرط "قابلية التثبيت" (installability) الذي تفرضه بعض المتصفحات
// (مثل Samsung Internet) قبل السماح بتثبيت الموقع كتطبيق على الشاشة الرئيسية

self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

// معالج fetch فارغ عمداً: يترك المتصفح يتعامل مع كل الطلبات بشكل طبيعي
// (بلا أي كاش أو تعديل)، لكن وجوده مطلوب لاستيفاء شروط التثبيت
self.addEventListener("fetch", () => {});
