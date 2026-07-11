export default function PosterFrame() {
  return (
    <div className="relative mx-auto w-fit">
      {/* blok polkadot di belakang, ngasih depth biar area kanan gak kosong */}
      <div
        aria-hidden
        className="bg-polka absolute -bottom-6 -right-6 h-full w-full rotate-3 border-4 border-ink bg-sun text-ink/25"
      />

      {/* kartu poster — rasio kertas HVS/A4 (210:297), lebar sengaja dikunci kecil */}
      <div className="relative -rotate-2 border-4 border-ink bg-white shadow-brutal-lg">
        <div className="relative aspect-[210/297] w-40 overflow-hidden sm:w-48 md:w-52">
          <div className="flex h-full w-full items-center justify-center bg-gray-50">
            <span className="font-display text-xs uppercase tracking-widest text-ink/40">
              Poster
            </span>
          </div>

          {/*
            Ganti placeholder di atas dengan poster asli, contoh:

            import Image from "next/image";

            <Image
              src="https://cdn.quatrolympic.com/nama-file-poster.jpg"
              alt="Poster ACS 2026: Archipelapace"
              fill
              className="object-cover"
              priority
            />

            (domain cdn.quatrolympic.com sudah di-whitelist di next.config.ts)
          */}
        </div>

        {/* washi tape di atas kartu */}
        <span
          aria-hidden
          className="absolute -top-3 left-1/2 h-6 w-16 -translate-x-1/2 -rotate-3 border-2 border-ink/60 bg-lime-300/80"
        />
      </div>

      {/* tag tanggal di pojok */}
      <span className="absolute -bottom-3 -right-3 rotate-3 border-4 border-ink bg-ember px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-white shadow-brutal-sm sm:text-xs">
        23.08.2026
      </span>

      {/* aksen dekoratif kecil */}
      <span
        aria-hidden
        className="absolute -left-4 -top-4 h-4 w-4 rotate-45 border-2 border-ink bg-palm"
      />
    </div>
  );
}
