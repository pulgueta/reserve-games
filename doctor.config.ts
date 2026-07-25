import type { ReactDoctorConfig } from "react-doctor/api";

export default {
  ignore: {
    files: ["node_modules", "convex/_generated", ".agents/**", ".claude/**"],
  },
} satisfies ReactDoctorConfig;
