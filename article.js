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

function getArticleImages(item) {
  const imageFields = {
    image: getField(item, ["image", "รูป", "รูปภาพ"]),
    image1: getField(item, ["image", "รูป", "รูปภาพ"]),
    image2: getField(item, ["image2", "รูป2", "รูปภาพ2"]),
    image3: getField(item, ["image3", "รูป3", "รูปภาพ3"]),
    image4: getField(item, ["image4", "รูป4", "รูปภาพ4"]),
  };
  const galleryField = getField(item, ["images", "gallery", "รูปทั้งหมด", "แกลเลอรี"]);
  const galleryImages = galleryField
    .split(/\n|,|\|/)
    .map(image => image.trim())
    .filter(Boolean);

  const byKey = Object.fromEntries(
    Object.entries(imageFields).map(([key, image]) => [key, resolveImageUrl(image)])
  );
  const all = [byKey.image, byKey.image2, byKey.image3, byKey.image4, ...galleryImages.map(resolveImageUrl)]
    .filter(Boolean)
    .filter((image, index, images) => images.indexOf(image) === index);

  return { all, byKey };
}

function renderInlineImage(container, image, alt) {
  if (!image) return false;

  const figure = document.createElement("figure");
  figure.className = "article-inline-image";

  const imageElement = document.createElement("img");
  imageElement.className = "article-image";
  imageElement.src = image;
  imageElement.alt = alt;
  imageElement.loading = "lazy";

  figure.append(imageElement);
  container.append(figure);
  return true;
}

function renderParagraphs(container, text, imagesByKey, title) {
  const tokenPattern = /\[(image|image1|image2|image3|image4|รูป|รูป1|รูป2|รูป3|รูป4)\]/gi;
  const tokenMap = {
    image: "image",
    image1: "image1",
    image2: "image2",
    image3: "image3",
    image4: "image4",
    "รูป": "image",
    "รูป1": "image1",
    "รูป2": "image2",
    "รูป3": "image3",
    "รูป4": "image4",
  };

  text
    .split(/\n{2,}|\r\n{2,}/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
    .forEach(paragraph => {
      const parts = paragraph.split(tokenPattern);

      if (parts.length === 1) {
        const element = document.createElement("p");
        element.textContent = paragraph;
        container.append(element);
        return;
      }

      let textBuffer = "";
      for (let i = 0; i < parts.length; i += 1) {
        const part = parts[i];
        const imageKey = tokenMap[part?.toLowerCase?.()];

        if (!imageKey) {
          textBuffer += part;
          continue;
        }

        if (textBuffer.trim()) {
          const element = document.createElement("p");
          element.textContent = textBuffer.trim();
          container.append(element);
          textBuffer = "";
        }

        renderInlineImage(container, imagesByKey[imageKey], title);
      }

      if (textBuffer.trim()) {
        const element = document.createElement("p");
        element.textContent = textBuffer.trim();
        container.append(element);
      }
    });
}

function renderArticle(item) {
  const category = getField(item, ["category", "หมวด", "หมวดข่าว", "หมวดรีวิว"]) || "บทความ";
  const title = getField(item, ["title", "หัวข้อ", "หัวข้อข่าว", "หัวข้อรีวิว"]);
  const description = getField(item, ["description", "รายละเอียด", "คำอธิบาย"]);
  const content = getField(item, ["content", "body", "article", "เนื้อหา", "บทความ"]) || description;
  const images = getArticleImages(item);
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

  const hasInlineImageTokens = /\[(image|image1|image2|image3|image4|รูป|รูป1|รูป2|รูป3|รูป4)\]/i.test(content);

  if (images.all.length && !hasInlineImageTokens) {
    const gallery = document.createElement("div");
    gallery.className = images.all.length > 1 ? "article-gallery" : "article-gallery single";

    images.all.forEach((image, index) => {
      const imageElement = document.createElement("img");
      imageElement.className = "article-image";
      imageElement.src = image;
      imageElement.alt = index === 0 ? title : `${title} ${index + 1}`;
      imageElement.loading = "lazy";
      gallery.append(imageElement);
    });

    articleDetail.append(gallery);
  }

  const body = document.createElement("div");
  body.className = "article-body";
  renderParagraphs(body, content, images.byKey, title);
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
