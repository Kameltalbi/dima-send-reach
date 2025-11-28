// Script pour générer une image PNG à partir du SVG
// Nécessite: npm install sharp
// Usage: node scripts/generate-og-image.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateOGImage() {
  try {
    const svgBuffer = fs.readFileSync(path.join(__dirname, '../public/og-image.svg'));
    
    await sharp(svgBuffer)
      .resize(1200, 630)
      .png()
      .toFile(path.join(__dirname, '../public/og-image.png'));
    
    console.log('✅ Image Open Graph PNG générée avec succès: public/og-image.png');
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error.message);
    console.log('💡 Assurez-vous d\'avoir installé sharp: npm install sharp');
  }
}

generateOGImage();

