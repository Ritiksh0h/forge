import app from "./app.js";
import { env } from "./config/env.js";

app.listen(env.PORT, () => {
  console.log(`FORGE API running on port ${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});
