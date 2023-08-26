export async function getHousesWithinRadius(lat, lon, radius) {
  const overpassUrl = `https://overpass-api.de/api/interpreter`;
  const query = `[out:json][timeout:25];(node(around:${radius},${lat},${lon})["building"];);out;`;

  try {
    const response = await fetch(overpassUrl, {
      method: "POST",
      body: query,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const data = await response.json();
    return data.elements;
  } catch (error) {
    return { error: error.message };
  }
}
