export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "url parameter required" });
  }

  // Only allow Google Calendar URLs
  if (!url.includes("calendar.google.com")) {
    return res.status(403).json({ error: "Only Google Calendar URLs are allowed" });
  }

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Timetable-ES/1.0" },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Upstream returned ${response.status}` });
    }

    const text = await response.text();

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    return res.status(200).send(text);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Fetch failed" });
  }
}
