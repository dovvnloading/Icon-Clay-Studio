
/**
 * Converts a PNG Blob to an ICO Blob by wrapping it in the ICO container format.
 * Modern Windows (Vista+) supports PNG compression inside ICO files.
 */
export const pngToIco = async (pngBlob: Blob): Promise<Blob> => {
  const pngData = new Uint8Array(await pngBlob.arrayBuffer());
  const fileSize = pngData.length;

  if (fileSize === 0) {
      throw new Error("Empty PNG data");
  }

  // Parse PNG Header (IHDR) to get dimensions
  // PNG signature: 8 bytes
  // Chunk length: 4 bytes
  // Chunk type (IHDR): 4 bytes
  // Width: 4 bytes (offset 16)
  // Height: 4 bytes (offset 20)
  
  const view = new DataView(pngData.buffer);
  const width = view.getUint32(16);
  const height = view.getUint32(20);

  // ICO Header (6 bytes)
  // Reserved (2) | Type (2) | Count (2)
  const header = new Uint8Array(6);
  const headerView = new DataView(header.buffer);
  headerView.setUint16(0, 0, true); // Reserved
  headerView.setUint16(2, 1, true); // Type (1 = ICO)
  headerView.setUint16(4, 1, true); // Count (1 image)

  // Directory Entry (16 bytes)
  const dir = new Uint8Array(16);
  const dirView = new DataView(dir.buffer);
  
  // Width/Height: 0 means 256. For >256, we also use 0 as standard practice 
  // for "large" icons containing PNGs.
  const wVal = width >= 256 ? 0 : width;
  const hVal = height >= 256 ? 0 : height;

  dirView.setUint8(0, wVal);        // Width
  dirView.setUint8(1, hVal);        // Height
  dirView.setUint8(2, 0);           // Palette count (0 for >=8bpp)
  dirView.setUint8(3, 0);           // Reserved
  dirView.setUint16(4, 1, true);    // Color planes
  dirView.setUint16(6, 32, true);   // Bits per pixel
  dirView.setUint32(8, fileSize, true);  // Size of image data
  dirView.setUint32(12, 6 + 16, true);   // Offset (Header + Directory)

  // Combine Header + Directory + PNG Data
  const icoBlob = new Blob([header, dir, pngData], { type: 'image/x-icon' });
  return icoBlob;
};
