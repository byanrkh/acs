type InvoiceEmailData = {
  namaLengkap: string;
  orderId: string;
  kategori: "pelajar" | "umum";
  ukuranJersey: string;
  grossAmount: number;
  paymentExpiresAt: string; // ISO string
  paymentUrl: string;
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDeadline(iso: string) {
  return (
    new Intl.DateTimeFormat("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    }).format(new Date(iso)) + " WIB"
  );
}

export function buildInvoiceEmailHtml(data: InvoiceEmailData) {
  return `
  <div style="background:#FDF6E9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;border-collapse:collapse;background:#ffffff;border:4px solid #000000;">
      <tr>
        <td style="background:#FF5A1F;padding:20px 24px;border-bottom:4px solid #000000;">
          <span style="font-size:20px;font-weight:900;letter-spacing:0.5px;color:#000;">ACS 2026 · ARCHIPELAPACE</span>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 12px;font-size:15px;color:#000;">Halo, <strong>${data.namaLengkap}</strong>.</p>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#333;">
            Terima kasih sudah mendaftar. Berikut rincian tagihan pendaftaranmu.
            Selesaikan pembayaran sebelum tenggat waktu supaya slot kamu tetap aman.
          </p>

          <table role="presentation" width="100%" style="border-collapse:collapse;border:2px solid #000;margin-bottom:20px;">
            <tr>
              <td style="padding:10px 12px;border-bottom:2px solid #000;font-size:12px;color:#666;">No. invoice</td>
              <td style="padding:10px 12px;border-bottom:2px solid #000;font-size:13px;color:#000;text-align:right;">${data.orderId}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border-bottom:2px solid #000;font-size:12px;color:#666;">Kategori</td>
              <td style="padding:10px 12px;border-bottom:2px solid #000;font-size:13px;color:#000;text-align:right;text-transform:capitalize;">${data.kategori}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;border-bottom:2px solid #000;font-size:12px;color:#666;">Ukuran jersey</td>
              <td style="padding:10px 12px;border-bottom:2px solid #000;font-size:13px;color:#000;text-align:right;">${data.ukuranJersey}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;font-size:13px;font-weight:bold;color:#000;">Total bayar</td>
              <td style="padding:10px 12px;font-size:15px;font-weight:900;color:#000;text-align:right;">${formatRupiah(data.grossAmount)}</td>
            </tr>
          </table>

          <p style="margin:0 0 20px;font-size:13px;color:#D91E36;font-weight:bold;">
            Silahkan lakukan pembayaran sebelum ${formatDeadline(data.paymentExpiresAt)}, Pendaftaran akan otomatis kedaluwarsa jika melewati batas waktu tersebut..
          </p>

          <a href="${data.paymentUrl}" style="display:inline-block;background:#FFD400;color:#000;font-weight:900;text-decoration:none;padding:14px 28px;border:4px solid #000;text-transform:uppercase;letter-spacing:0.5px;">
            Bayar sekarang
          </a>

          <p style="margin:24px 0 0;font-size:12px;color:#999;line-height:1.6;">
            Nomor BIB kamu akan diinfokan setelah pembayaran dikonfirmasi.
            Email ini dikirim otomatis, tidak perlu dibalas.
          </p>
        </td>
      </tr>
    </table>
  </div>
  `;
}