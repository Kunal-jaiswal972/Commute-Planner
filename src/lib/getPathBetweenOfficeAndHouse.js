const getPathBetweenOfficeAndHouse = async (office, house) => {
  const [officeLat, officeLng] = office;
  const [houseLat, houseLng] = house;

  const stops = `${officeLat},${officeLng};${houseLat},${houseLng}`;
  const url = `https://trueway-directions2.p.rapidapi.com/FindDrivingRoute?stops=${stops}`;

  const options = {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": import.meta.env.VITE_REACT_APP_RAPIDAPI_KEY,
      "X-RapidAPI-Host": import.meta.env.VITE_REACT_APP_RAPIDAPI_HOST,
    },
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return result;
  } catch (error) {
    return { error: error.message };
  }
};

export default getPathBetweenOfficeAndHouse;
