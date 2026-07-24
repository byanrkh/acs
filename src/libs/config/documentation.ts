export type DriveFolderLink = {
  title: string;
  description: string;
  url: string;
  /** Tailwind bg color class buat bulatan ikon foldernya */
  iconColor: string;
};

export const driveFolders: DriveFolderLink[] = [
  {
    title: "ACS 2026 Documentation",
    description: "Foto, video, dan hasil dokumentasi acara ACS 2026.",
    url: "https://drive.google.com/drive/folders/GANTI_DENGAN_FOLDER_ID_1",
    iconColor: "bg-[#7ED957]",
  },
  {
    title: "Al Azhar Creative Steps Archive",
    description: "Arsip foto & video dari penyelenggaraan ACS tahun lalu.",
    url: "https://drive.google.com/drive/folders/GANTI_DENGAN_FOLDER_ID_2",
    iconColor: "bg-[#5AC8FA]",
  },
];