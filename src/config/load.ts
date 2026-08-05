import appConfig from "../../data/app-config.json" with { type: "json" };
import { appConfigSchema } from "./schema.js";

export function loadAppConfig() {
  return appConfigSchema.parse(appConfig);
}
