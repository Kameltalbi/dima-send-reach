/**
 * Configuration globale pour les tests
 */
import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Étendre les matchers de Vitest avec ceux de Testing Library
expect.extend(matchers);

// Nettoyer après chaque test
afterEach(() => {
  cleanup();
});

