import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

type InfoRow = { label: string; value: string };

function InfoBlock({ title, rows }: { title: string; rows: InfoRow[] }) {
  return (
    <div>
      <p
        className={cn(
          spaceMono.className,
          "mb-2 text-[10px] uppercase tracking-widest text-black/40",
        )}
      >
        {title}
      </p>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 border-b border-black/10 pb-1.5 text-sm"
          >
            <span className="text-black/50">{row.label}</span>
            <span className="text-right font-bold">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SystemInfoCard({
  fees,
  contact,
  bankTransfer,
}: {
  fees: { pelajar: number; umum: number };
  contact: {
    email: string;
    whatsapp: string;
    instagram: string;
    address: string;
  };
  bankTransfer: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
}) {
  return (
    <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="border-b-4 border-black bg-[#FFD400] px-4 py-3">
        <h2
          className={cn(
            SpecialGhotic.className,
            "text-sm uppercase tracking-tight text-black sm:text-base",
          )}
        >
          Info Sistem
        </h2>
      </div>

      <div className="space-y-5 p-5">
        <InfoBlock
          title="Biaya Pendaftaran"
          rows={[
            { label: "Pelajar", value: formatRupiah(fees.pelajar) },
            { label: "Umum", value: formatRupiah(fees.umum) },
          ]}
        />
        <InfoBlock
          title="Kontak Panitia"
          rows={[
            { label: "Email", value: contact.email },
            { label: "WhatsApp", value: contact.whatsapp },
            { label: "Instagram", value: contact.instagram },
          ]}
        />
        <InfoBlock
          title="Rekening Transfer Manual"
          rows={[
            { label: "Bank", value: bankTransfer.bankName },
            { label: "No. Rekening", value: bankTransfer.accountNumber },
            { label: "Atas Nama", value: bankTransfer.accountHolder },
          ]}
        />
        <p className="border-2 border-black/10 bg-[#FDF6E9] px-3 py-2 text-[11px] text-black/50">
          Nilai-nilai ini diatur lewat file konfigurasi & environment variable
          di kode, bukan dari halaman ini — jadi kalau mau diubah, hubungi
          developer.
        </p>
      </div>
    </div>
  );
}
