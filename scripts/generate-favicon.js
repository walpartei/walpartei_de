const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function generateFavicon(emoji, size, outputPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Clear background
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, size, size);
  
  // Draw emoji
  ctx.font = `${size}px "Apple Color Emoji"`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(emoji, size/2, size/2);
  
  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
}

const publicDir = path.join(__dirname, '..', 'public');

// Generate different sizes
generateFavicon('🐋', 32, path.join(publicDir, 'favicon.ico'));
generateFavicon('🐋', 180, path.join(publicDir, 'apple-touch-icon.png'));
