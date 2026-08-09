import { getAdminUser } from "@/libs/supabase/serverAuth";
import { getAuditLogs, getPaymentLogs } from "@/libs/actions/logs";
import { getPaymentMethodSettingsAdmin } from "@/libs/actions/paymentSettings";
import { REGISTRATION_FEE } from "@/libs/config/pricing";
import { CONTACT_INFO } from "@/libs/config/contact";
import { BANK_TRANSFER_INFO } from "@/libs/config/bankTransfer";
import PageHeader from "@/components/dashboard/PageHeader";
import SettingsView from "@/components/dashboard/SettingsView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [user, auditLogs, paymentLogs, paymentMethodSettingsResult] =
    await Promise.all([
      getAdminUser(),
      getAuditLogs(),
      getPaymentLogs(),
      getPaymentMethodSettingsAdmin(),
    ]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader eyebrow="Konfigurasi" title="Settings" />
      <SettingsView
        userEmail={user?.email ?? ""}
        fees={REGISTRATION_FEE}
        contact={CONTACT_INFO}
        bankTransfer={BANK_TRANSFER_INFO}
        paymentMethodSettings={
          paymentMethodSettingsResult.ok ? paymentMethodSettingsResult.data : []
        }
        auditLogs={auditLogs}
        paymentLogs={paymentLogs}
      />
    </div>
  );
}
