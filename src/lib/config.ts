const stripTrailingSlash = (url: string) => url.replace(/\/+$/, "");

export const config = {
  app: {
    miniAppUrl: stripTrailingSlash(
      process.env.NEXT_PUBLIC_MINI_APP_URL ??
        "https://qj7.github.io/hanoi_exchange"
    ),
    /** Display name for marketing copy / titles. */
    name: "Hanoi Exchange",
  },
} as const;
