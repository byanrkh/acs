"use client";

import { ChangeEvent, FormEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import FormField from "@/components/form/FormField";
import SelectField from "@/components/form/SelectField";
import TextAreaField from "@/components/form/TextAreaField";
import RadioTabs from "@/components/form/RadioTabs";
import StepIndicator from "@/components/form/StepIndicator";
import SizeChartModal from "@/components/SizeChartModal";
import { submitRegistration } from "@/libs/actions/registration";
import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

type Kategori = "pelajar" | "umum" | "";
type JenisKelamin = "L" | "P" | "";

type FormState = {
  kategori: Kategori;
  nisn: string;
  nikTerakhir: string;
  namaLengkap: string;
  email: string;
  telepon: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: JenisKelamin;
  golonganDarah: string;
  riwayatPenyakit: string;
  kontakDaruratNama: string;
  kontakDaruratTelepon: string;
  ukuranJersey: string;
  namaBib: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const TOTAL_STEPS = 3;

const initialState: FormState = {
  kategori: "",
  nisn: "",
  nikTerakhir: "",
  namaLengkap: "",
  email: "",
  telepon: "",
  tempatLahir: "",
  tanggalLahir: "",
  jenisKelamin: "",
  golonganDarah: "",
  riwayatPenyakit: "",
  kontakDaruratNama: "",
  kontakDaruratTelepon: "",
  ukuranJersey: "",
  namaBib: "",
};

const golonganDarahOptions = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "AB", label: "AB" },
  { value: "O", label: "O" },
  { value: "tidak-tahu", label: "Tidak tahu" },
];

const jerseyOptions = [{ value: "All Size", label: "All Size" }];

const stepLabels = ["Data pribadi", "Data medis", "Jersey & lainnya"];

const step1Fields: (keyof FormState)[] = [
  "email",
  "nisn",
  "nikTerakhir",
  "namaLengkap",
];

function validateStep1(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.kategori) errors.kategori = "Pilih salah satu kategori peserta.";
  if (form.kategori === "pelajar" && !/^\d{10}$/.test(form.nisn.trim())) {
    errors.nisn = "NISN wajib 10 digit angka.";
  }
  if (form.kategori === "umum" && !/^\d{16}$/.test(form.nikTerakhir.trim())) {
    errors.nikTerakhir = "Wajib diisi 16 digit angka (NIK lengkap).";
  }
  if (!form.namaLengkap.trim())
    errors.namaLengkap = "Nama lengkap wajib diisi.";
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
    errors.email = "Format email tidak valid.";
  if (!/^0\d{9,13}$/.test(form.telepon.trim()))
    errors.telepon = "Nomor telepon tidak valid.";
  if (!form.tempatLahir.trim())
    errors.tempatLahir = "Tempat lahir wajib diisi.";
  if (!form.tanggalLahir) errors.tanggalLahir = "Tanggal lahir wajib diisi.";
  if (!form.jenisKelamin) errors.jenisKelamin = "Pilih jenis kelamin.";

  return errors;
}

function validateStep2(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.golonganDarah) errors.golonganDarah = "Pilih golongan darah.";
  if (!form.kontakDaruratNama.trim()) {
    errors.kontakDaruratNama = "Nama kontak darurat wajib diisi.";
  }
  if (!/^0\d{9,13}$/.test(form.kontakDaruratTelepon.trim())) {
    errors.kontakDaruratTelepon = "Nomor telepon tidak valid.";
  }

  return errors;
}

function validateStep3(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.ukuranJersey) errors.ukuranJersey = "Pilih ukuran jersey.";
  if (!form.namaBib.trim()) {
    errors.namaBib = "Nama di BIB wajib diisi.";
  } else if (form.namaBib.trim().length > 12) {
    errors.namaBib = "Maksimal 12 karakter.";
  }

  return errors;
}

// PENTING: peta eksplisit per-step, BUKAN ternary. Ini yang bikin nggak
// mungkin ada validator step yang salah kepanggil pas navigasi antar step —
// goNext() cuma pernah baca stepValidators[step_SEKARANG], titik, nggak ada
// jalur lain yang bisa nyasar ke validateStep3 sebelum step-nya beneran 3.
const stepValidators: Record<number, (form: FormState) => FormErrors> = {
  1: validateStep1,
  2: validateStep2,
  3: validateStep3,
};

