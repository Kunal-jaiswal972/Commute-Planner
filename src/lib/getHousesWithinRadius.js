import axiosInstance from "@/lib/axiosInstance";

export const getHousesWithinRadius = async (latitude, longitude, radius) => {
  try {
    const response = await axiosInstance.post("/getDummyHouses", {
      latitude,
      longitude,
      radius,
    });
    return response.data;
  } catch (error) {
    console.error("[getHousesWithinRadius]", error);
    return { error: "An error occurred while fetching house information" };
  }
};
