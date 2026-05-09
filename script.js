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
const NEWS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeq6tVZpZXyff-ARbdhPFLDAavmLTpk1J4K-lOOuyTakoJkHK3bXIb7MhBSRefbV61N1QNADPRDaQl/pub?gid=0&single=true&output=csv";
const newsCards = document.getElementById("newsCards");
const REVIEWS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeq6tVZpZXyff-ARbdhPFLDAavmLTpk1J4K-lOOuyTakoJkHK3bXIb7MhBSRefbV61N1QNADPRDaQl/pub?gid=2024619029&single=true&output=csv";
const reviewList = document.getElementById("reviewList");
const VIDEOS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeq6tVZpZXyff-ARbdhPFLDAavmLTpk1J4K-lOOuyTakoJkHK3bXIb7MhBSRefbV61N1QNADPRDaQl/pub?gid=1483108495&single=true&output=csv";
const videoList = document.getElementById("videoList");
const DEALS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeq6tVZpZXyff-ARbdhPFLDAavmLTpk1J4K-lOOuyTakoJkHK3bXIb7MhBSRefbV61N1QNADPRDaQl/pub?gid=907064744&single=true&output=csv";
const dealGrid = document.getElementById("dealGrid");

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
    const image = resolveImageUrl(getField(item, ["image", "รูป", "รูปภาพ"]));
    const link = getField(item, ["link", "url", "ลิงก์"]);

    if (!title) return;

    const article = document.createElement("article");
    article.className = "card";

    if (image) {
      const imageElement = document.createElement("img");
      imageElement.className = "news-img";
      imageElement.src = image;
      imageElement.alt = title;
      imageElement.loading = "lazy";
      article.append(imageElement);
    }

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
    if (image) {
      const imageElement = document.createElement("img");
      imageElement.className = "news-img";
      imageElement.src = image;
      imageElement.alt = title;
      imageElement.loading = "lazy";
      article.append(imageElement);
    }

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

function getYouTubeId(url) {
  if (!url) return "";

  const trimmedUrl = url.trim();
  const plainId = trimmedUrl.match(/^[a-zA-Z0-9_-]{11}$/);
  if (plainId) return trimmedUrl;

  try {
    const parsedUrl = new URL(trimmedUrl);
    if (parsedUrl.hostname.includes("youtu.be")) return parsedUrl.pathname.replace("/", "").slice(0, 11);
    if (parsedUrl.searchParams.get("v")) return parsedUrl.searchParams.get("v").slice(0, 11);

    const embedMatch = parsedUrl.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];

    const shortsMatch = parsedUrl.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return shortsMatch[1];
  } catch (error) {
    return "";
  }

  return "";
}

function renderVideos(items) {
  if (!videoList) return;

  videoList.innerHTML = "";
  if (!items.length) {
    videoList.innerHTML = '<article class="video-card"><div class="video-placeholder">YouTube</div><h3>ยังไม่มีวิดีโอ</h3><p>เพิ่มวิดีโอใน Google Sheets แล้วข้อมูลจะแสดงที่นี่</p></article>';
    return;
  }

  items.forEach(item => {
    const title = getField(item, ["title", "หัวข้อ", "ชื่อวิดีโอ"]);
    const description = getField(item, ["description", "รายละเอียด", "คำอธิบาย"]);
    const youtube = getField(item, ["youtube", "video", "url", "link", "ลิงก์"]);
    const videoId = getYouTubeId(youtube);

    if (!title && !videoId) return;

    const article = document.createElement("article");
    article.className = "video-card";

    if (videoId) {
      const frame = document.createElement("iframe");
      frame.src = `https://www.youtube.com/embed/${videoId}`;
      frame.title = title || "YouTube video";
      frame.loading = "lazy";
      frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      frame.allowFullscreen = true;
      article.append(frame);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "video-placeholder";
      placeholder.textContent = "YouTube";
      article.append(placeholder);
    }

    const heading = document.createElement("h3");
    heading.textContent = title || "วิดีโอจากช่อง";
    article.append(heading);

    if (description) {
      const paragraph = document.createElement("p");
      paragraph.textContent = description;
      article.append(paragraph);
    }

    videoList.append(article);
  });
}

async function loadVideos() {
  if (!videoList) return;

  try {
    const response = await fetch(VIDEOS_CSV_URL);
    if (!response.ok) throw new Error("Cannot load videos CSV");

    const csv = await response.text();
    const rows = parseCsv(csv);
    const headers = rows.shift().map(header => header.trim());
    const items = rows.map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
    renderVideos(items);
  } catch (error) {
    videoList.innerHTML = '<article class="video-card"><div class="video-placeholder">YouTube</div><h3>โหลดวิดีโอไม่สำเร็จ</h3><p>ตรวจสอบว่าลิงก์ Google Sheets เผยแพร่เป็น CSV แล้ว</p></article>';
  }
}

function renderDeals(items) {
  if (!dealGrid) return;

  dealGrid.innerHTML = "";
  if (!items.length) {
    dealGrid.innerHTML = '<div class="product"><span>Deal</span><h3>ยังไม่มีดีลแนะนำ</h3><p>เพิ่มสินค้าใน Google Sheets แล้วข้อมูลจะแสดงที่นี่</p></div>';
    return;
  }

  items.forEach(item => {
    const category = getField(item, ["category", "หมวด", "หมวดสินค้า"]) || "Deal";
    const title = getField(item, ["title", "ชื่อสินค้า", "หัวข้อ"]);
    const description = getField(item, ["description", "รายละเอียด", "คำอธิบาย"]);
    const image = resolveImageUrl(getField(item, ["image", "รูป", "รูปภาพ"]));
    const price = getField(item, ["price", "ราคา", "โปร"]);
    const link = getField(item, ["link", "url", "ลิงก์"]);

    if (!title) return;

    const product = document.createElement("div");
    product.className = "product";

    if (image) {
      const imageElement = document.createElement("img");
      imageElement.className = "product-img";
      imageElement.src = image;
      imageElement.alt = title;
      imageElement.loading = "lazy";
      product.append(imageElement);
    } else {
      const badge = document.createElement("span");
      badge.textContent = category.slice(0, 6);
      product.append(badge);
    }

    const heading = document.createElement("h3");
    heading.textContent = title;
    product.append(heading);

    if (price) {
      const priceElement = document.createElement("strong");
      priceElement.className = "price";
      priceElement.textContent = price;
      product.append(priceElement);
    }

    const paragraph = document.createElement("p");
    paragraph.textContent = description;
    product.append(paragraph);

    if (link) {
      const anchor = document.createElement("a");
      anchor.className = "btn btn-small";
      anchor.href = link;
      anchor.target = "_blank";
      anchor.rel = "noopener";
      anchor.textContent = "ดูดีล";
      product.append(anchor);
    }

    dealGrid.append(product);
  });
}

async function loadDeals() {
  if (!dealGrid) return;

  try {
    const response = await fetch(DEALS_CSV_URL);
    if (!response.ok) throw new Error("Cannot load deals CSV");

    const csv = await response.text();
    const rows = parseCsv(csv);
    const headers = rows.shift().map(header => header.trim());
    const items = rows.map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
    renderDeals(items);
  } catch (error) {
    dealGrid.innerHTML = '<div class="product"><span>Deal</span><h3>โหลดดีลไม่สำเร็จ</h3><p>ตรวจสอบว่าลิงก์ Google Sheets เผยแพร่เป็น CSV แล้ว</p></div>';
  }
}
loadNews();
loadReviews();
loadVideos();
loadDeals();