export default function RegistrationForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formTopRef = useRef<HTMLDivElement>(null);

  function updateField<K extends keyof FormState>(
    name: K,
    value: FormState[K],
  ) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setServerError(null);
  }

  function handleInputChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    updateField(name as keyof FormState, value);
  }

  function handleKategoriChange(value: string) {
    setForm((prev) => ({
      ...prev,
      kategori: value as Kategori,
      nisn: "",
      nikTerakhir: "",
    }));
    setErrors((prev) => ({
      ...prev,
      kategori: undefined,
      nisn: undefined,
      nikTerakhir: undefined,
    }));
  }

  function focusFirstError(stepErrors: FormErrors) {
    const firstErrorKey = Object.keys(stepErrors)[0];
    if (firstErrorKey) {
      document.getElementById(firstErrorKey)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }

  function scrollToTop() {
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goNext() {
    if (isPending) return;
    if (step >= TOTAL_STEPS) return; // pengaman ekstra, seharusnya nggak pernah kepanggil di step 3

    const validator = stepValidators[step];
    const stepErrors = validator(form);
    setErrors(stepErrors);

    if (Object.keys(stepErrors).length > 0) {
      focusFirstError(stepErrors);
      return;
    }

    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    scrollToTop();
  }

  function goBack() {
    if (isPending) return;
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
    scrollToTop();
  }

  // handleSubmit HANYA melakukan submit sungguhan (validateStep3 + kirim ke
  // server) kalau step === TOTAL_STEPS. Di step 1/2, submit event (misalnya
  // dari user pencet Enter di keyboard) diarahkan ke goNext(), BUKAN
  // langsung validasi/submit akhir.
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (step < TOTAL_STEPS) {
      goNext();
      return;
    }

    const stepErrors = validateStep3(form);
    setErrors(stepErrors);

    if (Object.keys(stepErrors).length > 0) {
      focusFirstError(stepErrors);
      return;
    }

    setServerError(null);

    startTransition(async () => {
      const result = await submitRegistration({
        kategori: form.kategori as "pelajar" | "umum",
        nisn: form.nisn || undefined,
        nikTerakhir: form.nikTerakhir || undefined,
        namaLengkap: form.namaLengkap,
        email: form.email,
        telepon: form.telepon,
        tempatLahir: form.tempatLahir,
        tanggalLahir: form.tanggalLahir,
        jenisKelamin: form.jenisKelamin as "L" | "P",
        golonganDarah: form.golonganDarah,
        riwayatPenyakit: form.riwayatPenyakit || undefined,
        kontakDaruratNama: form.kontakDaruratNama,
        kontakDaruratTelepon: form.kontakDaruratTelepon,
        ukuranJersey: form.ukuranJersey,
        namaBib: form.namaBib,
      });

      if (!result.ok) {
        setServerError(result.error);

        if (result.field) {
          setErrors((prev) => ({
            ...prev,
            [result.field as keyof FormState]: result.error,
          }));

          if (step1Fields.includes(result.field)) {
            setStep(1);
          }

          requestAnimationFrame(() => {
            document.getElementById(result.field as string)?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          });
        } else {
          scrollToTop();
        }
        return;
      }

      router.push(result.redirectPath ?? `/checkout/${result.registrationId}`);
    });
  }

  return (
    <div ref={formTopRef}>
      <div className="mb-8 border-4 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:p-6">
        <StepIndicator steps={stepLabels} current={step} />
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-8 border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:p-10"
      >
        {/* Wrapper transisi per-step: cuma nambah kelas animasi (lihat
            .step-in di globals.css), sama sekali ga ubah state/handler apa
            pun di bawah ini. */}
        <div key={step} className="step-in space-y-8">
          {/* STEP 1 — DATA PRIBADI */}
          {step === 1 && (
            <fieldset className="space-y-6">
              <legend
                className={cn(
                  SpecialGhotic.className,
                  "text-xl uppercase tracking-tight text-black md:text-2xl",
                )}
              >
                01 — Data pribadi
              </legend>

              <RadioTabs
                legend="Kategori peserta"
                name="kategori"
                value={form.kategori}
                onChange={handleKategoriChange}
                error={errors.kategori}
                options={[
                  { value: "pelajar", label: "Pelajar" },
                  { value: "umum", label: "Umum" },
                ]}
              />

              {form.kategori === "pelajar" && (
                <FormField
                  label="Nomor induk siswa nasional (NISN)"
                  name="nisn"
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10 digit angka"
                  value={form.nisn}
                  onChange={handleInputChange}
                  error={errors.nisn}
                />
              )}

              {form.kategori === "umum" && (
                <FormField
                  label="NIK (16 digit)"
                  name="nikTerakhir"
                  type="text"
                  inputMode="numeric"
                  maxLength={16}
                  placeholder="Contoh: 3273010101990001"
                  value={form.nikTerakhir}
                  onChange={handleInputChange}
                  error={errors.nikTerakhir}
                />
              )}

              <FormField
                label="Nama lengkap"
                name="namaLengkap"
                type="text"
                placeholder="Sesuai KTP / kartu pelajar"
                value={form.namaLengkap}
                onChange={handleInputChange}
                error={errors.namaLengkap}
              />

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={form.email}
                  onChange={handleInputChange}
                  error={errors.email}
                />
                <FormField
                  label="Nomor telepon / WhatsApp"
                  name="telepon"
                  type="tel"
                  inputMode="tel"
                  placeholder="08xx xxxx xxxx"
                  value={form.telepon}
                  onChange={handleInputChange}
                  error={errors.telepon}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  label="Tempat lahir"
                  name="tempatLahir"
                  type="text"
                  placeholder="Kota tempat lahir"
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
                  updateField("jenisKelamin", value as JenisKelamin)
                }
                error={errors.jenisKelamin}
                options={[
                  { value: "L", label: "Laki-laki" },
                  { value: "P", label: "Perempuan" },
                ]}
              />
            </fieldset>
          )}

          {/* STEP 2 — DATA MEDIS & KONTAK DARURAT */}
          {step === 2 && (
            <fieldset className="space-y-6">
              <legend
                className={cn(
                  SpecialGhotic.className,
                  "text-xl uppercase tracking-tight text-black md:text-2xl",
                )}
              >
                02 — Data medis & kontak darurat
              </legend>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <SelectField
                  label="Golongan darah"
                  name="golonganDarah"
                  value={form.golonganDarah}
                  onChange={handleInputChange}
                  error={errors.golonganDarah}
                  options={golonganDarahOptions}
                  placeholder="Pilih golongan darah"
                />
                <FormField
                  label="Nama kontak darurat"
                  name="kontakDaruratNama"
                  type="text"
                  placeholder="Nama"
                  value={form.kontakDaruratNama}
                  onChange={handleInputChange}
                  error={errors.kontakDaruratNama}
                />
              </div>

              <FormField
                label="Nomor telepon kontak darurat"
                name="kontakDaruratTelepon"
                type="tel"
                inputMode="tel"
                placeholder="08xx xxxx xxxx"
                value={form.kontakDaruratTelepon}
                onChange={handleInputChange}
                error={errors.kontakDaruratTelepon}
              />

              <TextAreaField
                label="Riwayat penyakit / alergi"
                name="riwayatPenyakit"
                placeholder="Kosongkan jika tidak ada"
                value={form.riwayatPenyakit}
                onChange={handleInputChange}
                optional
              />
            </fieldset>
          )}

          {/* STEP 3 — ATRIBUT LARI */}
          {step === 3 && (
            <fieldset className="space-y-6">
              <legend
                className={cn(
                  SpecialGhotic.className,
                  "text-xl uppercase tracking-tight text-black md:text-2xl",
                )}
              >
                03 — Jersey & lainnya
              </legend>

              <div>
                <div className="flex items-end justify-between gap-3">
                  <label
                    htmlFor="ukuranJersey"
                    className={cn(
                      SpecialGhotic.className,
                      "text-sm uppercase tracking-tight text-black",
                    )}
                  >
                    Ukuran jersey
                  </label>
                </div>
                <div className="mt-2">
                  <SelectField
                    label="Ukuran jersey"
                    hideLabel
                    name="ukuranJersey"
                    value={form.ukuranJersey}
                    onChange={handleInputChange}
                    error={errors.ukuranJersey}
                    options={jerseyOptions}
                    placeholder="Pilih ukuran"
                  />
                </div>
              </div>

              <FormField
                label="Nama di BIB"
                name="namaBib"
                type="text"
                maxLength={12}
                placeholder="Maks. 12 karakter"
                value={form.namaBib}
                onChange={handleInputChange}
                error={errors.namaBib}
                hint={`${form.namaBib.length}/12 karakter`}
              />

              {serverError &&
                !errors.email &&
                !errors.nisn &&
                !errors.nikTerakhir && (
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
            </fieldset>
          )}
        </div>

        {/* NAVIGASI STEP */}
        <div className="flex items-center justify-between gap-4 border-t-4 border-black pt-6">
          {step > 1 ? (
            <Button
              type="button"
              variant="secondary"
              onClick={goBack}
              disabled={isPending}
            >
              Kembali
            </Button>
          ) : (
            <span />
          )}

          {step < TOTAL_STEPS ? (
            <Button
              type="button"
              variant="primary"
              onClick={goNext}
              disabled={isPending}
            >
              Lanjut
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              className="text-[#004D3D]"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Menyimpan...
                </>
              ) : (
                "Konfirmasi & daftar"
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
