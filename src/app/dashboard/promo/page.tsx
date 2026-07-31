import PageHeader from "@/components/dashboard/PageHeader";
import PromoManagementCard from "@/components/dashboard/PromoManagementCard";

export default function PromoPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader eyebrow="Marketing" title="Kode Promo" />
      <PromoManagementCard />
    </div>
  );
}
