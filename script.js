const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");
menuBtn.addEventListener("click", () => navLinks.classList.toggle("open"));

document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => navLinks.classList.remove("open"));
});

const btuForm = document.getElementById("btuForm");
const result = document.getElementById("btuResult");

btuForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const width = Number(document.getElementById("width").value);
  const length = Number(document.getElementById("length").value);
  const factor = Number(document.getElementById("roomType").value);

  if (!width || !length || width <= 0 || length <= 0) {
    result.textContent = "กรุณากรอกขนาดห้องให้ถูกต้อง";
    return;
  }

  const area = width * length;
  const btu = Math.round(area * factor / 100) * 100;
  result.textContent = `ขนาดห้องประมาณ ${area.toFixed(1)} ตร.ม. แนะนำแอร์ประมาณ ${btu.toLocaleString("th-TH")} BTU`;
});
const NEWS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeq6tVZpZXyff-ARbdhPFLDAavmLTpk1J4K-lOOuyTakoJkHK3bXIb7MhBSRefbV61N1QNADPRDaQl/pub?output=csv";
const newsCards = document.getElementById("newsCards");
const REVIEWS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeq6tVZpZXyff-ARbdhPFLDAavmLTpk1J4K-lOOuyTakoJkHK3bXIb7MhBSRefbV61N1QNADPRDaQl/pub?gid=2024619029&single=true&output=csv";
const reviewList = document.getElementById("reviewList");

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

function renderNews(items) {
  if (!newsCards) return;

  newsCards.innerHTML = "";
  if (!items.length) {
    newsCards.innerHTML = '<article class="card"><span class="tag">News</span><h3>ยังไม่มีข่าว</h3><p>เพิ่มข่าวใน Google Sheets แล้วข้อมูลจะแสดงที่นี่</p></article>';
    return;
  }

  items.forEach(item => {
    const category = getField(item, ["category", "หมวด", "หมวดข่าว"]) || "ข่าว";
    const title = getField(item, ["title", "หัวข้อ", "หัวข้อข่าว"]);
    const description = getField(item, ["description", "รายละเอียด", "คำอธิบาย"]);
    const link = getField(item, ["link", "url", "ลิงก์"]);

    if (!title) return;

    const article = document.createElement("article");
    article.className = "card";

    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = category;

    const heading = document.createElement("h3");
    heading.textContent = title;

    const paragraph = document.createElement("p");
    paragraph.textContent = description;

    article.append(tag, heading, paragraph);

    if (link) {
      const anchor = document.createElement("a");
      anchor.href = link;
      anchor.target = "_blank";
      anchor.rel = "noopener";
      anchor.textContent = "อ่านต่อ →";
      article.append(anchor);
    }

    newsCards.append(article);
  });
}

async function loadNews() {
  if (!newsCards) return;

  try {
    const response = await fetch(NEWS_CSV_URL);
    if (!response.ok) throw new Error("Cannot load news CSV");

    const csv = await response.text();
    const rows = parseCsv(csv);
    const headers = rows.shift().map(header => header.trim());
    const items = rows.map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
    renderNews(items);
  } catch (error) {
    newsCards.innerHTML = '<article class="card"><span class="tag">News</span><h3>โหลดข่าวไม่สำเร็จ</h3><p>ตรวจสอบว่าลิงก์ Google Sheets เผยแพร่เป็น CSV แล้ว</p></article>';
  }
}


function resolveImageUrl(image) {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  return image.replace(/^\/+/, "");
}

function renderReviews(items) {
  if (!reviewList) return;

  reviewList.innerHTML = "";
  if (!items.length) {
    reviewList.innerHTML = '<article><div class="thumb">รีวิว</div><div><h3>ยังไม่มีรีวิว</h3><p>เพิ่มรีวิวใน Google Sheets แล้วข้อมูลจะแสดงที่นี่</p></div></article>';
    return;
  }

  items.forEach(item => {
    const category = getField(item, ["category", "หมวด", "หมวดรีวิว"]) || "รีวิว";
    const title = getField(item, ["title", "หัวข้อ", "หัวข้อรีวิว"]);
    const description = getField(item, ["description", "รายละเอียด", "คำอธิบาย"]);
    const image = resolveImageUrl(getField(item, ["image", "รูป", "รูปภาพ"]));
    const link = getField(item, ["link", "url", "ลิงก์"]);

    if (!title) return;

    const article = document.createElement("article");
    const media = document.createElement(image ? "img" : "div");

    if (image) {
      media.className = "review-img";
      media.src = image;
      media.alt = title;
      media.loading = "lazy";
    } else {
      media.className = "thumb";
      media.textContent = category.slice(0, 6);
    }

    const content = document.createElement("div");
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = category;

    const heading = document.createElement("h3");
    heading.textContent = title;

    const paragraph = document.createElement("p");
    paragraph.textContent = description;

    content.append(tag, heading, paragraph);

    if (link) {
      const anchor = document.createElement("a");
      anchor.href = link;
      anchor.target = "_blank";
      anchor.rel = "noopener";
      anchor.textContent = "อ่านต่อ →";
      content.append(anchor);
    }

    article.append(media, content);
    reviewList.append(article);
  });
}

async function loadReviews() {
  if (!reviewList) return;

  try {
    const response = await fetch(REVIEWS_CSV_URL);
    if (!response.ok) throw new Error("Cannot load reviews CSV");

    const csv = await response.text();
    const rows = parseCsv(csv);
    const headers = rows.shift().map(header => header.trim());
    const items = rows.map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
    renderReviews(items);
  } catch (error) {
    reviewList.innerHTML = '<article><div class="thumb">รีวิว</div><div><h3>โหลดรีวิวไม่สำเร็จ</h3><p>ตรวจสอบว่าลิงก์ Google Sheets เผยแพร่เป็น CSV แล้ว</p></div></article>';
  }
}
loadNews();
loadReviews();