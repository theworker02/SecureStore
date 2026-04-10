import { describe, expect, it } from "vitest";
import { shouldOfferClipboardSave } from "@/hooks/useClipboardWatcher";

describe("shouldOfferClipboardSave", () => {
  it("returns false when the watcher is disabled", () => {
    expect(shouldOfferClipboardSave(false, "Secret123!", null)).toBe(false);
  });

  it("returns false for short clipboard values", () => {
    expect(shouldOfferClipboardSave(true, "short", null)).toBe(false);
  });

  it("returns false for the same clipboard value twice", () => {
    expect(shouldOfferClipboardSave(true, "Secret123!", "Secret123!")).toBe(false);
  });

  it("returns true for a new clipboard candidate when enabled", () => {
    expect(shouldOfferClipboardSave(true, "Secret123!", null)).toBe(true);
  });
});
