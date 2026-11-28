/**
 * Google Apps Script per a "Càlcul: enters, potències i fraccions"
 * Registre automàtic amb un full separat per a cada curs (1r ESO, 2n ESO, 3r ESO, 4t ESO).
 *
 * COM ACTUALITZAR-HO / INSTAL·LAR-HO:
 * 1. Obre el teu Full de Càlcul de Google (Google Sheets).
 * 2. Ves al menú: Extensions > Apps Script.
 * 3. Esborra el codi antic i enganxa tot aquest fitxer.
 * 4. Desa el projecte (Ctrl+S / Cmd+S).
 * 5. Opcional: selecciona la funció "inicialitzarFulls" dalt i clica "Executa" per crear les pestanyes al moment.
 * 6. Fes clic a "Implementa" (Deploy) > "Nova implementació" (New deployment).
 *    - Tipus: "Aplicació web" (Web app)
 *    - Executa com a: "Jo mateix" (Me)
 *    - Qui hi té accés: "Qualsevol usuari" (Anyone)
 * 7. Clica "Implementa", autoritza els permisos si cal i copia la nova URL que acaba en /exec.
 */

var ACCESS_PASSWORD = 'Macitec3';

var COURSES = ['1r ESO', '2n ESO', '3r ESO', '4t ESO'];
var COURSE_COLORS = {
  '1r ESO': '#dbeafe',
  '2n ESO': '#dcfce7',
  '3r ESO': '#fef3c7',
  '4t ESO': '#ede9fe'
};

var SHEET_LOGS = 'Registre_Exercicis';
var SHEET_LOGINS = 'Registre_Accessos';
var SHEET_LEGACY_SUMMARY = 'Resum_Alumnes';

var COURSE_SUMMARY_HEADERS = [
  'ID Alumne',
  'Nom i cognoms',
  'Classe',
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
];

function extractCourseAndClass_(data, student) {
  var rawCourse = (data && data.course) || (student && student.course) || '';
  var rawClass = (data && data.classLetter) || (student && student.classLetter) || '';
  var rawGroup = (student && student.group) || '';

  var course = String(rawCourse).trim();
  if (COURSES.indexOf(course) === -1) {
    var upperGroup = String(rawGroup).toUpperCase();
    if (upperGroup.indexOf('1R') !== -1) course = '1r ESO';
    else if (upperGroup.indexOf('2N') !== -1) course = '2n ESO';
    else if (upperGroup.indexOf('3R') !== -1) course = '3r ESO';
    else if (upperGroup.indexOf('4T') !== -1) course = '4t ESO';
    else course = '3r ESO';
  }

  var classLetter = String(rawClass).trim().toUpperCase();
  if (!classLetter && rawGroup) {
    var remainder = String(rawGroup).replace(course, '').trim().toUpperCase();
    classLetter = remainder || '-';
  }

  return {
    course: course,
    classLetter: classLetter || '-'
  };
}

function ensureCourseSheet_(ss, courseName) {
  var sheet = ss.getSheetByName(courseName);
  if (!sheet) {
    sheet = ss.insertSheet(courseName);
    sheet.appendRow(COURSE_SUMMARY_HEADERS);
    sheet.setFrozenRows(1);
    var headerRange = sheet.getRange(1, 1, 1, COURSE_SUMMARY_HEADERS.length);
    headerRange.setFontWeight('bold').setBackground(COURSE_COLORS[courseName] || '#e0e7ff');
    sheet.autoResizeColumns(1, COURSE_SUMMARY_HEADERS.length);
  }
  return sheet;
}

