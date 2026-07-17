type SuccessEmailData = {
  namaLengkap: string;
  namaBib: string;
  bibNumber: string;
  kategori: "pelajar" | "umum";
  ukuranJersey: string;
};

// Ganti sesuai jadwal & lokasi event asli kamu.
const EVENT_DATE_LABEL = "Minggu, 23 Agustus 2026";
const EVENT_TIME_LABEL = "06.00 WIB";
const EVENT_VENUE_LABEL = "Venue akan diinfokan lewat email terpisah";

const KATEGORI_LABEL: Record<"pelajar" | "umum", string> = {
  pelajar: "Pelajar",
  umum: "Umum",
};

export function buildSuccessEmailHtml(data: SuccessEmailData) {
  const kategoriLabel = KATEGORI_LABEL[data.kategori] ?? data.kategori;

  return `
  <div style="background:#FDF6E9;padding:32px 12px;font-family:Arial,Helvetica,sans-serif;">
    <style>
      @media (max-width: 520px) {
        .acs-ticket-stub { display:block !important; width:100% !important; border-left:none !important; border-top:4px dashed #000 !important; margin-top:16px !important; }
        .acs-ticket-main { display:block !important; width:100% !important; }
      }
    </style>

    <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;border-collapse:collapse;">
      <tr>
        <td style="padding:0 0 16px;text-align:center;">
          <span style="display:inline-block;background:#FFD400;border:3px solid #000;padding:6px 16px;font-size:11px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;color:#000;">
            E-Ticket ACS
          </span>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;border-collapse:collapse;background:#ffffff;border:4px solid #000000;box-shadow:8px 8px 0 rgba(0,0,0,1);">
      <tr>
        <td style="background:#1F4B33;background-image:radial-gradient(rgba(255,255,255,0.08) 1.5px, transparent 1.5px);background-size:16px 16px;padding:22px 26px;border-bottom:4px solid #000000;">
          <table role="presentation" width="100%">
            <tr>
              <td style="font-size:19px;font-weight:900;letter-spacing:0.5px;color:#fff;">
                ACS 2026 · ARCHIPELAPACE
              </td>
              <td style="text-align:right;">
                <span style="display:inline-block;background:#7ED957;border:2px solid #000;padding:4px 10px;font-size:10px;font-weight:900;letter-spacing:1px;text-transform:uppercase;color:#000;white-space:nowrap;">
                  ✓ Confirmed
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td style="padding:26px 26px 8px;">
          <p style="margin:0 0 6px;font-size:15px;color:#000;">Halo, <strong>${data.namaLengkap}</strong> 👋</p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#444;">
            Pembayaran kamu sudah kami terima dan pendaftaran resmi terkonfirmasi.
            Simpan e-tiket ini baik-baik, ya — sampai ketemu di garis start!
          </p>
        </td>
      </tr>

      <tr>
        <td style="padding:18px 26px 26px;">
          <table role="presentation" width="100%" style="border-collapse:collapse;border:3px solid #000;">
            <tr>
              <td class="acs-ticket-main" width="60%" style="padding:20px;vertical-align:top;">
                <p style="margin:0 0 3px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;">Nama di BIB</p>
                <p style="margin:0 0 16px;font-size:18px;font-weight:900;color:#000;">${data.namaBib}</p>

                <table role="presentation" width="100%" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:0 0 10px;width:50%;">
                      <p style="margin:0 0 2px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;">Kategori</p>
                      <p style="margin:0;font-size:13px;font-weight:700;color:#000;">${kategoriLabel}</p>
                    </td>
                    <td style="padding:0 0 10px;width:50%;">
                      <p style="margin:0 0 2px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;">Ukuran Jersey</p>
                      <p style="margin:0;font-size:13px;font-weight:700;color:#000;">${data.ukuranJersey}</p>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding:6px 0 0;border-top:2px dashed #ccc;">
                      <p style="margin:8px 0 2px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;">Tanggal & Lokasi</p>
                      <p style="margin:0;font-size:12.5px;line-height:1.5;color:#333;">${EVENT_DATE_LABEL} · ${EVENT_TIME_LABEL}<br/>${EVENT_VENUE_LABEL}</p>
                    </td>
                  </tr>
                </table>
              </td>

              <td class="acs-ticket-stub" width="40%" style="padding:20px;text-align:center;vertical-align:top;border-left:4px dashed #000;background:#FDF6E9;">
                <p style="margin:0 0 2px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#666;">Nomor BIB</p>
                <p style="margin:0 0 14px;font-size:34px;font-weight:900;color:#000;line-height:1;">${data.bibNumber}</p>

                <img
                  src="cid:qrcode_tiket"
                  alt="QR Code tiket"
                  width="150"
                  height="150"
                  style="display:block;margin:0 auto;border:3px solid #000;background:#fff;"
                />
                <p style="margin:8px 0 0;font-size:10px;color:#999;line-height:1.4;">
                  Tunjukkan QR ini saat<br/>pengambilan race pack
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td style="padding:0 26px 26px;">
          <p style="margin:0;font-size:11.5px;color:#999;line-height:1.6;">
            Simpan email ini sebagai bukti pendaftaran. Info race pack dan jadwal pengambilan
            akan menyusul lewat email terpisah. Email ini dikirim otomatis, tidak perlu dibalas.
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" style="max-width:560px;margin:14px auto 0;border-collapse:collapse;">
      <tr>
        <td style="text-align:center;font-size:11px;color:#999;">
          ACS 2026: Archipelapace · Part of <a href="https://quatrolympic.com" target="_blank" style="color:#998">Quatrolympic</a>
        </td>
      </tr>
    </table>
  </div>
  `;
}