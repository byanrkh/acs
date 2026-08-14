"use client";

import { useEffect, useState, useTransition, type ChangeEvent } from "react";
import { FaPen } from "react-icons/fa";
import Button from "@/components/Button";
import FormField from "@/components/form/FormField";
import SelectField from "@/components/form/SelectField";
import TextAreaField from "@/components/form/TextAreaField";
import RadioTabs from "@/components/form/RadioTabs";
import {
  updateRegistrationData,
  type EditRegistrationPayload,
} from "@/libs/actions/registration";
import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

const golonganDarahOptions = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "AB", label: "AB" },
  { value: "O", label: "O" },
  { value: "tidak-tahu", label: "Tidak tahu" },
];

const jerseyOptions = [
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
  { value: "XL", label: "XL" },
];

export type ParticipantData = {
  namaLengkap: string;
  email: string;
  telepon: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  golonganDarah: string;
  riwayatPenyakit: string | null;
  kontakDaruratNama: string;
  kontakDaruratTelepon: string;
  ukuranJersey: string;
  namaBib: string;
};

type FormErrors = Partial<Record<keyof EditRegistrationPayload, string>>;

function toFormState(data: ParticipantData): EditRegistrationPayload {
  return {
    namaLengkap: data.namaLengkap,
    email: data.email,
    telepon: data.telepon,
    tempatLahir: data.tempatLahir,
    tanggalLahir: data.tanggalLahir,
    jenisKelamin: data.jenisKelamin,
    golonganDarah: data.golonganDarah,
    riwayatPenyakit: data.riwayatPenyakit ?? "",
    kontakDaruratNama: data.kontakDaruratNama,
    kontakDaruratTelepon: data.kontakDaruratTelepon,
    ukuranJersey: data.ukuranJersey,
    namaBib: data.namaBib,
  };
}

