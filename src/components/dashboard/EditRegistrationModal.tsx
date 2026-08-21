"use client";

import { useEffect, useState, useTransition, type ChangeEvent } from "react";
import {
  adminUpdateRegistrationData,
  type AdminUpdateRegistrationResult,
} from "@/libs/actions/admin";
import type { EditRegistrationPayload } from "@/libs/actions/registration";
import FormField from "@/components/form/FormField";
import SelectField from "@/components/form/SelectField";
import TextAreaField from "@/components/form/TextAreaField";
import RadioTabs from "@/components/form/RadioTabs";
import Button from "@/components/Button";
import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

const golonganDarahOptions = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "AB", label: "AB" },
  { value: "O", label: "O" },
  { value: "tidak-tahu", label: "Tidak tahu" },
];

const jerseyOptions = [{ value: "All Size", label: "All Size" }];

export type EditableRegistration = {
  id: string;
  nama_lengkap: string;
  email: string;
  telepon: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: "L" | "P";
  golongan_darah: string;
  riwayat_penyakit: string | null;
  kontak_darurat_nama: string;
  kontak_darurat_telepon: string;
  ukuran_jersey: string;
  nama_bib: string;
};

type FormErrors = Partial<Record<keyof EditRegistrationPayload, string>>;

function toFormState(data: EditableRegistration): EditRegistrationPayload {
  return {
    namaLengkap: data.nama_lengkap,
    email: data.email,
    telepon: data.telepon,
    tempatLahir: data.tempat_lahir,
    tanggalLahir: data.tanggal_lahir,
    jenisKelamin: data.jenis_kelamin,
    golonganDarah: data.golongan_darah,
    riwayatPenyakit: data.riwayat_penyakit ?? "",
    kontakDaruratNama: data.kontak_darurat_nama,
    kontakDaruratTelepon: data.kontak_darurat_telepon,
    ukuranJersey: data.ukuran_jersey,
    namaBib: data.nama_bib,
  };
}

export default function EditRegistrationModal({
  registration,
  onClose,
  onUpdated,
}: {
  registration: EditableRegistration;
  onClose: () => void;
  onUpdated: (
    id: string,
    registration: Extract<
      AdminUpdateRegistrationResult,
      { ok: true }
    >["registration"],
  ) => void;
}) {
  const [form, setForm] = useState<EditRegistrationPayload>(
    toFormState(registration),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending]);

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

  function handleClose() {
    if (isPending) return;
    onClose();
  }

  function handleSave() {
    setServerError(null);
    setErrors({});

    startTransition(async () => {
      const result = await adminUpdateRegistrationData(registration.id, {
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

      onUpdated(registration.id, result.registration);
      onClose();
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit data peserta"
      onClick={handleClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto border-4 border-black bg-[#F4F1EA] p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] sm:p-8"
      >
        <button
          type="button"
          onClick={handleClose}
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
        <p className={cn(spaceMono.className, "mt-1 text-xs text-black/60")}>
          Kategori & NISN/NIK tidak bisa diubah dari sini.
        </p>

        <div className="mt-6 space-y-5">
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
              <p className={cn(spaceMono.className, "text-xs text-[#D91E36]")}>
                {serverError}
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t-4 border-black pt-5">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
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
  );
}
