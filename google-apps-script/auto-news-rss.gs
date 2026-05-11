/**
 * Smart Choice News Draft From Links
 *
 * วิธีใช้:
 * 1. เปิด Google Sheet ข่าวของ Smart Choice
 * 2. ไปที่ Extensions > Apps Script
 * 3. วางโค้ดไฟล์นี้ลงไป แล้วกด Save
 * 4. Project Settings > Script Properties ใส่ OPENAI_API_KEY = API key ของคุณ
 * 5. ในชีตข่าว ใส่ลิงก์ข่าวลงคอลัมน์ source
 * 6. เลือกฟังก์ชัน draftNewsFromLinks แล้วกด Run
 *
 * คอลัมน์ชีตข่าว:
 * status,category,title,description,image,content,source,date
 *
 * ระบบจะเติมเฉพาะแถวที่มี source แต่ยังไม่มี content
 * สถานะเริ่มต้นเป็น draft เมื่อตรวจแล้วค่อยเปลี่ยนเป็น publish
 */

const OPENAI_MODEL = "gpt-4.1-mini";
const NEWS_SHEET_NAME = "news";
const MAX_LINKS_PER_RUN = 5;

const NEWS_HEADERS = [
  "status",
  "category",
  "title",
  "description",
  "image",
  "content",
  "source",
  "date"
];

function draftNewsFromLinks() {
  const sheet = getNewsSheet_();
  ensureHeaders_(sheet);

  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const indexes = getHeaderIndexes_(headers);
  let processed = 0;

  for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    if (processed >= MAX_LINKS_PER_RUN) break;

    const row = values[rowIndex];
    const source = row[indexes.source];
    const content = row[indexes.content];
    const status = row[indexes.status];

    if (!source || content) continue;

    const page = fetchPageSummary_(source);
    const draft = createThaiNewsDraft_(page);

    sheet.getRange(rowIndex + 1, indexes.status + 1).setValue(status || "draft");
    sheet.getRange(rowIndex + 1, indexes.category + 1).setValue(row[indexes.category] || draft.category || "เทคโนโลยี");
    sheet.getRange(rowIndex + 1, indexes.title + 1).setValue(row[indexes.title] || draft.title || page.title);
    sheet.getRange(rowIndex + 1, indexes.description + 1).setValue(row[indexes.description] || draft.description || "");
    sheet.getRange(rowIndex + 1, indexes.image + 1).setValue(row[indexes.image] || draft.image || page.image || "");
    sheet.getRange(rowIndex + 1, indexes.content + 1).setValue(draft.content || "");
    sheet.getRange(rowIndex + 1, indexes.date + 1).setValue(row[indexes.date] || Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd"));

    processed += 1;
  }
}

function getNewsSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(NEWS_SHEET_NAME) || spreadsheet.getSheets()[0];
}

function ensureHeaders_(sheet) {
  const firstRow = sheet.getRange(1, 1, 1, NEWS_HEADERS.length).getValues()[0];
  const hasHeaders = NEWS_HEADERS.every((header, index) => firstRow[index] === header);
  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, NEWS_HEADERS.length).setValues([NEWS_HEADERS]);
  }
}

function getHeaderIndexes_(headers) {
  return NEWS_HEADERS.reduce((indexes, header) => {
    const index = headers.indexOf(header);
    if (index < 0) throw new Error("Missing column: " + header);
    indexes[header] = index;
    return indexes;
  }, {});
}

function fetchPageSummary_(url) {
  const response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    followRedirects: true,
    headers: {
      "User-Agent": "Mozilla/5.0 SmartChoiceBot/1.0"
    }
  });

  const html = response.getContentText();
  return {
    link: url,
    title: extractMeta_(html, "og:title") || extractTitle_(html) || url,
    description: extractMeta_(html, "og:description") || extractMeta_(html, "description") || "",
    image: extractMeta_(html, "og:image") || "",
    text: stripHtml_(html).slice(0, 6000)
  };
}

function createThaiNewsDraft_(page) {
  const apiKey = PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY in Script Properties");

  const prompt = [
    "เขียนร่างข่าวภาษาไทยสำหรับเว็บ Smart Choice จากข้อมูลต้นทางนี้",
    "ห้ามคัดลอกเนื้อหาต้นฉบับแบบยาว ให้สรุปใหม่ด้วยภาษาของตัวเอง",
    "โทน: เข้าใจง่าย เป็นกลาง ช่วยคนตัดสินใจก่อนซื้อ",
    "ให้ตอบเป็น JSON เท่านั้น โดยมี key: category,title,description,content",
    "category เลือกสั้น ๆ เช่น เทคโนโลยี, เครื่องใช้ไฟฟ้า, มือถือ, ยานยนต์, ดีล",
    "description ยาว 1-2 ประโยค",
    "content ยาว 4-7 ย่อหน้า ใส่ข้อควรรู้และผลต่อผู้ซื้อ",
    "",
    "หัวข้อจากเว็บต้นทาง: " + page.title,
    "คำอธิบายจากเว็บต้นทาง: " + page.description,
    "เนื้อหาบางส่วนจากเว็บต้นทาง: " + page.text,
    "ลิงก์ต้นทาง: " + page.link
  ].join("\n");

  const response = UrlFetchApp.fetch("https://api.openai.com/v1/responses", {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + apiKey
    },
    payload: JSON.stringify({
      model: OPENAI_MODEL,
      input: prompt,
      text: {
        format: {
          type: "json_object"
        }
      }
    }),
    muteHttpExceptions: true
  });

  const data = JSON.parse(response.getContentText());
  if (data.error) throw new Error(data.error.message);

  const draft = JSON.parse(extractResponseText_(data));
  draft.image = page.image || "";
  return draft;
}

function extractResponseText_(data) {
  if (data.output_text) return data.output_text;

  const message = (data.output || []).find(item => item.type === "message");
  const textPart = message && (message.content || []).find(part => part.type === "output_text");
  if (textPart && textPart.text) return textPart.text;

  throw new Error("OpenAI response did not include output text");
}

function extractMeta_(html, property) {
  const patterns = [
    new RegExp("<meta[^>]+property=[\"']" + escapeRegExp_(property) + "[\"'][^>]+content=[\"']([^\"']+)[\"']", "i"),
    new RegExp("<meta[^>]+name=[\"']" + escapeRegExp_(property) + "[\"'][^>]+content=[\"']([^\"']+)[\"']", "i"),
    new RegExp("<meta[^>]+content=[\"']([^\"']+)[\"'][^>]+property=[\"']" + escapeRegExp_(property) + "[\"']", "i"),
    new RegExp("<meta[^>]+content=[\"']([^\"']+)[\"'][^>]+name=[\"']" + escapeRegExp_(property) + "[\"']", "i")
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) return decodeHtml_(match[1]);
  }
  return "";
}

function extractTitle_(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match && match[1] ? decodeHtml_(stripHtml_(match[1])) : "";
}

function stripHtml_(html) {
  return (html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml_(text) {
  return (text || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function escapeRegExp_(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
