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
import { GeocodingControl } from "@maptiler/geocoding-control/react";
import { InfinitySpin } from "react-loader-spinner";
import { toast } from "react-hot-toast";

import "@maptiler/geocoding-control/style.css";
import "./MapComponent.css";

import { closeOptions, middleOptions, farOptions } from "../Circles";
import { HouseIcon, MarkerIcon } from "../CustomMarker";
import constructAddress from "../../lib/constructAddress";
import getIpLocation from "../../lib/getIpLocation";
import getPathBetweenOfficeAndHouse from "../../lib/getPathBetweenOfficeAndHouse";
import { getHousesWithinRadius } from "../../lib/getHouses";
import MarkerClusterGroup from "react-leaflet-cluster";

const MapComponent = () => {
  const [mapCenter, setMapCenter] = useState({
    lat: -25,
    lng: 43,
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
  const [mapLoading, setMapLoading] = useState(true);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetcherror, setFetchError] = useState(true);
  const [path, setPath] = useState(null);
  const [houses, setHouses] = useState(null);

  const zoomLvl = 12;
  const animationDuration = 2;
  const radius = 5000;

  const mapref = useRef();

  useEffect(() => {
    const fetchIpDataAndSetMapCenter = async () => {
      try {
        setMapLoading(true);

        const { latitude, longitude, city, region, country } =
          await getIpLocation();
        setMapCenter({ lat: latitude, lng: longitude, city, region, country });

        mapref?.current?.flyTo([latitude, longitude], zoomLvl, {
          duration: animationDuration,
        });
      } catch (error) {
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
      try {
        setPath(null);
        setFetchLoading(true);
        const notification = toast.loading("Fetching Houses...");

        const houseData = await getHousesWithinRadius(
          selectedLocation.lat,
          selectedLocation.lng,
          radius
        );

        if (houseData.error) {
          setFetchError(true);
          toast.error("An Error Occurred While Fetching!!!", {
            id: notification,
          });
        } else {
          const formattedData = houseData.map(({ lat, lon, tags }) => [
            lat,
            lon,
            tags,
          ]);
          setHouses(formattedData);
          toast.success("Houses Successfully Fetched", {
            id: notification,
          });
        }
      } catch (error) {
        console.error("An error occurred:", error);
        toast.error("An Error Occurred While Fetching!!!", {
          id: notification,
        });
      } finally {
        setFetchError(false);
        setFetchLoading(false);
      }
    };

    fetchData();

    return () => {
      setFetchError(false);
      setFetchLoading(false);
    };
  }, [selectedLocation.lat, selectedLocation.lng, radius]);

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

    try {
      setPath(null);
      setFetchLoading(true);
      const notification = toast.loading("Fetching Route...");

      const routeData = await getPathBetweenOfficeAndHouse(office, house);
      if (routeData.error) {
        setFetchError(true);
        toast.error("An Error Occurred While Fetching!!!", {
          id: notification,
        });
      } else {
        setPath(routeData.route.geometry.coordinates);
        toast.success("Route Successfully Fetched", {
          id: notification,
        });
      }
    } catch (error) {
      console.error("An error occurred:", error);
      toast.error("An Error Occurred While Fetching!!!", {
        id: notification,
      });
    } finally {
      setFetchError(false);
      setFetchLoading(false);
    }
  };

  return (
    <div className="container">
      {mapLoading ? (
        <div className="loader">
          <InfinitySpin width="200" color="red" />
        </div>
      ) : (
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={zoomLvl}
          zoomControl={false}
          ref={mapref}
        >
          <TileLayer
            url={import.meta.env.VITE_REACT_APP_MAPTILER_DARK_MAP_URL}
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
                radius={4000}
              />
              <Circle
                center={selectedLocation}
                pathOptions={farOptions}
                radius={5000}
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
                pathOptions={{ color: "#197062", weight: 5 }}
              />
              <Marker position={path[path.length - 1]} icon={HouseIcon} />
            </>
          )}

          <Marker position={[mapCenter.lat, mapCenter.lng]}>
            <Popup>
              {mapCenter.city && `${mapCenter.city}, `}
              {mapCenter.region && `${mapCenter.region}, `}
              {mapCenter.country && `${mapCenter.country}`}
            </Popup>
          </Marker>
          <div className="geocoding">
            <GeocodingControl
              apiKey={import.meta.env.VITE_REACT_APP_MAPTILER_API_KEY}
              fuzzyMatch={true}
              debounceSearch={350}
              enableReverse={true}
              reverseActive={true}
              placeholder="Search Your Office..."
              onPick={handleGeocodeSelect}
            />
          </div>
        </MapContainer>
      )}
    </div>
  );
};

export default MapComponent;
