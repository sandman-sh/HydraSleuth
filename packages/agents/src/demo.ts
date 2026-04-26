import { investigateCase } from "./index";

try {
  const report = await investigateCase({
    subject: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    targetKind: "token",
    investigationType: "Investigate possible wash trading",
    requesterLabel: "Local Demo",
    context: "Generated locally to prove the private multi-agent flow on devnet with a valid token mint.",
  });

  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(
    error instanceof Error
      ? `HydraSleuth demo could not complete the live investigation: ${error.message}`
      : "HydraSleuth demo could not complete the live investigation.",
  );
  process.exit(1);
}
