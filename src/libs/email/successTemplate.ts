type SuccessEmailData = {
  namaLengkap: string;
  bibNumber: string;
};

export function buildSuccessEmailHtml(data: SuccessEmailData) {
  return `
  <div style="background:#FDF6E9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;border-collapse:collapse;background:#ffffff;border:4px solid #000000;">
      <tr>
        <td style="background:#1F4B33;padding:20px 24px;border-bottom:4px solid #000000;">
          <span style="font-size:20px;font-weight:900;letter-spacing:0.5px;color:#fff;">ACS 2026 · ARCHIPELAPACE</span>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 12px;font-size:15px;color:#000;">Halo, <strong>${data.namaLengkap}</strong>.</p>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#333;">
            Pembayaran kamu sudah kami terima dan pendaftaran kamu resmi
            terkonfirmasi. Sampai ketemu di garis start!
          </p>

          <div style="border:4px solid #000;background:#FFD400;padding:20px;text-align:center;margin-bottom:20px;">
            <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#000;">Nomor BIB kamu</p>
            <p style="margin:6px 0 0;font-size:32px;font-weight:900;color:#000;">${data.bibNumber}</p>
          </div>

          <p style="margin:0;font-size:12px;color:#999;line-height:1.6;">
            Simpan email ini sebagai bukti pendaftaran. Info race pack dan jadwal
            pengambilan akan menyusul lewat email terpisah.
          </p>
        </td>
      </tr>
    </table>
  </div>
  `;
}