import { Bot } from "lucide-react";
import { ComingSoon } from "@/components/primitives/ComingSoon";

export default function AIAssistantPage() {
    return (
        <ComingSoon
            title="AI Assistant"
            description="AI-powered insights and recommendations for your security data. Available on the Pro plan."
            icon={Bot}
        />
    );
}
