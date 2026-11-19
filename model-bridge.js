/* =====================================================================
 *  R01 model bridge
 *  The portal was written against the DTA demo taxonomy (snake_case keys). It sends to the
 *  "UAE Tax e-Services (R01)" app on trial-uaetaxauthority.count.ly, whose tracking plan is the
 *  e-Services Portal data model R01 from the Tax e-Services Behavioural Ontology v0.1
 *  (UAE-FTA-Demo/oktay-handover/handover/spec/uae_tax_ontology_v0.1.yaml). app.js hands every
 *  event, view and user property to this bridge, which returns the R01 equivalent(s):
 *    - events   -> 0..n R01 events. A VAT return is ONE outcome ("taxReturn - Filing") that
 *                  carries the journey: steps, validation errors, draft use, sessions, duration.
 *    - views    -> plain section names (views carry section timing in R01)
 *    - profile  -> the TAXPAYER and TRUST context providers only; nothing else is sent
 *  Every event also carries the SESSION / TEMPORAL context: actingAs, filingWindow, taxPeriod.
 *  Tested with the spec's own validator: UAE-FTA-Demo/portal-v2/test-bridge-r01.mjs.
 * ===================================================================== */
(function () {
  "use strict";

  var STEP = {               // portal step_key -> VAT 201 step in R01 (taxReturn.vatReturnStep)
    taxpayer_details: "Taxable Person Details",
    supplies: "VAT on Sales and All Other Outputs",
    purchases: "VAT on Expenses and All Other Inputs",
    adjustments: "Additional Reporting Requirements",
    review: "Review and Declaration"
  };
  var VIEWS = {
    "/home": "Home", "/login": "Login", "/register": "Tax Registration", "/register/identity": "Tax Registration > Identification Details",
    "/register/documents": "Tax Registration > Documents", "/register/review": "Tax Registration > Review and Declaration",
    "/dashboard": "Dashboard", "/returns": "Returns", "/returns/new": "VAT Return > Start",
    "/returns/taxpayer-details": "VAT Return > Taxable Person Details", "/returns/supplies": "VAT Return > VAT on Sales and All Other Outputs",
    "/returns/purchases": "VAT Return > VAT on Expenses and All Other Inputs", "/returns/adjustments": "VAT Return > Additional Reporting Requirements",
    "/returns/review": "VAT Return > Review and Declaration", "/returns/submitted": "VAT Return > Acknowledgement",
    "/payments": "Payments", "/payments/confirm": "Payments > Confirm", "/payments/receipt": "Payments > Receipt",
    "/refunds": "Refunds", "/profile": "Profile", "/support/faq": "Help Centre", "/support/chat": "Virtual Assistant", "/support/ticket": "Support"
  };
  var AMOUNT_BAND = { "<10k": "< 10K", "10k-50k": "10K–50K", "50k-250k": "50K–250K", ">250k": "250K–1M" };
  var AMOUNT_BY_INDEX = [null, "< 10K", "10K–50K", "50K–250K", "250K–1M"];
  var TOPIC = { filing: "Filing", payment: "Payment", registration: "Registration", refund: "Refund" };
  var FEATURE = { Filing: "Tax Return", Payment: "Payment", Registration: "Registration", Refund: "Refund" };

  // Session state the R01 outcome events need but individual portal events don't carry.
  var st = { loginMethod: "UAE PASS", taxpayerType: "SME", frequency: "Monthly", loginAttempts: 0,
    filingStartedAt: null, draftUsed: false, sessions: 1, lastStep: "N/A", errors: 0, topError: "N/A", skipped: {},
    regStartedAt: null, docsRejected: 0, paymentMethod: "Card", savedAt: null };

  function resetFiling() { st.filingStartedAt = Date.now(); st.draftUsed = false; st.sessions = 1; st.lastStep = "N/A"; st.errors = 0; st.topError = "N/A"; st.skipped = {}; }
  function actingAs() { return st.taxpayerType === "Tax Agent" ? "On Behalf of Client" : "Self"; }
  // Next VAT due date: the 28th. Dubai midnight = 20:00 UTC the day before.
  function filingWindow(onTime) {
    if (onTime === "false") { return "Overdue"; }
    var now = new Date(); var due = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 28, 20));
    if (due < now) { due = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 28, 20)); }
    var d = (due - now) / 86400000;
    return d <= 3 ? "Final 3 Days" : d <= 10 ? "Filing Window Open" : "Outside Filing Window";
  }
  // R01's taxPeriod list holds example periods only ("2026-Q3", "2026-09", "FY2025"); the period
  // being filed now is not in it yet, so live portal events send N/A.
  function ctx(extra) {
    var c = { actingAs: actingAs(), filingWindow: filingWindow(), taxPeriod: "N/A" };
    for (var k in extra) { if (Object.prototype.hasOwnProperty.call(extra, k)) { c[k] = extra[k]; } }
    return c;
  }
  function outcome(ok, failReason, enabler) {
    return { result: ok ? "Success" : "Fail", failReason: ok ? "N/A" : failReason, failedEnabler: !ok && failReason === "Enabler error" ? enabler : "N/A" };
  }
  function merge(a, b) { var o = {}, k; for (k in a) { o[k] = a[k]; } for (k in b) { o[k] = b[k]; } return o; }
  function ev(key, seg) { return { key: key, segmentation: seg }; }
  function duration(ms) { var s = ms / 1000; return s < 900 ? "< 15 min" : s < 3600 ? "15–60 min" : s < 86400 ? "1–24 h" : s < 604800 ? "1–7 days" : "7+ days"; }
  function errorTier(n) { return n === 0 ? "0" : n === 1 ? "1" : n <= 3 ? "2–3" : "4+"; }
  function skippedTier() {
    var e = !!st.skipped["VAT on Expenses and All Other Inputs"], a = !!st.skipped["Additional Reporting Requirements"];
    return e && a ? "Both" : e ? "Expenses and Inputs" : a ? "Additional Reporting" : "None";
  }
  function taxPeriodType() { return st.frequency === "Monthly" ? "Monthly" : st.frequency === "Quarterly" ? "Quarterly" : "Annual"; }
  function helpTopic(view) {
    view = view || "";
    return view.indexOf("/payments") === 0 ? "Payments" : view.indexOf("/register") === 0 ? "Registration" : view.indexOf("/refunds") === 0 ? "Refunds" : "VAT Return Filing";
  }
  function helpFeature(view) {
    view = view || "";
    return view.indexOf("/returns") === 0 ? "Tax Return" : view.indexOf("/payments") === 0 ? "Payment" : view.indexOf("/register") === 0 ? "Registration" : view.indexOf("/refunds") === 0 ? "Refund" : "None";
  }

  function mapEvent(key, s, extra) {
    s = s || {}; extra = extra || {};
    var now = Date.now();
    switch (key) {
      case "login": {
        st.loginMethod = s.method === "UAE Pass" ? "UAE PASS" : "Email and Password";
        st.loginAttempts += 1;
        var ok = s.result === "success";
        var uae = st.loginMethod === "UAE PASS";
        var fr = s.failure_reason === "otp_timeout" ? (uae ? "UAE PASS timeout" : "OTP expired") : s.failure_reason === "locked" ? "Account locked" : uae ? "UAE PASS request declined" : "Wrong password";
        var out = [ev("user - Access Control Started", ctx({ entryPoint: "Landing Page", accessType: "Login" }))];
        if (!uae) {
          var otpOk = !(s.failure_reason === "otp_timeout");
          out.push(ev("app - OTP Verification Started", ctx({ triggerContext: "Login", otpChannel: "SMS" })));
          out.push(ev("app - OTP Verification", ctx(merge({ resendAttempts: "0" }, outcome(otpOk, "Code expired")))));
        }
        out.push(ev("user - Access Control", ctx(merge({ loginMethod: st.loginMethod, attemptNumber: st.loginAttempts >= 4 ? "4+" : String(st.loginAttempts) }, outcome(ok, fr, "uaePass")))));
        if (ok) { st.loginAttempts = 0; }
        return out;
      }
      case "portal_account_created":           // presenter panel: "Welcome" message
        return [ev("app - Registration Started", ctx({ registrationMethod: st.loginMethod, entryPoint: "Landing Page" })),
          ev("app - Registration", ctx(merge({ registrationMethod: st.loginMethod, failedAtStep: "N/A", totalDurationTier: "1–5 min" }, outcome(true))))];
      case "registration_started":
        st.regStartedAt = now; st.docsRejected = 0;
        return [ev("taxRegistration - Application Started", ctx({ taxType: "VAT", applicantType: st.taxpayerType === "Individual" ? "Natural Person" : "Legal Person", registrationBasis: "Mandatory", applicationType: "New" }))];
      case "registration_step_completed":
        return [];                             // R01: the journey is carried by the application outcome
      case "registration_document_uploaded": {
        var okd = s.result === "accepted";
        if (!okd) { st.docsRejected += 1; }
        var dt = { "Trade Licence": "Trade Licence", "Emirates ID": "Emirates ID", Passport: "Passport", "Bank Letter": "Bank Letter", "Lease Contract": "Lease Contract", "Memorandum of Association": "Memorandum of Association", "Financial Statements": "Financial Statements" }[s.doc_type] || "Other";
        return [ev("utility - Document Upload", ctx(merge({ associatedFeatureOrService: "Tax Registration", documentType: dt, fileSizeTier: s.result === "rejected_size" ? "25 MB+" : "1–5 MB" },
          outcome(okd, s.result === "rejected_size" ? "File too large" : "Unsupported format", "documentService"))))];
      }
      case "registration_completed":
        return [ev("taxRegistration - Application", ctx(merge({ taxType: "VAT", failedAtStep: "N/A", documentsRejectedCount: st.docsRejected >= 2 ? "2+" : String(st.docsRejected), draftUsed: "No",
          totalDurationTier: duration(now - (st.regStartedAt || now)) }, outcome(true))))];
      case "filing_started":
        resetFiling();
        return [ev("taxReturn - Filing Started", ctx({ taxType: s.return_type === "Corporate Tax" ? "Corporate Tax" : "VAT", filingType: "Original", taxPeriodType: taxPeriodType(),
          entryPoint: s.entry_point === "reminder" ? "Reminder Link" : s.entry_point === "deep_link" ? "Deep Link" : s.entry_point === "returns_list" ? "Returns List" : "Dashboard" }))];
      case "filing_step_viewed":
        return [];                             // section timing comes from the view
      case "filing_step_completed": {
        var sec = STEP[s.step_key];
        if (sec) { st.lastStep = sec; }
        if (s.attempt_no && s.attempt_no !== "1") { st.sessions = Math.max(st.sessions, 1); }
        return [];
      }
      case "filing_step_skipped":
        if (STEP[s.step_key]) { st.skipped[STEP[s.step_key]] = true; }
        return [];
      case "filing_validation_error": {
        st.errors += 1;
        st.topError = s.error_code === "E101_FORMAT" ? "Invalid format" : s.error_code === "E402_REQUIRED" ? "Mandatory field missing" : s.error_code === "E301_RANGE" ? "Amount out of range" : "Amount mismatch";
        return [];                             // carried by validationErrorCount on the outcome
      }
      case "filing_draft_saved": {
        st.draftUsed = true; st.savedAt = now;
        return [ev("taxReturn - Management", ctx(merge({ managementAction: "Draft Saved", saveTrigger: s.autosave === "true" ? "Autosave" : "Manual",
          stepAtAction: STEP[s.step_key] || "Taxable Person Details", daysSinceSaveTier: "N/A" }, outcome(true))))];
      }
      case "filing_draft_resumed": {
        st.draftUsed = true; st.sessions += 1;
        return [ev("taxReturn - Management", ctx(merge({ managementAction: "Draft Resumed", saveTrigger: "N/A", stepAtAction: STEP[s.step_key] || "Taxable Person Details",
          daysSinceSaveTier: s.gap_band === "1-7d" ? "1–7 days" : s.gap_band === ">7d" ? "8+ days" : "Same Day" }, outcome(true))))];
      }
      case "filing_submitted": {
        var amt = typeof extra.sum === "number" ? AMOUNT_BY_INDEX[extra.sum] || "< 10K" : "< 10K";
        var seg = ctx(merge({ taxType: s.return_type === "Corporate Tax" ? "Corporate Tax" : "VAT", lastCompletedStep: "Review and Declaration", failedAtStep: "N/A",
          optionalStepsSkipped: skippedTier(), validationErrorCount: errorTier(st.errors), topValidationErrorType: st.errors ? st.topError : "N/A",
          draftUsed: st.draftUsed ? "Yes" : "No", sessionsToSubmit: st.sessions >= 3 ? "3+" : String(st.sessions), netPosition: "Payable", amountTier: amt,
          totalDurationTier: duration(now - (st.filingStartedAt || now)) }, outcome(true)));
        seg.filingWindow = filingWindow(s.filed_on_time);
        return [ev("taxReturn - Filing", seg)];
      }
      case "filing_submission_failed": {
        var fr2 = s.error_code === "S408_TIMEOUT" ? "Session expired" : s.error_code === "S409_DUPLICATE" ? "Duplicate submission" : "Enabler error";
        return [ev("taxReturn - Filing", ctx(merge({ taxType: s.return_type === "Corporate Tax" ? "Corporate Tax" : "VAT", lastCompletedStep: st.lastStep, failedAtStep: "Review and Declaration",
          optionalStepsSkipped: skippedTier(), validationErrorCount: errorTier(st.errors), topValidationErrorType: st.errors ? st.topError : "N/A",
          draftUsed: st.draftUsed ? "Yes" : "No", sessionsToSubmit: st.sessions >= 3 ? "3+" : String(st.sessions), netPosition: "Payable", amountTier: "< 10K",
          totalDurationTier: duration(now - (st.filingStartedAt || now)) }, outcome(false, fr2, "coreTaxSystem"))))];
      }
      case "payment_started":
        st.paymentMethod = s.method === "eDirham" ? "eDirham" : s.method === "Card" ? "Card" : "GIBAN Bank Transfer";
        return [ev("payment - Transaction Started", ctx({ paymentType: "Tax Liability", liabilityType: "VAT", paymentScope: "Pay All", entryPoint: "Dashboard" }))];
      case "payment_completed":
        return [ev("payment - Transaction", ctx(merge({ paymentMethod: st.paymentMethod, amountTier: AMOUNT_BAND[s.amount_band] || (typeof extra.sum === "number" ? AMOUNT_BY_INDEX[extra.sum] : "< 10K") || "< 10K",
          isOverdue: s.on_time === "false" ? "Yes" : "No", authMethodUsed: st.paymentMethod === "Card" ? "3-D Secure" : "None", failedAtStep: "N/A" }, outcome(true))))];
      case "payment_failed":
        return [ev("payment - Transaction", ctx(merge({ paymentMethod: st.paymentMethod, amountTier: "< 10K", isOverdue: "No", authMethodUsed: st.paymentMethod === "Card" ? "3-D Secure" : "None",
          failedAtStep: "Authentication" }, outcome(false, s.error_code === "P202_3DS_TIMEOUT" ? "3-D Secure failed" : s.error_code === "P303_INSUFFICIENT" ? "Insufficient funds" : "Card declined"))))];
      case "help_opened":
        if (s.surface === "Chatbot") {
          return [ev("app - Advisor Started", ctx({ advisorTopic: helpTopic(s.context_view) === "Payments" ? "Payment" : helpTopic(s.context_view) === "Registration" ? "Registration" : "Filing", contextFeature: helpFeature(s.context_view) === "None" ? "Dashboard" : helpFeature(s.context_view) }))];
        }
        return [ev("content - Explored", ctx({ contentType: s.surface === "Guided Help" ? "Guided Help" : s.surface === "User Guide" ? "User Guide" : "FAQ", contentTopic: helpTopic(s.context_view),
          contextFeature: helpFeature(s.context_view), contextStep: STEP[(s.context_view || "").replace("/returns/", "")] || "N/A" }))];
      case "chatbot_session_ended": {
        var topic = TOPIC[s.topic] || "Filing"; var resolved = s.resolved === "true";
        return [ev("app - Advisor", ctx(merge({ queryIntent: "How To", resolved: resolved ? "Yes" : "No", actionTaken: resolved ? "None" : "Handed to Support Inquiry" }, outcome(resolved, "Escalated"))))];
      }
      case "support_ticket_created": {
        var t2 = TOPIC[s.topic];
        return [ev("app - Form Submission Started", ctx({ formType: "Service Request", associatedFeatureOrService: t2 ? FEATURE[t2] === "Tax Return" ? "Tax Return" : FEATURE[t2] : "Support Inquiry", entryPoint: "Help Centre" })),
          ev("app - Form Submission", ctx(outcome(true)))];
      }
      case "reminder_opened":
        return [ev("app - Deep Link Opened", ctx({ linkType: s.reminder_type === "payment_due" ? "Payment Due Reminder" : s.reminder_type === "document_missing" ? "Additional Information Request" : "Filing Deadline Reminder",
          linkChannel: "Email", daysToDeadlineTier: s.days_before ? (+s.days_before <= 3 ? "0–3" : +s.days_before <= 10 ? "4–10" : "11+ days") : "N/A" }))];
      case "refund_requested": {
        var rt = s.reason === "duplicate_payment" ? "Duplicate Payment" : s.reason === "correction" ? "Correction" : "Excess Input Tax";
        return [ev("refund - Request Started", ctx({ refundType: rt, entryPoint: "Refunds" })),
          ev("refund - Request", ctx(merge({ refundType: rt, amountTier: AMOUNT_BAND[s.amount_band] || "10K–50K", documentsUploadedCount: "0" }, outcome(true))))];
      }
      default:
        return [];                             // not in R01: nothing is sent (the feed says so)
    }
  }

  function mapView(name) { return VIEWS[name] || name; }

  // Profile: only R01 TAXPAYER + TRUST context providers leave the browser.
  function mapUser(custom) {
    var out = {};
    if (custom.taxpayer_type) {
      st.taxpayerType = custom.taxpayer_type;
      out.userType = { Individual: "Individual", "Tax Agent": "Tax Agent" }[custom.taxpayer_type] || "Taxable Person";
      out.entityType = { Individual: "Natural Person", "Large Business": "PJSC" }[custom.taxpayer_type] || "LLC";
      out.businessSizeTier = { Individual: "N/A", "Large Business": "Large (> AED 250M)" }[custom.taxpayer_type] || "Small (AED 3M–50M)";
      out.clientCountTier = custom.taxpayer_type === "Tax Agent" ? "21–100" : "N/A";
      out.loginMethod = st.loginMethod;
      out.uaePassAccountLevel = st.loginMethod === "UAE PASS" ? "Verified (SOP3)" : "N/A";
      out.analyticsConsent = "Granted";
    }
    if (custom.registration_status) {
      out.registeredTaxTypes = custom.registration_status !== "Registered" ? "None" : st.taxpayerType === "Individual" ? "VAT" : "VAT + Corporate Tax";
    }
    if (custom.filing_frequency) {
      st.frequency = custom.filing_frequency;
      out.vatFilingFrequency = custom.filing_frequency === "Monthly" || custom.filing_frequency === "Quarterly" ? custom.filing_frequency : "N/A";
    }
    if (custom.emirate) { out.emirate = custom.emirate; }
    if (custom.agent_managed) { out.hasTaxAgent = custom.agent_managed === "true" ? "Yes" : "No"; }
    if (custom.returns_filed_count !== undefined) {
      var n = +custom.returns_filed_count;
      out.filingHistoryTier = n === 0 ? "First-time Filer" : n <= 4 ? "1–4" : n <= 12 ? "5–12" : "13+";
    }
    if (custom.on_time_rate_band) {
      out.onTimeFilingRateTier = { "0-50%": "< 50%", "50-80%": "50–80%", "80-95%": "80–95%", "95-100%": "95%+" }[custom.on_time_rate_band] || "80–95%";
    }
    if (custom.preferred_language) { out.portalLanguage = custom.preferred_language === "ar" ? "Arabic" : "English"; }
    return out;
  }
  // Single property: returns null when it has no R01 equivalent (app.js then sends nothing).
  function mapUserKey(key, value) {
    var o = {}; o[key] = value; var m = mapUser(o); var ks = Object.keys(m);
    return ks.length ? { key: ks[0], value: m[ks[0]] } : null;
  }

  window.EMARATAX_BRIDGE = { mapEvent: mapEvent, mapView: mapView, mapUser: mapUser, mapUserKey: mapUserKey, model: "R01" };
})();
