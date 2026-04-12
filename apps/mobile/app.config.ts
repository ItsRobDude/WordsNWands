import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Words 'n Wands!",
  slug: "words-n-wands",
  version: "0.0.0",
  orientation: "portrait",
  scheme: "words-n-wands",
  experiments: {
    typedRoutes: true,
  },
};

export default config;
