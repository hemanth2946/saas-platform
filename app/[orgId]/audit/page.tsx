import { ClipboardList } from "lucide-react";
import { ComingSoon } from "@/components/primitives/ComingSoon";

export default function AuditLogPage() {
    return (
        <ComingSoon
            title="Audit Log"
            description="Track all activity across your organisation — user actions, role changes, and system events. Coming soon."
            icon={ClipboardList}
        />
    );
}
