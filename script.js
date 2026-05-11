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
let activeNewsCategory = "ทั้งหมด";
let activeReviewCategory = "ทั้งหมด";
let activeDealCategory = "ทั้งหมด";

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

function makeExcerpt(text, limit = 150) {
  const cleanText = (text || "").replace(/\s+/g, " ").trim();
  if (cleanText.length <= limit) return cleanText;
  return `${cleanText.slice(0, limit).trim()}...`;
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
    newsCards.innerHTML = '<article class="news-feature"><span class="tag">News</span><h3>ยังไม่มีข่าว</h3><p>เพิ่มข่าวใน Google Sheets แล้วข้อมูลจะแสดงที่นี่</p></article>';
    return;
  }

  const validItems = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => getField(item, ["title", "หัวข้อ", "หัวข้อข่าว"]));
  const categories = [...new Set(validItems.map(({ item }) => getField(item, ["category", "หมวด", "หมวดข่าว"]) || "ข่าว"))];

  if (activeNewsCategory !== "ทั้งหมด" && !categories.includes(activeNewsCategory)) {
    activeNewsCategory = "ทั้งหมด";
  }

  renderCategoryFilters(newsCards, "news-filters", categories, activeNewsCategory, (category) => {
    activeNewsCategory = category;
    renderNews(items);
  });

  const visibleItems = activeNewsCategory === "ทั้งหมด"
    ? validItems
    : validItems.filter(({ item }) => (getField(item, ["category", "หมวด", "หมวดข่าว"]) || "ข่าว") === activeNewsCategory);

  if (!visibleItems.length) {
    newsCards.innerHTML = '<article class="news-feature"><span class="tag">News</span><h3>ยังไม่มีข่าวในหมวดนี้</h3><p>ลองเลือกหมวดอื่น หรือเพิ่มข่าวใน Google Sheets</p></article>';
    return;
  }

  const featured = visibleItems[0];
  const sideItems = visibleItems.slice(1, 4);

  if (featured) {
    const { item, index } = featured;
    const category = getField(item, ["category", "หมวด", "หมวดข่าว"]) || "ข่าว";
    const title = getField(item, ["title", "หัวข้อ", "หัวข้อข่าว"]);
    const description = getField(item, ["description", "รายละเอียด", "คำอธิบาย"]);
    const image = resolveImageUrl(getField(item, ["image", "รูป", "รูปภาพ"]));

    const article = document.createElement("article");
    article.className = "news-feature";

    if (image) {
      const imageLink = document.createElement("a");
      imageLink.href = "article.html?type=news&id=" + index;
      const imageElement = document.createElement("img");
      imageElement.src = image;
      imageElement.alt = title;
      imageElement.loading = "lazy";
      imageLink.append(imageElement);
      article.append(imageLink);
    }

    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = category;

    const heading = document.createElement("h3");
    const headingLink = document.createElement("a");
    headingLink.href = "article.html?type=news&id=" + index;
    headingLink.textContent = title;
    heading.append(headingLink);

    const paragraph = document.createElement("p");
    paragraph.textContent = makeExcerpt(description, 120);

    article.append(tag, heading, paragraph);
    newsCards.append(article);
  }

  const sideList = document.createElement("div");
  sideList.className = "news-side-list";

  sideItems.forEach(({ item, index }) => {
    const title = getField(item, ["title", "หัวข้อ", "หัวข้อข่าว"]);
    const category = getField(item, ["category", "หมวด", "หมวดข่าว"]) || "ข่าว";
    const image = resolveImageUrl(getField(item, ["image", "รูป", "รูปภาพ"]));

    const article = document.createElement("article");
    article.className = "news-side-item";

    if (image) {
      const imageLink = document.createElement("a");
      imageLink.href = "article.html?type=news&id=" + index;
      const imageElement = document.createElement("img");
      imageElement.src = image;
      imageElement.alt = title;
      imageElement.loading = "lazy";
      imageLink.append(imageElement);
      article.append(imageLink);
    }

    const content = document.createElement("div");
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = category;

    const heading = document.createElement("h3");
    const headingLink = document.createElement("a");
    headingLink.href = "article.html?type=news&id=" + index;
    headingLink.textContent = title;
    heading.append(headingLink);

    content.append(tag, heading);
    article.append(content);
    sideList.append(article);
  });

  newsCards.append(sideList);
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

  const reviews = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => getField(item, ["title", "หัวข้อ", "หัวข้อรีวิว"]));
  const categories = [...new Set(reviews.map(({ item }) => getField(item, ["category", "หมวด", "หมวดรีวิว"]) || "รีวิว"))];

  if (activeReviewCategory !== "ทั้งหมด" && !categories.includes(activeReviewCategory)) {
    activeReviewCategory = "ทั้งหมด";
  }

  renderCategoryFilters(reviewList, "review-filters", categories, activeReviewCategory, (category) => {
    activeReviewCategory = category;
    renderReviews(items);
  });

  const visibleReviews = activeReviewCategory === "ทั้งหมด"
    ? reviews
    : reviews.filter(({ item }) => (getField(item, ["category", "หมวด", "หมวดรีวิว"]) || "รีวิว") === activeReviewCategory);

  if (!visibleReviews.length) {
    reviewList.innerHTML = '<article><div class="thumb">รีวิว</div><div><h3>ยังไม่มีรีวิวในหมวดนี้</h3><p>ลองเลือกหมวดอื่น หรือเพิ่มรีวิวใน Google Sheets</p></div></article>';
    return;
  }

  visibleReviews.forEach(({ item, index }) => {
    const category = getField(item, ["category", "หมวด", "หมวดรีวิว"]) || "รีวิว";
    const title = getField(item, ["title", "หัวข้อ", "หัวข้อรีวิว"]);
    const description = getField(item, ["description", "รายละเอียด", "คำอธิบาย"]);
    const image = resolveImageUrl(getField(item, ["image", "รูป", "รูปภาพ"]));

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
    paragraph.textContent = makeExcerpt(description, 130);

    content.append(tag, heading, paragraph);

    const anchor = document.createElement("a");
    anchor.href = "article.html?type=reviews&id=" + index;
    anchor.textContent = "\u0e2d\u0e48\u0e32\u0e19\u0e15\u0e48\u0e2d \u2192";
    content.append(anchor);

    article.append(media, content);
    reviewList.append(article);
  });
}

