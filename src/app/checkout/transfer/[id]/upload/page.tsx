import { notFound } from "next/navigation";
import Container from "@/components/Container";
import { supabaseAdmin } from "@/libs/supabase/server";
import UploadBuktiForm from "@/components/checkout/UploadBuktiForm";
import { SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";

export default async function UploadBuktiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: registration } = await supabaseAdmin
    .from("registrations")
    .select("id, status")
    .eq("id", id)
    .single();

  if (!registration) {
    notFound();
  }

  if (registration.status === "confirmed") {
    return (
      <section className="py-16 md:py-24">
        <Container>
          <div className="mx-auto max-w-lg border-4 border-black bg-[#1F4B33] p-6 text-center text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <p
              className={cn(
                SpecialGhotic.className,
                "uppercase tracking-tight",
              )}
            >
              Pendaftaran ini sudah terkonfirmasi
            </p>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24">
      <Container>
        <div className="mx-auto max-w-lg">
          <span className="inline-block -rotate-2 border-4 border-black bg-[#FFD400] px-4 py-1.5 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Upload bukti
          </span>
          <h1
            className={cn(
              SpecialGhotic.className,
              "mt-6 text-3xl uppercase leading-[0.95] tracking-tight text-black sm:text-4xl",
            )}
          >
            Unggah bukti transfer
          </h1>

          <div className="mt-8 border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:p-8">
            <UploadBuktiForm registrationId={registration.id} />
          </div>
        </div>
      </Container>
    </section>
  );
}
