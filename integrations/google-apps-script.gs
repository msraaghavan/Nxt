/**
 * AI Quest 60 · optional live backend (Google Sheets + Apps Script)
 *
 * Turns the prototype from "works in one browser" into a shared, multi-device
 * tracker: every registration, Quest Leader and funnel event lands in a Sheet the
 * growth team can filter, and the leaderboards read back from it.
 *
 * Setup (5 minutes):
 *  1. Create a Google Sheet → Extensions → Apps Script → paste this file.
 *  2. Deploy → New deployment → type "Web app"
 *       Execute as: Me · Who has access: Anyone
 *  3. Copy the /exec URL and set it as VITE_SHEETS_URL in Vercel / Netlify / Lovable
 *     (or a local .env file), then redeploy the site.
 *
 * Privacy: phone numbers and emails are written to the Sheet but NEVER returned by
 * doGet(). The public endpoint only exposes what the leaderboards need.
 */

var SHEETS = {
  registration: 'registrations',
  leader: 'leaders',
  event: 'events',
};

var COLUMNS = {
  registrations: ['id', 'ts', 'name', 'phone', 'email', 'college', 'branch', 'gradYear', 'priorAI', 'code', 'referredBy', 'leader', 'channel', 'source', 'hook', 'day', 'hour'],
  leaders: ['code', 'name', 'college', 'phone', 'day'],
  events: ['ts', 'type', 'day', 'channel', 'hook'],
};

// Fields that are safe to return publicly (no phone / email).
var PUBLIC = {
  registrations: ['id', 'ts', 'name', 'college', 'branch', 'gradYear', 'priorAI', 'code', 'referredBy', 'leader', 'channel', 'source', 'hook', 'day', 'hour'],
  leaders: ['code', 'name', 'college', 'day'],
};

function sheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(COLUMNS[name]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var body = JSON.parse(e.postData.contents);
    var name = SHEETS[body.kind];
    if (!name) return json_({ ok: false, error: 'unknown kind' });
    var p = body.payload || {};
    if (name === 'events') p.ts = Date.now();
    var sh = sheet_(name);
    // de-duplicate registrations by phone number
    if (name === 'registrations' && p.phone) {
      var phones = sh.getRange(2, 4, Math.max(sh.getLastRow() - 1, 1), 1).getValues().map(function (r) { return String(r[0]); });
      if (phones.indexOf(String(p.phone)) !== -1) return json_({ ok: true, duplicate: true });
    }
    sh.appendRow(COLUMNS[name].map(function (c) { return p[c] === undefined ? '' : p[c]; }));
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({
    registrations: read_('registrations'),
    leaders: read_('leaders'),
  });
}

function read_(name) {
  var sh = sheet_(name);
  var rows = sh.getDataRange().getValues();
  var head = rows.shift() || [];
  var keep = PUBLIC[name];
  return rows.map(function (r) {
    var o = {};
    head.forEach(function (h, i) {
      if (keep.indexOf(h) === -1) return;
      var v = r[i];
      if (h === 'gradYear' || h === 'day' || h === 'hour' || h === 'ts') v = Number(v);
      if (h === 'priorAI') v = v === true || v === 'TRUE' || v === 'true';
      if (v === '') return;
      o[h] = v;
    });
    if (name === 'registrations') {
      o.phone = '';
      o.email = '';
    }
    return o;
  });
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
