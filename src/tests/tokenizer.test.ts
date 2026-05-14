import { describe, expect, test } from "vitest";
import { normalizeText, tokenize } from "../core/tokenizer";

describe("tokenizer", () => {
  test("tokenizes English titles", () => {
    expect(tokenize("Chrome Extensions API Reference")).toEqual(expect.arrayContaining(["chrome", "extensions", "api", "reference"]));
  });

  test("tokenizes Chinese 2-gram and 3-gram text", () => {
    const tokens = tokenize("毕业论文答辩PPT模板");
    expect(tokens).toEqual(expect.arrayContaining(["毕业", "论文", "答辩", "ppt", "模板", "毕业论"]));
  });

  test("decodes URL text", () => {
    expect(normalizeText("%E6%AF%95%E4%B8%9A%E8%AE%BA%E6%96%87")).toContain("毕业论文");
  });

  test("filters stop words", () => {
    expect(tokenize("the official website for Chrome")).not.toContain("the");
  });

  test("deduplicates tokens", () => {
    expect(tokenize("react react React").filter((token) => token === "react")).toHaveLength(1);
  });
});
