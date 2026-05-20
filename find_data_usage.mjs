import fs from 'fs';
import path from 'path';

function findUsages(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findUsages(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('@/lib/data') || content.includes('../lib/data') || content.includes('data.ts')) {
        console.log('Usage found in:', fullPath);
      }
    }
  }
}

findUsages('./src');
