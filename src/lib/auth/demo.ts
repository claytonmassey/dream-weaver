/** Opt-in demo mode for local prototyping without auth friction. */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}
