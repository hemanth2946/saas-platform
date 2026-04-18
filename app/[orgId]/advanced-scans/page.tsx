import { ScanSearch } from "lucide-react";
import { ComingSoon } from "@/components/primitives/ComingSoon";

export default function AdvancedScansPage() {
    return (
        <ComingSoon
            title="Advanced Scans"
            description="Deep vulnerability scanning with advanced configuration options. Available on the Pro plan."
            icon={ScanSearch}
        />
    );
}
