const test = async () => {
  const res = await fetch("http://localhost:3000/api/cases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subject: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      investigationType: "wash-trading",
      targetKind: "token",
    }),
  });
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Body:", text);
};
test();
