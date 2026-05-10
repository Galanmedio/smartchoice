const ARTICLE_SOURCES = {
  news: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeq6tVZpZXyff-ARbdhPFLDAavmLTpk1J4K-lOOuyTakoJkHK3bXIb7MhBSRefbV61N1QNADPRDaQl/pub?gid=0&single=true&output=csv",
  reviews: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeq6tVZpZXyff-ARbdhPFLDAavmLTpk1J4K-lOOuyTakoJkHK3bXIb7MhBSRefbV61N1QNADPRDaQl/pub?gid=2024619029&single=true&output=csv",
};

const articleDetail = document.getElementById("articleDetail");
const params = new URLSearchParams(window.location.search);
const articleType = params.get("type") || "news";
const articleId = Number(params.get("id") || 0);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(value.trim());
      value = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function getField(item, names) {
  for (const name of names) {
    if (item[name]) return item[name];
  }
  return "";
}

function resolveImageUrl(image) {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  return image.replace(/^\/+/, "");
}

function renderParagraphs(container, text) {
  text
    .split(/\n{2,}|\r\n{2,}/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
    .forEach(paragraph => {
      const element = document.createElement("p");
      element.textContent = paragraph;
      container.append(element);
    });
}

function renderArticle(item) {
  const category = getField(item, ["category", "หมวด", "หมวดข่าว", "หมวดรีวิว"]) || "บทความ";
  const title = getField(item, ["title", "หัวข้อ", "หัวข้อข่าว", "หัวข้อรีวิว"]);
  const description = getField(item, ["description", "รายละเอียด", "คำอธิบาย"]);
  const content = getField(item, ["content", "body", "article", "เนื้อหา", "บทความ"]) || description;
  const image = resolveImageUrl(getField(item, ["image", "รูป", "รูปภาพ"]));
  const link = getField(item, ["link", "url", "ลิงก์"]);

  document.title = `${title || "บทความ"} | Smart Choice ฉลาดเลือก`;
  articleDetail.innerHTML = "";

  const eyebrow = document.createElement("span");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = category;

  const heading = document.createElement("h1");
  heading.textContent = title || "ไม่พบบทความ";

  articleDetail.append(eyebrow, heading);

  if (description) {
    const lead = document.createElement("p");
    lead.className = "article-lead";
    lead.textContent = description;
    articleDetail.append(lead);
  }

  if (image) {
    const imageElement = document.createElement("img");
    imageElement.className = "article-image";
    imageElement.src = image;
    imageElement.alt = title;
    articleDetail.append(imageElement);
  }

  const body = document.createElement("div");
  body.className = "article-body";
  renderParagraphs(body, content);
  articleDetail.append(body);

  const actions = document.createElement("div");
  actions.className = "article-actions";

  const backLink = document.createElement("a");
  backLink.className = "btn btn-outline";
  backLink.href = articleType === "reviews" ? "index.html#reviews" : "index.html#news";
  backLink.textContent = "กลับ";
  actions.append(backLink);

  if (link) {
    const sourceLink = document.createElement("a");
    sourceLink.className = "btn";
    sourceLink.href = link;
    sourceLink.target = "_blank";
    sourceLink.rel = "noopener";
    sourceLink.textContent = "เปิดลิงก์ต้นทาง";
    actions.append(sourceLink);
  }

  articleDetail.append(actions);
}

async function loadArticle() {
  const sourceUrl = ARTICLE_SOURCES[articleType];
  if (!sourceUrl || Number.isNaN(articleId)) {
    articleDetail.innerHTML = "<h1>ไม่พบบทความ</h1><p class=\"article-lead\">ลิงก์บทความไม่ถูกต้อง</p>";
    return;
  }

  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) throw new Error("Cannot load article CSV");

    const csv = await response.text();
    const rows = parseCsv(csv);
    const headers = rows.shift().map(header => header.trim());
    const items = rows.map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
    const item = items[articleId];

    if (!item) throw new Error("Article not found");
    renderArticle(item);
  } catch (error) {
    articleDetail.innerHTML = "<h1>โหลดบทความไม่สำเร็จ</h1><p class=\"article-lead\">ตรวจสอบว่า Google Sheets เผยแพร่เป็น CSV แล้ว</p>";
  }
}

loadArticle();
