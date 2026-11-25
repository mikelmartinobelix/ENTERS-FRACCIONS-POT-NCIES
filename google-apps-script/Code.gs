/**
 * Google Apps Script per a "Mates 3r ESO - Entrenador Adaptatiu"
 *
 * COM INSTAL·LAR-HO:
 * 1. Obre un Full de Càlcul de Google (Google Sheets) nou.
 * 2. Ves al menú: Extensions > Apps Script.
 * 3. Esborra el codi que hi hagi i enganxa tot aquest fitxer.
 * 4. Desa el projecte (Ctrl+S / Cmd+S).
 * 5. Fes clic a "Implementa" (Deploy) > "Nova implementació" (New deployment).
 * 6. Tria el tipus: "Aplicació web" (Web app).
 *    - Executa com a: "Jo mateix" (Me)
 *    - Qui hi té accés: "Qualsevol usuari" (Anyone)
 * 7. Clica "Implementa", autoritza els permisos i copia la URL que acaba en /exec.
 */

var ACCESS_PASSWORD = 'Macitec3';
var SHEET_LOGS = 'Registre_Exercicis';
var SHEET_SUMMARY = 'Resum_Alumnes';
var SHEET_LOGINS = 'Registre_Accessos';

function getOrCreateSheets_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var logsSheet = ss.getSheetByName(SHEET_LOGS);
  if (!logsSheet) {
    logsSheet = ss.insertSheet(SHEET_LOGS);
    logsSheet.appendRow([
      'Data i hora',
      'ID Alumne',
      'Nom i cognoms',
      'Grup',
      'Bloc',
      'Nivell',
      'Expressió',
      'Resposta alumne',
      'Solució correcta',
      'Correcte?',
      "Diagnòstic d'error"
    ]);
    logsSheet.setFrozenRows(1);
    logsSheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#e0e7ff');
  }

  var summarySheet = ss.getSheetByName(SHEET_SUMMARY);
  if (!summarySheet) {
    summarySheet = ss.insertSheet(SHEET_SUMMARY);
    summarySheet.appendRow([
      'ID Alumne',
      'Nom i cognoms',
      'Grup',
      'Data registre',
      'Darrera activitat',
      'Total exercicis',
      'Correctes',
      '% Encert',
      'Ràtxa actual',
      'Millor ràtxa',
      'Enters (encerts/total)',
      'Potències (encerts/total)',
      'Fraccions (encerts/total)'
    ]);
    summarySheet.setFrozenRows(1);
    summarySheet.getRange(1, 1, 1, 13).setFontWeight('bold').setBackground('#dcfce7');
  }

  var loginsSheet = ss.getSheetByName(SHEET_LOGINS);
  if (!loginsSheet) {
    loginsSheet = ss.insertSheet(SHEET_LOGINS);
    loginsSheet.appendRow([
      'Data i hora entrada',
      'ID Alumne',
      'Nom i cognoms',
      'Grup'
    ]);
    loginsSheet.setFrozenRows(1);
    loginsSheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#fef3c7');
  }

  return { logsSheet: logsSheet, summarySheet: summarySheet, loginsSheet: loginsSheet };
}

function upsertSummary_(summarySheet, student) {
  if (!student || !student.studentId) return;

  var lastRow = summarySheet.getLastRow();
  var targetRow = -1;

  if (lastRow >= 2) {
    var ids = summarySheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(student.studentId)) {
        targetRow = i + 2;
        break;
      }
    }
  }

  var total = Number(student.totalExercises || 0);
  var correct = Number(student.correctExercises || 0);
  var accuracy = total > 0 ? Math.round((correct / total) * 100) + '%' : '0%';
  var cats = student.categoryStats || {};
  var entersStr = (cats.enters ? cats.enters.correct : 0) + '/' + (cats.enters ? cats.enters.total : 0);
  var potStr = (cats.potencies ? cats.potencies.correct : 0) + '/' + (cats.potencies ? cats.potencies.total : 0);
  var fracStr = (cats.fraccions ? cats.fraccions.correct : 0) + '/' + (cats.fraccions ? cats.fraccions.total : 0);

  var nowFormatted = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
  var createdStr = student.createdAt ? String(student.createdAt).slice(0, 10) : nowFormatted;

  var rowValues = [
    student.studentId,
    student.name || '',
    student.group || '',
    createdStr,
    nowFormatted,
    total,
    correct,
    accuracy,
    Number(student.currentStreak || 0),
    Number(student.bestStreak || 0),
    entersStr,
    potStr,
    fracStr
  ];

  if (targetRow > 0) {
    summarySheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    summarySheet.appendRow(rowValues);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      service: 'Mates 3r ESO - Registre Google Sheets',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    var data = JSON.parse(raw);

    if (String(data.accessCode || '') !== ACCESS_PASSWORD) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: 'Contrasenya incorrecta' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var sheets = getOrCreateSheets_();
    var nowFormatted = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');

    if (data.student) {
      upsertSummary_(sheets.summarySheet, data.student);
    }

    if (data.action === 'register' && data.student) {
      sheets.loginsSheet.appendRow([
        nowFormatted,
        data.student.studentId || '',
        data.student.name || '',
        data.student.group || ''
      ]);
    }

    if (data.action === 'exercise' && data.exercise) {
      var ex = data.exercise;
      sheets.logsSheet.appendRow([
        nowFormatted,
        data.student ? data.student.studentId : '',
        data.student ? data.student.name : '',
        data.student ? data.student.group : '',
        ex.category || '',
        ex.difficulty || '',
        ex.expression || '',
        ex.userAnswer || '',
        ex.correctAnswer || '',
        ex.isCorrect ? 'SÍ' : 'NO',
        ex.mistakeTitle || ''
      ]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
