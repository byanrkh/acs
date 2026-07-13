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
      "id, nama_lengkap, email, kategori, ukuran_jersey, status, midtrans_order_id, payment_expires_at, bib_number",
    )
    .eq("id", id)
    .single();

  if (!registration) {
    notFound();
  }

  return (
    <section className="py-16 md:py-24">
      <Container>
        <div className="mx-auto max-w-lg">
          <CheckoutClient registration={registration} />
        </div>
      </Container>
    </section>
  );
}
