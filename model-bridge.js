/* =====================================================================
 *  EmaraTax model bridge
 *  The portal was written against the DTA demo taxonomy (snake_case keys, see
 *  C:\Countly\DTA_Demo\taxonomy.json). This copy sends to the "UAE Tax Authority" app on
 *  staging.count.ly (formerly main-ui.v2.count.ly), whose tracking plan is the EmaraTax model
 *  (C:\Crosstru\knowledge-base\scripts\uae-fta\model.js). app.js hands every event, view and
 *  user property to this bridge, which returns the EmaraTax equivalent(s):
 *    - events   -> 0..n events in the approved plan (Data hub shows nothing unplanned)
 *    - views    -> "<Service> > <Section>" names used by Flows and the seeded data
 *    - profile  -> the model's custom.* properties
 *  The presenter feed still shows the portal's own keys, with the mapped key(s) appended.
 * ===================================================================== */
(function () {
  "use strict";

  var STEP = {               // DTA VAT step_key -> VAT 201 section in the model
    taxpayer_details: "Taxable Person Details",
    supplies: "VAT on Sales and All Other Outputs",
    purchases: "VAT on Expenses and All Other Inputs",
    adjustments: "Additional Reporting Requirements",
    review: "Review and Declaration"
  };
  var VAT_SECTIONS = ["Taxable Person Details", "VAT on Sales and All Other Outputs", "VAT on Expenses and All Other Inputs",
    "Net VAT Due", "Additional Reporting Requirements", "Review and Declaration"];
  var REG_STEP = {           // DTA registration step_key -> VAT registration section
    identity: "Identification Details", contact: "Contact Details", business_details: "Entity Details",
    documents: "Eligibility Details", review: "Review and Declaration"
  };
  var REG_SECTIONS = ["Entity Details", "Identification Details", "Eligibility Details", "Business Relationships",
    "Contact Details", "Bank Details", "Authorized Signatory", "Review and Declaration"];
  var VIEWS = {
    "/home": "Online User Dashboard", "/login": "Login", "/register": "VAT Registration > Instructions and Guidelines",
    "/register/identity": "VAT Registration > Identification Details", "/register/documents": "VAT Registration > Eligibility Details",
    "/register/review": "VAT Registration > Review and Declaration", "/dashboard": "Taxable Person Dashboard", "/returns": "My Filings",
    "/returns/new": "VAT Return > Instructions and Guidelines", "/returns/taxpayer-details": "VAT Return > Taxable Person Details",
    "/returns/supplies": "VAT Return > VAT on Sales and All Other Outputs", "/returns/purchases": "VAT Return > VAT on Expenses and All Other Inputs",
    "/returns/adjustments": "VAT Return > Additional Reporting Requirements", "/returns/review": "VAT Return > Review and Declaration",
    "/returns/submitted": "VAT Return > Acknowledgement", "/payments": "My Payments", "/payments/confirm": "Payment Summary",
    "/payments/receipt": "Payment Acknowledgement", "/refunds": "Refunds", "/profile": "Manage Profile",
    "/support/faq": "Help Centre", "/support/chat": "Virtual Assistant", "/support/ticket": "Submit Inquiry"
  };
  var BAND_AED = { "<10k": 5000, "10k-50k": 30000, "50k-250k": 150000, ">250k": 400000 };
  var BAND_BY_INDEX = [null, 5000, 30000, 150000, 400000];

  // Session-scoped state the model needs but the portal events don't carry.
  var st = { loginMethod: "UAE PASS", taxpayerType: "SME", filingStartedAt: null, usedDraft: false, sessions: 1,
    stepsDone: {}, regStartedAt: null };

  function persona() {
    return st.taxpayerType === "Tax Agent" ? "Tax Agent" : st.taxpayerType === "Individual" ? "Individual" : "Taxable Person";
  }
  function entityType() {
    return { Individual: "Individual (Non-business)", SME: "LLC", "Large Business": "PJSC", "Tax Agent": "LLC" }[st.taxpayerType] || "LLC";
  }
  function filingWindow(onTime) {
    if (onTime === "false") { return "Overdue"; }
    var now = new Date(); var due = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 28, 20));
    if (due < now) { due = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 28, 20)); }
    var d = (due - now) / 86400000;
    return d <= 3 ? "Final 3 Days" : d <= 10 ? "Filing Window Open" : "Outside Filing Window";
  }
  function core(extra) {
    var c = { persona: persona(), loginMethod: st.loginMethod, entityType: entityType(), filingWindow: filingWindow() };
    for (var k in extra) { if (Object.prototype.hasOwnProperty.call(extra, k)) { c[k] = extra[k]; } }
    return c;
  }
  function tier(ms) { var s = ms / 1000; return s < 60 ? "< 1 min" : s < 300 ? "1-5 min" : s < 900 ? "5-15 min" : "> 15 min"; }
  function completion(ms) { var s = ms / 1000; return s < 900 ? "< 15 min" : s < 3600 ? "15-60 min" : s < 86400 ? "1-24 h" : "1-7 days"; }
  function ev(key, seg, extra) { var e = { key: key, segmentation: seg }; if (extra) { for (var k in extra) { e[k] = extra[k]; } } return e; }
  function svcKey(returnType) { return returnType === "Corporate Tax" ? "corporate tax return" : "vat return"; }

  function sectionDone(svc, section, sections, stepVisit, durMs) {
    var seg = { stepIndex: sections.indexOf(section) + 1, totalSteps: sections.length, stepVisit: stepVisit,
      isOptionalStep: /Additional Reporting|Business Relationships|Bank Details/.test(section) ? "Yes" : "No",
      attemptNumber: 1, timeOnStepTier: tier(durMs || 90000) };
    if (svc === "vat return") { seg.inputMethod = section.indexOf("VAT on") === 0 ? "Manual Entry" : "Not Applicable"; }
    var generic = core(seg); generic.stepName = section;
    return [ev(svc + " - Step Completed", generic), ev(svc + " - " + section + " Completed", core(seg))];
  }

  function mapEvent(key, s, extra) {
    s = s || {}; extra = extra || {};
    var now = Date.now();
    switch (key) {
      case "login": {
        st.loginMethod = s.method === "UAE Pass" ? "UAE PASS" : "Email and Password";
        var ok = s.result === "success";
        var fr = ok ? "N/A" : s.failure_reason === "otp_timeout" ? (st.loginMethod === "UAE PASS" ? "UAE PASS timeout" : "OTP expired") : s.failure_reason === "locked" ? "UAE PASS account not verified" : "Wrong password";
        var out = [ev("account - Login", core({ loginMethod: st.loginMethod, uaePassAuthMode: st.loginMethod === "UAE PASS" ? "Push Approval" : "N/A",
          uaePassLinkScenario: "N/A", result: ok ? "Success" : "Fail", failReason: fr,
          enabler: ok ? "N/A" : (st.loginMethod === "UAE PASS" ? "UAE PASS" : "OTP Service") }))];
        if (ok) { out.push(ev("account - Persona Selected", core({ selectedPersona: persona(), isSwitch: "No" }))); }
        return out;
      }
      case "registration_started":
        st.regStartedAt = now;
        return [ev("vat registration - Started", core({ entryPoint: "Taxable Person Dashboard", applicationType: "New", attemptNumber: 1 }))];
      case "registration_step_completed": {
        var rs = REG_STEP[s.step_key]; if (!rs) { return []; }
        return sectionDone("vat registration", rs, REG_SECTIONS, s.attempt_no && s.attempt_no !== "1" ? "Revisit" : "First Visit", extra.dur ? extra.dur * 1000 : null);
      }
      case "registration_document_uploaded": {
        var okd = s.result === "accepted";
        return [ev("document - Uploaded", core({ serviceName: "VAT Registration", documentType: s.doc_type === "Trade Licence" ? "Trade License" : s.doc_type === "Emirates ID" ? "Emirates ID of Signatory" : s.doc_type,
          fileType: "PDF", fileSizeTier: s.result === "rejected_size" ? "5-15 MB" : "1-5 MB", result: okd ? "Success" : "Fail",
          failReason: okd ? "N/A" : s.result === "rejected_size" ? "File too large" : "Unsupported format", enabler: "N/A" }))];
      }
      case "registration_completed":
        return [ev("vat registration - Submitted", core({ result: "Success", failReason: "N/A", enabler: "N/A", attemptNumber: 1,
          isFirstAttempt: s.first_attempt_success === "true" ? "Yes" : "No", usedDraft: "No", sessionsToSubmit: 1,
          completionTimeTier: completion(now - (st.regStartedAt || now)) })),
          ev("application - Status Changed", core({ serviceName: "VAT Registration", newStatus: "In-Review", daysInReviewTier: "0-5 days" }))];
      case "filing_started":
        st.filingStartedAt = now; st.usedDraft = false; st.stepsDone = {};
        return [ev(svcKey(s.return_type) + " - Started", core({ entryPoint: s.entry_point === "reminder" ? "Correspondence Link" : s.entry_point === "deep_link" ? "Search" : "Taxable Person Dashboard",
          applicationType: "New", attemptNumber: 1 }))];
      case "filing_step_viewed":
        return [];                      // screens are carried by the view itself
      case "filing_step_completed": {
        var sec = STEP[s.step_key]; if (!sec) { return []; }
        var visit = st.stepsDone[sec] || (s.attempt_no && s.attempt_no !== "1") ? "Revisit" : "First Visit";
        st.stepsDone[sec] = true;
        var list = [];
        // Net VAT Due is the computed summary shown on the portal's review step.
        if (sec === "Review and Declaration") { list = list.concat(sectionDone("vat return", "Net VAT Due", VAT_SECTIONS, "First Visit", 30000)); }
        return list.concat(sectionDone("vat return", sec, VAT_SECTIONS, visit, extra.dur ? extra.dur * 1000 : null));
      }
      case "filing_step_skipped":
        return [ev("vat return - Step Skipped", core({ stepName: STEP[s.step_key] || s.step_key, stepIndex: VAT_SECTIONS.indexOf(STEP[s.step_key]) + 1,
          skipReason: s.skip_reason === "will_complete_later" ? "Optional - Provide Later" : "Not Applicable" }))];
      case "filing_draft_saved": {
        st.usedDraft = true;
        var ds = STEP[s.step_key] || "Taxable Person Details"; var idx = VAT_SECTIONS.indexOf(ds) + 1;
        return [ev("vat return - Draft Saved", core({ lastStepName: ds, stepIndex: idx, progressTier: ["0-25%", "25-50%", "50-75%", "75-99%"][Math.min(3, Math.floor((idx - 1) / VAT_SECTIONS.length * 4))],
          saveTrigger: s.autosave === "true" ? "Autosave" : "Manual Save" }))];
      }
      case "filing_draft_resumed": {
        st.usedDraft = true; st.sessions += 1;
        var rsn = STEP[s.step_key] || "Taxable Person Details";
        return [ev("vat return - Draft Resumed", core({ resumedAtStep: rsn, stepIndex: VAT_SECTIONS.indexOf(rsn) + 1,
          daysSinceSaveTier: s.gap_band === "1-7d" ? "1-3 days" : s.gap_band === ">7d" ? "4-14 days" : "Same day", resumeEntryPoint: "My Drafts" }))];
      }
      case "filing_validation_error": {
        var et = s.error_code === "E101_FORMAT" ? "Invalid format" : s.error_code === "E402_REQUIRED" ? "Mandatory field missing" : s.field === "date_range" ? "Date out of range" : "Amount mismatch";
        return [ev("form - Validation Error", core({ serviceName: "VAT Return", stepName: STEP[s.step_key] || s.step_key, errorType: et,
          fieldGroup: s.field === "trn" ? "Identification" : s.field === "date_range" ? "Dates" : "Financial Amounts" }))];
      }
      case "filing_submitted": {
        var sv = svcKey(s.return_type);
        var seg = core({ result: "Success", failReason: "N/A", enabler: "N/A", attemptNumber: 1,
          isFirstAttempt: s.first_attempt_success === "true" ? "Yes" : "No", usedDraft: st.usedDraft ? "Yes" : "No",
          sessionsToSubmit: st.sessions, completionTimeTier: completion(now - (st.filingStartedAt || now)) });
        seg.filingWindow = filingWindow(s.filed_on_time);
        var sum = typeof extra.sum === "number" ? BAND_BY_INDEX[extra.sum] || 5000 : undefined;
        return [ev(sv + " - Submitted", seg, sum ? { sum: sum } : null),
          ev("correspondence - Opened", core({ correspondenceType: "Submission Acknowledgement", channel: "In-app Inbox" }))];
      }
      case "filing_submission_failed": {
        var fr2 = s.error_code === "S408_TIMEOUT" ? "Session expired" : s.error_code === "S409_DUPLICATE" ? "Duplicate application" : "Enabler timeout";
        return [ev(svcKey(s.return_type) + " - Submitted", core({ result: "Fail", failReason: fr2, enabler: fr2 === "Enabler timeout" ? "EmaraTax Core" : "N/A",
          attemptNumber: 1, isFirstAttempt: "Yes", usedDraft: st.usedDraft ? "Yes" : "No", sessionsToSubmit: st.sessions,
          completionTimeTier: completion(now - (st.filingStartedAt || now)) }))];
      }
      case "payment_started": {
        var pm = s.method === "Card" || s.method === "eDirham" ? "Card via Magnati" : "GIBAN Bank Transfer";
        st.paymentMethod = pm;
        return [ev("tax payment - Started", core({ liabilityType: "VAT", paymentScope: "Pay All" })),
          ev("tax payment - Method Selected", core({ paymentMethod: pm }))];
      }
      case "payment_completed":
        return [ev("tax payment - Main", core({ liabilityType: "VAT", paymentMethod: st.paymentMethod || "Card via Magnati", result: "Success",
          failReason: "N/A", enabler: "N/A", isOverdue: s.on_time === "false" ? "Yes" : "No" }), { sum: BAND_AED[s.amount_band] || (typeof extra.sum === "number" ? BAND_BY_INDEX[extra.sum] : 5000) })];
      case "payment_failed":
        return [ev("tax payment - Main", core({ liabilityType: "VAT", paymentMethod: st.paymentMethod || "Card via Magnati", result: "Fail",
          failReason: s.error_code === "P202_3DS_TIMEOUT" ? "3-D Secure failed" : s.error_code === "P303_INSUFFICIENT" ? "Card declined" : "Card declined",
          enabler: (st.paymentMethod || "Card via Magnati") === "Card via Magnati" ? "Magnati Payment Gateway" : "Central Bank GIBAN", isOverdue: "No" }))];
      case "help_opened":
        if (s.surface === "FAQ" || s.surface === "Guided Help") {
          var cv = s.context_view || "";
          return [ev("help - User Guide Opened", core({ guideTopic: cv.indexOf("/payments") === 0 ? "Payments via GIBAN" : cv.indexOf("/register") === 0 ? "Corporate Tax Registration" : "VAT Return Filing" }))];
        }
        return [];
      case "chatbot_session_ended":
        return [ev("support - Chatbot Used", core({ intent: { filing: "Filing deadline", payment: "Payment methods", registration: "UAE PASS login", refund: "Refund status" }[s.topic] || "Filing deadline",
          resolved: s.resolved === "true" ? "Yes" : "No", escalatedToAgent: "No" }))];
      case "support_ticket_created":
        return [ev("support - Chatbot Used", core({ intent: { filing: "Filing deadline", payment: "Payment methods", registration: "UAE PASS login", refund: "Refund status" }[s.topic] || "Filing deadline",
          resolved: "No", escalatedToAgent: "Yes" }))];
      case "reminder_opened":
        return [ev("correspondence - Opened", core({ correspondenceType: s.reminder_type === "payment_due" ? "Tax Liability Notification" : s.reminder_type === "document_missing" ? "Additional Information Request" : "Filing Deadline Reminder",
          channel: "Email" }))];
      case "refund_requested":
        return [];                      // business VAT refunds are not in the EmaraTax demo model
      default:
        return [ev(key, s, extra)];     // unknown keys pass through (and show as Unplanned in Data hub)
    }
  }

  function mapView(name) { return VIEWS[name] || name; }

  // Profile: portal persona properties -> model custom.* properties (unmapped ones pass through).
  function mapUser(custom) {
    var out = {}; var k;
    for (k in custom) { if (Object.prototype.hasOwnProperty.call(custom, k)) { out[k] = custom[k]; } }
    if (custom.taxpayer_type) {
      st.taxpayerType = custom.taxpayer_type;
      out.userType = persona(); out.entityType = entityType();
      out.businessSize = { Individual: "Not Applicable", SME: "Small (AED 3M-50M)", "Large Business": "Large (> AED 250M)", "Tax Agent": "Small (AED 3M-50M)" }[custom.taxpayer_type];
      delete out.taxpayer_type;
    }
    if (custom.preferred_language) { out.portalLanguage = custom.preferred_language === "ar" ? "Arabic" : "English"; delete out.preferred_language; }
    if (custom.filing_frequency) { out.vatFilingFrequency = custom.filing_frequency === "Monthly" ? "Monthly" : "Quarterly"; delete out.filing_frequency; }
    if (custom.agent_managed) { out.hasTaxAgent = custom.agent_managed === "true" ? "Yes" : "No"; delete out.agent_managed; }
    if (custom.registration_status) { out.registeredTaxTypes = custom.registration_status === "Registered" ? "VAT + Corporate Tax" : "None"; delete out.registration_status; }
    if (custom.ab_variant) { out.formLayoutVariant = custom.ab_variant; delete out.ab_variant; }
    if (custom.emirate) { out.emirate = custom.emirate; }
    if (!out.primaryLoginMethod && custom.taxpayer_type) { out.primaryLoginMethod = "UAE PASS"; out.uaePassAccountType = "Verified (Emirates ID)"; }
    return out;
  }
  function mapUserKey(key, value) {
    var o = {}; o[key] = value; var m = mapUser(o); var ks = Object.keys(m);
    return ks.length ? { key: ks[0], value: m[ks[0]] } : { key: key, value: value };
  }

  window.EMARATAX_BRIDGE = { mapEvent: mapEvent, mapView: mapView, mapUser: mapUser, mapUserKey: mapUserKey };
})();
