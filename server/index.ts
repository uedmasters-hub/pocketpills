import "dotenv/config";
import { createAccessApp } from "./app.js";

const PORT = Number(process.env.ACCESS_API_PORT || 8787);
const app = createAccessApp();

app.listen(PORT, () => {
  console.log(`[access] API listening on http://localhost:${PORT}`);
});
