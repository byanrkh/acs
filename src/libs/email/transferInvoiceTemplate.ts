import { BANK_TRANSFER_INFO } from "@/libs/config/bankTransfer";

type TransferInvoiceData = {
  namaLengkap: string;
  kategori: "pelajar" | "umum";
  ukuranJersey: string;
  grossAmount: number;
  checkoutUrl: string;
};

const KATEGORI_LABEL: Record<"pelajar" | "umum", string> = {
  pelajar: "Pelajar",
  umum: "Umum",
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function buildTransferInvoiceEmailHtml(data: TransferInvoiceData) {
  const kategoriLabel = KATEGORI_LABEL[data.kategori] ?? data.kategori;

  return `
    <div style="background:#FDF6E5;padding:32px 15px;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="100%" style="max-width:520px;margin:0 auto;border-collapse:collapse;">
        <tr>
          <td style="padding:0 0 16px;text-align:center;">
            <span style="display:inline-block;background:#FFD400;border:3px solid #000;padding:6px 16px;font-size:11px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;color:#000;">
              Invoice ACS 2026
            </span>
          </td>
        </tr>
        <tr>
          <td style="border:4px solid #000;background:#fff;padding:24px;">
            <p style="margin:0 0 12px;font-size:14px;color:#000;">
              Halo <strong>${data.namaLengkap}</strong>,
            </p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#000;">
              Terima kasih sudah mendaftar ACS 2026 kategori <strong>${kategoriLabel}</strong>
              (ukuran jersey ${data.ukuranJersey}). Selesaikan pembayaran dengan transfer
              bank ke rekening di bawah ini, <strong>PERSIS</strong> sejumlah nominal yang
              tertera (sudah termasuk kode unik):
            </p>
            <div style="border:3px solid #000;background:#fff;padding:16px;text-align:center;margin-bottom:16px;">
              <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;">
                Transfer ke rekening
              </p>
              <p style="margin:6px 0 0;font-size:16px;font-weight:900;color:#000;text-transform:uppercase;">
                ${BANK_TRANSFER_INFO.bankName}
              </p>
              <p style="margin:6px 0 0;font-size:22px;font-weight:900;letter-spacing:2px;color:#000;">
                ${BANK_TRANSFER_INFO.accountNumber}
              </p>
              <p style="margin:4px 0 0;font-size:13px;color:#333;">
                a.n. ${BANK_TRANSFER_INFO.accountHolder}
              </p>
            </div>
            <div style="border:3px solid #000;background:#FFD400;padding:16px;text-align:center;margin-bottom:16px;">
              <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#000;">
                Total transfer
              </p>
              <p style="margin:4px 0 0;font-size:24px;font-weight:900;color:#000;">
                ${formatRupiah(data.grossAmount)}
              </p>
            </div>
            <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#000;">
              Setelah transfer, buka link di bawah ini untuk melihat detail rekening
              dan mengunggah bukti transfer kamu:
            </p>
            <p style="text-align:center;margin:0 0 8px;">
              <a
                href="${data.checkoutUrl}"
                style="display:inline-block;border:3px solid #000;background:#1F4B33;color:#fff;padding:10px 20px;font-size:13px;font-weight:700;text-decoration:none;text-transform:uppercase;"
              >
                Lihat Detail & Bayar
              </a>
            </p>
            <p style="margin:16px 0 0;font-size:11px;color:#666;text-align:center;">
              Nominal harus sama persis termasuk kode unik, jangan dibulatkan.
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;
}

// Dipakai admin buat nge-nudge peserta transfer bank yang belum
// bayar/belum upload bukti. Beda sama buildTransferInvoiceEmailHtml:
// nadanya "kamu belum bayar", dan SENGAJA TANPA tenggat waktu — jalur
// transfer manual ini belum punya deadline otomatis kayak Midtrans.
export function buildTransferReminderEmailHtml(data: TransferInvoiceData) {
  const kategoriLabel = KATEGORI_LABEL[data.kategori] ?? data.kategori;

  return `
    <div style="background:#FDF6E5;padding:32px 15px;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="100%" style="max-width:520px;margin:0 auto;border-collapse:collapse;">
        <tr>
          <td style="padding:0 0 16px;text-align:center;">
            <span style="display:inline-block;background:#FFD400;border:3px solid #000;padding:6px 16px;font-size:11px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;color:#000;">
              ⏰ Pengingat Pembayaran
            </span>
          </td>
        </tr>
        <tr>
          <td style="border:4px solid #000;background:#fff;padding:24px;">
            <p style="margin:0 0 12px;font-size:14px;color:#000;">
              Halo <strong>${data.namaLengkap}</strong>,
            </p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#000;">
              Kami belum menerima bukti transfer untuk pendaftaran ACS 2026
              kategori <strong>${kategoriLabel}</strong> kamu. Berikut rekening
              tujuannya lagi, transfer <strong>PERSIS</strong> sejumlah nominal
              di bawah (sudah termasuk kode unik) lalu unggah buktinya:
            </p>
            <div style="border:3px solid #000;background:#fff;padding:16px;text-align:center;margin-bottom:16px;">
              <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;">
                Transfer ke rekening
              </p>
              <p style="margin:6px 0 0;font-size:16px;font-weight:900;color:#000;text-transform:uppercase;">
                ${BANK_TRANSFER_INFO.bankName}
              </p>
              <p style="margin:6px 0 0;font-size:22px;font-weight:900;letter-spacing:2px;color:#000;">
                ${BANK_TRANSFER_INFO.accountNumber}
              </p>
              <p style="margin:4px 0 0;font-size:13px;color:#333;">
                a.n. ${BANK_TRANSFER_INFO.accountHolder}
              </p>
            </div>
            <div style="border:3px solid #000;background:#FFD400;padding:16px;text-align:center;margin-bottom:16px;">
              <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#000;">
                Total transfer
              </p>
              <p style="margin:4px 0 0;font-size:24px;font-weight:900;color:#000;">
                ${formatRupiah(data.grossAmount)}
              </p>
            </div>
            <p style="text-align:center;margin:0 0 8px;">
              <a
                href="${data.checkoutUrl}"
                style="display:inline-block;border:3px solid #000;background:#1F4B33;color:#fff;padding:10px 20px;font-size:13px;font-weight:700;text-decoration:none;text-transform:uppercase;"
              >
                Lihat Detail & Unggah Bukti
              </a>
            </p>
            <p style="margin:16px 0 0;font-size:11px;color:#666;text-align:center;">
              Nominal harus sama persis termasuk kode unik, jangan dibulatkan.
              Kalau kamu sudah transfer & sudah unggah bukti, abaikan email ini.
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;
}