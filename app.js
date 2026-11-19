/* =====================================================================
 *  e-Services Portal (Demo) - Countly Web SDK instrumentation
 *  ---------------------------------------------------------------------
 *  Every event key, segmentation key/value, view name, user property and
 *  the A/B test key below are taken verbatim from ../taxonomy.json.
 *  Do not "tidy" them - the dashboards, funnels and cohorts in Countly
 *  are built against these exact strings.
 *
 *  SDK version targeted: countly-sdk-web 26.x (jsDelivr @latest).
 *  Methods used (all verified against the shipped SDK):
 *    Countly.init / track_sessions / track_view / track_clicks /
 *    track_scrolls / track_links / track_errors / add_log / log_error /
 *    add_event / start_event / end_event / user_details / userData.* /
 *    fetch_remote_config / get_remote_config / change_id /
 *    report_trace / get_device_id / sdk_version
 * ===================================================================== */

(function () {
  "use strict";

  /* ==================================================================
   * 0. Config
   * ================================================================== */

  var CFG = window.DTA_DEMO_CONFIG || {};
  var APP_KEY = CFG.APP_KEY || "REPLACE_WITH_APP_KEY";
  var COUNTLY_URL = CFG.COUNTLY_URL || "https://demo-ui.count.ly";
  var AB_KEY = CFG.AB_TEST_KEY || "filing_form_layout";
  var AB_VARIANTS = CFG.AB_VARIANTS || ["control", "variant_a_fewer_fields", "variant_b_guided"];
  var RC_TIMEOUT = CFG.REMOTE_CONFIG_TIMEOUT_MS || 4000;

  var LS = {
    device: "dta_demo_device_id",
    lang: "dta_demo_lang",
    persona: "dta_demo_persona",
    variant: "dta_demo_local_variant",
    draft: "dta_demo_draft",
    identified: "dta_demo_identified"
  };

  /* ==================================================================
   * 1. Taxonomy-derived tables (keep in sync with taxonomy.json)
   * ================================================================== */

  var RETURN_TYPE = "VAT";
  var PERIOD = "2026-Q3";                 // one of 2026-Q1 | 2026-Q2 | 2026-Q3
  var DUE_DATE = new Date("2026-10-28T23:59:00Z");

  var STEPS = [
    { key: "taxpayer_details", index: "1", route: "/returns/taxpayer-details", optional: false },
    { key: "supplies",         index: "2", route: "/returns/supplies",         optional: false },
    { key: "purchases",        index: "3", route: "/returns/purchases",        optional: true  },
    { key: "adjustments",      index: "4", route: "/returns/adjustments",      optional: true  },
    { key: "review",           index: "5", route: "/returns/review",           optional: false }
  ];

  // help_opened.context_view only accepts these values
  var HELP_CONTEXTS = ["/returns/supplies", "/returns/review", "/payments", "/register/documents"];

  /* --- Registration & onboarding -----------------------------------
   * The taxonomy has five registration step_keys but the brief lists
   * four routes, so /register/identity hosts the identity, contact and
   * business_details sub-steps. Every step_key is still reachable.
   * ----------------------------------------------------------------- */
  var REG_STEPS = [
    { key: "identity",         index: "1", route: "/register/identity",  label: "Identity" },
    { key: "contact",          index: "2", route: "/register/identity",  label: "Contact" },
    { key: "business_details", index: "3", route: "/register/identity",  label: "Business details" },
    { key: "documents",        index: "4", route: "/register/documents", label: "Documents" },
    { key: "review",           index: "5", route: "/register/review",    label: "Review" }
  ];

  var REG_METHODS = ["UAE Pass", "Email", "In-person code"];
  var REG_CHANNELS = ["Web Portal", "Mobile App"];

  var DOC_TYPES = ["Trade Licence", "Emirates ID", "Bank Letter", "Lease Contract"];

  // Fake "files". No real file input anywhere - picking a fabricated
  // filename is what drives the accepted / rejected_format / rejected_size
  // outcome, so nothing from the presenter's machine is ever touched.
  var FAKE_FILES = [
    { name: "demo-document.pdf",        result: "accepted",        note: "PDF, 1.2 MB — accepted" },
    { name: "demo-document.png",        result: "accepted",        note: "PNG, 0.8 MB — accepted" },
    { name: "demo-document.bmp",        result: "rejected_format", note: "BMP — unsupported format" },
    { name: "demo-photo.heic",          result: "rejected_format", note: "HEIC — unsupported format" },
    { name: "demo-scan-huge.pdf",       result: "rejected_size",   note: "PDF, 41 MB — over the 25 MB limit" }
  ];

  var PERSONAS = [
    {
      id: "individual",
      label: "Individual · Dubai · first-time filer",
      name: "Demo Taxpayer (Individual)",
      username: "demo_individual",
      props: {
        taxpayer_type: "Individual", registration_status: "Registered", trn_prefix: "100",
        emirate: "Dubai", filing_frequency: "Annual", first_time_filer: "true",
        returns_filed_count: 0, on_time_rate_band: "0-50%",
        channel_preference: "Mobile App", agent_managed: "false"
      }
    },
    {
      id: "sme",
      label: "SME · Sharjah · monthly filer",
      name: "Demo Trading LLC (SME)",
      username: "demo_sme",
      props: {
        taxpayer_type: "SME", registration_status: "Registered", trn_prefix: "200",
        emirate: "Sharjah", filing_frequency: "Monthly", first_time_filer: "false",
        returns_filed_count: 14, on_time_rate_band: "80-95%",
        channel_preference: "Both", agent_managed: "false"
      }
    },
    {
      id: "large",
      label: "Large Business · Abu Dhabi · quarterly",
      name: "Demo Holding PJSC (Large Business)",
      username: "demo_large",
      props: {
        taxpayer_type: "Large Business", registration_status: "Registered", trn_prefix: "300",
        emirate: "Abu Dhabi", filing_frequency: "Quarterly", first_time_filer: "false",
        returns_filed_count: 42, on_time_rate_band: "95-100%",
        channel_preference: "Web Portal", agent_managed: "true"
      }
    },
    {
      id: "agent",
      label: "Tax Agent · Dubai · files for clients",
      name: "Demo Tax Agents FZ (Agent)",
      username: "demo_agent",
      props: {
        taxpayer_type: "Tax Agent", registration_status: "Registered", trn_prefix: "300",
        emirate: "Dubai", filing_frequency: "Quarterly", first_time_filer: "false",
        returns_filed_count: 120, on_time_rate_band: "95-100%",
        channel_preference: "Web Portal", agent_managed: "true"
      }
    },
    {
      id: "pending",
      label: "SME · Ras Al Khaimah · documents pending",
      name: "Demo Workshop LLC (Pending)",
      username: "demo_pending",
      props: {
        taxpayer_type: "SME", registration_status: "Pending Documents", trn_prefix: "200",
        emirate: "Ras Al Khaimah", filing_frequency: "Quarterly", first_time_filer: "true",
        returns_filed_count: 0, on_time_rate_band: "0-50%",
        channel_preference: "Mobile App", agent_managed: "false"
      }
    }
  ];

  /* ==================================================================
   * 2. i18n (en / ar). Arabic strings are demo copy, not official text.
   * ================================================================== */

  var I18N = {
    en: {
      brand: "e-Services Portal", brandDemo: "Demo", persona: "Taxpayer persona",
      abBadgeLabel: "A/B layout", langBtn: "العربية",
      nav_home: "Home", nav_login: "Sign in", nav_register: "Register",
      nav_dashboard: "Dashboard", nav_returns: "Returns", nav_payments: "Payments",
      nav_refunds: "Refunds", nav_profile: "Profile", nav_support: "Support",
      next: "Continue", back: "Back", saveDraft: "Save draft", skipStep: "Skip this step",
      help: "Need help?", submit: "Submit return"
    },
    ar: {
      brand: "بوابة الخدمات الإلكترونية", brandDemo: "عرض توضيحي", persona: "نوع المكلّف",
      abBadgeLabel: "تجربة التصميم", langBtn: "English",
      nav_home: "الرئيسية", nav_login: "تسجيل الدخول", nav_register: "التسجيل",
      nav_dashboard: "لوحة المعلومات", nav_returns: "الإقرارات", nav_payments: "المدفوعات",
      nav_refunds: "الاستردادات", nav_profile: "الملف الشخصي", nav_support: "الدعم",
      next: "متابعة", back: "رجوع", saveDraft: "حفظ المسودة", skipStep: "تخطي هذه الخطوة",
      help: "هل تحتاج مساعدة؟", submit: "إرسال الإقرار"
    }
  };

  function t(key) {
    var pack = I18N[state.lang] || I18N.en;
    return pack[key] || I18N.en[key] || key;
  }

  /* ==================================================================
   * 3. State
   * ================================================================== */

  var state = {
    lang: read(LS.lang) || "en",
    personaId: read(LS.persona) || "sme",
    variant: "control",
    variantSource: "pending",          // "remote config" | "local fallback" | "forced (demo)"
    variantResolved: false,
    forcedVariant: "",
    loggedIn: false,
    backendFail: false,
    currentRoute: "/home",
    lastHelpContext: "/returns/supplies",
    filing: null,                      // active return, see startFiling()
    registration: null,                // active registration, see startRegistration()
    optionalOpen: {},                  // step_key -> bool (variant_a "Add details")
    payment: null,
    feedCount: 0,
    sdkOk: false
  };

  // Mutable object handed to Countly.track_errors(); the SDK keeps the
  // reference and merges it into every crash report, so updating these
  // fields keeps the crash segmentation current. Breadcrumbs (add_log)
  // are the documented way to carry screen context - we do both.
  var crashSegments = {
    screen: "/home",
    return_type: RETURN_TYPE,
    app_version: CFG.APP_VERSION || "1.0.0",
    connection: (navigator.connection && navigator.connection.effectiveType) || "unknown"
  };

  function persona() {
    var p = PERSONAS.filter(function (x) { return x.id === state.personaId; })[0];
    return p || PERSONAS[1];
  }

  function read(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function write(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  function drop(k) { try { window.localStorage.removeItem(k); } catch (e) { /* noop */ } }

  /* ==================================================================
   * 4. Device id - fake, non-identifying taxpayer account hash.
   *    NEVER the TRN or Emirates ID (taxonomy: technical_conventions).
   * ================================================================== */

  function randomHash(len) {
    var chars = "0123456789abcdef", out = "";
    var buf = null;
    if (window.crypto && window.crypto.getRandomValues) {
      buf = new Uint8Array(len);
      window.crypto.getRandomValues(buf);
    }
    for (var i = 0; i < len; i++) {
      var n = buf ? buf[i] : Math.floor(Math.random() * 256);
      out += chars[n % 16];
    }
    return out;
  }

  function getDeviceId() {
    var id = read(LS.device);
    if (!id) {
      id = "acct_" + randomHash(24);
      write(LS.device, id);
    }
    return id;
  }

  var DEVICE_ID = getDeviceId();

  /* ==================================================================
   * 5. Countly bootstrap
   * ================================================================== */

  var Countly = window.Countly;
  var SDK_PRESENT = !!(Countly && typeof Countly.init === "function");

  function initCountly() {
    if (!SDK_PRESENT) {
      setSdkStatus("Countly Web SDK did NOT load (CDN blocked or offline). The portal still works, " +
        "but nothing is sent. Check the network tab for countly.min.js.");
      return;
    }

    Countly.init({
      app_key: APP_KEY,                    // <-- comes from config.js
      url: COUNTLY_URL,
      device_id: DEVICE_ID,                // persisted fake account hash
      app_version: CFG.APP_VERSION || "1.0.0",
      debug: CFG.DEBUG !== false,
      require_consent: false,              // demo app: no consent gate
      use_session_cookie: true,
      session_update: 30,                  // heartbeat, keeps the live session honest on stage
      inactivity_time: 5,
      offline_mode: false,
      use_explicit_rc_api: true,           // method=rc remote config API
      rc_automatic_optin_for_ab: true,     // auto-enrol the user in the A/B test on fetch
      namespace: "dta_demo",
      // Hash-routed SPA: report the route as the page URL so click/scroll heatmaps are per screen and the
      // heatmap overlay can load the right screen (domain + "/#/returns/supplies").
      getViewUrl: function () { return "/" + (window.location.hash || "#/home"); },
      // In-app content (campaigns + journeys): poll the content queue every 15 s (SDK minimum).
      content_zone_timer_interval: 15
    });

    // --- Sessions (start/heartbeat/end handled by the SDK) -----------
    Countly.track_sessions();

    // --- Views ------------------------------------------------------
    // NOTE: automatic view tracking is intentionally NOT switched on.
    // In this SDK "automatic" view tracking simply means calling
    // track_pageview() with no arguments, which would report the raw
    // URL/hash. We call Countly.track_view("<exact taxonomy name>")
    // from the router instead so view names match taxonomy.json.

    // --- Heatmaps & scrollmaps --------------------------------------
    // track_clicks() feeds the click heatmap, track_scrolls() feeds the
    // scrollmap. Both emit the internal [CLY]_action event.
    Countly.track_clicks();
    Countly.track_scrolls();
    Countly.track_links();

    // --- Crash / error tracking -------------------------------------
    Countly.track_errors(crashSegments);

    // --- In-app messages, surveys and ratings -----------------------
    // Campaigns and journeys created in Countly are delivered through the SDK content zone:
    // the SDK polls /o/sdk/content and renders whatever the server queues for this profile.
    var enterZone = function () {
      try {
        Countly.content.enterContentZone(function (params) { feed("rc", "in-app content received", params || {}); return true; });
      } catch (e) { console.warn("[demo] enterContentZone failed", e); }
    };
    enterZone();

    // Message buttons (CTAs): the SDK opens every link with window.open(url, "_blank") and leaves the message
    // on screen. For links into this portal, go to the page in the same tab and close the message instead;
    // leaving and re-entering the content zone removes the message and resumes polling.
    try {
      var nativeOpen = window.open;
      window.open = function (url, target, features) {
        // Any link to a portal route (localhost or the public copy) stays in this tab, whichever host it names.
        var hashAt = typeof url === "string" ? url.indexOf("#/") : -1;
        var route = hashAt >= 0 ? url.slice(hashAt + 1).split("?")[0] : "";
        if (route && ROUTES[route]) {
          feed("rc", "in-app message button → " + route, {});
          var frames = document.querySelectorAll("#cly-content-iframe");
          for (var fi = 0; fi < frames.length; fi++) { frames[fi].parentNode.removeChild(frames[fi]); }
          try { Countly.content.exitContentZone(); } catch (e) { /* noop */ }
          window.location.hash = "#" + route;
          window.setTimeout(enterZone, 1500);
          return null;
        }
        return nativeOpen.call(window, url, target, features);
      };
    } catch (e) { console.warn("[demo] CTA handler not installed", e); }

    state.sdkOk = true;
    var v = "unknown";
    try { v = Countly.sdk_version(); } catch (e) { /* noop */ }
    var el = document.getElementById("sdkVersionLine");
    if (el) { el.textContent = "SDK " + v; }

    if (APP_KEY === "REPLACE_WITH_APP_KEY") {
      setSdkStatus("SDK loaded (v" + v + ") and every code path runs, but APP_KEY is still " +
        "\"REPLACE_WITH_APP_KEY\" - the server will reject each request with HTTP 400. " +
        "Paste the real app key in config.js and reload.");
    } else {
      setSdkStatus("SDK loaded (v" + v + "). Device id: " + DEVICE_ID + " · server: " + COUNTLY_URL);
    }
  }

  function setSdkStatus(msg) {
    var el = document.getElementById("sdkStatus");
    if (el) { el.textContent = msg; }
  }

  /* ==================================================================
   * 6. Tracking helpers - every call is wrapped so a demo never dies
   *    because of the SDK.
   * ================================================================== */

  /* ---- live event feed ------------------------------------------
   * This is the "point at the portal, then find the same line in the
   * dashboard's incoming data / event log" surface. Every record keeps
   * the event key, its segmentation, a local timestamp and the ISO
   * timestamp + device id needed to match it server-side.
   * --------------------------------------------------------------- */

  var feedLog = [];                    // newest first
  var FEED_MAX = 60;

  function feed(kind, key, seg) {
    var now = new Date();
    var record = {
      time: now.toLocaleTimeString(),
      timestamp: now.toISOString(),
      epoch_ms: now.getTime(),
      kind: kind,                      // event | event* (timed) | view | user | crash | apm | rc | id | demo
      key: key,
      segmentation: seg || null,
      view: state.currentRoute,
      device_id: DEVICE_ID,
      app_key_set: APP_KEY !== "REPLACE_WITH_APP_KEY"
    };
    feedLog.unshift(record);
    while (feedLog.length > FEED_MAX) { feedLog.pop(); }

    state.feedCount++;
    var c = document.getElementById("feedCount");
    if (c) { c.textContent = String(state.feedCount); }

    var list = document.getElementById("eventFeed");
    if (!list) { return; }
    var empty = list.querySelector(".feed-empty");
    if (empty) { list.removeChild(empty); }

    var li = document.createElement("li");
    li.className = "feed-row";
    li.innerHTML =
      '<span class="t">' + escapeHtml(record.time) + "</span>" +
      '<span class="kind kind-' + escapeHtml(kind.replace("*", "-timed")) + '">' + escapeHtml(kind) + "</span>" +
      '<span class="k">' + escapeHtml(key) + "</span>" +
      '<span class="s">' + escapeHtml(seg ? JSON.stringify(seg) : "—") + "</span>";
    list.insertBefore(li, list.firstChild);
    while (list.children.length > FEED_MAX) { list.removeChild(list.lastChild); }
  }

  function copyLastEvents(n) {
    var slice = feedLog.slice(0, n);
    var payload = {
      exported_at: new Date().toISOString(),
      countly_url: COUNTLY_URL,
      app_key_set: APP_KEY !== "REPLACE_WITH_APP_KEY",
      device_id: DEVICE_ID,
      ab_variant: state.variant,
      ab_variant_source: state.variantSource,
      count: slice.length,
      events: slice
    };
    var text = JSON.stringify(payload, null, 2);

    // The JSON is always shown in a selectable box and logged to the
    // console, so the presenter is never stuck if the browser blocks
    // clipboard access (it commonly does without a trusted gesture, or
    // over plain http on a non-localhost host).
    var wrap = document.getElementById("eventJsonWrap");
    var box = document.getElementById("eventJson");
    var note = document.getElementById("eventJsonNote");
    if (wrap && box) {
      box.value = text;
      wrap.removeAttribute("hidden");
      try { box.focus(); box.select(); } catch (e) { /* noop */ }
    }
    console.info("[demo] last " + slice.length + " events:\n" + text);

    var done = function (ok) {
      var btn = document.getElementById("btnCopyEvents");
      if (note) {
        note.textContent = ok
          ? "Copied " + slice.length + " events to the clipboard. The same JSON is below and in the console."
          : "The browser blocked clipboard access. The JSON is selected below — press Ctrl/Cmd+C. It is also in the console.";
      }
      if (!btn) { return; }
      var original = btn.getAttribute("data-label") || btn.textContent;
      btn.setAttribute("data-label", original);
      btn.textContent = ok ? "Copied " + slice.length + " events ✓" : "Select below and press Ctrl+C";
      window.setTimeout(function () { btn.textContent = original; }, 3000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function (err) {
        console.warn("[demo] clipboard blocked, falling back", err);
        done(legacyCopy(text));
      });
    } else {
      done(legacyCopy(text));
    }
  }

  // Fallback for non-secure contexts where navigator.clipboard is absent.
  function legacyCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "readonly");
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      console.warn("[demo] legacy copy failed", e);
      return false;
    }
  }

  // EmaraTax bridge (model-bridge.js): every portal event is translated into the tracking plan
  // of the target app before it reaches the SDK. Without the bridge the original behaviour stays.
  var BRIDGE = window.EMARATAX_BRIDGE || null;
  var timedStarts = {};

  function trackEvent(key, segmentation, extra) {
    if (BRIDGE) {
      var mapped = BRIDGE.mapEvent(key, segmentation || {}, extra || {});
      var names = [];
      for (var i = 0; i < mapped.length; i++) {
        var m = mapped[i];
        var p = { key: m.key, segmentation: m.segmentation };
        if (typeof m.sum === "number") { p.sum = m.sum; }
        if (extra && typeof extra.dur === "number") { p.dur = extra.dur; }
        try { if (state.sdkOk) { Countly.add_event(p); } } catch (e) { console.warn("[demo] add_event failed", e); }
        names.push(m.key);
      }
      feed("event", key + (names.length ? "  \u2192  " + names.join(" + ") : "  \u2192  (not in model)"), segmentation);
      return;
    }
    var payload = { key: key };
    if (segmentation) { payload.segmentation = segmentation; }
    if (extra && typeof extra.count === "number") { payload.count = extra.count; }
    if (extra && typeof extra.sum === "number") { payload.sum = extra.sum; }
    if (extra && typeof extra.dur === "number") { payload.dur = extra.dur; }
    try {
      if (state.sdkOk) { Countly.add_event(payload); }
    } catch (e) { console.warn("[demo] add_event failed", e); }
    feed("event", key, segmentation);
  }

  function startTimedEvent(key) {
    if (BRIDGE) { timedStarts[key] = Date.now(); return; }
    try { if (state.sdkOk) { Countly.start_event(key); } } catch (e) { /* noop */ }
  }

  function endTimedEvent(key, segmentation, extra) {
    if (BRIDGE) {
      var ex = {}; var k2;
      for (k2 in (extra || {})) { if (Object.prototype.hasOwnProperty.call(extra, k2)) { ex[k2] = extra[k2]; } }
      if (timedStarts[key]) { ex.dur = Math.round((Date.now() - timedStarts[key]) / 1000); delete timedStarts[key]; }
      trackEvent(key, segmentation, ex);
      return;
    }
    var payload = { key: key };
    if (segmentation) { payload.segmentation = segmentation; }
    if (extra && typeof extra.count === "number") { payload.count = extra.count; }
    if (extra && typeof extra.sum === "number") { payload.sum = extra.sum; }
    try {
      if (state.sdkOk) { Countly.end_event(payload); }
      else { feed("event", key, segmentation); return; }
    } catch (e) {
      // start_event was never called for this key - fall back to a plain event
      trackEvent(key, segmentation, extra);
      return;
    }
    feed("event*", key, segmentation);   // * = duration measured by the SDK
  }

  function trackViewName(name) {
    if (BRIDGE) { name = BRIDGE.mapView(name); }
    crashSegments.screen = name;
    try {
      if (state.sdkOk) {
        Countly.track_view(name);        // exact taxonomy view name
        Countly.add_log("view: " + name);
      }
    } catch (e) { console.warn("[demo] track_view failed", e); }
    feed("view", name);
  }

  function pushUserProperties() {
    var p = persona();
    var custom = {};
    var k;
    for (k in p.props) {
      if (Object.prototype.hasOwnProperty.call(p.props, k)) { custom[k] = p.props[k]; }
    }
    custom.preferred_language = state.lang;              // "en" | "ar"
    if (state.variantResolved) { custom.ab_variant = state.variant; }
    if (BRIDGE) { custom = BRIDGE.mapUser(custom); }

    try {
      if (state.sdkOk) {
        Countly.user_details({
          name: p.name,
          username: p.username,
          custom: custom
        });
      }
    } catch (e) { console.warn("[demo] user_details failed", e); }
    feed("user", p.username, custom);
  }

  function setUserProperty(key, value) {
    if (BRIDGE) {
      var mu = BRIDGE.mapUserKey(key, value);
      if (!mu) { var skipped = {}; skipped[key] = value; feed("user", key + "  →  (not in model)", skipped); return; }
      key = mu.key; value = mu.value;
    }
    try {
      if (state.sdkOk) {
        Countly.userData.set(key, value);
        Countly.userData.save();
      }
    } catch (e) { console.warn("[demo] userData.set failed", e); }
    var seg = {}; seg[key] = value;
    feed("user", key, seg);
  }

  /* ==================================================================
   * 7. A/B test - remote config drives the filing form layout
   * ================================================================== */

  function localFallbackVariant() {
    var stored = read(LS.variant);
    if (stored && AB_VARIANTS.indexOf(stored) !== -1) { return stored; }
    // Deterministic from the device id so it is stable across reloads.
    var sum = 0;
    for (var i = 0; i < DEVICE_ID.length; i++) { sum += DEVICE_ID.charCodeAt(i); }
    var v = AB_VARIANTS[sum % AB_VARIANTS.length];
    write(LS.variant, v);
    return v;
  }

  function applyVariant(value, source) {
    if (AB_VARIANTS.indexOf(value) === -1) { value = localFallbackVariant(); source = "local fallback"; }
    state.variant = value;
    state.variantSource = source;
    state.variantResolved = true;
    renderAbBadge();
    setUserProperty("ab_variant", value);   // taxonomy user property
    if (state.currentRoute.indexOf("/returns/") === 0) { render(); }
  }

  function renderAbBadge() {
    var badge = document.getElementById("abBadge");
    var val = document.getElementById("abBadgeValue");
    var src = document.getElementById("abBadgeSource");
    if (!badge || !val || !src) { return; }
    val.textContent = state.variantResolved ? state.variant : "resolving…";
    src.textContent = state.variantResolved ? "· " + state.variantSource : "";
    badge.classList.toggle("is-fallback", state.variantSource !== "remote config");
    badge.setAttribute("title", "filing_form_layout = " + state.variant + " (" + state.variantSource + ")");
  }

  function resolveVariant() {
    if (state.forcedVariant) {
      applyVariant(state.forcedVariant, "forced (demo)");
      return;
    }
    state.variantResolved = false;
    var settled = false;
    var timer = window.setTimeout(function () {
      if (settled) { return; }
      settled = true;
      applyVariant(localFallbackVariant(), "local fallback");
    }, RC_TIMEOUT);

    if (!state.sdkOk) { return; }

    try {
      // keys, omit_keys, callback
      Countly.fetch_remote_config([AB_KEY], null, function (err, remoteConfig) {
        if (settled) { return; }
        settled = true;
        window.clearTimeout(timer);
        var value = null;
        try { value = Countly.get_remote_config(AB_KEY); } catch (e2) { value = null; }
        if (value === null || typeof value === "undefined") {
          if (remoteConfig && typeof remoteConfig === "object") { value = remoteConfig[AB_KEY]; }
        }
        // R01 project: the experiment's values (single_form / guided_wizard) map onto the layouts the portal renders
        if (typeof value === "string" && CFG.AB_VALUE_MAP && CFG.AB_VALUE_MAP[value]) { value = CFG.AB_VALUE_MAP[value]; }
        if (typeof value === "string" && AB_VARIANTS.indexOf(value) !== -1) {
          applyVariant(value, "remote config");
        } else {
          applyVariant(localFallbackVariant(), "local fallback");
        }
      });
      feed("rc", "fetch_remote_config", { key: AB_KEY });
    } catch (e) {
      if (!settled) {
        settled = true;
        window.clearTimeout(timer);
        applyVariant(localFallbackVariant(), "local fallback");
      }
    }
  }

  /* ==================================================================
   * 8. Small helpers
   * ================================================================== */

  function escapeHtml(s) {
    return String(s === null || typeof s === "undefined" ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function money(n) {
    return "AED " + Number(n || 0).toLocaleString("en-AE", { maximumFractionDigits: 2 });
  }

  function amountBand(n) {
    n = Number(n) || 0;
    if (n < 10000) { return "<10k"; }
    if (n < 50000) { return "10k-50k"; }
    if (n <= 250000) { return "50k-250k"; }
    return ">250k";
  }

  function bandIndex(band) {
    return ({ "<10k": 1, "10k-50k": 2, "50k-250k": 3, ">250k": 4 })[band] || 1;
  }

  function attemptBand(n) {
    if (n <= 1) { return "1"; }
    if (n === 2) { return "2"; }
    return "3+";
  }

  function gapBand(savedAtMs) {
    var mins = (Date.now() - savedAtMs) / 60000;
    if (mins < 60) { return "<1h"; }
    if (mins < 60 * 24) { return "1-24h"; }
    if (mins < 60 * 24 * 7) { return "1-7d"; }
    return ">7d";
  }

  function stepByKey(key) {
    return STEPS.filter(function (s) { return s.key === key; })[0];
  }
  function stepByRoute(route) {
    return STEPS.filter(function (s) { return s.route === route; })[0];
  }

  function setHelpContext(route) {
    if (HELP_CONTEXTS.indexOf(route) !== -1) { state.lastHelpContext = route; }
  }

  /* ==================================================================
   * 9. Filing session model
   * ================================================================== */

  function newFiling(entryPoint) {
    return {
      entry_point: entryPoint || "dashboard",
      attempts: { taxpayer_details: 1, supplies: 1, purchases: 1, adjustments: 1, review: 1 },
      completed: {},
      skipped: {},
      validationErrors: 0,
      submitFailures: 0,
      autosaved: false,
      inlineReported: {},
      fields: { trn: "", legal_name: "", contact_email: "", standard_supplies: "", zero_rated: "", exempt: "", emirate_split: "", purchases: "", input_tax: "", adjustments: "" },
      errors: {},
      startedAt: Date.now()
    };
  }

  function startFiling(entryPoint) {
    state.filing = newFiling(entryPoint);
    startTimedEvent("filing_submitted");   // duration = whole filing journey
    trackEvent("filing_started", {
      return_type: RETURN_TYPE,
      period: PERIOD,
      entry_point: entryPoint || "dashboard",
      ab_variant: state.variant
    });
  }

  function ensureFiling() {
    if (!state.filing) { startFiling("deep_link"); }
    return state.filing;
  }

  function saveDraft(stepKey, autosave) {
    var f = ensureFiling();
    write(LS.draft, JSON.stringify({
      savedAt: Date.now(),
      step_key: stepKey,
      fields: f.fields,
      entry_point: f.entry_point
    }));
    trackEvent("filing_draft_saved", { step_key: stepKey, autosave: autosave ? "true" : "false" });
  }

  function loadDraft() {
    var raw = read(LS.draft);
    if (!raw) { return null; }
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function resumeDraft() {
    var d = loadDraft();
    if (!d) { return; }
    state.filing = newFiling(d.entry_point || "dashboard");
    state.filing.fields = d.fields || state.filing.fields;
    startTimedEvent("filing_submitted");
    trackEvent("filing_draft_resumed", {
      step_key: d.step_key,
      gap_band: gapBand(d.savedAt || Date.now())
    });
    var s = stepByKey(d.step_key) || STEPS[0];
    go(s.route);
  }

  function completeStep(stepKey) {
    var f = ensureFiling();
    var s = stepByKey(stepKey);
    f.completed[stepKey] = true;
    endTimedEvent("filing_step_completed", {
      step_key: stepKey,
      step_index: s.index,
      attempt_no: attemptBand(f.attempts[stepKey]),
      ab_variant: state.variant
    });
  }

  // inline = raised by variant_b_guided's on-blur check rather than by
  // pressing Continue. Inline errors are still reported (otherwise the
  // guided variant would look artificially clean), but they are deduped
  // per field+code and they do NOT count as a new attempt - an "attempt"
  // is one press of Continue.
  function validationError(stepKey, field, code, inline) {
    var f = ensureFiling();
    if (inline) {
      var sig = stepKey + "|" + field + "|" + code;
      if (f.inlineReported[sig]) { return; }
      f.inlineReported[sig] = true;
    } else {
      f.attempts[stepKey] = (f.attempts[stepKey] || 1) + 1;
    }
    f.validationErrors++;
    trackEvent("filing_validation_error", { step_key: stepKey, field: field, error_code: code });
  }

  function skipStep(stepKey, reason) {
    var f = ensureFiling();
    f.skipped[stepKey] = true;
    trackEvent("filing_step_skipped", { step_key: stepKey, skip_reason: reason });
  }

  function nextRouteAfter(stepKey) {
    for (var i = 0; i < STEPS.length; i++) {
      if (STEPS[i].key === stepKey) {
        return (i + 1 < STEPS.length) ? STEPS[i + 1].route : "/returns/review";
      }
    }
    return "/returns/review";
  }
  function prevRouteAfter(stepKey) {
    for (var i = 0; i < STEPS.length; i++) {
      if (STEPS[i].key === stepKey) {
        return (i > 0) ? STEPS[i - 1].route : "/returns/new";
      }
    }
    return "/returns/new";
  }

  function declaredTotal() {
    var f = ensureFiling();
    return (Number(f.fields.standard_supplies) || 0) +
           (Number(f.fields.zero_rated) || 0) +
           (Number(f.fields.exempt) || 0);
  }

  function vatDue() {
    var f = ensureFiling();
    var output = (Number(f.fields.standard_supplies) || 0) * 0.05;
    var input = (Number(f.fields.input_tax) || 0);
    var adj = (Number(f.fields.adjustments) || 0);
    return Math.max(0, output - input + adj);
  }

  /* ==================================================================
   * 9b. Registration session model
   * ================================================================== */

  function regStepByKey(key) {
    return REG_STEPS.filter(function (s) { return s.key === key; })[0];
  }

  function newRegistration(method, channel) {
    return {
      method: method || "UAE Pass",
      channel: channel || "Web Portal",
      attempts: { identity: 1, contact: 1, business_details: 1, documents: 1, review: 1 },
      completed: {},
      uploads: [],                     // {doc_type, file, result}
      rejections: 0,
      retries: 0,
      fields: { id_type: "", contact_channel: "", entity_type: "", activity: "" },
      errors: {},
      startedAt: Date.now()
    };
  }

  function ensureRegistration() {
    if (!state.registration) { state.registration = newRegistration(); }
    return state.registration;
  }

  function startRegistration(method, channel) {
    state.registration = newRegistration(method, channel);
    startTimedEvent("registration_completed");     // duration of the whole onboarding
    startTimedEvent("registration_step_completed");
    trackEvent("registration_started", {
      method: method,
      channel: channel,
      language: state.lang                          // "en" | "ar"
    });
    // Taxonomy user property: onboarding in progress.
    setUserProperty("registration_status", "Pending Documents");
  }

  function completeRegStep(stepKey) {
    var r = ensureRegistration();
    var s = regStepByKey(stepKey);
    r.completed[stepKey] = true;
    endTimedEvent("registration_step_completed", {
      step_key: stepKey,
      step_index: s.index,
      attempt_no: attemptBand(r.attempts[stepKey])
    });
    startTimedEvent("registration_step_completed"); // start timing the next one
  }

  // No registration_validation_error exists in the taxonomy, so a rejected
  // sub-step only bumps attempt_no locally - we do not invent an event.
  function bumpRegAttempt(stepKey) {
    var r = ensureRegistration();
    r.attempts[stepKey] = (r.attempts[stepKey] || 1) + 1;
    r.retries++;
  }

  function uploadDocument(docType, fileName) {
    var r = ensureRegistration();
    var file = FAKE_FILES.filter(function (f) { return f.name === fileName; })[0] || FAKE_FILES[0];
    startTimedEvent("registration_document_uploaded");
    // Simulated transfer so the event carries a believable duration.
    window.setTimeout(function () {
      endTimedEvent("registration_document_uploaded", {
        doc_type: docType,
        result: file.result
      });
      r.uploads.push({ doc_type: docType, file: file.name, result: file.result });
      if (file.result !== "accepted") { r.rejections++; }
      render();
      if (file.result === "accepted") {
        notify("ok", "Document accepted", docType + " (" + file.name + ") was accepted.");
      } else {
        notify("error", "Document rejected",
          docType + " (" + file.name + ") was rejected: " + file.result.replace("_", " ") +
          ". This is the biggest onboarding blocker in the data model.");
      }
    }, 900);
  }

  function acceptedDocTypes() {
    var r = ensureRegistration();
    var out = {};
    r.uploads.forEach(function (u) { if (u.result === "accepted") { out[u.doc_type] = true; } });
    return out;
  }

  function submitRegistration() {
    var r = ensureRegistration();
    completeRegStep("review");
    var firstAttempt = (r.rejections === 0 && r.retries === 0);
    endTimedEvent("registration_completed", {
      method: r.method,
      first_attempt_success: firstAttempt ? "true" : "false"
    });
    setUserProperty("registration_status", "Registered");
    state.loggedIn = true;
    notify("ok", "Registration submitted", "registration_completed recorded with first_attempt_success = " + firstAttempt + ".");
    go("/dashboard");
  }

  /* ==================================================================
   * 10. Router
   * ================================================================== */

  var NAV = [
    { route: "/home", key: "nav_home" },
    { route: "/login", key: "nav_login" },
    { route: "/register", key: "nav_register" },
    { route: "/dashboard", key: "nav_dashboard" },
    { route: "/returns", key: "nav_returns" },
    { route: "/payments", key: "nav_payments" },
    { route: "/refunds", key: "nav_refunds" },
    { route: "/profile", key: "nav_profile" },
    { route: "/support/faq", key: "nav_support" }
  ];

  var ROUTES = {
    "/home": screenHome,
    "/login": screenLogin,
    "/register": screenRegister,
    "/register/identity": screenRegisterIdentity,
    "/register/documents": screenRegisterDocuments,
    "/register/review": screenRegisterReview,
    "/dashboard": screenDashboard,
    "/returns": screenReturnsList,
    "/returns/new": screenReturnsNew,
    "/returns/taxpayer-details": function () { return screenStep("taxpayer_details"); },
    "/returns/supplies": function () { return screenStep("supplies"); },
    "/returns/purchases": function () { return screenStep("purchases"); },
    "/returns/adjustments": function () { return screenStep("adjustments"); },
    "/returns/review": function () { return screenStep("review"); },
    "/returns/submitted": screenSubmitted,
    "/payments": screenPayments,
    "/payments/confirm": screenPaymentConfirm,
    "/payments/receipt": screenPaymentReceipt,
    "/refunds": screenRefunds,
    "/profile": screenProfile,
    "/support/faq": screenFaq,
    "/support/chat": screenChat,
    "/support/ticket": screenTicket
  };

  function currentRouteFromHash() {
    var h = (window.location.hash || "").replace(/^#/, "");
    if (!h || !ROUTES[h]) { return "/home"; }
    return h;
  }

  function go(route) {
    if (!ROUTES[route]) { route = "/home"; }
    if (("#" + route) === window.location.hash) {
      onRoute();                 // same hash, re-render + re-track
    } else {
      window.location.hash = "#" + route;
    }
  }

  function onRoute() {
    var route = currentRouteFromHash();
    state.currentRoute = route;
    setHelpContext(route);
    render();
    trackViewName(route);        // <- exact taxonomy view name
    onEnterRoute(route);
    window.scrollTo(0, 0);
    var main = document.getElementById("main");
    if (main) { main.focus({ preventScroll: true }); }
  }

  function onEnterRoute(route) {
    var s = stepByRoute(route);
    if (s) {
      ensureFiling();
      trackEvent("filing_step_viewed", {
        step_key: s.key,
        step_index: s.index,
        ab_variant: state.variant
      });
      startTimedEvent("filing_step_completed");   // duration of this step attempt
    }
    if (route === "/login") { startTimedEvent("login"); }
    if (route === "/support/faq") {
      trackEvent("help_opened", { surface: "FAQ", context_view: state.lastHelpContext });
    }
    if (route === "/support/chat") {
      trackEvent("help_opened", { surface: "Chatbot", context_view: state.lastHelpContext });
      startTimedEvent("chatbot_session_ended");
    }
    if (route === "/payments/confirm") { startTimedEvent("payment_completed"); }
  }

  /* ==================================================================
   * 11. Rendering
   * ================================================================== */

  function render() {
    var app = document.getElementById("app");
    if (!app) { return; }
    var fn = ROUTES[state.currentRoute] || screenHome;
    app.innerHTML = fn();
    renderNav();
    applyI18nAttributes();
  }

  function renderNav() {
    var nav = document.getElementById("mainNav");
    if (!nav) { return; }
    nav.innerHTML = NAV.map(function (item) {
      var active = state.currentRoute === item.route ||
        (item.route === "/returns/new" && state.currentRoute.indexOf("/returns") === 0) ||
        (item.route === "/payments" && state.currentRoute.indexOf("/payments") === 0) ||
        (item.route === "/support/faq" && state.currentRoute.indexOf("/support") === 0);
      return '<a class="nav-link' + (active ? " is-active" : "") + '" href="#' + item.route + '">' +
        escapeHtml(t(item.key)) + "</a>";
    }).join("");
  }

  function applyI18nAttributes() {
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].getAttribute("data-i18n"));
    }
    var lt = document.getElementById("langToggleText");
    if (lt) { lt.textContent = t("langBtn"); }
  }

  function pageHead(crumb, title, lede) {
    return '<div class="page-head">' +
      '<p class="crumb">' + escapeHtml(crumb) + "</p>" +
      "<h1>" + escapeHtml(title) + "</h1>" +
      (lede ? '<p class="lede">' + escapeHtml(lede) + "</p>" : "") +
      "</div>";
  }

  function stepper(currentKey) {
    var f = state.filing;
    return '<div class="stepper">' + STEPS.map(function (s) {
      var cls = "stepper-item";
      if (s.key === currentKey) { cls += " is-current"; }
      else if (f && (f.completed[s.key] || f.skipped[s.key])) { cls += " is-done"; }
      return '<span class="' + cls + '"><span class="n">' + s.index + "</span>" +
        escapeHtml(stepTitle(s.key)) + (s.optional ? " <em>(optional)</em>" : "") + "</span>";
    }).join("") + "</div>";
  }

  function stepTitle(key) {
    return ({
      taxpayer_details: "Taxpayer details",
      supplies: "Supplies & outputs",
      purchases: "Purchases & inputs",
      adjustments: "Adjustments",
      review: "Review & submit"
    })[key] || key;
  }

  /* ---------------------------------------------------------- screens */

  function screenHome() {
    var d = loadDraft();
    return pageHead("Home", "Tax e-Services", "A mock taxpayer portal used to demonstrate Countly product analytics. Everything you see is fabricated demo data.") +
      '<div class="grid grid-hero">' +
        '<div class="card">' +
          "<h2>File, pay and track your tax obligations</h2>" +
          "<p>Sign in to file a VAT return for " + PERIOD + ", settle an outstanding balance, or check the status of a submission.</p>" +
          '<div class="btn-row">' +
            '<button type="button" class="btn btn-primary" data-go="/login">Sign in to continue</button>' +
            '<button type="button" class="btn" data-go="/register">Register a new taxpayer</button>' +
            '<button type="button" class="btn btn-ghost" data-go="/support/faq">Browse help topics</button>' +
          "</div>" +
          (d ? '<div class="notice notice-warn" style="margin-top:16px"><strong>You have a saved draft</strong>' +
               "VAT return " + PERIOD + ", last saved at step \"" + escapeHtml(stepTitle(d.step_key)) + "\". " +
               '<div class="btn-row"><button type="button" class="btn" data-action="resume-draft">Resume draft</button></div></div>' : "") +
        "</div>" +
        '<div class="card">' +
          "<h3>Service status</h3>" +
          '<dl class="kv">' +
            "<dt>VAT filing</dt><dd><span class=\"pill ok\">Available</span></dd>" +
            "<dt>Payments</dt><dd><span class=\"pill ok\">Available</span></dd>" +
            "<dt>Next deadline</dt><dd>28 Oct 2026</dd>" +
            "<dt>Period</dt><dd>" + PERIOD + "</dd>" +
          "</dl>" +
          '<p class="lede" style="margin-top:12px;font-size:.86rem">This page is one of the heatmap views in the data model, together with /returns/supplies, /returns/review and /payments.</p>' +
        "</div>" +
      "</div>" +
      '<div class="grid grid-3">' +
        '<div class="card"><h3>VAT returns</h3><p>Quarterly and monthly VAT returns for registered businesses.</p><button type="button" class="btn" data-go="/returns/new">Start a return</button></div>' +
        '<div class="card"><h3>Payments</h3><p>Card, direct debit, bank transfer and eDirham.</p><button type="button" class="btn" data-go="/payments">Make a payment</button></div>' +
        '<div class="card"><h3>Support</h3><p>FAQ, guided help and the virtual assistant.</p><button type="button" class="btn" data-go="/support/chat">Ask the assistant</button></div>' +
      "</div>";
  }

  function screenLogin() {
    return pageHead("Sign in", "Sign in to e-Services", "Choose a sign-in method. The buttons below fire the login event with result = success or failure.") +
      '<div class="card" style="max-width:640px">' +
        '<div class="field"><label for="loginMethod">Sign-in method</label>' +
          '<select id="loginMethod">' +
            '<option value="UAE Pass">UAE Pass</option>' +
            '<option value="Password">Password</option>' +
            '<option value="Biometric">Biometric</option>' +
          "</select></div>" +
        '<div class="field"><label for="loginUser">Demo account</label>' +
          '<output class="readonly-value" id="loginUser">' + escapeHtml(persona().username) + "</output>" +
          '<p class="hint">Fixed by the taxpayer persona in the header. There is nothing to type.</p></div>' +
        '<div class="notice notice-info"><strong>There is no password field on this page</strong>' +
          "Sign-in is a demo button. This portal never asks for a password, one-time code, card number or any other credential, " +
          "and nothing is authenticated.</div>" +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-primary" data-action="login-ok">Sign in</button>' +
          '<button type="button" class="btn btn-danger" data-action="login-fail">Sign in with the wrong password</button>' +
          '<button type="button" class="btn btn-quiet" data-action="login-otp">OTP times out</button>' +
        "</div>" +
        '<p class="hint" style="margin-top:14px">On success the SDK calls <code>Countly.change_id(newId, true)</code> so pre-login and post-login activity merge into one user, as required by the data model.</p>' +
      "</div>";
  }

  /* ----- shared: a select-only field -------------------------------
   * The portal deliberately uses selects instead of free-text inputs
   * wherever a real service would ask for identity or contact data, so
   * there is nowhere for a presenter (or the audience) to type real
   * personal information into a demo page.
   * ----------------------------------------------------------------- */
  function selectField(id, label, options, hint, selected, errText) {
    var opts = options.map(function (o) {
      var value = (typeof o === "string") ? o : o.value;
      var text = (typeof o === "string") ? o : o.label;
      return '<option value="' + escapeHtml(value) + '"' +
        (String(selected || "") === String(value) ? " selected" : "") + ">" +
        escapeHtml(text) + "</option>";
    }).join("");
    return '<div class="field' + (errText ? " is-error" : "") + '">' +
      '<label for="' + id + '">' + escapeHtml(label) + "</label>" +
      '<select id="' + id + '">' + opts + "</select>" +
      (hint ? '<p class="hint">' + escapeHtml(hint) + "</p>" : "") +
      (errText ? '<p class="err">' + escapeHtml(errText) + "</p>" : "") +
      "</div>";
  }

  /* ----- registration & onboarding ---------------------------------- */

  function regStepper(currentKey) {
    var r = state.registration;
    return '<div class="stepper">' + REG_STEPS.map(function (s) {
      var cls = "stepper-item";
      if (s.key === currentKey) { cls += " is-current"; }
      else if (r && r.completed[s.key]) { cls += " is-done"; }
      return '<span class="' + cls + '"><span class="n">' + s.index + "</span>" +
        escapeHtml(s.label) +
        (r && r.attempts[s.key] > 1 ? ' <em>· attempt ' + escapeHtml(attemptBand(r.attempts[s.key])) + "</em>" : "") +
        "</span>";
    }).join("") + "</div>";
  }

  function screenRegister() {
    return pageHead("Register", "Register for tax e-Services",
      "Onboarding journey. Starting fires registration_started with method, channel and language.") +
      '<div class="card" style="max-width:720px">' +
        selectField("regMethod", "Registration method", REG_METHODS,
          "Matches the method segmentation on registration_started and registration_completed.", "UAE Pass") +
        selectField("regChannel", "Channel", REG_CHANNELS,
          "The same taxpayer may register on one channel and file on another.", "Web Portal") +
        '<div class="notice notice-info"><strong>No identity data is collected here</strong>' +
          "Every field in this journey is a fixed demo choice. Nothing you pick is real, and nothing identifying is sent to Countly.</div>" +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-primary" data-action="start-registration">Start registration</button>' +
          '<button type="button" class="btn btn-ghost" data-go="/login">I already have an account</button>' +
        "</div>" +
      "</div>";
  }

  function screenRegisterIdentity() {
    var r = ensureRegistration();
    var identityDone = !!r.completed.identity;
    var contactDone = !!r.completed.contact;

    var html = pageHead("Register", "Identity, contact and business details",
      "Three taxonomy step_keys live on this screen: identity, contact and business_details.") +
      regStepper(identityDone ? (contactDone ? "business_details" : "contact") : "identity");

    /* --- 1. identity ------------------------------------------------ */
    html += '<div class="card">' +
      "<h2>1 · Identity</h2>" +
      selectField("regIdType", "Identity document type", [
        { value: "", label: "— select —" },
        "Emirates ID (demo)", "Passport (demo)", "Trade Licence (demo)", "GCC ID (demo)"
      ], "Leave this unselected and press Continue to make the step fail and push attempt_no to 2.",
        r.fields.id_type, r.errors.id_type) +
      (identityDone
        ? '<p class="pill ok">Step completed</p>'
        : '<div class="btn-row">' +
            '<button type="button" class="btn btn-primary" data-action="reg-step" data-step="identity">Continue</button>' +
            '<button type="button" class="btn btn-quiet" data-action="reg-retry" data-step="identity">Simulate a rejected submission (retry)</button>' +
          "</div>") +
      "</div>";

    /* --- 2. contact ------------------------------------------------- */
    if (identityDone) {
      html += '<div class="card">' +
        "<h2>2 · Contact</h2>" +
        selectField("regContact", "Preferred correspondence channel",
          ["Email (demo mailbox)", "SMS (demo number)", "Both"],
          "A fixed choice, not a real address or number.", r.fields.contact_channel) +
        (contactDone
          ? '<p class="pill ok">Step completed</p>'
          : '<div class="btn-row">' +
              '<button type="button" class="btn btn-primary" data-action="reg-step" data-step="contact">Continue</button>' +
              '<button type="button" class="btn btn-quiet" data-action="reg-retry" data-step="contact">Simulate a rejected submission (retry)</button>' +
            "</div>") +
        "</div>";
    }

    /* --- 3. business_details ---------------------------------------- */
    if (contactDone) {
      html += '<div class="card">' +
        "<h2>3 · Business details</h2>" +
        selectField("regEntity", "Entity type",
          ["Sole Establishment", "LLC", "Free Zone Company", "Branch of a Foreign Company"],
          "", r.fields.entity_type) +
        selectField("regActivity", "Main activity",
          ["Trading", "Construction", "Professional Services", "Hospitality", "Logistics"],
          "", r.fields.activity) +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-primary" data-action="reg-step" data-step="business_details">Continue to documents</button>' +
          '<button type="button" class="btn btn-quiet" data-action="reg-retry" data-step="business_details">Simulate a rejected submission (retry)</button>' +
        "</div>" +
        "</div>";
    }

    return html;
  }

  function screenRegisterDocuments() {
    var r = ensureRegistration();
    var accepted = acceptedDocTypes();

    var rows = DOC_TYPES.map(function (dt) {
      var mine = r.uploads.filter(function (u) { return u.doc_type === dt; });
      var last = mine[mine.length - 1];
      var statusPill = accepted[dt]
        ? '<span class="pill ok">Accepted</span>'
        : (last ? '<span class="pill error">' + escapeHtml(last.result.replace("_", " ")) + "</span>"
                : '<span class="pill">Not uploaded</span>');
      return '<tr>' +
        "<td><strong>" + escapeHtml(dt) + "</strong></td>" +
        '<td><select id="file_' + escapeHtml(dt.replace(/\s+/g, "_")) + '">' +
          FAKE_FILES.map(function (f) {
            return '<option value="' + escapeHtml(f.name) + '">' + escapeHtml(f.name + " — " + f.note) + "</option>";
          }).join("") + "</select></td>" +
        "<td>" + statusPill + "</td>" +
        '<td><button type="button" class="btn" data-action="reg-upload" data-doc="' + escapeHtml(dt) + '">Upload</button></td>' +
        "</tr>";
    }).join("");

    return pageHead("Register", "Supporting documents",
      "Each upload fires registration_document_uploaded with doc_type and result. Pick a .bmp or .heic file to force rejected_format, or the 41 MB file to force rejected_size.") +
      regStepper("documents") +
      '<div class="notice notice-info"><strong>No real files are read</strong>' +
        "There is no file picker on this page. The fabricated filename you choose decides the outcome, so nothing leaves the presenter's machine.</div>" +
      '<div class="card">' +
        '<table class="data"><thead><tr><th>Document</th><th>Demo file</th><th>Status</th><th></th></tr></thead>' +
        "<tbody>" + rows + "</tbody></table>" +
        '<div class="btn-row">' + helpButton("/register/documents") + "</div>" +
        (r.uploads.length
          ? '<p class="hint">Uploads so far: ' + r.uploads.length + " · rejected: " + r.rejections + "</p>"
          : "") +
        '<div class="btn-row spread"><div class="btn-row" style="margin:0">' +
          '<button type="button" class="btn btn-ghost" data-go="/register/identity">Back</button>' +
        "</div>" +
        '<button type="button" class="btn btn-primary" data-action="reg-step" data-step="documents">Continue to review</button>' +
        "</div>" +
      "</div>";
  }

  function screenRegisterReview() {
    var r = ensureRegistration();
    var firstAttempt = (r.rejections === 0 && r.retries === 0);
    return pageHead("Register", "Review and submit registration",
      "Submitting fires registration_step_completed (review) then registration_completed.") +
      regStepper("review") +
      '<div class="card">' +
        '<dl class="kv">' +
          "<dt>Method</dt><dd>" + escapeHtml(r.method) + "</dd>" +
          "<dt>Channel</dt><dd>" + escapeHtml(r.channel) + "</dd>" +
          "<dt>Language</dt><dd>" + escapeHtml(state.lang) + "</dd>" +
          "<dt>Identity document</dt><dd>" + escapeHtml(r.fields.id_type || "—") + "</dd>" +
          "<dt>Correspondence</dt><dd>" + escapeHtml(r.fields.contact_channel || "—") + "</dd>" +
          "<dt>Entity type</dt><dd>" + escapeHtml(r.fields.entity_type || "—") + "</dd>" +
          "<dt>Documents accepted</dt><dd>" + Object.keys(acceptedDocTypes()).length + " of " + DOC_TYPES.length + "</dd>" +
          "<dt>Documents rejected</dt><dd>" + r.rejections + "</dd>" +
          "<dt>Step retries</dt><dd>" + r.retries + "</dd>" +
          "<dt>first_attempt_success will be</dt><dd>" + (firstAttempt ? "true" : "false") + "</dd>" +
        "</dl>" +
        '<div class="btn-row spread"><div class="btn-row" style="margin:0">' +
          '<button type="button" class="btn btn-ghost" data-go="/register/documents">Back</button>' +
        "</div>" +
        '<button type="button" class="btn btn-primary" data-action="submit-registration">Submit registration</button>' +
        "</div>" +
      "</div>";
  }

  /* ----- returns list, refunds, profile, ticket --------------------- */

  function screenReturnsList() {
    var d = loadDraft();
    return pageHead("Returns", "Your returns", "All periods for this taxpayer. The taxonomy's /returns list view.") +
      '<div class="card">' +
        '<table class="data"><thead><tr><th>Period</th><th>Type</th><th>Status</th><th class="num">Declared</th><th></th></tr></thead><tbody>' +
          "<tr><td>" + PERIOD + "</td><td>VAT</td><td>" +
            (d ? '<span class="pill warn">Draft saved</span>' : '<span class="pill">Not started</span>') +
            '</td><td class="num">-</td><td>' +
            (d ? '<button type="button" class="btn" data-action="resume-draft">Resume</button>'
               : '<button type="button" class="btn" data-action="start-filing-dashboard">File now</button>') + "</td></tr>" +
          '<tr><td>2026-Q2</td><td>VAT</td><td><span class="pill ok">Submitted</span></td><td class="num">' + money(412300) + '</td><td><button type="button" class="btn btn-ghost" data-go="/payments">Pay</button></td></tr>' +
          '<tr><td>2026-Q1</td><td>VAT</td><td><span class="pill ok">Submitted</span></td><td class="num">' + money(388100) + '</td><td><button type="button" class="btn btn-ghost" data-go="/refunds">Refunds</button></td></tr>' +
          '<tr><td>2025-Q4</td><td>Excise</td><td><span class="pill ok">Submitted</span></td><td class="num">' + money(96400) + "</td><td></td></tr>" +
        "</tbody></table>" +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-primary" data-go="/returns/new">Start a new return</button>' +
        "</div>" +
      "</div>";
  }

  function screenRefunds() {
    return pageHead("Refunds", "Refunds", "Request and track refunds. Requesting fires refund_requested with amount_band and reason.") +
      '<div class="card">' +
        '<table class="data"><thead><tr><th>Reference</th><th>Reason</th><th>Band</th><th>Status</th></tr></thead><tbody>' +
          '<tr><td>DEMO-RF-4471</td><td>excess_input_tax</td><td>10k-50k</td><td><span class="pill ok">Paid</span></td></tr>' +
          '<tr><td>DEMO-RF-4402</td><td>duplicate_payment</td><td>&lt;10k</td><td><span class="pill warn">Under review</span></td></tr>' +
        "</tbody></table>" +
      "</div>" +
      '<div class="card" style="max-width:720px">' +
        "<h2>Request a refund</h2>" +
        selectField("refundBand", "Amount band", ["<10k", "10k-50k", "50k-250k"],
          "Only the band is ever sent - never the exact figure.", "10k-50k") +
        selectField("refundReason", "Reason",
          [{ value: "excess_input_tax", label: "Excess input tax" },
           { value: "duplicate_payment", label: "Duplicate payment" },
           { value: "correction", label: "Correction" }], "", "excess_input_tax") +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-primary" data-action="request-refund-form">Submit refund request</button>' +
        "</div>" +
      "</div>";
  }

  function screenProfile() {
    var p = persona();
    return pageHead("Profile", "Taxpayer profile",
      "Everything below is a Countly user property from the data model. Changing one calls Countly.userData.set() and saves immediately.") +
      '<div class="grid grid-2">' +
        '<div class="card"><h2>Current properties</h2><dl class="kv">' +
          "<dt>taxpayer_type</dt><dd>" + escapeHtml(p.props.taxpayer_type) + "</dd>" +
          "<dt>registration_status</dt><dd>" + escapeHtml(p.props.registration_status) + "</dd>" +
          "<dt>trn_prefix</dt><dd>" + escapeHtml(p.props.trn_prefix) + "</dd>" +
          "<dt>emirate</dt><dd>" + escapeHtml(p.props.emirate) + "</dd>" +
          "<dt>preferred_language</dt><dd>" + escapeHtml(state.lang) + "</dd>" +
          "<dt>filing_frequency</dt><dd>" + escapeHtml(p.props.filing_frequency) + "</dd>" +
          "<dt>first_time_filer</dt><dd>" + escapeHtml(p.props.first_time_filer) + "</dd>" +
          "<dt>returns_filed_count</dt><dd>" + p.props.returns_filed_count + "</dd>" +
          "<dt>on_time_rate_band</dt><dd>" + escapeHtml(p.props.on_time_rate_band) + "</dd>" +
          "<dt>channel_preference</dt><dd>" + escapeHtml(p.props.channel_preference) + "</dd>" +
          "<dt>agent_managed</dt><dd>" + escapeHtml(p.props.agent_managed) + "</dd>" +
          "<dt>ab_variant</dt><dd>" + escapeHtml(state.variant) + "</dd>" +
        "</dl></div>" +
        '<div class="card"><h2>Update preferences</h2>' +
          selectField("profChannel", "channel_preference", ["Mobile App", "Web Portal", "Both"], "", p.props.channel_preference) +
          selectField("profFrequency", "filing_frequency", ["Monthly", "Quarterly", "Annual"], "", p.props.filing_frequency) +
          selectField("profAgent", "agent_managed", ["true", "false"], "Files through a registered tax agent.", p.props.agent_managed) +
          selectField("profEmirate", "emirate",
            ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"], "", p.props.emirate) +
          '<div class="btn-row">' +
            '<button type="button" class="btn btn-primary" data-action="save-profile">Save preferences</button>' +
          "</div>" +
          '<p class="hint">No name, TRN, Emirates ID or address is stored on this screen - the data model forbids it.</p>' +
        "</div>" +
      "</div>";
  }

  function screenTicket() {
    return pageHead("Support", "Raise a support ticket",
      "Creating a ticket fires support_ticket_created with topic and channel.") +
      '<div class="card" style="max-width:720px">' +
        selectField("ticketTopic", "Topic", ["filing", "payment", "registration", "refund"], "", "filing") +
        selectField("ticketChannel", "Channel", ["Web Portal", "Mobile App", "Call Centre"], "", "Web Portal") +
        selectField("ticketDetail", "What happened?", [
          "My return was rejected at the supplies step",
          "My payment was declined twice",
          "My Trade Licence upload keeps failing",
          "My refund has not arrived"
        ], "A fixed list of demo descriptions - there is no free-text box, so no personal data can be entered.") +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-primary" data-action="create-ticket">Create ticket</button>' +
          '<button type="button" class="btn btn-ghost" data-go="/support/chat">Try the assistant first</button>' +
        "</div>" +
      "</div>";
  }

  function screenDashboard() {
    var d = loadDraft();
    return pageHead("Dashboard", "Welcome back, " + persona().name,
      "Outstanding obligations for " + persona().props.emirate + " · " + persona().props.filing_frequency + " filer") +
      '<div class="notice notice-warn"><strong>Your VAT return for ' + PERIOD + ' is due in 3 days</strong>' +
        'File now - it takes about 4 minutes.' +
        '<div class="btn-row"><button type="button" class="btn btn-primary" data-action="open-reminder">Open reminder and file</button></div>' +
      "</div>" +
      '<div class="grid grid-3">' +
        '<div class="stat is-due"><div class="stat-value">' + money(48250) + '</div><div class="stat-label">VAT payable this period</div></div>' +
        '<div class="stat"><div class="stat-value">' + persona().props.returns_filed_count + '</div><div class="stat-label">Returns filed to date</div></div>' +
        '<div class="stat"><div class="stat-value">' + persona().props.on_time_rate_band + '</div><div class="stat-label">On-time filing band</div></div>' +
      "</div>" +
      '<div class="card">' +
        "<h2>Your returns</h2>" +
        '<table class="data"><thead><tr><th>Period</th><th>Type</th><th>Status</th><th class="num">Declared</th></tr></thead><tbody>' +
          "<tr><td>" + PERIOD + "</td><td>VAT</td><td>" + (d ? '<span class="pill warn">Draft saved</span>' : '<span class="pill">Not started</span>') + '</td><td class="num">-</td></tr>' +
          '<tr><td>2026-Q2</td><td>VAT</td><td><span class="pill ok">Submitted</span></td><td class="num">' + money(412300) + "</td></tr>" +
          '<tr><td>2026-Q1</td><td>VAT</td><td><span class="pill ok">Submitted</span></td><td class="num">' + money(388100) + "</td></tr>" +
        "</tbody></table>" +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-primary" data-action="start-filing-dashboard">File ' + PERIOD + " return</button>" +
          (d ? '<button type="button" class="btn" data-action="resume-draft">Resume saved draft</button>' : "") +
          '<button type="button" class="btn" data-go="/payments">Pay outstanding balance</button>' +
        "</div>" +
      "</div>";
  }

  function screenReturnsNew() {
    var d = loadDraft();
    return pageHead("Returns", "Start a new return",
      "The form layout on the following steps is chosen by the Countly A/B test \"" + AB_KEY + "\". Current assignment: " + state.variant + " (" + state.variantSource + ").") +
      '<div class="card" style="max-width:720px">' +
        '<div class="field"><label for="returnType">Return type</label>' +
          '<select id="returnType"><option>VAT</option><option>Excise</option><option>Corporate Tax</option></select>' +
          '<p class="hint">The demo funnel is built on VAT; the other types are here to show segmentation.</p></div>' +
        '<div class="field"><label for="returnPeriod">Tax period</label>' +
          '<select id="returnPeriod"><option>2026-Q3</option><option>2026-Q2</option><option>2026-Q1</option></select></div>' +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-primary" data-action="start-filing-new">Start return</button>' +
          (d ? '<button type="button" class="btn" data-action="resume-draft">Resume saved draft (' + escapeHtml(stepTitle(d.step_key)) + ")</button>" : "") +
          '<button type="button" class="btn btn-quiet" data-action="start-filing-deeplink">Start from a deep link</button>' +
        "</div>" +
      "</div>";
  }

  /* ----- the VAT return steps, rendered per A/B variant -------------- */

  function optionalWrap(stepKey, title, innerHtml) {
    // control: always expanded. variant_a / variant_b: collapsed behind a toggle.
    if (state.variant === "control") {
      return '<fieldset class="fieldset"><legend>' + escapeHtml(title) + "</legend>" + innerHtml + "</fieldset>";
    }
    var open = !!state.optionalOpen[stepKey];
    return '<div class="optional-block">' +
      '<button type="button" class="optional-toggle" data-action="toggle-optional" data-step="' + stepKey + '">' +
      (open ? "− Hide details" : "+ Add details") + " — " + escapeHtml(title) + "</button>" +
      (open ? '<div style="margin-top:12px">' + innerHtml + "</div>" : "") +
      "</div>";
  }

  /* A select bound to the filing model (data-field), used wherever a
     real service would take free text that could contain identifiers or
     personal data. Keeps the validation demo working without ever
     offering somewhere to type a real TRN, name or address. */
  function fieldSelect(id, label, options, hint) {
    var f = state.filing;
    var value = f && f.fields ? f.fields[id] : "";
    var err = f && f.errors ? f.errors[id] : null;
    var opts = options.map(function (o) {
      return '<option value="' + escapeHtml(o.value) + '"' +
        (String(value || "") === String(o.value) ? " selected" : "") + ">" +
        escapeHtml(o.label) + "</option>";
    }).join("");
    return '<div class="field' + (err ? " is-error" : "") + '">' +
      '<label for="' + id + '">' + escapeHtml(label) + "</label>" +
      '<select id="' + id + '" data-field="' + id + '"' +
      (state.variant === "variant_b_guided" ? ' data-inline-validate="1"' : "") + ">" + opts + "</select>" +
      (hint ? '<p class="hint">' + escapeHtml(hint) + "</p>" : "") +
      (err ? '<p class="err">' + escapeHtml(err) + "</p>" : "") +
      "</div>";
  }

  /* Numeric-only input. The `type` argument is ignored and forced to
     "number": the portal must never render a free-text box that could
     take a name, address, identifier or credential, so this helper is
     structurally incapable of producing one. Use fieldSelect() for
     everything else. Amounts are fabricated and only their band is
     ever sent to Countly. */
  function field(id, label, value, hint, type, errKey) {
    var f = state.filing;
    var err = f && f.errors ? f.errors[errKey || id] : null;
    return '<div class="field' + (err ? " is-error" : "") + '">' +
      '<label for="' + id + '">' + escapeHtml(label) + "</label>" +
      '<input type="number" inputmode="decimal" id="' + id + '" data-field="' + id + '" value="' + escapeHtml(value || "") + '"' +
      (state.variant === "variant_b_guided" ? ' data-inline-validate="1"' : "") + ">" +
      (hint ? '<p class="hint">' + escapeHtml(hint) + "</p>" : "") +
      (err ? '<p class="err">' + escapeHtml(err) + "</p>" : "") +
      "</div>";
  }

  function wizardRail(stepKey) {
    if (state.variant !== "variant_b_guided") { return ""; }
    var s = stepByKey(stepKey);
    var pct = Math.round((Number(s.index) / STEPS.length) * 100);
    return '<div class="wizard-rail">' +
      "<strong>Step " + s.index + " of " + STEPS.length + " — " + escapeHtml(stepTitle(stepKey)) + "</strong>" +
      "<p style=\"margin:4px 0 0;font-size:.88rem\">Guided mode checks each field as you leave it, so mistakes are caught before you continue.</p>" +
      '<div class="wizard-progress"><i style="width:' + pct + '%"></i></div>' +
      "</div>";
  }

  function stepActions(stepKey) {
    var s = stepByKey(stepKey);
    var html = '<div class="btn-row spread"><div class="btn-row" style="margin:0">' +
      '<button type="button" class="btn btn-ghost" data-go="' + prevRouteAfter(stepKey) + '">' + escapeHtml(t("back")) + "</button>" +
      '<button type="button" class="btn" data-action="save-draft" data-step="' + stepKey + '">' + escapeHtml(t("saveDraft")) + "</button>";
    if (s.optional) {
      html += '<select id="skipReason" style="min-width:210px">' +
        '<option value="not_applicable">Not applicable</option>' +
        '<option value="will_complete_later">Will complete later</option></select>' +
        '<button type="button" class="btn btn-quiet" data-action="skip-step" data-step="' + stepKey + '">' + escapeHtml(t("skipStep")) + "</button>";
    }
    html += "</div>" +
      '<button type="button" class="btn btn-primary" data-action="next-step" data-step="' + stepKey + '">' +
      (stepKey === "review" ? escapeHtml(t("submit")) : escapeHtml(t("next"))) + "</button></div>";
    return html;
  }

  function helpButton(contextRoute) {
    return '<button type="button" class="btn btn-quiet" data-action="open-help" data-context="' + contextRoute + '">' +
      escapeHtml(t("help")) + "</button>";
  }

  function screenStep(stepKey) {
    var f = ensureFiling();
    var body = "";

    if (stepKey === "taxpayer_details") {
      body =
        fieldSelect("trn", "Tax Registration Number (TRN)", [
          { value: "", label: "— none selected —" },
          { value: "200123456789012", label: "200123456789012 — valid demo TRN" },
          { value: "100987654321098", label: "100987654321098 — valid demo TRN" },
          { value: "12345", label: "12345 — malformed, fires E101_FORMAT" },
          { value: "500123456789012", label: "500123456789012 — bad prefix, fires E101_FORMAT" }
        ], "Fabricated TRNs only. Pick a malformed one to fire the validation error; leave it unselected to fire E402_REQUIRED. The TRN itself is never sent to Countly - only the trn_prefix bucket and the error code.") +
        fieldSelect("legal_name", "Registered legal name", [
          { value: "", label: "— none selected —" },
          { value: "Demo Trading LLC", label: "Demo Trading LLC" },
          { value: "Demo Holding PJSC", label: "Demo Holding PJSC" },
          { value: "Demo Workshop LLC", label: "Demo Workshop LLC" }
        ], "A fixed list of fabricated entities. There is no free-text name box on this page.") +
        optionalWrap("taxpayer_details", "Contact and correspondence",
          fieldSelect("contact_email", "Correspondence mailbox", [
            { value: "", label: "— none selected —" },
            { value: "demo-mailbox-1@example.invalid", label: "demo-mailbox-1@example.invalid" },
            { value: "demo-mailbox-2@example.invalid", label: "demo-mailbox-2@example.invalid" }
          ], "Reserved .invalid demo addresses - they cannot resolve to a real mailbox."));
    } else if (stepKey === "supplies") {
      body =
        field("standard_supplies", "Standard-rated supplies (AED)", f.fields.standard_supplies, "Required. Leave empty to fire E402_REQUIRED.", "number") +
        field("zero_rated", "Zero-rated supplies (AED)", f.fields.zero_rated, "", "number") +
        optionalWrap("supplies", "Exempt supplies and emirate split",
          field("exempt", "Exempt supplies (AED)", f.fields.exempt, "", "number") +
          field("emirate_split", "Emirate split total (AED)", f.fields.emirate_split, "Must equal standard-rated supplies, or E204_MISMATCH is raised.", "number"));
    } else if (stepKey === "purchases") {
      body =
        '<div class="notice notice-info"><strong>This step is optional</strong>Skipping it fires filing_step_skipped with a skip_reason.</div>' +
        field("purchases", "Standard-rated purchases (AED)", f.fields.purchases, "", "number") +
        field("input_tax", "Recoverable input tax (AED)", f.fields.input_tax, "Cannot exceed 5% of purchases, or E311_RANGE is raised.", "number");
    } else if (stepKey === "adjustments") {
      body =
        '<div class="notice notice-info"><strong>This step is optional</strong>Most taxpayers skip it - that is exactly the behaviour the demo highlights.</div>' +
        field("adjustments", "Adjustments to previous periods (AED)", f.fields.adjustments, "Positive increases the amount due.", "number");
    } else if (stepKey === "review") {
      var total = declaredTotal();
      body =
        '<div class="notice notice-info"><strong>Check before you submit</strong>Submitting fires filing_submitted, or filing_submission_failed if the back-end failure toggle in the demo panel is on.</div>' +
        '<dl class="kv">' +
          "<dt>Return type</dt><dd>" + RETURN_TYPE + "</dd>" +
          "<dt>Period</dt><dd>" + PERIOD + "</dd>" +
          "<dt>TRN</dt><dd>" + escapeHtml(f.fields.trn || "-") + "</dd>" +
          "<dt>Standard-rated supplies</dt><dd>" + money(f.fields.standard_supplies) + "</dd>" +
          "<dt>Zero-rated supplies</dt><dd>" + money(f.fields.zero_rated) + "</dd>" +
          "<dt>Exempt supplies</dt><dd>" + money(f.fields.exempt) + "</dd>" +
          "<dt>Total declared</dt><dd>" + money(total) + " <span class=\"pill\">" + amountBand(total) + "</span></dd>" +
          "<dt>Recoverable input tax</dt><dd>" + money(f.fields.input_tax) + "</dd>" +
          "<dt>Adjustments</dt><dd>" + money(f.fields.adjustments) + "</dd>" +
          "<dt>VAT due</dt><dd>" + money(vatDue()) + "</dd>" +
          "<dt>Validation errors so far</dt><dd>" + f.validationErrors + "</dd>" +
          "<dt>Failed submissions</dt><dd>" + f.submitFailures + "</dd>" +
        "</dl>" +
        (f.submitFailures ? '<div class="notice notice-error"><strong>Submission failed</strong>The filing service returned S500_BACKEND. Your draft is safe - try again.</div>' : "");
    }

    return pageHead("VAT return · " + PERIOD, stepTitle(stepKey),
      "Layout: " + state.variant + " · attempt " + attemptBand(f.attempts[stepKey])) +
      stepper(stepKey) +
      wizardRail(stepKey) +
      '<div class="card">' + body +
        '<div class="btn-row">' + helpButton(stepKey === "review" ? "/returns/review" : (stepKey === "supplies" ? "/returns/supplies" : "/returns/supplies")) + "</div>" +
        stepActions(stepKey) +
      "</div>";
  }

  function screenSubmitted() {
    var f = state.filing || newFiling();
    return pageHead("VAT return · " + PERIOD, "Return submitted", "Reference DEMO-" + PERIOD + "-" + randomHash(6).toUpperCase()) +
      '<div class="card">' +
        '<div class="notice notice-ok"><strong>Your ' + PERIOD + ' VAT return has been received</strong>Keep the reference for your records. A payment is now due.</div>' +
        '<dl class="kv">' +
          "<dt>Declared total</dt><dd>" + money(declaredTotal()) + "</dd>" +
          "<dt>VAT due</dt><dd>" + money(vatDue()) + "</dd>" +
          "<dt>First-attempt success</dt><dd>" + (f.validationErrors === 0 && f.submitFailures === 0 ? "Yes" : "No") + "</dd>" +
          "<dt>Filed on time</dt><dd>" + (Date.now() <= DUE_DATE.getTime() ? "Yes" : "No") + "</dd>" +
        "</dl>" +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-primary" data-go="/payments">Pay ' + money(vatDue()) + "</button>" +
          '<button type="button" class="btn" data-go="/dashboard">Back to dashboard</button>' +
        "</div>" +
      "</div>";
  }

  function screenPayments() {
    var due = state.filing ? vatDue() : 48250;
    return pageHead("Payments", "Make a payment", "Outstanding balance for " + PERIOD + ".") +
      '<div class="card" style="max-width:720px">' +
        '<div class="field"><label for="payMethod">Payment method</label>' +
          '<select id="payMethod"><option>Card</option><option>Direct Debit</option><option>Bank Transfer</option><option>eDirham</option></select></div>' +
        '<div class="field"><label for="payAmount">Amount (AED)</label>' +
          '<input type="number" id="payAmount" value="' + (Math.round(due) || 48250) + '">' +
          '<p class="hint">Amount bands used in reporting: &lt;10k, 10k-50k, 50k-250k, &gt;250k. Only the band is sent, never the exact figure.</p></div>' +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-primary" data-action="start-payment">Continue to confirmation</button>' +
          helpButton("/payments") +
        "</div>" +
      "</div>";
  }

  function screenPaymentConfirm() {
    var p = state.payment || { method: "Card", amount: 48250 };
    return pageHead("Payments", "Confirm payment", "Check the details before authorising.") +
      '<div class="card" style="max-width:720px">' +
        '<dl class="kv">' +
          "<dt>Method</dt><dd>" + escapeHtml(p.method) + "</dd>" +
          "<dt>Amount</dt><dd>" + money(p.amount) + ' <span class="pill">' + amountBand(p.amount) + "</span></dd>" +
          "<dt>Period</dt><dd>" + PERIOD + "</dd>" +
        "</dl>" +
        '<div class="notice notice-info"><strong>No real payment is taken</strong>Do not enter card details anywhere on this page - there are none to enter.</div>' +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-primary" data-action="confirm-payment">Authorise payment</button>' +
          '<button type="button" class="btn btn-danger" data-action="decline-payment">Simulate a declined payment</button>' +
          '<button type="button" class="btn btn-ghost" data-go="/payments">Back</button>' +
        "</div>" +
      "</div>";
  }

  function screenPaymentReceipt() {
    var p = state.payment || { method: "Card", amount: 48250 };
    return pageHead("Payments", "Payment receipt", "Reference DEMO-PAY-" + randomHash(6).toUpperCase()) +
      '<div class="card" style="max-width:720px">' +
        '<div class="notice notice-ok"><strong>Payment completed</strong>' + money(p.amount) + " by " + escapeHtml(p.method) + ".</div>" +
        '<div class="field" style="max-width:320px"><label for="refundReason">Refund reason</label>' +
          '<select id="refundReason">' +
            '<option value="excess_input_tax">Excess input tax</option>' +
            '<option value="duplicate_payment">Duplicate payment</option>' +
            '<option value="correction">Correction</option>' +
          "</select></div>" +
        '<div class="btn-row">' +
          '<button type="button" class="btn" data-action="request-refund">Request a refund</button>' +
          '<button type="button" class="btn btn-ghost" data-go="/dashboard">Back to dashboard</button>' +
        "</div>" +
      "</div>";
  }

  function screenFaq() {
    var faqs = [
      ["When is my VAT return due?", "Quarterly returns are due 28 days after the end of the tax period. This demo uses 28 October 2026."],
      ["Can I save a return and finish it later?", "Yes. Use \"Save draft\" on any step; the portal fires filing_draft_saved, and filing_draft_resumed when you come back."],
      ["Why was my TRN rejected?", "A TRN is 15 digits beginning 100, 200 or 300. A malformed TRN raises error code E101_FORMAT."],
      ["What happens if a submission fails?", "The draft is preserved and filing_submission_failed is recorded with the back-end error code so IT operations can be alerted."],
      ["Is this a real government service?", "No. This is a Countly product demonstration. No real taxpayer data is processed."]
    ];
    return pageHead("Support", "Help topics", "Opening this page records help_opened with surface = FAQ.") +
      '<div class="card">' + faqs.map(function (x, i) {
        return '<div class="faq-item"><button type="button" class="faq-q" data-action="faq" data-i="' + i + '">' +
          escapeHtml(x[0]) + '</button><p class="faq-a" id="faq' + i + '" hidden>' + escapeHtml(x[1]) + "</p></div>";
      }).join("") + "</div>" +
      '<div class="card"><h3>Still stuck?</h3>' +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-primary" data-go="/support/chat">Open the virtual assistant</button>' +
          '<button type="button" class="btn" data-go="/support/ticket">Raise a support ticket</button>' +
        "</div></div>";
  }

  function screenChat() {
    return pageHead("Support", "Virtual assistant", "Ending the chat records chatbot_session_ended with resolved = true or false, plus the conversation duration.") +
      '<div class="card" style="max-width:820px">' +
        '<div class="chat-log" id="chatLog">' +
          '<div class="chat-msg bot">Hello. I can help with filing, payments, registration or refunds. What do you need?</div>' +
        "</div>" +
        '<div class="field"><label for="chatTopic">Topic</label>' +
          '<select id="chatTopic"><option value="filing">filing</option><option value="payment">payment</option><option value="registration">registration</option><option value="refund">refund</option></select></div>' +
        selectField("chatInput", "Your message", [
          "When is my VAT return due?",
          "Why was my TRN rejected?",
          "Can I save my return and finish it later?",
          "My payment was declined — what now?",
          "How do I request a refund?"
        ], "A fixed list of demo questions. There is no free-text box, so no personal data can be typed into the transcript.") +
        '<div class="btn-row">' +
          '<button type="button" class="btn" data-action="chat-send">Send</button>' +
          '<button type="button" class="btn btn-primary" data-action="chat-end-resolved">End chat — resolved</button>' +
          '<button type="button" class="btn btn-danger" data-action="chat-end-unresolved">End chat — not resolved</button>' +
          '<button type="button" class="btn btn-quiet" data-go="/support/ticket">Raise a support ticket</button>' +
        "</div>" +
      "</div>";
  }

  /* ==================================================================
   * 12. Screen event binding
   * ================================================================== */

  // Bound ONCE at boot; #app's innerHTML is replaced on every render but
  // the element itself (and therefore these delegated listeners) persists.
  function bindScreen() {
    var app = document.getElementById("app");
    if (!app || app.getAttribute("data-bound")) { return; }
    app.setAttribute("data-bound", "1");

    app.addEventListener("click", onAppClick);
    app.addEventListener("input", onAppInput);
    app.addEventListener("blur", onAppBlur, true);
  }

  function onAppInput(e) {
    var name = e.target.getAttribute && e.target.getAttribute("data-field");
    if (!name) { return; }
    ensureFiling().fields[name] = e.target.value;

    // Selects have no meaningful "blur after typing" moment, so the
    // guided variant validates them as soon as the choice changes.
    if (state.variant === "variant_b_guided" &&
        e.target.tagName === "SELECT" &&
        e.target.getAttribute("data-inline-validate")) {
      var s = stepByRoute(state.currentRoute);
      if (s) { validateStep(s.key, true); }
    }
  }

  function onAppBlur(e) {
    // variant_b_guided validates inline, as its description in taxonomy.json says
    if (state.variant !== "variant_b_guided") { return; }
    if (!e.target.getAttribute || !e.target.getAttribute("data-inline-validate")) { return; }
    var stepKey = stepByRoute(state.currentRoute) ? stepByRoute(state.currentRoute).key : null;
    if (!stepKey) { return; }
    validateStep(stepKey, true);
  }

  function onAppClick(e) {
    var el = e.target.closest ? e.target.closest("[data-go],[data-action]") : null;
    if (!el) { return; }

    var goTo = el.getAttribute("data-go");
    if (goTo) { e.preventDefault(); go(goTo); return; }

    var action = el.getAttribute("data-action");
    if (!action) { return; }
    e.preventDefault();

    switch (action) {

      /* ---- login ------------------------------------------------- */
      case "login-ok": {
        var method = valueOf("loginMethod", "UAE Pass");
        endTimedEvent("login", { method: method, result: "success", failure_reason: "none" });
        state.loggedIn = true;
        // Data-model convention: change the device id on login, merging
        // the anonymous pre-login activity into the signed-in user.
        var newId = "acct_" + randomHash(24);
        try {
          if (state.sdkOk) { Countly.change_id(newId, true); }
          write(LS.device, newId);
          DEVICE_ID = newId;
          write(LS.identified, "1");
          feed("id", "change_id (merge)", { device_id: newId });
        } catch (err) { console.warn("[demo] change_id failed", err); }
        updateDeviceIdLine();
        pushUserProperties();
        go("/dashboard");
        break;
      }
      case "login-fail":
        endTimedEvent("login", { method: valueOf("loginMethod", "Password"), result: "failure", failure_reason: "wrong_password" });
        startTimedEvent("login");
        notify("error", "Sign-in failed", "The password you entered is not correct. (Demo only - nothing was checked.)");
        break;
      case "login-otp":
        endTimedEvent("login", { method: valueOf("loginMethod", "UAE Pass"), result: "failure", failure_reason: "otp_timeout" });
        startTimedEvent("login");
        notify("error", "One-time password expired", "The OTP timed out. (Demo only.)");
        break;

      /* ---- filing entry points ----------------------------------- */
      case "start-filing-dashboard":
        startFiling("dashboard"); go(STEPS[0].route); break;
      case "start-filing-new":
        startFiling("dashboard"); go(STEPS[0].route); break;
      case "start-filing-deeplink":
        startFiling("deep_link"); go(STEPS[0].route); break;
      case "open-reminder":
        trackEvent("reminder_opened", {
          reminder_type: "filing_deadline", days_before: "3", ab_variant: state.variant
        });
        startFiling("reminder");
        go(STEPS[0].route);
        break;
      case "resume-draft":
        resumeDraft(); break;

      /* ---- filing steps ------------------------------------------ */
      case "save-draft":
        saveDraft(el.getAttribute("data-step"), false);
        notify("ok", "Draft saved", "You can leave the portal and resume this return later.");
        break;
      case "skip-step": {
        var skipKey = el.getAttribute("data-step");
        skipStep(skipKey, valueOf("skipReason", "not_applicable"));
        go(nextRouteAfter(skipKey));
        break;
      }
      case "toggle-optional": {
        var oKey = el.getAttribute("data-step");
        state.optionalOpen[oKey] = !state.optionalOpen[oKey];
        render();
        break;
      }
      case "next-step": {
        var stepKey = el.getAttribute("data-step");
        if (!validateStep(stepKey, false)) {
          render();
          window.scrollTo(0, 0);       // put the error in front of the audience
          return;
        }
        if (stepKey === "review") { submitReturn(); return; }
        completeStep(stepKey);
        // One autosave on the way out of "supplies" so the demo has an
        // autosave = true example alongside the manual saves.
        if (stepKey === "supplies" && !state.filing.autosaved) {
          state.filing.autosaved = true;
          saveDraft("supplies", true);
        }
        go(nextRouteAfter(stepKey));
        break;
      }

      /* ---- registration & onboarding ----------------------------- */
      case "start-registration":
        startRegistration(valueOf("regMethod", "UAE Pass"), valueOf("regChannel", "Web Portal"));
        go("/register/identity");
        break;

      case "reg-step": {
        var rKey = el.getAttribute("data-step");
        var reg = ensureRegistration();
        reg.errors = {};

        if (rKey === "identity") {
          reg.fields.id_type = valueOf("regIdType", "");
          if (!reg.fields.id_type) {
            reg.errors.id_type = "Choose an identity document type to continue.";
            bumpRegAttempt("identity");
            render();
            window.scrollTo(0, 0);
            return;
          }
        }
        if (rKey === "contact") { reg.fields.contact_channel = valueOf("regContact", "Both"); }
        if (rKey === "business_details") {
          reg.fields.entity_type = valueOf("regEntity", "LLC");
          reg.fields.activity = valueOf("regActivity", "Trading");
        }
        if (rKey === "documents") {
          if (!Object.keys(acceptedDocTypes()).length) {
            notify("warn", "No accepted documents yet",
              "Upload at least one document that is accepted before continuing. Rejected uploads are still recorded.");
            return;
          }
        }

        completeRegStep(rKey);
        if (rKey === "business_details") { go("/register/documents"); }
        else if (rKey === "documents") { go("/register/review"); }
        else { render(); }
        break;
      }

      case "reg-retry": {
        var retryKey = el.getAttribute("data-step");
        bumpRegAttempt(retryKey);
        render();
        notify("warn", "Step rejected",
          "The registry rejected this step. attempt_no is now " +
          attemptBand(ensureRegistration().attempts[retryKey]) +
          " and will be sent with the next registration_step_completed.");
        break;
      }

      case "reg-upload": {
        var docType = el.getAttribute("data-doc");
        var fileSel = document.getElementById("file_" + docType.replace(/\s+/g, "_"));
        uploadDocument(docType, fileSel ? fileSel.value : FAKE_FILES[0].name);
        break;
      }

      case "submit-registration":
        submitRegistration();
        break;

      /* ---- refunds, profile, tickets ----------------------------- */
      case "request-refund-form":
        trackEvent("refund_requested", {
          amount_band: valueOf("refundBand", "10k-50k"),
          reason: valueOf("refundReason", "excess_input_tax")
        });
        notify("ok", "Refund requested", "Your refund request has been logged.");
        break;

      case "save-profile": {
        var updates = {
          channel_preference: valueOf("profChannel", "Web Portal"),
          filing_frequency: valueOf("profFrequency", "Quarterly"),
          agent_managed: valueOf("profAgent", "false"),
          emirate: valueOf("profEmirate", "Dubai")
        };
        var pp = persona();
        Object.keys(updates).forEach(function (k) {
          pp.props[k] = updates[k];
          setUserProperty(k, updates[k]);
        });
        render();
        notify("ok", "Preferences saved", "Four user properties updated via Countly.userData.set().");
        break;
      }

      case "create-ticket":
        trackEvent("support_ticket_created", {
          topic: valueOf("ticketTopic", "filing"),
          channel: valueOf("ticketChannel", "Web Portal")
        });
        notify("ok", "Ticket created", "support_ticket_created recorded. Reference DEMO-TK-" + randomHash(5).toUpperCase() + ".");
        break;

      /* ---- help & support ---------------------------------------- */
      case "open-help": {
        var ctx = el.getAttribute("data-context") || state.lastHelpContext;
        if (HELP_CONTEXTS.indexOf(ctx) === -1) { ctx = state.lastHelpContext; }
        trackEvent("help_opened", { surface: "Guided Help", context_view: ctx });
        notify("info", "Guided help", "Guided help panel would open here. help_opened recorded with context_view = " + ctx + ".");
        break;
      }
      case "faq": {
        var i = el.getAttribute("data-i");
        var ans = document.getElementById("faq" + i);
        if (ans) { ans.hidden = !ans.hidden; }
        break;
      }
      case "chat-send": {
        var inp = document.getElementById("chatInput");
        var log = document.getElementById("chatLog");
        if (inp && log && inp.value.trim()) {
          log.insertAdjacentHTML("beforeend", '<div class="chat-msg user">' + escapeHtml(inp.value) + "</div>");
          log.insertAdjacentHTML("beforeend", '<div class="chat-msg bot">Thanks. In the demo the assistant does not answer - use the buttons below to end the conversation as resolved or unresolved.</div>');
          log.scrollTop = log.scrollHeight;
        }
        break;
      }
      case "chat-end-resolved":
        endTimedEvent("chatbot_session_ended", { resolved: "true", topic: valueOf("chatTopic", "filing") });
        notify("ok", "Chat ended", "Marked as resolved.");
        startTimedEvent("chatbot_session_ended");
        break;
      case "chat-end-unresolved":
        endTimedEvent("chatbot_session_ended", { resolved: "false", topic: valueOf("chatTopic", "filing") });
        notify("warn", "Chat ended", "Marked as unresolved - this feeds the \"Chatbot unresolved\" cohort.");
        startTimedEvent("chatbot_session_ended");
        break;

      /* ---- payments ---------------------------------------------- */
      case "start-payment": {
        var amount = Number(valueOf("payAmount", "48250")) || 0;
        var pmethod = valueOf("payMethod", "Card");
        state.payment = { method: pmethod, amount: amount };
        trackEvent("payment_started", { method: pmethod, amount_band: amountBand(amount) });
        go("/payments/confirm");
        break;
      }
      case "confirm-payment": {
        var pay = state.payment || { method: "Card", amount: 48250 };
        if (state.backendFail) {
          trackEvent("payment_failed", { method: pay.method, error_code: "P202_3DS_TIMEOUT" });
          notify("error", "Payment could not be completed", "The payment gateway timed out during 3-D Secure (P202_3DS_TIMEOUT). Turn the back-end failure toggle off in the demo panel to succeed.");
          break;
        }
        var band = amountBand(pay.amount);
        endTimedEvent("payment_completed", {
          method: pay.method, amount_band: band, on_time: (Date.now() <= DUE_DATE.getTime() ? "true" : "false")
        }, { sum: bandIndex(band) });
        go("/payments/receipt");
        break;
      }
      case "decline-payment": {
        var pd = state.payment || { method: "Card", amount: 48250 };
        trackEvent("payment_failed", { method: pd.method, error_code: "P101_DECLINED" });
        notify("error", "Payment declined", "Your bank declined the payment (P101_DECLINED).");
        break;
      }
      case "request-refund": {
        var amt = (state.payment && state.payment.amount) || 48250;
        var refundBand = amountBand(amt);
        if (refundBand === ">250k") { refundBand = "50k-250k"; }   // taxonomy caps refund bands
        trackEvent("refund_requested", { amount_band: refundBand, reason: valueOf("refundReason", "excess_input_tax") });
        notify("ok", "Refund requested", "Your refund request has been logged.");
        break;
      }

      default:
        break;
    }
  }

  function valueOf(id, dflt) {
    var el = document.getElementById(id);
    return el && el.value !== "" ? el.value : dflt;
  }

  function notify(kind, title, body) {
    var app = document.getElementById("app");
    if (!app) { return; }
    var cls = { ok: "notice-ok", info: "notice-info", warn: "notice-warn", error: "notice-error" }[kind] || "notice-info";
    var existing = app.querySelector(".js-notice");
    if (existing) { existing.parentNode.removeChild(existing); }
    var div = document.createElement("div");
    div.className = "notice " + cls + " js-notice";
    div.setAttribute("role", "status");
    div.innerHTML = "<strong>" + escapeHtml(title) + "</strong>" + escapeHtml(body);
    var head = app.querySelector(".page-head");
    if (head && head.nextSibling) { app.insertBefore(div, head.nextSibling); }
    else { app.insertBefore(div, app.firstChild); }
  }

  /* ==================================================================
   * 13. Validation - the deliberate source of filing_validation_error
   * ================================================================== */

  function validateStep(stepKey, silent) {
    var f = ensureFiling();
    f.errors = {};
    var ok = true;

    if (stepKey === "taxpayer_details") {
      var trn = String(f.fields.trn || "").trim();
      if (!trn) {
        f.errors.trn = "Enter your TRN.";
        validationError("taxpayer_details", "trn", "E402_REQUIRED", silent);
        ok = false;
      } else if (!/^(100|200|300)\d{12}$/.test(trn)) {
        f.errors.trn = "That TRN is not in the right format. It must be 15 digits starting 100, 200 or 300.";
        validationError("taxpayer_details", "trn", "E101_FORMAT", silent);
        ok = false;
      }
    }

    if (stepKey === "supplies") {
      var std = String(f.fields.standard_supplies || "").trim();
      if (!std) {
        f.errors.standard_supplies = "Enter your standard-rated supplies (0 is allowed).";
        validationError("supplies", "taxable_amount", "E402_REQUIRED", silent);
        ok = false;
      } else if (Number(std) < 0) {
        f.errors.standard_supplies = "Supplies cannot be negative.";
        validationError("supplies", "taxable_amount", "E311_RANGE", silent);
        ok = false;
      }
      var split = String(f.fields.emirate_split || "").trim();
      if (split && Number(split) !== Number(std || 0)) {
        f.errors.emirate_split = "The emirate split must add up to your standard-rated supplies.";
        validationError("supplies", "emirate_split", "E204_MISMATCH", silent);
        ok = false;
      }
    }

    if (stepKey === "purchases") {
      var pur = Number(f.fields.purchases || 0);
      var inp = String(f.fields.input_tax || "").trim();
      if (inp && Number(inp) > pur * 0.05 + 0.001) {
        f.errors.input_tax = "Recoverable input tax cannot exceed 5% of purchases.";
        validationError("purchases", "input_tax", "E311_RANGE", silent);
        ok = false;
      }
    }

    if (stepKey === "review") {
      if (!f.fields.trn) {
        f.errors.trn = "Taxpayer details are incomplete.";
        validationError("review", "trn", "E402_REQUIRED", silent);
        ok = false;
      }
    }

    if (silent) { renderInlineErrors(); }
    return ok;
  }

  function renderInlineErrors() {
    var f = state.filing;
    if (!f) { return; }
    var app = document.getElementById("app");
    if (!app) { return; }
    var inputs = app.querySelectorAll("[data-field]");
    for (var i = 0; i < inputs.length; i++) {
      var name = inputs[i].getAttribute("data-field");
      var wrap = inputs[i].parentNode;
      var old = wrap.querySelector(".err");
      if (old) { wrap.removeChild(old); }
      wrap.classList.remove("is-error");
      if (f.errors[name]) {
        wrap.classList.add("is-error");
        var p = document.createElement("p");
        p.className = "err";
        p.textContent = f.errors[name];
        wrap.appendChild(p);
      }
    }
  }

  /* ==================================================================
   * 14. Submission
   * ================================================================== */

  function submitReturn() {
    var f = ensureFiling();

    if (state.backendFail) {
      f.submitFailures++;
      trackEvent("filing_submission_failed", {
        error_code: "S500_BACKEND", step_key: "review", return_type: RETURN_TYPE
      });
      render();
      notify("error", "Submission failed", "The filing service is not responding (S500_BACKEND). Your draft has been kept - switch the toggle off in the demo panel and try again.");
      return;
    }

    completeStep("review");

    var total = declaredTotal();
    var band = amountBand(total);
    endTimedEvent("filing_submitted", {
      return_type: RETURN_TYPE,
      first_attempt_success: (f.validationErrors === 0 && f.submitFailures === 0) ? "true" : "false",
      filed_on_time: (Date.now() <= DUE_DATE.getTime()) ? "true" : "false",
      ab_variant: state.variant
    }, { sum: bandIndex(band) });

    try {
      if (state.sdkOk) { Countly.userData.increment("returns_filed_count"); Countly.userData.save(); }
    } catch (e) { /* noop */ }

    drop(LS.draft);
    go("/returns/submitted");
  }

  /* ==================================================================
   * 15. Header controls (persona, language)
   * ================================================================== */

  function buildPersonaSelect() {
    var sel = document.getElementById("personaSelect");
    if (!sel) { return; }
    sel.innerHTML = PERSONAS.map(function (p) {
      return '<option value="' + p.id + '"' + (p.id === state.personaId ? " selected" : "") + ">" +
        escapeHtml(p.label) + "</option>";
    }).join("");
    sel.addEventListener("change", function () {
      state.personaId = sel.value;
      write(LS.persona, state.personaId);
      pushUserProperties();
      render();
    });
  }

  function applyLanguage() {
    var html = document.documentElement;
    html.setAttribute("lang", state.lang);
    html.setAttribute("dir", state.lang === "ar" ? "rtl" : "ltr");
    applyI18nAttributes();
    // Screen bodies are English templates; i18n-ar.js translates the rendered DOM when Arabic is on.
    if (window.PortalAR) { window.PortalAR.setActive(state.lang === "ar"); }
  }

  function bindLanguageToggle() {
    var btn = document.getElementById("langToggle");
    if (!btn) { return; }
    btn.addEventListener("click", function () {
      state.lang = state.lang === "en" ? "ar" : "en";
      write(LS.lang, state.lang);
      applyLanguage();
      setUserProperty("preferred_language", state.lang);   // taxonomy user property
      render();
    });
  }

  /* ==================================================================
   * 16. Demo panel wiring
   * ================================================================== */

  function updateDeviceIdLine() {
    var el = document.getElementById("deviceIdLine");
    if (el) { el.textContent = "Current: " + DEVICE_ID; }
  }

  function bindDemoPanel() {
    var $ = function (id) { return document.getElementById(id); };

    var collapse = $("demoCollapse");
    var body = $("demoPanelBody");
    if (collapse && body) {
      collapse.addEventListener("click", function () {
        var hidden = body.hasAttribute("hidden");
        if (hidden) { body.removeAttribute("hidden"); } else { body.setAttribute("hidden", ""); }
        collapse.textContent = hidden ? "Hide" : "Show";
        collapse.setAttribute("aria-expanded", hidden ? "true" : "false");
      });
    }

    var unhandled = $("btnUnhandledError");
    if (unhandled) {
      unhandled.addEventListener("click", function () {
        feed("crash", "unhandled error (deliberate)", { screen: state.currentRoute });
        // Thrown asynchronously so it reaches window.onerror as a genuine
        // unhandled error and is picked up by Countly.track_errors().
        window.setTimeout(function () {
          var missing = window.__dta_demo_missing_service__;
          missing.submitReturn();          // TypeError, on purpose
        }, 0);
      });
    }

    var handled = $("btnHandledError");
    if (handled) {
      handled.addEventListener("click", function () {
        try {
          throw new Error("DemoHandledError: /api/returns/draft returned 503 while autosaving");
        } catch (err) {
          try {
            if (state.sdkOk) {
              Countly.log_error(err, {
                screen: state.currentRoute,
                return_type: RETURN_TYPE,
                app_version: crashSegments.app_version,
                connection: crashSegments.connection
              });
            }
          } catch (e) { console.warn("[demo] log_error failed", e); }
          feed("crash", "handled error (log_error)", { screen: state.currentRoute });
          notify("warn", "Handled error logged", "Countly.log_error() sent a non-fatal error report with the crash segments from the data model.");
        }
      });
    }

    var slow = $("btnSlowApi");
    if (slow) {
      slow.addEventListener("click", function () {
        slow.disabled = true;
        slow.textContent = "Calling /api/returns/submit…";
        var started = Date.now();
        window.setTimeout(function () {
          var ended = Date.now();
          var metrics = {
            response_time: ended - started,
            response_payload_size: 1840,
            response_code: 200,
            request_payload_size: 620
          };
          try {
            if (state.sdkOk) {
              Countly.report_trace({
                type: "network",
                name: "/api/returns/submit",
                stz: started,
                etz: ended,
                apm_metrics: metrics,
                app_metrics: metrics      // both names accepted across SDK builds
              });
            }
          } catch (e) { console.warn("[demo] report_trace failed", e); }
          feed("apm", "/api/returns/submit", { response_time: metrics.response_time });
          slow.disabled = false;
          slow.textContent = "Fire slow fake API call";
        }, 2400);
      });
    }

    var reset = $("btnResetDevice");
    if (reset) {
      reset.addEventListener("click", function () {
        var newId = "acct_" + randomHash(24);
        try {
          // merge = false -> a genuinely new user, which is what the demo wants
          if (state.sdkOk) { Countly.change_id(newId, false); }
        } catch (e) { console.warn("[demo] change_id failed", e); }
        write(LS.device, newId);
        drop(LS.draft);
        drop(LS.variant);
        drop(LS.identified);
        feed("id", "change_id (new user)", { device_id: newId });
        window.setTimeout(function () { window.location.reload(); }, 350);
      });
    }

    var fail = $("toggleBackendFail");
    if (fail) {
      fail.addEventListener("change", function () {
        state.backendFail = fail.checked;
        feed("demo", "backend_failure_simulation", { enabled: String(fail.checked) });
      });
    }

    var force = $("forceVariant");
    if (force) {
      force.addEventListener("change", function () {
        state.forcedVariant = force.value;
        if (force.value) { applyVariant(force.value, "forced (demo)"); }
        else { resolveVariant(); }
      });
    }

    var refetch = $("btnRefetchRC");
    if (refetch) {
      refetch.addEventListener("click", function () {
        state.forcedVariant = "";
        if (force) { force.value = ""; }
        resolveVariant();
      });
    }

    // Fire an in-app message on demand: sends the event its Countly campaign is triggered by (same keys and
    // segmentation as the real portal flow, through the model bridge). The server queues the message and the
    // SDK shows it at its next content poll (every ~15 s).
    var fireMsg = $("btnFireInApp");
    var fireSel = $("fireInAppSelect");
    if (fireMsg && fireSel) {
      var FIRE = {
        welcome: ["portal_account_created", {}],
        start: ["filing_started", { return_type: RETURN_TYPE, period: PERIOD, entry_point: "dashboard" }],
        validation: ["help_opened", { surface: "Guided Help", context_view: "/returns/supplies" }],
        submitted: ["filing_submitted", { return_type: RETURN_TYPE, first_attempt_success: "true", filed_on_time: "true", ab_variant: state.variant }],
        payment: ["reminder_opened", { reminder_type: "payment_due" }]
      };
      fireMsg.addEventListener("click", function () {
        var f = FIRE[fireSel.value];
        if (!f) { return; }
        trackEvent(f[0], f[1]);
        fireMsg.disabled = true;
        var label = fireMsg.textContent;
        fireMsg.textContent = "Sent — message in ~15 s…";
        window.setTimeout(function () { fireMsg.disabled = false; fireMsg.textContent = label; }, 15000);
      });
    }

    var copyBtn = $("btnCopyEvents");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () { copyLastEvents(10); });
    }

    var clearQueue = $("btnClearQueue");
    if (clearQueue) {
      clearQueue.addEventListener("click", function () {
        // The SDK persists its request/event queues under the configured
        // namespace. Dropping them stops requests captured under an old
        // app key from replaying and producing confusing 400s on stage.
        var removed = 0;
        try {
          var keys = [];
          for (var i = 0; i < window.localStorage.length; i++) {
            var k = window.localStorage.key(i);
            if (k && (k.indexOf("cly_") !== -1 || k.indexOf("dta_demo/") === 0)) { keys.push(k); }
          }
          keys.forEach(function (k) { drop(k); removed++; });
        } catch (e) { console.warn("[demo] could not clear SDK queue", e); }
        feed("demo", "cleared_sdk_queue", { removed_keys: String(removed) });
        window.setTimeout(function () { window.location.reload(); }, 400);
      });
    }

    var link = $("linkEventLog");
    if (link) { link.setAttribute("href", CFG.EVENT_LOG_URL || (COUNTLY_URL + "/dashboard")); }

    updateDeviceIdLine();
  }

  /* ==================================================================
   * 17. Boot
   * ================================================================== */

  function boot() {
    initCountly();
    applyLanguage();
    buildPersonaSelect();
    bindLanguageToggle();
    bindDemoPanel();
    bindScreen();
    renderAbBadge();

    window.addEventListener("hashchange", onRoute);
    if (!window.location.hash) { window.location.hash = "#/home"; }
    onRoute();

    pushUserProperties();
    resolveVariant();

    console.info("[demo] e-Services Portal (Demo) ready. Countly:", state.sdkOk ? "initialised" : "NOT initialised",
      "· device_id:", DEVICE_ID, "· app_key:", APP_KEY === "REPLACE_WITH_APP_KEY" ? "NOT SET (requests will 400)" : "set");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();
