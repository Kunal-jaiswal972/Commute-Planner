import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  Circle,
  Polyline,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { GeocodingControl } from "@maptiler/geocoding-control/react";
import { InfinitySpin } from "react-loader-spinner";
import { toast } from "react-hot-toast";

import "@maptiler/geocoding-control/style.css";
import "./MapComponent.css";

import { closeOptions, middleOptions, farOptions } from "../Circles";
import { HouseIcon, MarkerIcon } from "../CustomMarker";
import * as libFunctions from "../../lib";
import DetailsCard from "../DetailsCard";

const {
  constructAddress,
  getIpLocation,
  getPathBetweenOfficeAndHouse,
  getHousesWithinRadius,
} = libFunctions;

const MapComponent = () => {
  const [mapCenter, setMapCenter] = useState({
    lat: 30,
    lng: 55,
    city: null,
    region: null,
    country: null,
  });
  const [selectedLocation, setSelectedLocation] = useState({
    lat: null,
    lng: null,
    place_name_en: "",
    place_name: "",
    loaded: false,
  });

  const [status, setStatus] = useState(true);
  const [mapLoading, setMapLoading] = useState(false);
  const [houses, setHouses] = useState(null);
  const [path, setPath] = useState(null);
  const [pathInfo, setPathInfo] = useState(null);

  const zoomLvl = 12;
  const animationDuration = 2;
  const radius = 7500;

  const mapref = useRef();

  useEffect(() => {
    function changeStatus() {
      const onlineStatus = navigator.onLine;
      setStatus(onlineStatus);

      if (onlineStatus) {
        toast.success("You Are Online");
      } else {
        toast.error("You Are Offline");
      }
    }

    window.addEventListener("online", changeStatus);
    window.addEventListener("offline", changeStatus);

    return () => {
      window.removeEventListener("online", changeStatus);
      window.removeEventListener("offline", changeStatus);
    };
  }, [status]);

  useEffect(() => {
    const fetchIpDataAndSetMapCenter = async () => {
      try {
        setMapLoading(true);

        const { latitude, longitude, city, region, country } =
          await getIpLocation();
        setMapCenter({ lat: latitude, lng: longitude, city, region, country });
        setSelectedLocation((prev) => ({
          ...prev,
          lat: latitude,
          lng: longitude,
          loaded: true,
        }));

        mapref?.current?.flyTo([latitude, longitude], zoomLvl, {
          duration: animationDuration,
        });
      } catch (error) {
        toast.error("An error occurred while fetching your location");
        console.error("An error occurred while fetching IP data:", error);
      } finally {
        setMapLoading(false);
      }
    };

    fetchIpDataAndSetMapCenter();

    return () => {
      setMapLoading(false);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedLocation.lat && !selectedLocation.lng) return;
      const notification = toast.loading("Fetching Houses...");

      try {
        setPath(null);
        const houseData = await getHousesWithinRadius(
          selectedLocation.lat,
          selectedLocation.lng,
          radius
        );
        const formattedData = houseData.map(({ lat, lon, tags }) => [
          lat,
          lon,
          tags,
        ]);
        setHouses(formattedData);
        toast.success(`${formattedData.length} Houses Found`, {
          id: notification,
        });
      } catch (error) {
        console.error("An error occurred:", error);
        toast.error("An Error Occurred While Fetching!!!", {
          id: notification,
        });
      }
    };

    fetchData();
  }, [selectedLocation.lat, selectedLocation.lng]);

  const handleGeocodeSelect = (event) => {
    if (!event) return;

    const { center, place_name_en, place_name } = event;

    if (center) {
      const [lng, lat] = center;
      setSelectedLocation({
        lat,
        lng,
        place_name_en,
        place_name,
        loaded: true,
      });

      const newZoomLevel = zoomLvl + 1;
      const flyOptions = {
        duration: animationDuration,
      };

      mapref?.current?.flyTo([lat, lng], newZoomLevel, flyOptions);
    }
  };

  const handleMarkerClick = async (event) => {
    const { lat, lng } = event.latlng;
    const office = [selectedLocation.lat, selectedLocation.lng];
    const house = [lat, lng];

    const notification = toast.loading("Fetching Route...");

    try {
      setPath(null);
      setPathInfo(null);
      const routeData = await getPathBetweenOfficeAndHouse(office, house);

      setPath(routeData.route.geometry.coordinates);
      setPathInfo(routeData.route);
      toast.success("Route Successfully Fetched", {
        id: notification,
      });
    } catch (error) {
      console.error("An error occurred:", error);
      toast.error("An Error Occurred While Fetching!!!", {
        id: notification,
      });
    }
  };

  return (
    <div className="container">
      {mapLoading ? (
        <div className="loader">
          <InfinitySpin width="200" color="red" />
          <div>Loading Map...</div>
          <div>Please Wait...</div>
        </div>
      ) : (
        <>
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={zoomLvl}
            zoomControl={false}
            ref={mapref}
          >
            <TileLayer
              url={import.meta.env.VITE_REACT_APP_OPENSTREET_MAP_URL}
              attribution={import.meta.env.VITE_REACT_APP_ATTRIBUTION}
            />
            <ZoomControl position="topright" />

            {selectedLocation.loaded && (
              <>
                <Marker
                  position={[selectedLocation.lat, selectedLocation.lng]}
                  title={selectedLocation.lat + ", " + selectedLocation.lng}
                >
                  <Popup>
                    {selectedLocation.place_name_en ||
                      selectedLocation.place_name}
                  </Popup>
                </Marker>
                <Circle
                  center={selectedLocation}
                  pathOptions={closeOptions}
                  radius={2500}
                />
                <Circle
                  center={selectedLocation}
                  pathOptions={middleOptions}
                  radius={5000}
                />
                <Circle
                  center={selectedLocation}
                  pathOptions={farOptions}
                  radius={7500}
                />
              </>
            )}

            <MarkerClusterGroup
              chunkedLoading
              maxClusterRadius={150}
              spiderfyOnMaxZoom={false}
              disableClusteringAtZoom={17}
            >
              {houses &&
                houses.map((house, index) => {
                  const lat = house[0];
                  const lng = house[1];
                  const tags = house[2];
                  const address = constructAddress(tags);

                  if (lat !== undefined && lng !== undefined) {
                    return (
                      <Marker
                        key={index}
                        position={[lat, lng]}
                        title={lat + ", " + lng}
                        icon={HouseIcon}
                        eventHandlers={{
                          click: handleMarkerClick,
                        }}
                      >
                        <Popup>
                          <div>{address[0]}</div>
                          <div>{address[1]}</div>
                          <div>{address[2]}</div>
                        </Popup>
                      </Marker>
                    );
                  }
                  return null;
                })}
            </MarkerClusterGroup>

            {path && (
              <>
                <Polyline
                  positions={path}
                  pathOptions={{ color: "#00b0ff", weight: 5 }}
                />
                <Marker position={path[path.length - 1]} icon={HouseIcon} />
                <DetailsCard pathInfo={pathInfo} />
              </>
            )}

            <Marker position={[mapCenter.lat, mapCenter.lng]}>
              <Popup>
                {mapCenter.city && `${mapCenter.city}, `}
                {mapCenter.region && `${mapCenter.region}, `}
                {mapCenter.country && `${mapCenter.country}`}
              </Popup>
            </Marker>
          </MapContainer>
          <div className="geocoding">
            <GeocodingControl
              apiKey={import.meta.env.VITE_REACT_APP_MAPTILER_API_KEY}
              fuzzyMatch={true}
              debounceSearch={350}
              placeholder="Search Your Office..."
              onPick={handleGeocodeSelect}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default MapComponent;
