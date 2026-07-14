import "server-only";
import QRCode from "qrcode";

// Generate QR code sebagai Buffer PNG, siap dipasang jadi CID attachment.
export async function generateQrCodeBuffer(url: string): Promise<Buffer> {
  const dataUrl = await QRCode.toDataURL(url, {
    width: 320,
    margin: 1,
  });

  // toDataURL() balikin string "data:image/png;base64,xxxxx" — buang
  // prefix-nya, sisain base64 mentahnya doang sebelum diubah ke Buffer.
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
  return Buffer.from(base64Data, "base64");
}