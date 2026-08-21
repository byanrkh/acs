type BroadcastEmailData = {
  namaLengkap: string;
  message: string;
  isTest?: boolean;
};

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Admin nulis pesan sebagai plain text di textarea -- baris kosong ganda
// (Enter 2x) jadi paragraf baru, baris tunggal jadi <br/>. Di-escape dulu
// biar aman dari HTML injection walau pengirimnya admin sendiri.
function messageToHtml(message: string) {
  return message
    .trim()
    .split(/\n{2,}/)
    .map(
      (para) =>
        `<p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#222;">${escapeHtml(
          para,
        ).replace(/\n/g, "<br/>")}</p>`,
    )
    .join("");
}

export function buildBroadcastEmailHtml(data: BroadcastEmailData) {
  return `
    <div style="background: #FDF6E5; padding: 32px 15px; font-family: Arial, Helvetica, sans-serif;">
      ${
        data.isTest
          ? `<table role="presentation" width="100%" style="max-width:560px;margin:0 auto 16px;border-collapse:collapse;">
              <tr>
                <td style="padding:0;text-align:center;">
                  <span
                    style="display:inline-block;background:#D91E36;border:3px solid #000;padding:6px 16px;font-size:11px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;color:#fff;"
                  >
                    ⚠️ Test Broadcast
                  </span>
                </td>
              </tr>
            </table>`
          : ""
      }
      <table
        role="presentation"
        width="100%"
        style="max-width:560px;margin:0 auto;border-collapse:collapse;background:#ffffff;border:4px solid #000000;box-shadow:8px 8px 0 rgba(0,0,0,1);"
      >
        <tr>
          <td
            style="background:#1F4B33;background-image:radial-gradient(rgba(255,255,255,0.08) 1.5px, transparent 1.5px);background-size:16px 16px;padding:22px 26px;border-bottom:4px solid #000000;"
          >
            <div style="font-size:19px;font-weight:900;letter-spacing:0.5px;color:#fff;">
              ACS 2026 · ARCHIPELA<span style="color:#FFD400">PACE</span>
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:26px 26px 6px;">
            <p style="margin:0 0 16px;font-size:15px;color:#000;">Halo, <strong>${escapeHtml(
              data.namaLengkap,
            )}</strong> 👋</p>
            ${messageToHtml(data.message)}
          </td>
        </tr>

        <tr>
          <td style="padding:6px 26px 26px;">
            <p style="margin:0;font-size:11.5px;color:#999;line-height:1.6;">
              Email ini dikirim otomatis, tidak perlu dibalas. Al Azhar Creative Steps 2026. Sampai bertemu di garis start!
            </p>
          </td>
        </tr>
      </table>
      <table role="presentation" width="100%" style="max-width:560px;margin:14px auto 0;border-collapse:collapse;">
        <tr>
          <td style="text-align:center;font-size:11px;color:#999;">
            ACS 2026: Archipelapace · Part of
            <a href="https://quatrolympic.com" target="_blank" style="color:#998">Quatrolympic</a>
          </td>
        </tr>
      </table>
    </div>
  `;
}