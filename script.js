const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const upload = document.getElementById("upload");
const zoomSlider = document.getElementById("zoom");
const downloadBtn = document.getElementById("download");

const frameImage = new Image();
frameImage.src = "frame.png";

let uploadedImage = null;
let hole = null;
let imageState = {
  x: 0,
  y: 0,
  scale: 1,
  dragging: false,
  startX: 0,
  startY: 0
};

let scaleFactor = 1; // for responsiveness

frameImage.onload = () => {
  resizeCanvas();
  hole = detectTransparentArea();
  drawAll();
};

function resizeCanvas() {
  const maxWidth = Math.min(window.innerWidth * 0.9, 700);
  scaleFactor = maxWidth / frameImage.width;
  canvas.width = frameImage.width;
  canvas.height = frameImage.height;
  canvas.style.width = `${frameImage.width * scaleFactor}px`;
  canvas.style.height = `${frameImage.height * scaleFactor}px`;
}

function detectTransparentArea() {
  ctx.drawImage(frameImage, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      if (pixels[i + 3] === 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function drawAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (uploadedImage) {
    const w = uploadedImage.width * imageState.scale;
    const h = uploadedImage.height * imageState.scale;
    ctx.drawImage(uploadedImage, imageState.x, imageState.y, w, h);
  }

  ctx.drawImage(frameImage, 0, 0);
}

upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.onload = () => {
      uploadedImage = img;

      const initialScale = Math.max(
        hole.width / img.width,
        hole.height / img.height
      );
      imageState.scale = initialScale;
      zoomSlider.value = initialScale;

      imageState.x = hole.x + (hole.width - img.width * initialScale) / 2;
      imageState.y = hole.y + (hole.height - img.height * initialScale) / 2;

      drawAll();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

canvas.addEventListener("mousedown", (e) => {
  imageState.dragging = true;
  const x = e.offsetX / scaleFactor;
  const y = e.offsetY / scaleFactor;
  imageState.startX = x - imageState.x;
  imageState.startY = y - imageState.y;
});

canvas.addEventListener("mousemove", (e) => {
  if (!imageState.dragging) return;
  const x = e.offsetX / scaleFactor;
  const y = e.offsetY / scaleFactor;
  imageState.x = x - imageState.startX;
  imageState.y = y - imageState.startY;
  drawAll();
});

canvas.addEventListener("mouseup", () => (imageState.dragging = false));
canvas.addEventListener("mouseleave", () => (imageState.dragging = false));

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = (touch.clientX - rect.left) / scaleFactor;
  const y = (touch.clientY - rect.top) / scaleFactor;

  imageState.dragging = true;
  imageState.startX = x - imageState.x;
  imageState.startY = y - imageState.y;
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = (touch.clientX - rect.left) / scaleFactor;
  const y = (touch.clientY - rect.top) / scaleFactor;

  imageState.x = x - imageState.startX;
  imageState.y = y - imageState.startY;
  drawAll();
});

canvas.addEventListener("touchend", () => (imageState.dragging = false));

zoomSlider.addEventListener("input", (e) => {
  imageState.scale = parseFloat(e.target.value);
  drawAll();
});

downloadBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "framed-photo.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

window.addEventListener("resize", () => {
  const prevScale = scaleFactor;
  resizeCanvas();
  drawAll();
});
