/* ==========================================================================
 *  Arabic for the demo portal (portal-v2).
 *
 *  app.js only translated the header and nav; every screen body is built from
 *  English templates. Rather than rewriting ~2,400 lines of templates, this file
 *  translates the rendered DOM when the language is Arabic:
 *    - EXACT: full text of a text node (whitespace-collapsed) -> Arabic
 *    - PATTERNS: text with values in it (amounts, periods, references, names)
 *    - a MutationObserver translates whatever app.js renders later (screens,
 *      notices, inline validation errors, chat messages)
 *    - switching back to English restores the original text of static parts;
 *      the screen itself is re-rendered in English by app.js
 *  Never translated: the presenter demo panel (#demoPanel) and the event feed,
 *  <code>, and technical identifiers (event names, error codes, property keys),
 *  which stay in Latin inside the Arabic sentences.
 *  Tracked values are unaffected: every <option> gets its English text pinned as
 *  its value before its label is translated, so el.value never changes.
 *  Arabic strings are demo copy, not official FTA wording.
 * ========================================================================== */
(function () {
  "use strict";

  var EXACT = {
    // --- chrome / home ---
    "Skip to content": "تخطَّ إلى المحتوى",
    "e-Services Portal": "بوابة الخدمات الإلكترونية",
    "e-Services Portal (Demo)": "بوابة الخدمات الإلكترونية (عرض توضيحي)",
    "Demo": "عرض توضيحي",
    "A/B layout": "تجربة التصميم",
    "control": "الأساسي",
    "variant_a_fewer_fields": "النسخة أ · حقول أقل",
    "variant_b_guided": "النسخة ب · معالج موجّه",
    "· remote config": "· إعداد عن بُعد",
    "· local fallback": "· بديل محلي",
    "· forced (demo)": "· مفروض (عرض)",
    "Taxpayer persona": "نوع المكلّف",
    "Individual · Dubai · first-time filer": "فرد · دبي · يقدّم لأول مرة",
    "SME · Sharjah · monthly filer": "منشأة صغيرة ومتوسطة · الشارقة · إقرار شهري",
    "Large Business · Abu Dhabi · quarterly": "منشأة كبيرة · أبوظبي · إقرار ربع سنوي",
    "Tax Agent · Dubai · files for clients": "وكيل ضريبي · دبي · يقدّم عن العملاء",
    "SME · Ras Al Khaimah · documents pending": "منشأة صغيرة ومتوسطة · رأس الخيمة · مستندات معلّقة",
    "Tax e-Services": "الخدمات الضريبية الإلكترونية",
    "A mock taxpayer portal used to demonstrate Countly product analytics. Everything you see is fabricated demo data.": "بوابة مكلّفين تجريبية لعرض تحليلات المنتج في Countly. جميع البيانات المعروضة وهمية لأغراض العرض.",
    "File, pay and track your tax obligations": "قدّم إقراراتك وادفع وتابع التزاماتك الضريبية",
    "Sign in to file a VAT return for 2026-Q3, settle an outstanding balance, or check the status of a submission.": "سجّل الدخول لتقديم إقرار ضريبة القيمة المضافة للفترة 2026-Q3، أو سداد رصيد مستحق، أو متابعة حالة طلب.",
    "Sign in to continue": "سجّل الدخول للمتابعة",
    "Register a new taxpayer": "تسجيل مكلّف جديد",
    "Browse help topics": "تصفّح مواضيع المساعدة",
    "Service status": "حالة الخدمات",
    "VAT filing": "تقديم إقرارات ضريبة القيمة المضافة",
    "Available": "متاحة",
    "Next deadline": "الموعد النهائي القادم",
    "Period": "الفترة",
    "This page is one of the heatmap views in the data model, together with /returns/supplies, /returns/review and /payments.": "هذه الصفحة إحدى صفحات الخرائط الحرارية في نموذج البيانات، إلى جانب ‎/returns/supplies و‎/returns/review و‎/payments.",
    "VAT returns": "إقرارات ضريبة القيمة المضافة",
    "Quarterly and monthly VAT returns for registered businesses.": "إقرارات ضريبة القيمة المضافة الربع سنوية والشهرية للأعمال المسجّلة.",
    "Start a return": "ابدأ إقراراً",
    "Payments": "المدفوعات",
    "Card, direct debit, bank transfer and eDirham.": "البطاقة، والخصم المباشر، والتحويل البنكي، والدرهم الإلكتروني.",
    "Make a payment": "سداد دفعة",
    "Support": "الدعم",
    "FAQ, guided help and the virtual assistant.": "الأسئلة الشائعة، والمساعدة الموجّهة، والمساعد الافتراضي.",
    "Ask the assistant": "اسأل المساعد",
    "This is a Countly product demonstration, not a real government service.": "هذا عرض توضيحي لمنتج Countly، وليس خدمة حكومية حقيقية.",
    "No real tax authority branding, logos or crests are used. All taxpayer data, amounts, references and outcomes shown on these screens are fabricated for the purposes of the demo. Do not enter real personal data.": "لا تُستخدم أي علامات أو شعارات لجهة ضريبية حقيقية. جميع بيانات المكلّفين والمبالغ والمراجع والنتائج المعروضة وهمية لأغراض العرض. لا تُدخل بيانات شخصية حقيقية.",
    "Instrumented with the Countly Web SDK ·": "مزوّدة بحزمة Countly Web SDK ·",
    "Primary": "الرئيسية",
    "Home": "الرئيسية",
    "Register": "التسجيل",
    "Dashboard": "لوحة المعلومات",

    // --- sign in ---
    "Sign in to e-Services": "تسجيل الدخول إلى الخدمات الإلكترونية",
    "Choose a sign-in method. The buttons below fire the login event with result = success or failure.": "اختر طريقة تسجيل الدخول. تُرسل الأزرار أدناه حدث login بالنتيجة success أو failure.",
    "Sign-in method": "طريقة تسجيل الدخول",
    "UAE Pass": "الهوية الرقمية (UAE PASS)",
    "Password": "كلمة المرور",
    "Biometric": "البصمة الحيوية",
    "Demo account": "حساب العرض",
    "Fixed by the taxpayer persona in the header. There is nothing to type.": "يحدّده نوع المكلّف في أعلى الصفحة، فلا حاجة لإدخال أي شيء.",
    "There is no password field on this page": "لا يوجد حقل لكلمة المرور في هذه الصفحة",
    "Sign-in is a demo button. This portal never asks for a password, one-time code, card number or any other credential, and nothing is authenticated.": "تسجيل الدخول هنا زر تجريبي. لا تطلب هذه البوابة كلمة مرور أو رمزاً لمرة واحدة أو رقم بطاقة أو أي بيانات اعتماد، ولا تتم أي مصادقة فعلية.",
    "Sign in": "تسجيل الدخول",
    "Sign in with the wrong password": "تسجيل الدخول بكلمة مرور خاطئة",
    "OTP times out": "انتهاء صلاحية رمز التحقق",
    "On success the SDK calls": "عند النجاح تستدعي حزمة SDK",
    "so pre-login and post-login activity merge into one user, as required by the data model.": "لدمج النشاط قبل تسجيل الدخول وبعده في مستخدم واحد، كما يتطلب نموذج البيانات.",

    // --- registration ---
    "Register for tax e-Services": "التسجيل في الخدمات الضريبية الإلكترونية",
    "Onboarding journey. Starting fires registration_started with method, channel and language.": "رحلة التسجيل. البدء يرسل حدث registration_started مع الطريقة والقناة واللغة.",
    "Registration method": "طريقة التسجيل",
    "Email": "البريد الإلكتروني",
    "In-person code": "رمز الحضور الشخصي",
    "Matches the method segmentation on registration_started and registration_completed.": "يطابق تقسيم method في الحدثين registration_started وregistration_completed.",
    "Channel": "القناة",
    "Web Portal": "البوابة الإلكترونية",
    "Mobile App": "تطبيق الهاتف",
    "The same taxpayer may register on one channel and file on another.": "قد يسجّل المكلّف نفسه عبر قناة ويقدّم إقراراته عبر قناة أخرى.",
    "No identity data is collected here": "لا تُجمع أي بيانات هوية هنا",
    "Every field in this journey is a fixed demo choice. Nothing you pick is real, and nothing identifying is sent to Countly.": "كل حقل في هذه الرحلة خيار تجريبي ثابت. لا شيء مما تختاره حقيقي، ولا تُرسل أي بيانات تعريفية إلى Countly.",
    "Start registration": "ابدأ التسجيل",
    "I already have an account": "لدي حساب بالفعل",
    "Identity, contact and business details": "بيانات الهوية والتواصل والنشاط التجاري",
    "Three taxonomy step_keys live on this screen: identity, contact and business_details.": "تضم هذه الشاشة ثلاث خطوات من التصنيف (step_key): identity وcontact وbusiness_details.",
    "Identity": "الهوية",
    "Contact": "التواصل",
    "Business details": "بيانات النشاط التجاري",
    "Documents": "المستندات",
    "Review": "المراجعة",
    "Identity document type": "نوع وثيقة الهوية",
    "— select —": "— اختر —",
    "Emirates ID (demo)": "الهوية الإماراتية (تجريبي)",
    "Passport (demo)": "جواز السفر (تجريبي)",
    "Trade Licence (demo)": "الرخصة التجارية (تجريبي)",
    "GCC ID (demo)": "هوية دول مجلس التعاون (تجريبي)",
    "Leave this unselected and press Continue to make the step fail and push attempt_no to 2.": "اترك هذا الحقل دون اختيار واضغط متابعة لإفشال الخطوة ورفع attempt_no إلى 2.",
    "Continue": "متابعة",
    "Simulate a rejected submission (retry)": "محاكاة رفض الطلب (إعادة المحاولة)",
    "Supporting documents": "المستندات الداعمة",
    "Each upload fires registration_document_uploaded with doc_type and result. Pick a .bmp or .heic file to force rejected_format, or the 41 MB file to force rejected_size.": "كل رفع يرسل حدث registration_document_uploaded مع doc_type وresult. اختر ملف ‎.bmp أو ‎.heic لفرض rejected_format، أو الملف بحجم 41 ميغابايت لفرض rejected_size.",
    "No real files are read": "لا تتم قراءة أي ملفات حقيقية",
    "There is no file picker on this page. The fabricated filename you choose decides the outcome, so nothing leaves the presenter's machine.": "لا يوجد منتقي ملفات في هذه الصفحة. اسم الملف الوهمي الذي تختاره يحدّد النتيجة، فلا يغادر أي شيء جهاز مقدّم العرض.",
    "Document": "المستند",
    "Demo file": "ملف تجريبي",
    "Status": "الحالة",
    "Trade Licence": "الرخصة التجارية",
    "demo-document.pdf — PDF, 1.2 MB — accepted": "demo-document.pdf — PDF، ‏1.2 ميغابايت — مقبول",
    "demo-document.png — PNG, 0.8 MB — accepted": "demo-document.png — PNG، ‏0.8 ميغابايت — مقبول",
    "demo-document.bmp — BMP — unsupported format": "demo-document.bmp — BMP — صيغة غير مدعومة",
    "demo-photo.heic — HEIC — unsupported format": "demo-photo.heic — HEIC — صيغة غير مدعومة",
    "demo-scan-huge.pdf — PDF, 41 MB — over the 25 MB limit": "demo-scan-huge.pdf — PDF، ‏41 ميغابايت — يتجاوز حد 25 ميغابايت",
    "Not uploaded": "لم يُرفع",
    "Uploading…": "جارٍ الرفع…",
    "Accepted": "مقبول",
    "Rejected": "مرفوض",
    "Upload": "رفع",
    "Emirates ID": "الهوية الإماراتية",
    "Bank Letter": "خطاب بنكي",
    "Lease Contract": "عقد الإيجار",
    "Need help?": "هل تحتاج مساعدة؟",
    "Back": "رجوع",
    "Continue to review": "متابعة إلى المراجعة",
    "Review and submit registration": "مراجعة طلب التسجيل وإرساله",
    "Submitting fires registration_step_completed (review) then registration_completed.": "الإرسال يرسل الحدث registration_step_completed ‏(review) ثم registration_completed.",
    "Method": "الطريقة",
    "Language": "اللغة",
    "en": "الإنجليزية",
    "ar": "العربية",
    "Identity document": "وثيقة الهوية",
    "Correspondence": "المراسلات",
    "Entity type": "نوع الكيان",
    "Documents accepted": "المستندات المقبولة",
    "Documents rejected": "المستندات المرفوضة",
    "Step retries": "إعادة محاولات الخطوات",
    "first_attempt_success will be": "ستكون قيمة first_attempt_success",
    "true": "نعم (true)",
    "false": "لا (false)",
    "Submit registration": "إرسال طلب التسجيل",

    // --- dashboard ---
    "File now - it takes about 4 minutes.": "قدّم الآن — يستغرق نحو 4 دقائق.",
    "Open reminder and file": "افتح التذكير وقدّم الإقرار",
    "VAT payable this period": "ضريبة القيمة المضافة المستحقة لهذه الفترة",
    "Returns filed to date": "الإقرارات المقدّمة حتى الآن",
    "On-time filing band": "نطاق الالتزام بالمواعيد",
    "Your returns": "إقراراتك",
    "Type": "النوع",
    "Declared": "المُقرّ به",
    "VAT": "ضريبة القيمة المضافة",
    "Not started": "لم يبدأ",
    "Submitted": "مُقدَّم",
    "Pay outstanding balance": "سداد الرصيد المستحق",

    // --- returns ---
    "Returns": "الإقرارات",
    "All periods for this taxpayer. The taxonomy's /returns list view.": "جميع الفترات لهذا المكلّف. عرض القائمة ‎/returns في التصنيف.",
    "File now": "قدّم الآن",
    "Pay": "ادفع",
    "Excise": "الضريبة الانتقائية",
    "Start a new return": "بدء إقرار جديد",
    "Return type": "نوع الإقرار",
    "Corporate Tax": "ضريبة الشركات",
    "The demo funnel is built on VAT; the other types are here to show segmentation.": "مسار العرض مبني على ضريبة القيمة المضافة؛ الأنواع الأخرى موجودة لعرض التقسيم.",
    "Tax period": "الفترة الضريبية",
    "Start return": "ابدأ الإقرار",
    "Start from a deep link": "البدء من رابط مباشر",
    "Taxpayer details": "بيانات المكلّف",
    "Supplies & outputs": "التوريدات والمخرجات",
    "Purchases & inputs": "المشتريات والمدخلات",
    "(optional)": "(اختياري)",
    "Adjustments": "التعديلات",
    "Review & submit": "المراجعة والإرسال",
    "Tax Registration Number (TRN)": "رقم التسجيل الضريبي (TRN)",
    "— none selected —": "— لم يتم الاختيار —",
    "200123456789012 — valid demo TRN": "200123456789012 — رقم تسجيل تجريبي صالح",
    "100987654321098 — valid demo TRN": "100987654321098 — رقم تسجيل تجريبي صالح",
    "12345 — malformed, fires E101_FORMAT": "12345 — صيغة خاطئة، يُطلق E101_FORMAT",
    "500123456789012 — bad prefix, fires E101_FORMAT": "500123456789012 — بادئة خاطئة، يُطلق E101_FORMAT",
    "Fabricated TRNs only. Pick a malformed one to fire the validation error; leave it unselected to fire E402_REQUIRED. The TRN itself is never sent to Countly - only the trn_prefix bucket and the error code.": "أرقام تسجيل وهمية فقط. اختر رقماً بصيغة خاطئة لإطلاق خطأ التحقق، أو اتركه دون اختيار لإطلاق E402_REQUIRED. لا يُرسل الرقم نفسه إلى Countly — فقط فئة trn_prefix ورمز الخطأ.",
    "Registered legal name": "الاسم القانوني المسجّل",
    "A fixed list of fabricated entities. There is no free-text name box on this page.": "قائمة ثابتة من الكيانات الوهمية. لا يوجد حقل نصي حر للاسم في هذه الصفحة.",
    "Contact and correspondence": "التواصل والمراسلات",
    "Correspondence mailbox": "صندوق بريد المراسلات",
    "Reserved .invalid demo addresses - they cannot resolve to a real mailbox.": "عناوين تجريبية محجوزة بنطاق ‎.invalid — لا يمكن أن تصل إلى صندوق بريد حقيقي.",
    "Save draft": "حفظ المسودة",
    "Standard-rated supplies (AED)": "التوريدات الخاضعة للنسبة الأساسية (درهم)",
    "Required. Leave empty to fire E402_REQUIRED.": "مطلوب. اتركه فارغاً لإطلاق E402_REQUIRED.",
    "Zero-rated supplies (AED)": "التوريدات الخاضعة للنسبة الصفرية (درهم)",
    "Exempt supplies and emirate split": "التوريدات المعفاة والتوزيع حسب الإمارة",
    "Exempt supplies (AED)": "التوريدات المعفاة (درهم)",
    "Emirate split total (AED)": "إجمالي التوزيع حسب الإمارة (درهم)",
    "Must equal standard-rated supplies, or E204_MISMATCH is raised.": "يجب أن يساوي التوريدات الخاضعة للنسبة الأساسية، وإلا يُطلق E204_MISMATCH.",
    "This step is optional": "هذه الخطوة اختيارية",
    "Skipping it fires filing_step_skipped with a skip_reason.": "تخطيها يرسل حدث filing_step_skipped مع skip_reason.",
    "Standard-rated purchases (AED)": "المشتريات الخاضعة للنسبة الأساسية (درهم)",
    "Recoverable input tax (AED)": "ضريبة المدخلات القابلة للاسترداد (درهم)",
    "Cannot exceed 5% of purchases, or E311_RANGE is raised.": "لا يمكن أن تتجاوز 5% من المشتريات، وإلا يُطلق E311_RANGE.",
    "Not applicable": "لا ينطبق",
    "Will complete later": "سأكمله لاحقاً",
    "Skip this step": "تخطي هذه الخطوة",
    "Add details": "إضافة التفاصيل",
    "Hide details": "إخفاء التفاصيل",
    "Most taxpayers skip it - that is exactly the behaviour the demo highlights.": "يتخطاها معظم المكلّفين — وهذا بالضبط السلوك الذي يبرزه العرض.",
    "Adjustments to previous periods (AED)": "تعديلات الفترات السابقة (درهم)",
    "Positive increases the amount due.": "القيمة الموجبة تزيد المبلغ المستحق.",
    "Check before you submit": "تحقّق قبل الإرسال",
    "Submitting fires filing_submitted, or filing_submission_failed if the back-end failure toggle in the demo panel is on.": "الإرسال يرسل حدث filing_submitted، أو filing_submission_failed إذا كان مفتاح تعطّل النظام في لوحة العرض مفعّلاً.",
    "TRN": "رقم التسجيل الضريبي",
    "Standard-rated supplies": "التوريدات الخاضعة للنسبة الأساسية",
    "Zero-rated supplies": "التوريدات الخاضعة للنسبة الصفرية",
    "Exempt supplies": "التوريدات المعفاة",
    "Total declared": "إجمالي المُقرّ به",
    "Recoverable input tax": "ضريبة المدخلات القابلة للاسترداد",
    "VAT due": "ضريبة القيمة المضافة المستحقة",
    "Validation errors so far": "أخطاء التحقق حتى الآن",
    "Failed submissions": "محاولات الإرسال الفاشلة",
    "Submit return": "إرسال الإقرار",
    "Return submitted": "تم تقديم الإقرار",
    "Keep the reference for your records. A payment is now due.": "احتفظ بالمرجع في سجلاتك. هناك دفعة مستحقة الآن.",
    "Declared total": "الإجمالي المُقرّ به",
    "First-attempt success": "النجاح من المحاولة الأولى",
    "Yes": "نعم",
    "No": "لا",
    "Filed on time": "قُدّم في الموعد",
    "Back to dashboard": "العودة إلى لوحة المعلومات",
    "Enter your TRN.": "أدخل رقم التسجيل الضريبي.",
    "That TRN is not in the right format. It must be 15 digits starting 100, 200 or 300.": "صيغة رقم التسجيل الضريبي غير صحيحة. يجب أن يتكوّن من 15 رقماً ويبدأ بـ 100 أو 200 أو 300.",
    "Enter your standard-rated supplies (0 is allowed).": "أدخل التوريدات الخاضعة للنسبة الأساسية (يُسمح بالصفر).",
    "Supplies cannot be negative.": "لا يمكن أن تكون التوريدات قيمة سالبة.",
    "The emirate split must add up to your standard-rated supplies.": "يجب أن يساوي مجموع التوزيع حسب الإمارة التوريداتِ الخاضعة للنسبة الأساسية.",
    "Recoverable input tax cannot exceed 5% of purchases.": "لا يمكن أن تتجاوز ضريبة المدخلات القابلة للاسترداد 5% من المشتريات.",
    "Taxpayer details are incomplete.": "بيانات المكلّف غير مكتملة.",
    "Guided mode checks each field as you leave it, so mistakes are caught before you continue.": "يتحقق الوضع الموجّه من كل حقل عند الانتقال منه، فتُكتشف الأخطاء قبل المتابعة.",
    "Choose an identity document type to continue.": "اختر نوع وثيقة الهوية للمتابعة.",

    // --- payments ---
    "Payment method": "طريقة الدفع",
    "Card": "البطاقة",
    "Direct Debit": "الخصم المباشر",
    "Bank Transfer": "التحويل البنكي",
    "eDirham": "الدرهم الإلكتروني",
    "Amount (AED)": "المبلغ (درهم)",
    "Amount bands used in reporting: <10k, 10k-50k, 50k-250k, >250k. Only the band is sent, never the exact figure.": "فئات المبالغ المستخدمة في التقارير: ‎<10k و10k-50k و50k-250k و‎>250k. تُرسل الفئة فقط، وليس المبلغ الدقيق.",
    "Continue to confirmation": "متابعة إلى التأكيد",
    "Confirm payment": "تأكيد الدفع",
    "Check the details before authorising.": "تحقّق من التفاصيل قبل الاعتماد.",
    "Amount": "المبلغ",
    "No real payment is taken": "لا يتم تحصيل أي دفعة حقيقية",
    "Do not enter card details anywhere on this page - there are none to enter.": "لا تُدخل بيانات بطاقة في أي مكان بهذه الصفحة — لا توجد حقول لذلك.",
    "Authorise payment": "اعتماد الدفع",
    "Simulate a declined payment": "محاكاة رفض الدفع",
    "Payment receipt": "إيصال الدفع",
    "Payment completed": "تمت عملية الدفع",

    // --- refunds ---
    "Refunds": "الاستردادات",
    "Refund reason": "سبب الاسترداد",
    "Excess input tax": "ضريبة مدخلات زائدة",
    "Duplicate payment": "دفعة مكرّرة",
    "Correction": "تصحيح",
    "Request a refund": "طلب استرداد",
    "Request and track refunds. Requesting fires refund_requested with amount_band and reason.": "اطلب الاستردادات وتابعها. الطلب يرسل حدث refund_requested مع amount_band وreason.",
    "Reference": "المرجع",
    "Reason": "السبب",
    "Band": "الفئة",
    "excess_input_tax": "ضريبة مدخلات زائدة",
    "duplicate_payment": "دفعة مكرّرة",
    "correction": "تصحيح",
    "Paid": "مدفوع",
    "Under review": "قيد المراجعة",
    "Amount band": "فئة المبلغ",
    "Only the band is ever sent - never the exact figure.": "تُرسل الفئة فقط — وليس المبلغ الدقيق أبداً.",
    "Submit refund request": "إرسال طلب الاسترداد",

    // --- profile ---
    "Profile": "الملف الشخصي",
    "Taxpayer profile": "ملف المكلّف",
    "Everything below is a Countly user property from the data model. Changing one calls Countly.userData.set() and saves immediately.": "كل ما يلي خصائص مستخدم في Countly من نموذج البيانات. تغيير أي منها يستدعي Countly.userData.set() ويُحفظ فوراً.",
    "Current properties": "الخصائص الحالية",
    "Individual": "فرد",
    "SME": "منشأة صغيرة ومتوسطة",
    "Large Business": "منشأة كبيرة",
    "Tax Agent": "وكيل ضريبي",
    "Pending Documents": "مستندات معلّقة",
    "Registered": "مسجّل",
    "Pending": "قيد الانتظار",
    "Dubai": "دبي",
    "Abu Dhabi": "أبوظبي",
    "Sharjah": "الشارقة",
    "Ajman": "عجمان",
    "Ras Al Khaimah": "رأس الخيمة",
    "Fujairah": "الفجيرة",
    "Umm Al Quwain": "أم القيوين",
    "Annual": "سنوي",
    "Monthly": "شهري",
    "Quarterly": "ربع سنوي",
    "Both": "كلاهما",
    "Update preferences": "تحديث التفضيلات",
    "Files through a registered tax agent.": "يقدّم إقراراته عبر وكيل ضريبي مسجّل.",
    "Save preferences": "حفظ التفضيلات",
    "No name, TRN, Emirates ID or address is stored on this screen - the data model forbids it.": "لا يُخزَّن في هذه الشاشة أي اسم أو رقم تسجيل ضريبي أو هوية إماراتية أو عنوان — نموذج البيانات يمنع ذلك.",

    // --- support ---
    "Help topics": "مواضيع المساعدة",
    "Opening this page records help_opened with surface = FAQ.": "فتح هذه الصفحة يسجّل حدث help_opened مع surface = FAQ.",
    "When is my VAT return due?": "متى يستحق تقديم إقرار ضريبة القيمة المضافة؟",
    "Quarterly returns are due 28 days after the end of the tax period. This demo uses 28 October 2026.": "تُستحق الإقرارات الربع سنوية بعد 28 يوماً من نهاية الفترة الضريبية. يستخدم هذا العرض تاريخ 28 أكتوبر 2026.",
    "Can I save a return and finish it later?": "هل يمكنني حفظ الإقرار وإكماله لاحقاً؟",
    "Yes. Use \"Save draft\" on any step; the portal fires filing_draft_saved, and filing_draft_resumed when you come back.": "نعم. استخدم «حفظ المسودة» في أي خطوة؛ ترسل البوابة حدث filing_draft_saved، ثم filing_draft_resumed عند عودتك.",
    "Why was my TRN rejected?": "لماذا رُفض رقم التسجيل الضريبي الخاص بي؟",
    "A TRN is 15 digits beginning 100, 200 or 300. A malformed TRN raises error code E101_FORMAT.": "يتكوّن رقم التسجيل الضريبي من 15 رقماً ويبدأ بـ 100 أو 200 أو 300. الرقم بصيغة خاطئة يُطلق رمز الخطأ E101_FORMAT.",
    "What happens if a submission fails?": "ماذا يحدث إذا فشل الإرسال؟",
    "The draft is preserved and filing_submission_failed is recorded with the back-end error code so IT operations can be alerted.": "تُحفظ المسودة ويُسجَّل حدث filing_submission_failed مع رمز خطأ النظام لتنبيه فريق العمليات التقنية.",
    "Is this a real government service?": "هل هذه خدمة حكومية حقيقية؟",
    "No. This is a Countly product demonstration. No real taxpayer data is processed.": "لا. هذا عرض توضيحي لمنتج Countly، ولا تتم معالجة أي بيانات مكلّفين حقيقية.",
    "Still stuck?": "هل ما زلت بحاجة إلى مساعدة؟",
    "Open the virtual assistant": "افتح المساعد الافتراضي",
    "Raise a support ticket": "فتح تذكرة دعم",
    "Virtual assistant": "المساعد الافتراضي",
    "Ending the chat records chatbot_session_ended with resolved = true or false, plus the conversation duration.": "إنهاء المحادثة يسجّل حدث chatbot_session_ended مع resolved = true أو false، إضافة إلى مدة المحادثة.",
    "Hello. I can help with filing, payments, registration or refunds. What do you need?": "مرحباً. يمكنني المساعدة في تقديم الإقرارات أو المدفوعات أو التسجيل أو الاستردادات. بماذا أساعدك؟",
    "Topic": "الموضوع",
    "filing": "تقديم الإقرارات",
    "payment": "المدفوعات",
    "registration": "التسجيل",
    "refund": "الاسترداد",
    "Your message": "رسالتك",
    "Can I save my return and finish it later?": "هل يمكنني حفظ إقراري وإكماله لاحقاً؟",
    "My payment was declined — what now?": "رُفضت دفعتي — ماذا أفعل الآن؟",
    "How do I request a refund?": "كيف أطلب استرداداً؟",
    "A fixed list of demo questions. There is no free-text box, so no personal data can be typed into the transcript.": "قائمة ثابتة من الأسئلة التجريبية. لا يوجد حقل نصي حر، لذا لا يمكن كتابة أي بيانات شخصية في المحادثة.",
    "Send": "إرسال",
    "End chat — resolved": "إنهاء المحادثة — تم الحل",
    "End chat — not resolved": "إنهاء المحادثة — لم يتم الحل",
    "Thanks. In the demo the assistant does not answer - use the buttons below to end the conversation as resolved or unresolved.": "شكراً. في هذا العرض لا يجيب المساعد — استخدم الأزرار أدناه لإنهاء المحادثة كمحلولة أو غير محلولة.",
    "Creating a ticket fires support_ticket_created with topic and channel.": "إنشاء تذكرة يرسل حدث support_ticket_created مع الموضوع والقناة.",
    "Call Centre": "مركز الاتصال",
    "What happened?": "ماذا حدث؟",
    "My return was rejected at the supplies step": "رُفض إقراري في خطوة التوريدات",
    "My payment was declined twice": "رُفضت دفعتي مرتين",
    "My Trade Licence upload keeps failing": "يستمر فشل رفع الرخصة التجارية",
    "My refund has not arrived": "لم يصلني المبلغ المسترد",
    "A fixed list of demo descriptions - there is no free-text box, so no personal data can be entered.": "قائمة ثابتة من الأوصاف التجريبية — لا يوجد حقل نصي حر، لذا لا يمكن إدخال بيانات شخصية.",
    "Create ticket": "إنشاء تذكرة",
    "Try the assistant first": "جرّب المساعد أولاً",
    "Guided help": "المساعدة الموجّهة",

    // --- notices (titles and fixed bodies) ---
    "Document accepted": "تم قبول المستند",
    "Document rejected": "تم رفض المستند",
    "Registration submitted": "تم إرسال طلب التسجيل",
    "Sign-in failed": "فشل تسجيل الدخول",
    "The password you entered is not correct. (Demo only - nothing was checked.)": "كلمة المرور التي أدخلتها غير صحيحة. (عرض فقط — لم يتم التحقق من أي شيء.)",
    "One-time password expired": "انتهت صلاحية رمز التحقق",
    "The OTP timed out. (Demo only.)": "انتهت مهلة رمز التحقق. (عرض فقط.)",
    "Draft saved": "تم حفظ المسودة",
    "You can leave the portal and resume this return later.": "يمكنك مغادرة البوابة واستكمال هذا الإقرار لاحقاً.",
    "No accepted documents yet": "لا توجد مستندات مقبولة بعد",
    "Upload at least one document that is accepted before continuing. Rejected uploads are still recorded.": "ارفع مستنداً مقبولاً واحداً على الأقل قبل المتابعة. تُسجَّل عمليات الرفع المرفوضة أيضاً.",
    "Step rejected": "تم رفض الخطوة",
    "Refund requested": "تم طلب الاسترداد",
    "Your refund request has been logged.": "تم تسجيل طلب الاسترداد الخاص بك.",
    "Preferences saved": "تم حفظ التفضيلات",
    "Four user properties updated via Countly.userData.set().": "تم تحديث أربع خصائص مستخدم عبر Countly.userData.set().",
    "Ticket created": "تم إنشاء التذكرة",
    "Chat ended": "انتهت المحادثة",
    "Marked as resolved.": "تم وضع علامة «تم الحل».",
    "Marked as unresolved - this feeds the \"Chatbot unresolved\" cohort.": "تم وضع علامة «لم يتم الحل» — يغذّي ذلك شريحة «Chatbot unresolved».",
    "Payment could not be completed": "تعذّر إتمام الدفع",
    "The payment gateway timed out during 3-D Secure (P202_3DS_TIMEOUT). Turn the back-end failure toggle off in the demo panel to succeed.": "انتهت مهلة بوابة الدفع أثناء التحقق الآمن 3-D Secure ‏(P202_3DS_TIMEOUT). أوقف مفتاح تعطّل النظام في لوحة العرض لإتمام الدفع.",
    "Payment declined": "تم رفض الدفع",
    "Your bank declined the payment (P101_DECLINED).": "رفض البنك عملية الدفع (P101_DECLINED).",
    "Submission failed": "فشل الإرسال",
    "The filing service is not responding (S500_BACKEND). Your draft has been kept - switch the toggle off in the demo panel and try again.": "خدمة تقديم الإقرارات لا تستجيب (S500_BACKEND). تم الاحتفاظ بمسودتك — أوقف المفتاح في لوحة العرض وحاول مجدداً.",
    "Handled error logged": "تم تسجيل خطأ مُعالَج",
    "Countly.log_error() sent a non-fatal error report with the crash segments from the data model.": "أرسل Countly.log_error() تقرير خطأ غير مُعطِّل مع تقسيمات الأعطال من نموذج البيانات."
  };

  var MONTHS = { Jan: "يناير", Feb: "فبراير", Mar: "مارس", Apr: "أبريل", May: "مايو", Jun: "يونيو", Jul: "يوليو", Aug: "أغسطس", Sep: "سبتمبر", Oct: "أكتوبر", Nov: "نوفمبر", Dec: "ديسمبر" };
  var PERSONA_TAG = { Individual: "فرد", SME: "منشأة صغيرة ومتوسطة", "Large Business": "منشأة كبيرة", Agent: "وكيل ضريبي", Pending: "مستندات معلّقة" };
  var FREQ = { Annual: "سنوي", Monthly: "شهري", Quarterly: "ربع سنوي" };
  function tr(s) { return EXACT[s] || s; }

  // Text that carries values. Each: [regex on the whitespace-collapsed text, function(match) -> Arabic]
  var PATTERNS = [
    [/^Welcome back, (.+) \((Individual|SME|Large Business|Agent|Pending)\)$/, function (m) { return "مرحباً بعودتك، " + m[1] + " (" + PERSONA_TAG[m[2]] + ")"; }],
    [/^Outstanding obligations for (.+) · (Annual|Monthly|Quarterly) filer$/, function (m) { return "الالتزامات المستحقة · " + tr(m[1]) + " · إقرار " + FREQ[m[2]]; }],
    [/^Your VAT return for (\S+) is due in (\d+) days?$/, function (m) { return "إقرار ضريبة القيمة المضافة للفترة " + m[1] + " مستحق خلال " + m[2] + " أيام"; }],
    [/^Your VAT return for (\S+) is overdue$/, function (m) { return "إقرار ضريبة القيمة المضافة للفترة " + m[1] + " متأخر"; }],
    [/^AED ([\d,.]+)$/, function (m) { return m[1] + " درهم"; }],
    [/^Pay AED ([\d,.]+)$/, function (m) { return "ادفع " + m[1] + " درهم"; }],
    [/^AED ([\d,.]+) by (.+)\.$/, function (m) { return "تم دفع " + m[1] + " درهم عبر " + tr(m[2]) + "."; }],
    [/^Reference ([A-Z0-9-]+)$/, function (m) { return "المرجع " + m[1]; }],
    [/^Your (\S+) VAT return has been received$/, function (m) { return "تم استلام إقرار ضريبة القيمة المضافة للفترة " + m[1]; }],
    [/^Layout: (\S+) · attempt (\d+)$/, function (m) { return "التصميم: " + tr(m[1]) + " · المحاولة " + m[2]; }],
    [/^VAT return · (\S+)$/, function (m) { return "إقرار ضريبة القيمة المضافة · " + m[1]; }],
    [/^File (\S+) return$/, function (m) { return "تقديم إقرار " + m[1]; }],
    [/^Outstanding balance for (\S+)\.$/, function (m) { return "الرصيد المستحق للفترة " + m[1] + "."; }],
    [/^(\d+) of (\d+)$/, function (m) { return m[1] + " من " + m[2]; }],
    // A/B layouts: variant_a "+ Add details — <section>" toggles, variant_b "Step N of 5 — <section>" header
    [/^([+−]) (Add|Hide) details — (.+)$/, function (m) { return EXACT[m[3]] ? m[1] + " " + (m[2] === "Add" ? "إضافة التفاصيل" : "إخفاء التفاصيل") + " — " + EXACT[m[3]] : null; }],
    [/^Step (\d+) of (\d+) — (.+)$/, function (m) { return EXACT[m[3]] ? "الخطوة " + m[1] + " من " + m[2] + " — " + EXACT[m[3]] : null; }],
    [/^(\d) · (.+)$/, function (m) { return EXACT[m[2]] ? m[1] + " · " + EXACT[m[2]] : null; }],
    [/^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})$/, function (m) { return m[1] + " " + MONTHS[m[2]] + " " + m[3]; }],
    [/^The form layout on the following steps is chosen by the Countly A\/B test "filing_form_layout"\. Current assignment: (\S+) \((.+)\)\.$/, function (m) {
      return "يتم اختيار تصميم النموذج في الخطوات التالية عبر تجربة A/B في Countly ‏«filing_form_layout». التعيين الحالي: " + tr(m[1]) + " (" + (tr("· " + m[2]).replace(/^· /, "")) + ")."; }],
    [/^(.+) \((.+)\) was accepted\.$/, function (m) { return tr(m[1]) + " (" + m[2] + ") تم قبوله."; }],
    [/^(.+) \((.+)\) was rejected: (.+)\. This is the biggest onboarding blocker in the data model\.$/, function (m) {
      return tr(m[1]) + " (" + m[2] + ") تم رفضه: " + m[3] + ". هذا أكبر عائق في رحلة التسجيل بحسب نموذج البيانات."; }],
    [/^registration_completed recorded with first_attempt_success = (\w+)\.$/, function (m) { return "تم تسجيل registration_completed مع first_attempt_success = " + m[1] + "."; }],
    [/^The registry rejected this step\. attempt_no is now (\S+) and will be sent with the next registration_step_completed\.$/, function (m) {
      return "رفض السجل هذه الخطوة. أصبحت قيمة attempt_no الآن " + m[1] + " وسترسل مع الحدث registration_step_completed التالي."; }],
    [/^support_ticket_created recorded\. Reference (\S+)\.$/, function (m) { return "تم تسجيل support_ticket_created. المرجع " + m[1] + "."; }],
    [/^Guided help panel would open here\. help_opened recorded with context_view = (\S+)\.$/, function (m) { return "ستفتح لوحة المساعدة الموجّهة هنا. تم تسجيل help_opened مع context_view = " + m[1] + "."; }]
  ];

  var SKIP = "#demoPanel, .demo-panel, .event-feed, code, script, style, [data-no-i18n]";
  var ATTRS = ["placeholder", "aria-label", "title"];
  var originals = new Map();   // text node -> original English (for restoring static parts)
  var attrOriginals = [];      // [element, attr, original]
  var active = false, observer = null;

  // While the portal is in Arabic, report "ar-AE" as the browser language (what an Arabic-speaking
  // taxpayer's browser sends; the SDK passes it as la on content requests and as the locale metric).
  // Arabic in-app messages themselves are SEPARATE Arabic-only content blocks and campaigns targeted at
  // custom.portalLanguage = Arabic (knowledge-base/scripts/uae-fta/arabic-portal-messages.js); the portal
  // sets that property on load, sign-in and language toggle. Message translations are not used (known issue).
  var langOverride = null;
  try {
    var navLang = Object.getOwnPropertyDescriptor(Navigator.prototype, "language");
    Object.defineProperty(navigator, "language", { configurable: true, get: function () { return langOverride || navLang.get.call(navigator); } });
  } catch (e) { /* older browsers: messages stay in the browser's language */ }

  function translateText(s) {
    var key = s.replace(/\s+/g, " ").trim();
    if (!key || !/[A-Za-z]/.test(key)) { return null; }
    if (Object.prototype.hasOwnProperty.call(EXACT, key)) { return EXACT[key]; }
    for (var i = 0; i < PATTERNS.length; i++) {
      var m = key.match(PATTERNS[i][0]);
      if (m) { var out = PATTERNS[i][1](m); if (out) { return out; } }
    }
    return null;
  }

  function translateNode(node) {
    var p = node.parentElement;
    if (!p || (p.closest && p.closest(SKIP))) { return; }
    var v = node.nodeValue;
    var out = translateText(v);
    if (out === null) { return; }
    // Pin <option> values before changing their label, so tracked values stay English.
    if (p.tagName === "OPTION" && !p.hasAttribute("value")) { p.setAttribute("value", v.trim()); }
    if (!originals.has(node)) { originals.set(node, v); }
    var lead = v.match(/^\s*/)[0], trail = v.match(/\s*$/)[0];
    node.nodeValue = lead + out + trail;
  }

  function translateTree(root) {
    if (!root) { return; }
    if (root.nodeType === 3) { translateNode(root); return; }
    if (root.nodeType !== 1 || (root.closest && root.closest(SKIP))) { return; }
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var n, list = [];
    while ((n = w.nextNode())) { list.push(n); }
    list.forEach(translateNode);
    var els = [root].concat(Array.prototype.slice.call(root.querySelectorAll("[placeholder],[aria-label],[title]")));
    els.forEach(function (el) {
      if (el.closest && el.closest(SKIP)) { return; }
      ATTRS.forEach(function (a) {
        var val = el.getAttribute && el.getAttribute(a);
        if (!val) { return; }
        var out = translateText(val);
        if (out !== null) { attrOriginals.push([el, a, val]); el.setAttribute(a, out); }
      });
    });
  }

  function setActive(on) {
    langOverride = on ? "ar-AE" : null;
    if (on === active) { if (on) { translateTree(document.body); } return; }
    active = on;
    langOverride = on ? "ar-AE" : null;
    if (on) {
      translateTree(document.body);
      document.title = EXACT[document.title] || document.title;
      observer = new MutationObserver(function (muts) {
        muts.forEach(function (mu) {
          if (mu.type === "characterData") { translateNode(mu.target); }
          else { for (var i = 0; i < mu.addedNodes.length; i++) { translateTree(mu.addedNodes[i]); } }
        });
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    } else {
      if (observer) { observer.disconnect(); observer = null; }
      originals.forEach(function (orig, node) { if (node.isConnected) { node.nodeValue = orig; } });
      attrOriginals.forEach(function (x) { if (x[0].isConnected) { x[0].setAttribute(x[1], x[2]); } });
      originals = new Map(); attrOriginals = [];
      document.title = "e-Services Portal (Demo)";
    }
  }

  window.PortalAR = { setActive: setActive, translateText: translateText, EXACT: EXACT };
})();
