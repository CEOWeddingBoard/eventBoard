// Resize images to fit A4 PDF pages
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imgs = path.join(__dirname, "images");
const resized = path.join(__dirname, "images", "resized");

if (!fs.existsSync(resized)) fs.mkdirSync(resized);

const files = fs.readdirSync(imgs).filter(f => f.endsWith(".png"));

for (const file of files) {
  const input = path.join(imgs, file);
  const output = path.join(resized, file.replace(".png", ".jpg"));
  
  console.log(`Resizing ${file}...`);
  await sharp(input)
    .resize(1200, 1800, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(output);
  
  const orig = (fs.statSync(input).size / 1024).toFixed(0);
  const newsz = (fs.statSync(output).size / 1024).toFixed(0);
  console.log(`  ${orig} KB -> ${newsz} KB`);
}

console.log("\nDone! Resized images in images/resized/");
