/**
 * Tests unitaires pour la validation d'emails
 * 
 * Pour exécuter: npm run test
 */

import { describe, it, expect } from "vitest";
import { validateEmail, validateEmailList, detectPotentialBounces } from "../../supabase/functions/send-email/utils/email-validation.ts";

describe("Email Validation", () => {
  describe("validateEmail", () => {
    it("devrait valider un email valide", () => {
      const result = validateEmail("test@example.com");
      expect(result.valid).toBe(true);
      expect(result.normalizedEmail).toBe("test@example.com");
    });

    it("devrait normaliser l'email (minuscules, trim)", () => {
      const result = validateEmail("  TEST@EXAMPLE.COM  ");
      expect(result.valid).toBe(true);
      expect(result.normalizedEmail).toBe("test@example.com");
    });

    it("devrait rejeter un email sans @", () => {
      const result = validateEmail("testexample.com");
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Format");
    });

    it("devrait rejeter un email sans domaine", () => {
      const result = validateEmail("test@");
      expect(result.valid).toBe(false);
    });

    it("devrait rejeter un email trop long", () => {
      const longEmail = "a".repeat(250) + "@example.com";
      const result = validateEmail(longEmail);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("trop long");
    });

    it("devrait rejeter les emails jetables", () => {
      const result = validateEmail("test@10minutemail.com");
      expect(result.valid).toBe(false);
      expect(result.isDisposable).toBe(true);
      expect(result.reason).toContain("jetables");
    });

    it("devrait rejeter les emails avec caractères interdits", () => {
      const result = validateEmail("test<test>@example.com");
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Caractères interdits");
    });
  });

  describe("validateEmailList", () => {
    it("devrait valider une liste d'emails valides", () => {
      const emails = ["test1@example.com", "test2@example.com"];
      const result = validateEmailList(emails);
      expect(result.valid.length).toBe(2);
      expect(result.invalid.length).toBe(0);
    });

    it("devrait séparer les valides et invalides", () => {
      const emails = [
        "valid@example.com",
        "invalid-email",
        "another@example.com",
      ];
      const result = validateEmailList(emails);
      expect(result.valid.length).toBe(2);
      expect(result.invalid.length).toBe(1);
    });
  });

  describe("detectPotentialBounces", () => {
    it("devrait détecter les emails système", () => {
      const result = detectPotentialBounces("noreply@example.com");
      expect(result.likelyToBounce).toBe(true);
      expect(result.reason).toContain("système");
    });

    it("ne devrait pas détecter les emails normaux", () => {
      const result = detectPotentialBounces("user@example.com");
      expect(result.likelyToBounce).toBe(false);
    });

    it("devrait détecter les domaines de test", () => {
      const result = detectPotentialBounces("test@example.com");
      expect(result.likelyToBounce).toBe(true);
    });
  });
});

