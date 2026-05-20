import ffmpegStatic from 'ffmpeg-static';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const VIDEO_PATH = path.join(__dirname, 'VideoLanding', 'puedes_ser_la_sprinter_detenid.mp4');
const OUTPUT_DIR = path.join(__dirname, 'public', 'frames');
const FPS = 10; // Extract 10 frames per second. For a 10s video = 100 frames

console.log('--- Motor de Extracción de Secuencias 3D ---');

// Check if video exists
if (!fs.existsSync(VIDEO_PATH)) {
  console.error(`❌ Error: No se encontró el video en: ${VIDEO_PATH}`);
  console.error(`👉 Instrucción: Guarda tu video de 10 segundos como "sprinter.mp4" dentro de la carpeta "public" y vuelve a ejecutar este script.`);
  process.exit(1);
}

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Ensure the directory is empty before extracting to avoid mixing frames
const files = fs.readdirSync(OUTPUT_DIR);
for (const file of files) {
  if (file.endsWith('.jpg')) {
    fs.unlinkSync(path.join(OUTPUT_DIR, file));
  }
}

console.log(`⏳ Extrayendo frames de ${VIDEO_PATH}...`);
console.log(`🎬 Guardando imágenes en ${OUTPUT_DIR}...`);

// FFmpeg command to extract frames at 10fps, pad numbering to 4 digits, quality scale 2
// Resize to 1920 width to keep size reasonable for web
const command = `"${ffmpegStatic}" -i "${VIDEO_PATH}" -vf "fps=${FPS},scale=1920:-1" -q:v 2 "${path.join(OUTPUT_DIR, 'frame_%04d.jpg')}"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Error al ejecutar FFmpeg: ${error.message}`);
    return;
  }
  
  const generatedFrames = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.jpg')).length;
  console.log(`✅ ¡Éxito! Se han extraído ${generatedFrames} imágenes (frames).`);
  console.log(`🚀 El Motor de Canvas ya está listo para leerlos en tiempo real con el Scroll.`);
});
