import { CreditCard } from "lucide-react";
import { ComingSoon } from "@/components/primitives/ComingSoon";

export default function BillingPage() {
    return (
        <ComingSoon
            title="Billing"
            description="Manage your subscription, invoices, and payment methods. Coming soon."
            icon={CreditCard}
        />
    );
}
