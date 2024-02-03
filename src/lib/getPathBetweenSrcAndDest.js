import axiosInstance from "@/lib/axiosInstance";

export const getPathBetweenSrcAndDest = async (src, dest) => {
  try {
    const response = await axiosInstance.post("/directions", {
      src,
      dest,
    });
    return response.data;
  } catch (error) {
    console.error("[getPathBetweenOfficeAndHouse]", error);
    return { error: "An error occurred while fetching route information" };
  }
};
