/**
 * Read-only mic permission check — never opens the microphone.
 *
 * Shared by both speech hooks (native browser engine and the on-device
 * Whisper fallback) so permission-denied fails fast with a friendly message
 * before either one touches hardware.
 */
export async function isMicExplicitlyDenied(): Promise<boolean> {
  try {
    if (!navigator.permissions?.query) return false;
    // Not all browsers support "microphone" as a query name (notably
    // Firefox); an unsupported name throws, which the catch treats as
    // "unknown" rather than "denied".
    const status = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });
    return status.state === "denied";
  } catch {
    return false;
  }
}

