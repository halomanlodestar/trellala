export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { loadEnv, webEnvSchema } = await import("@trellala/core/env");
  loadEnv(webEnvSchema);
}
