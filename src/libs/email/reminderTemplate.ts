type ReminderEmailData = {
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

// Dipakai admin buat nge-nudge peserta yang statusnya masih
// "pending_payment" — beda nada sama invoice pertama (buildInvoiceEmailHtml):
// ini kerangkanya "kamu belum bayar", bukan "makasih udah daftar".
export function buildReminderEmailHtml(data: ReminderEmailData) {
  return `
  <div style="background:#FDF6E9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;border-collapse:collapse;background:#ffffff;border:4px solid #000000;">
      <tr>
        <td style="background:#FFD400;padding:20px 24px;border-bottom:4px solid #000000;">
          <span style="font-size:11px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;color:#000;">⏰ Pengingat Pembayaran</span>
          <br />
          <span style="font-size:18px;font-weight:900;letter-spacing:0.5px;color:#000;">ACS 2026 · ARCHIPELAPACE</span>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 12px;font-size:15px;color:#000;">Halo, <strong>${data.namaLengkap}</strong>.</p>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#333;">
            Kami belum menerima pembayaran untuk pendaftaran ACS 2026 kamu.
            Slot kamu masih ditahan, tapi bakal otomatis hangus kalau
            nggak dibayar sebelum tenggat waktu di bawah. Yuk selesaikan
            dulu sebelum kehabisan waktu.
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

          <div style="border:2px solid #D91E36;background:#FFF3F3;padding:12px 14px;margin-bottom:20px;">
            <p style="margin:0;font-size:13px;color:#D91E36;font-weight:bold;">
              Batas waktu pembayaran: ${formatDeadline(data.paymentExpiresAt)}
            </p>
          </div>

          <a href="${data.paymentUrl}" style="display:inline-block;background:#FFD400;color:#000;font-weight:900;text-decoration:none;padding:14px 28px;border:4px solid #000;text-transform:uppercase;letter-spacing:0.5px;">
            Selesaikan pembayaran
          </a>

          <p style="margin:24px 0 0;font-size:12px;color:#999;line-height:1.6;">
            Kalau kamu sudah bayar tapi masih dapat email ini, abaikan saja —
            sistem kami biasanya butuh beberapa menit buat konfirmasi otomatis.
            Email ini dikirim otomatis, tidak perlu dibalas.
          </p>
        </td>
      </tr>
    </table>
  </div>
  `;
}