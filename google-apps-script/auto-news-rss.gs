/**
 * Smart Choice Auto News Drafts
 *
 * วิธีใช้:
 * 1. เปิด Google Sheet ข่าวของ Smart Choice
 * 2. ไปที่ Extensions > Apps Script
 * 3. วางโค้ดไฟล์นี้ลงไป
 * 4. Project Settings > Script Properties ใส่ OPENAI_API_KEY = API key ของคุณ
 * 5. แก้ RSS_FEEDS เป็นแหล่งข่าวที่ต้องการ
 * 6. รัน setupDailyAutoNewsTrigger() หนึ่งครั้ง เพื่อตั้งให้ทำงานทุกวัน
 *
 * คอลัมน์ชีตข่าวที่รองรับ:
 * status,category,title,description,image,content,source,date
 *
 * ระบบจะใส่ status = draft เพื่อให้ตรวจเองก่อน
 * ถ้าจะให้เว็บแสดง ให้เปลี่ยน status เป็น publish
 */

const OPENAI_MODEL = "gpt-4.1-mini";
const NEWS_SHEET_NAME = "news";
const MAX_ITEMS_PER_RUN = 5;
const RSS_FEEDS = [
  "https://www.gizchina.com/feed/",
  "https://www.gsmarena.com/rss-news-reviews.php3",
  "https://www.theverge.com/rss/index.xml"
];

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

function setupDailyAutoNewsTrigger() {
  ScriptApp.newTrigger("runAutoNewsDrafts")
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();
}

function runAutoNewsDrafts() {
  const sheet = getNewsSheet_();
  ensureHeaders_(sheet);

  const existingSources = getExistingSources_(sheet);
  const feedItems = RSS_FEEDS
    .flatMap(fetchRssItems_)
    .filter(item => item.link && !existingSources.has(item.link))
    .slice(0, MAX_ITEMS_PER_RUN);

  feedItems.forEach(item => {
    const draft = createThaiNewsDraft_(item);
    sheet.appendRow([
      "draft",
      draft.category || "เทคโนโลยี",
      draft.title || item.title,
      draft.description || "",
      draft.image || item.image || "",
      draft.content || "",
      item.link,
      Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd")
    ]);
  });
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

function getExistingSources_(sheet) {
  const values = sheet.getDataRange().getValues();
  const headers = values.shift() || [];
  const sourceIndex = headers.indexOf("source");
  if (sourceIndex < 0) return new Set();
  return new Set(values.map(row => row[sourceIndex]).filter(Boolean));
}

function fetchRssItems_(url) {
  try {
    const xml = UrlFetchApp.fetch(url, { muteHttpExceptions: true }).getContentText();
    const document = XmlService.parse(xml);
    const root = document.getRootElement();
    const channel = root.getChild("channel");
    const entries = channel ? channel.getChildren("item") : root.getChildren("entry", root.getNamespace());

    return entries.map(entry => parseRssEntry_(entry)).filter(item => item.title && item.link);
  } catch (error) {
    console.log("RSS error: " + url + " " + error);
    return [];
  }
}

function parseRssEntry_(entry) {
  const namespace = entry.getNamespace();
  const mediaNamespace = XmlService.getNamespace("media", "http://search.yahoo.com/mrss/");
  const title = getChildText_(entry, "title", namespace);
  const link = getLink_(entry, namespace);
  const description = stripHtml_(getChildText_(entry, "description", namespace) || getChildText_(entry, "summary", namespace));
  const image = getMediaImage_(entry, mediaNamespace);

  return { title, link, description, image };
}

function createThaiNewsDraft_(item) {
  const apiKey = PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY in Script Properties");

  const prompt = [
    "เขียนร่างข่าวภาษาไทยสำหรับเว็บ Smart Choice จากข้อมูลต้นทางนี้",
    "ห้ามคัดลอกเนื้อหาต้นฉบับแบบยาว ให้สรุปใหม่ด้วยภาษาของตัวเอง",
    "โทน: เข้าใจง่าย เป็นกลาง ช่วยคนตัดสินใจก่อนซื้อ",
    "ให้ตอบเป็น JSON เท่านั้น โดยมี key: category,title,description,content",
    "content ควรยาว 4-7 ย่อหน้า และใส่ข้อควรรู้/ผลต่อผู้ซื้อ",
    "",
    "หัวข้อข่าวต้นทาง: " + item.title,
    "สรุป/คำอธิบายต้นทาง: " + item.description,
    "ลิงก์ต้นทาง: " + item.link
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

  const text = extractResponseText_(data);
  const draft = JSON.parse(text);
  draft.image = item.image || "";
  return draft;
}

function extractResponseText_(data) {
  if (data.output_text) return data.output_text;

  const message = (data.output || []).find(item => item.type === "message");
  const textPart = message && (message.content || []).find(part => part.type === "output_text");
  if (textPart && textPart.text) return textPart.text;

  throw new Error("OpenAI response did not include output text");
}

function getChildText_(entry, name, namespace) {
  const child = entry.getChild(name, namespace) || entry.getChild(name);
  return child ? child.getText() : "";
}

function getLink_(entry, namespace) {
  const linkText = getChildText_(entry, "link", namespace);
  if (linkText) return linkText;

  const link = entry.getChild("link", namespace) || entry.getChild("link");
  return link ? link.getAttribute("href") && link.getAttribute("href").getValue() : "";
}

function getMediaImage_(entry, mediaNamespace) {
  const content = entry.getChild("content", mediaNamespace);
  if (content && content.getAttribute("url")) return content.getAttribute("url").getValue();

  const thumbnail = entry.getChild("thumbnail", mediaNamespace);
  if (thumbnail && thumbnail.getAttribute("url")) return thumbnail.getAttribute("url").getValue();

  return "";
}

function stripHtml_(html) {
  return (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