function getOrCreateSheets_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var courseSheets = {};

  for (var i = 0; i < COURSES.length; i++) {
    var c = COURSES[i];
    courseSheets[c] = ensureCourseSheet_(ss, c);
  }

  var logsSheet = ss.getSheetByName(SHEET_LOGS);
  if (!logsSheet) {
    logsSheet = ss.insertSheet(SHEET_LOGS);
    logsSheet.appendRow([
      'Data i hora',
      'ID Alumne',
      'Nom i cognoms',
      'Curs',
      'Classe',
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
    logsSheet.getRange(1, 1, 1, 13).setFontWeight('bold').setBackground('#e0e7ff');
  }

  var loginsSheet = ss.getSheetByName(SHEET_LOGINS);
  if (!loginsSheet) {
    loginsSheet = ss.insertSheet(SHEET_LOGINS);
    loginsSheet.appendRow([
      'Data i hora entrada',
      'ID Alumne',
      'Nom i cognoms',
      'Curs',
      'Classe',
      'Grup'
    ]);
    loginsSheet.setFrozenRows(1);
    loginsSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#fef3c7');
  }

  var legacySummarySheet = ss.getSheetByName(SHEET_LEGACY_SUMMARY);

  return {
    courseSheets: courseSheets,
    logsSheet: logsSheet,
    loginsSheet: loginsSheet,
    legacySummarySheet: legacySummarySheet
  };
}

/**
 * Funció manual opcional: executa-la des de l'editor d'Apps Script
 * per crear immediatament totes les pestanyes (1r ESO, 2n ESO, 3r ESO, 4t ESO).
 */
function inicialitzarFulls() {
  getOrCreateSheets_();
}

function upsertCourseSummary_(courseSheet, student, classLetter) {
  if (!courseSheet || !student || !student.studentId) return;

  var lastRow = courseSheet.getLastRow();
  var targetRow = -1;

  if (lastRow >= 2) {
    var ids = courseSheet.getRange(2, 1, lastRow - 1, 1).getValues();
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
    classLetter || '-',
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
    courseSheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    courseSheet.appendRow(rowValues);
    var updatedLastRow = courseSheet.getLastRow();
    if (updatedLastRow >= 3) {
      courseSheet
        .getRange(2, 1, updatedLastRow - 1, COURSE_SUMMARY_HEADERS.length)
        .sort([
          { column: 3, ascending: true },
          { column: 2, ascending: true }
        ]);
    }
  }
}

function upsertLegacySummary_(summarySheet, student) {
  if (!summarySheet || !student || !student.studentId) return;

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

function appendRowRespectingHeaders_(sheet, valuesByColumn, legacyFallbackRow) {
  var colCount = sheet.getLastColumn();
  if (colCount <= legacyFallbackRow.length) {
    sheet.appendRow(legacyFallbackRow);
    return;
  }
  sheet.appendRow(valuesByColumn);
}

function doGet(e) {
  getOrCreateSheets_();
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      service: 'Càlcul: enters, potències i fraccions - Registre per cursos',
      courses: COURSES,
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
    var parsed = extractCourseAndClass_(data, data.student);

    if (data.student) {
      var targetCourseSheet = sheets.courseSheets[parsed.course] || sheets.courseSheets['3r ESO'];
      upsertCourseSummary_(targetCourseSheet, data.student, parsed.classLetter);

      if (sheets.legacySummarySheet) {
        upsertLegacySummary_(sheets.legacySummarySheet, data.student);
      }
    }

    if (data.action === 'register' && data.student) {
      appendRowRespectingHeaders_(
        sheets.loginsSheet,
        [
          nowFormatted,
          data.student.studentId || '',
          data.student.name || '',
          parsed.course,
          parsed.classLetter,
          data.student.group || ''
        ],
        [
          nowFormatted,
          data.student.studentId || '',
          data.student.name || '',
          data.student.group || ''
        ]
      );
    }

    if (data.action === 'exercise' && data.exercise) {
      var ex = data.exercise;
      appendRowRespectingHeaders_(
        sheets.logsSheet,
        [
          nowFormatted,
          data.student ? data.student.studentId : '',
          data.student ? data.student.name : '',
          parsed.course,
          parsed.classLetter,
          data.student ? data.student.group : '',
          ex.category || '',
          ex.difficulty || '',
          ex.expression || '',
          ex.userAnswer || '',
          ex.correctAnswer || '',
          ex.isCorrect ? 'SÍ' : 'NO',
          ex.mistakeTitle || ''
        ],
        [
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
        ]
      );
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, course: parsed.course }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
