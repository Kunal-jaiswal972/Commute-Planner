import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  ZoomControl,
  Polyline,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { toast } from "react-hot-toast";

import { HouseIcon } from "../CustomMarker";
import DetailsCard from "../DetailsCard";

import { animationDuration, initialZoomLvl } from "@/constants/constants";

import InitialLoadLoader from "@/components/InitialLoadLoader";
import { CloseCircle, FarCircle, MiddleCircle } from "@/components/Circles";
import GeoEncodingComponent from "@/components/GeoEncodingComponent";

import { getPathBetweenSrcAndDest } from "@/lib/getPathBetweenSrcAndDest";
import { getHousesWithinRadius } from "@/lib/getHousesWithinRadius";
import { getIpLocation } from "@/lib/getIpLocation";

const openStreetMapUrl = import.meta.env.VITE_REACT_APP_OPENSTREET_MAP_URL;
const attribution = import.meta.env.VITE_REACT_APP_ATTRIBUTION;

if (!openStreetMapUrl || !attribution)
  throw new Error("ENV configuration failed!!!");

const MapComponent = () => {
  const mapRef = useRef();
  const [selectedLocation, setSelectedLocation] = useState({
    lat: null,
    lng: null,
  });

  const [houses, setHouses] = useState(null);

  const {
    data: initialLocation,
    isLoading,
    isError: isIpFetchingError,
  } = useQuery({
    queryKey: ["ipLocation"],
    queryFn: getIpLocation,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 12 * 60 * 60 * 60,
  });

  const routeMutation = useMutation({
    mutationFn: ({ src, dest }) => getPathBetweenSrcAndDest(src, dest),
  });
  const {
    data: routeData,
    isError: isRouteFetchingError,
    isPending,
  } = routeMutation;

  useEffect(() => {
    if (isIpFetchingError || isRouteFetchingError) {
      toast.error("An error occurred while fetching data");
    }
  }, [isIpFetchingError, isRouteFetchingError]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedLocation.lat && !selectedLocation.lng) return;
      const notification = toast.loading("Fetching Houses...");

      try {
        routeMutation.reset();
        const houseData = await getHousesWithinRadius(
          selectedLocation.lat,
          selectedLocation.lng,
          7500
        );
        setHouses(houseData);
        toast.success(`${houseData.length} Houses Found`, {
          id: notification,
        });
      } catch (error) {
        console.error("An error occurred: ", error);
        toast.error("An Error Occurred While Fetching!!", {
          id: notification,
        });
      }
    };

    fetchData();
  }, [selectedLocation.lat, selectedLocation.lng]);

  const handleGeocodeSelect = (event) => {
    if (!event || !event.center) return;

    const [lng, lat] = event.center;
    setSelectedLocation({
      lat,
      lng,
    });

    mapRef?.current?.flyTo([lat, lng], initialZoomLvl + 1, {
      duration: animationDuration,
    });
  };

  const handleMarkerClick = async (event) => {
    const { lat, lng } = event.latlng;
    const src = [selectedLocation.lat, selectedLocation.lng];
    const dest = [lat, lng];

    try {
      const notification = toast.loading("Fetching Houses...");
      await routeMutation.mutateAsync({ src, dest });
      toast.success("Route Successfully Fetched", { id: notification });
    } catch (error) {
      toast.error("An Error Occurred While Fetching!!", { id: "notification" });
      console.error(
        "An error occurred in [handlemarkerclick]",
        isRouteFetchingError
      );
    }
  };

  return (
    <div className="container">
      {isLoading ? (
        <InitialLoadLoader />
      ) : (
        <MapContainer
          center={[initialLocation.latitude, initialLocation.longitude]}
          zoom={initialZoomLvl}
          zoomControl={false}
          ref={mapRef}
        >
          <TileLayer url={openStreetMapUrl} attribution={attribution} />
          <ZoomControl position="topright" />

          <Marker
            position={[initialLocation.latitude, initialLocation.longitude]}
          >
            <Popup>
              {`${initialLocation?.city}, ${initialLocation?.region}, ${initialLocation?.country}`}
            </Popup>
          </Marker>

          {selectedLocation.lat && selectedLocation.lng && (
            <>
              <Marker
                position={[selectedLocation.lat, selectedLocation.lng]}
                title={selectedLocation.lat + ", " + selectedLocation.lng}
              />
              <CloseCircle center={selectedLocation} />
              <MiddleCircle center={selectedLocation} />
              <FarCircle center={selectedLocation} />
            </>
          )}

          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={150}
            spiderfyOnMaxZoom={false}
            disableClusteringAtZoom={17}
          >
            {houses &&
              houses.map(({ lat, lng }, index) => {
                return (
                  <Marker
                    key={index}
                    position={[lat, lng]}
                    title={lat + ", " + lng}
                    icon={HouseIcon}
                    eventHandlers={{
                      click: handleMarkerClick,
                    }}
                  />
                );
              })}
          </MarkerClusterGroup>

          {routeData && routeData?.geometry && (
            <>
              <Polyline
                positions={routeData.geometry.coordinates}
                pathOptions={{ color: "#00b0ff", weight: 5 }}
              />
              <Marker
                position={
                  routeData.geometry.coordinates[
                    routeData.geometry.coordinates.length - 1
                  ]
                }
                icon={HouseIcon}
              />
            </>
          )}

          <GeoEncodingComponent handleGeocodeSelect={handleGeocodeSelect} />
        </MapContainer>
      )}
    </div>
  );
};

export default MapComponent;
