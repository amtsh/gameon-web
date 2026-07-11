import { afterEach, describe, expect, it } from "vitest";
import { getSupabaseKey, getSupabaseUrl, hasSupabaseEnv } from "./env";

describe("hasSupabaseEnv", () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
  });

  it("is true when url and publishable key are set", () => {
    process.env = {
      ...env,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "pk_test",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
    };
    expect(hasSupabaseEnv()).toBe(true);
  });

  it("accepts the legacy anon key name", () => {
    process.env = {
      ...env,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon_test",
    };
    expect(hasSupabaseEnv()).toBe(true);
  });

  it("is false when either value is missing", () => {
    process.env = {
      ...env,
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "pk_test",
    };
    expect(hasSupabaseEnv()).toBe(false);
  });
});

describe("getSupabaseUrl", () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
  });

  it("throws when the url is missing", () => {
    process.env = { ...env, NEXT_PUBLIC_SUPABASE_URL: "" };
    expect(() => getSupabaseUrl()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});

describe("getSupabaseKey", () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
  });

  it("throws when no key is configured", () => {
    process.env = {
      ...env,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    };
    expect(() => getSupabaseKey()).toThrow(/PUBLISHABLE_KEY/);
  });
});
