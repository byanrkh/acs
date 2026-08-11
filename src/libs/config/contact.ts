export const CONTACT_INFO = {
  email: "acs.projectalkp4@gmail.com",
  whatsapp: "+62 856-9770-3733",
  whatsappChannelUrl: "https://whatsapp.com/channel/0029Vb6Yxd0LCoWxS6cZIU2n",
  instagram: "@acs.projectid",
  instagramUrl: "https://instagram.com/acs.projectid",
  address: "Kompleks SMAI Al Azhar 4, Kemang Pratama",
};

export function whatsappHref(whatsapp: string) {
  const digits = whatsapp.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}