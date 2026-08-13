import { CareChatWorkspace } from "@/components/CareChatWorkspace";

export function ProviderChat() {
  return (
    <CareChatWorkspace
      side="provider"
      eyebrow="Chat"
      title="Patient messages"
      subtitle="Same conversations patients see in Messages — reply here and it shows up on their side."
    />
  );
}
