const fs = require('fs');
const path = require('path');

function getPngDimensions(filePath) {
    if (!fs.existsSync(filePath)) return `Not found: ${filePath}`;
    const data = fs.readFileSync(filePath);
    if (data.toString('ascii', 12, 16) === 'IHDR') {
        const width = data.readUInt32BE(16);
        const height = data.readUInt32BE(20);
        return { width, height, isSquare: width === height };
    }
    return `Not a PNG or missing IHDR: ${filePath}`;
}

const iconPath = path.join('src', 'assets', 'images', 'icon_square.png');
const logoPath = path.join('src', 'assets', 'images', 'logo.png');

console.log('Icon Square:', getPngDimensions(iconPath));
console.log('Logo:', getPngDimensions(logoPath));
