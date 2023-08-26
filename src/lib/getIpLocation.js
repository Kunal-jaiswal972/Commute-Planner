export const getIpLocation = async () => {
  const apiKey = import.meta.env.VITE_REACT_APP_MAPTILER_API_KEY;
  const response = await fetch(
    `https://api.maptiler.com/geolocation/ip.json?key=${apiKey}`
  );
  const location = await response.json();
  return location;
};

