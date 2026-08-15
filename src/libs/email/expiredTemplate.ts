type ExpiredEmailData = {
  namaLengkap: string;
  kategori: "pelajar" | "umum";
  ukuranJersey: string;
  registrationUrl: string;
};

// Dikirim otomatis pas registrasi channel Midtrans transisi
// pending_payment -> expired (lewat 3 jam tanpa bayar). Nadanya: kasih tau
// jelas bahwa invoice lama sudah tidak bisa dipakai lagi, TAPI slot belum
// hilang -- ajak daftar ulang lewat tombol DAFTAR ULANG yang mengarah ke
// halaman /registration (route publik yang sudah ada, tidak dibuat baru).
export function buildExpiredEmailHtml(data: ExpiredEmailData) {
  return `
  <div style="background:#FDF6E9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;border-collapse:collapse;background:#ffffff;border:4px solid #000000;">
      <tr>
        <td style="background:#D91E36;padding:20px 24px;border-bottom:4px solid #000000;">
          <span style="font-size:11px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;color:#fff;">⏳ Tagihan Kedaluwarsa</span>
          <br />
          <span style="font-size:18px;font-weight:900;letter-spacing:0.5px;color:#fff;">ACS 2026 · ARCHIPELAPACE</span>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 12px;font-size:15px;color:#000;">Halo, <strong>${data.namaLengkap}</strong>.</p>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#333;">
            Batas waktu 3 jam untuk menyelesaikan pembayaran pendaftaran ACS 2026 kamu
            (kategori <strong style="text-transform:capitalize;">${data.kategori}</strong>, jersey <strong>${data.ukuranJersey}</strong>)
            sudah lewat. Pendaftaran ini sekarang berstatus <strong>kedaluwarsa</strong> dan
            tidak bisa dipakai lagi untuk melanjutkan pembayaran.
          </p>

          <div style="border:2px solid #D91E36;background:#FFF3F3;padding:12px 14px;margin-bottom:20px;">
            <p style="margin:0;font-size:13px;color:#D91E36;font-weight:bold;">
              Tenang, kamu masih bisa ikut ACS 2026 kok — daftar ulang kapan saja pakai data yang sama.
            </p>
          </div>

          <a href="${data.registrationUrl}" style="display:inline-block;background:#FFD400;color:#000;font-weight:900;text-decoration:none;padding:14px 28px;border:4px solid #000;text-transform:uppercase;letter-spacing:0.5px;">
            Daftar Ulang
          </a>

          <p style="margin:24px 0 0;font-size:12px;color:#999;line-height:1.6;">
            Kalau kamu sudah bayar tapi masih menerima email ini, hubungi panitia lewat halaman Kontak ya.
            Email ini dikirim otomatis, tidak perlu dibalas.
          </p>
        </td>
      </tr>
    </table>
  </div>
  `;
}