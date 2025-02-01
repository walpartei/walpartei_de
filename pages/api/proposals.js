export default async function handler(req, res) {
  try {
    const response = await fetch("https://dip.bundestag.de/api/v1/vorgang?limit=10", {
      headers: { "Authorization": `Bearer ${process.env.DIP_API_KEY}` }
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch proposals" });
  }
}
