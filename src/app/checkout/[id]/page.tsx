import { notFound } from "next/navigation";
import Container from "@/components/Container";
import { supabaseAdmin } from "@/libs/supabase/server";
import CheckoutClient from "@/components/checkout/CheckoutClient";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: registration } = await supabaseAdmin
    .from("registrations")
    .select(
      "id, nama_lengkap, email, kategori, ukuran_jersey, status, midtrans_order_id, payment_expires_at, bib_number, discount_amount, final_amount, promos:promo_id ( code )",
    )
    .eq("id", id)
    .single();

  if (!registration) {
    notFound();
  }

  // Supabase/PostgREST selalu balikin relasi promo_id -> promos sebagai
  // OBJECT TUNGGAL di runtime (karena promo_id merujuk ke promos.id yang
  // unique/primary key), tapi tipe TS hasil infer-nya kadang defensif dan
  // nganggep bisa array -> normalize dulu lewat `unknown` biar aman dua-duanya.
  const promoRelation = registration.promos as unknown;
  const promo = (
    Array.isArray(promoRelation) ? promoRelation[0] : promoRelation
  ) as { code: string } | null;

  return (
    <section className="py-16 md:py-24">
      <Container>
        <div className="mx-auto max-w-lg">
          <CheckoutClient
            registration={{
              id: registration.id,
              nama_lengkap: registration.nama_lengkap,
              email: registration.email,
              kategori: registration.kategori,
              ukuran_jersey: registration.ukuran_jersey,
              status: registration.status,
              midtrans_order_id: registration.midtrans_order_id,
              payment_expires_at: registration.payment_expires_at,
              bib_number: registration.bib_number,
              discount_amount: registration.discount_amount,
              final_amount: registration.final_amount,
              promo_code: promo?.code ?? null,
            }}
          />
        </div>
      </Container>
    </section>
  );
}
