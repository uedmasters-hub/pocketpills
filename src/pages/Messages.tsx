import { CareChatWorkspace } from "@/components/CareChatWorkspace";

export function Messages() {
  return (
    <CareChatWorkspace
      side="patient"
      eyebrow="Messages"
      title="Your care team"
      subtitle="Message a pharmacist or clinician any day of the week — usually replies within a few hours."
    />
  );
}
