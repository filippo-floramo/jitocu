import { describe, expect, it } from "bun:test";
import { ExitPromptError } from "@inquirer/core";
import { isCancellation, CANCELLED_EXIT_CODE } from "../src/errors/cancellation";
import { APIError, CLIError } from "../src/errors";

describe("isCancellation", () => {
   it("recognises the error @inquirer throws on Ctrl+C", () => {
      expect(isCancellation(new ExitPromptError("User force closed the prompt with SIGINT"))).toBe(true);
   });

   it("recognises a duplicate copy of the class by name", () => {
      // @inquirer/core can be installed more than once, so identity is not
      // guaranteed — only the name is.
      const duplicate = new Error("closed");
      duplicate.name = "ExitPromptError";
      expect(isCancellation(duplicate)).toBe(true);
   });

   it("recognises an aborted prompt", () => {
      const aborted = new Error("Prompt was aborted");
      aborted.name = "AbortPromptError";
      expect(isCancellation(aborted)).toBe(true);
   });

   it("leaves real failures alone", () => {
      expect(isCancellation(new CLIError("nope"))).toBe(false);
      expect(isCancellation(new APIError("nope"))).toBe(false);
      expect(isCancellation(new Error("nope"))).toBe(false);
      expect(isCancellation("nope")).toBe(false);
      expect(isCancellation(undefined)).toBe(false);
   });

   it("exits with the SIGINT convention", () => {
      expect(CANCELLED_EXIT_CODE).toBe(130);
   });
});