export default function ParticipantDataCard({
  registrationId,
  kategori,
  identifierLabel,
  identifierValue,
  data,
  editable,
  onUpdated,
}: {
  registrationId: string;
  kategori: "pelajar" | "umum";
  /** "NISN" untuk pelajar, "4 digit terakhir NIK" untuk umum. */
  identifierLabel: string;
  /** Nilai NISN/NIK -- read-only, tidak pernah dikirim ke form edit. */
  identifierValue: string;
  data: ParticipantData;
  /** false kalau status registration sudah tidak boleh diubah lagi. */
  editable: boolean;
  onUpdated: (patch: {
    namaLengkap: string;
    email: string;
    telepon: string;
    ukuranJersey: string;
  }) => void;
}) {
  const [current, setCurrent] = useState(data);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<EditRegistrationPayload>(toFormState(data));
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isEditing) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  function openModal() {
    setForm(toFormState(current));
    setErrors({});
    setServerError(null);
    setIsEditing(true);
  }

  function closeModal() {
    if (isPending) return;
    setIsEditing(false);
  }

  function updateField<K extends keyof EditRegistrationPayload>(
    name: K,
    value: EditRegistrationPayload[K],
  ) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setServerError(null);
  }

  function handleInputChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    updateField(name as keyof EditRegistrationPayload, value);
  }

  function handleSave() {
    setServerError(null);
    setErrors({});

    startTransition(async () => {
      const result = await updateRegistrationData(registrationId, {
        ...form,
        riwayatPenyakit: form.riwayatPenyakit || undefined,
      });

      if (!result.ok) {
        setServerError(result.error);
        if (result.field) {
          setErrors((prev) => ({
            ...prev,
            [result.field as string]: result.error,
          }));
        }
        return;
      }

      const next: ParticipantData = {
        ...current,
        namaLengkap: form.namaLengkap.trim(),
        email: result.registration.email,
        telepon: form.telepon.trim(),
        tempatLahir: form.tempatLahir.trim(),
        tanggalLahir: form.tanggalLahir,
        jenisKelamin: form.jenisKelamin,
        golonganDarah: form.golonganDarah,
        riwayatPenyakit: form.riwayatPenyakit?.trim() || null,
        kontakDaruratNama: form.kontakDaruratNama.trim(),
        kontakDaruratTelepon: form.kontakDaruratTelepon.trim(),
        ukuranJersey: form.ukuranJersey,
        namaBib: form.namaBib.trim(),
      };

      setCurrent(next);
      setIsEditing(false);
      onUpdated({
        namaLengkap: result.registration.namaLengkap,
        email: result.registration.email,
        telepon: result.registration.telepon,
        ukuranJersey: result.registration.ukuranJersey,
      });
    });
  }

  return (
    <div className="border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            SpecialGhotic.className,
            "text-sm uppercase tracking-tight text-black",
          )}
        >
          Data peserta
        </span>

        {editable && (
          <button
            type="button"
            onClick={openModal}
            className={cn(
              spaceMono.className,
              "flex items-center gap-1.5 border-2 border-black bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-tight shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5",
            )}
          >
            <FaPen size={10} />
            Edit Data
          </button>
        )}
      </div>

      <dl className="mt-4 divide-y-2 divide-dashed divide-black/15 text-sm">
        <Row label="Nama Lengkap" value={current.namaLengkap} />
        <Row label={identifierLabel} value={identifierValue} />
        <Row label="Email" value={current.email} />
        <Row label="Nomor HP" value={current.telepon} />
        <Row
          label="Kategori"
          value={kategori === "pelajar" ? "Pelajar" : "Umum"}
        />
        <Row label="Ukuran Jersey" value={current.ukuranJersey} />
      </dl>

      {isEditing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit data peserta"
          onClick={closeModal}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto border-4 border-black bg-[#F4F1EA] p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] sm:p-8"
          >
            <button
              type="button"
              onClick={closeModal}
              disabled={isPending}
              aria-label="Tutup edit data"
              className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center border-4 border-black bg-white font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50"
            >
              ✕
            </button>

            <h3
              className={cn(
                SpecialGhotic.className,
                "text-xl uppercase tracking-tight text-black sm:text-2xl",
              )}
            >
              Edit data peserta
            </h3>
            <p
              className={cn(spaceMono.className, "mt-1 text-xs text-black/60")}
            >
              {identifierLabel} & kategori tidak bisa diubah di sini.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <FormField
                  label={identifierLabel}
                  name="identifier"
                  type="text"
                  value={identifierValue}
                  disabled
                  readOnly
                  className="cursor-not-allowed bg-black/5 text-black/50"
                />
                <p
                  className={cn(
                    spaceMono.className,
                    "mt-1.5 text-[11px] text-black/50",
                  )}
                >
                  {identifierLabel} tidak dapat diubah. Hubungi admin jika ingin
                  mengubah {identifierLabel}.
                </p>
              </div>

              <FormField
                label="Nama lengkap"
                name="namaLengkap"
                type="text"
                value={form.namaLengkap}
                onChange={handleInputChange}
                error={errors.namaLengkap}
              />

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleInputChange}
                  error={errors.email}
                />
                <FormField
                  label="Nomor telepon / WhatsApp"
                  name="telepon"
                  type="tel"
                  inputMode="tel"
                  value={form.telepon}
                  onChange={handleInputChange}
                  error={errors.telepon}
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  label="Tempat lahir"
                  name="tempatLahir"
                  type="text"
                  value={form.tempatLahir}
                  onChange={handleInputChange}
                  error={errors.tempatLahir}
                />
                <FormField
                  label="Tanggal lahir"
                  name="tanggalLahir"
                  type="date"
                  value={form.tanggalLahir}
                  onChange={handleInputChange}
                  error={errors.tanggalLahir}
                />
              </div>

              <RadioTabs
                legend="Jenis kelamin"
                name="jenisKelamin"
                value={form.jenisKelamin}
                onChange={(value) =>
                  updateField("jenisKelamin", value as "L" | "P")
                }
                error={errors.jenisKelamin}
                options={[
                  { value: "L", label: "Laki-laki" },
                  { value: "P", label: "Perempuan" },
                ]}
              />

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <SelectField
                  label="Golongan darah"
                  name="golonganDarah"
                  value={form.golonganDarah}
                  onChange={handleInputChange}
                  error={errors.golonganDarah}
                  options={golonganDarahOptions}
                  placeholder="Pilih golongan darah"
                />
                <SelectField
                  label="Ukuran jersey"
                  name="ukuranJersey"
                  value={form.ukuranJersey}
                  onChange={handleInputChange}
                  error={errors.ukuranJersey}
                  options={jerseyOptions}
                  placeholder="Pilih ukuran"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  label="Nama kontak darurat"
                  name="kontakDaruratNama"
                  type="text"
                  value={form.kontakDaruratNama}
                  onChange={handleInputChange}
                  error={errors.kontakDaruratNama}
                />
                <FormField
                  label="Nomor telepon kontak darurat"
                  name="kontakDaruratTelepon"
                  type="tel"
                  inputMode="tel"
                  value={form.kontakDaruratTelepon}
                  onChange={handleInputChange}
                  error={errors.kontakDaruratTelepon}
                />
              </div>

              <TextAreaField
                label="Riwayat penyakit / alergi"
                name="riwayatPenyakit"
                value={form.riwayatPenyakit}
                onChange={handleInputChange}
                optional
              />

              <FormField
                label="Nama di BIB"
                name="namaBib"
                type="text"
                maxLength={12}
                value={form.namaBib}
                onChange={handleInputChange}
                error={errors.namaBib}
                hint={`${form.namaBib.length}/12 karakter`}
              />

              {serverError && Object.keys(errors).length === 0 && (
                <div className="border-4 border-[#D91E36] bg-[#D91E36]/10 px-4 py-3">
                  <p
                    className={cn(
                      spaceMono.className,
                      "text-xs text-[#D91E36]",
                    )}
                  >
                    {serverError}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t-4 border-black pt-5">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeModal}
                  disabled={isPending}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSave}
                  disabled={isPending}
                >
                  {isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt
        className={cn(
          spaceMono.className,
          "text-[11px] uppercase tracking-widest text-black/50",
        )}
      >
        {label}
      </dt>
      <dd className="text-right text-sm font-medium text-black">{value}</dd>
    </div>
  );
}
