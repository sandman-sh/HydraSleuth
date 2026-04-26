const fetch = require("node-fetch");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

async function getModels() {
  const res = await fetch("https://api.tokenrouter.com/v1/models", {
    headers: {
      Authorization: `Bearer ${process.env.TOKENROUTER_API_KEY}`,
    },
  });
  const data = await res.json();
  console.log(JSON.stringify(data.data.map(m => m.id).slice(0, 50), null, 2));
}

getModels().catch(console.error);
