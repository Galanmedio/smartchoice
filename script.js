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