function renderCategoryFilters(container, className, categories, activeCategory, onSelect) {
  const section = container.closest("section");
  if (!section) return;

  let filter = section.querySelector("." + className);
  if (!categories.length) {
    if (filter) filter.remove();
    return;
  }

  if (!filter) {
    filter = document.createElement("div");
    filter.className = "content-filters " + className;
    container.before(filter);
  }

  filter.innerHTML = "";
  ["ทั้งหมด", ...categories].forEach(category => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = category === activeCategory ? "active" : "";
    button.textContent = category;
    button.addEventListener("click", () => onSelect(category));
    filter.append(button);
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
      paragraph.textContent = makeExcerpt(description, 130);
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

  const deals = items
    .map(item => ({
      category: getField(item, ["category", "หมวด", "หมวดสินค้า", "tag", "แท็ก", "ประเภท"]) || "Deal",
      title: getField(item, ["title", "ชื่อสินค้า", "หัวข้อ", "ชื่อดีล", "ดีล", "สินค้า", "name", "product", "product_name"]),
      description: getField(item, ["description", "รายละเอียด", "คำอธิบาย", "description_short", "คำโปรย"]),
      image: resolveImageUrl(getField(item, ["image", "รูป", "รูปภาพ", "image_url", "รูปสินค้า"])),
      price: getField(item, ["price", "ราคา", "โปร", "ส่วนลด", "discount"]),
      link: getField(item, ["link", "ลิงก์", "ลิงค์", "url", "URL", "affiliate", "affiliate_link", "ลิงก์สินค้า", "ลิงค์สินค้า"])
    }))
    .filter(item => item.title);

  const categories = [...new Set(deals.map(item => item.category).filter(Boolean))];
  if (activeDealCategory !== "ทั้งหมด" && !categories.includes(activeDealCategory)) {
    activeDealCategory = "ทั้งหมด";
  }

  renderDealFilters(categories, items);

  const visibleDeals = activeDealCategory === "ทั้งหมด"
    ? deals
    : deals.filter(item => item.category === activeDealCategory);

  if (!visibleDeals.length) {
    dealGrid.innerHTML = '<div class="product"><span class="product-icon">Deal</span><h3>ยังไม่มีดีลในหมวดนี้</h3><p>ลองเลือกหมวดอื่น หรือเพิ่มสินค้าใน Google Sheets</p></div>';
    return;
  }

  visibleDeals.forEach(item => {
    const { category, title, description, image, price, link } = item;

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
      badge.className = "product-icon";
      badge.textContent = category.slice(0, 6);
      product.append(badge);
    }

    const tag = document.createElement("span");
    tag.className = "tag deal-tag";
    tag.textContent = category;
    product.append(tag);

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
    paragraph.textContent = makeExcerpt(description, 130);
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

function renderDealFilters(categories, allItems) {
  const dealSection = dealGrid.closest("section");
  if (!dealSection) return;

  let filter = dealSection.querySelector(".deal-filters");
  if (!categories.length) {
    if (filter) filter.remove();
    return;
  }

  if (!filter) {
    filter = document.createElement("div");
    filter.className = "deal-filters";
    dealGrid.before(filter);
  }

  filter.innerHTML = "";
  ["ทั้งหมด", ...categories].forEach(category => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = category === activeDealCategory ? "active" : "";
    button.textContent = category;
    button.addEventListener("click", () => {
      activeDealCategory = category;
      renderDeals(allItems);
    });
    filter.append(button);
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
