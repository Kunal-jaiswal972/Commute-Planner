import axiosInstance from "@/lib/axiosInstance";

export const getIpLocation = async () => {
  try {
    const response = await axiosInstance.get("/ip");
    return response.data;
  } catch (error) {
    console.error("[getIpLocation]", error);
    return { error: "An error occurred while fetching IP location" };
  }
};
