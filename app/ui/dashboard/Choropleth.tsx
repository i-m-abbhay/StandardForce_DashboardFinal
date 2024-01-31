// export default MapChart;
"use client";
// https://github.com/CodingWith-Adam/geoJson-map-with-react-leaflet/blob/master/src/components/MyMap.jsx
import React, { useState, useEffect, ChangeEvent } from "react";
import {
  MapContainer,
  GeoJSON,
  TileLayer,
  GeoJSONProps,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import rawJapanMapData from "../../data/gadm41_JPN_1.json"; // Update this path
import L, { Layer } from "leaflet";
import postal_code from "japan-postal-code";
import { translateAndCapitalize } from "../../utils/choroplethUtils.js";

interface JapanGeoJSONFeatureProperties {
  GID_1: string;
  GID_0: string;
  COUNTRY: string;
  NAME_1: string;
  VARNAME_1: string;
  NL_NAME_1: string;
  TYPE_1: string;
  ENGTYPE_1: string;
  CC_1: string;
  HASC_1: string;
  ISO_1: string;
}

interface JapanGeoJSONGeometry {
  type: string;
  coordinates: number[][][] | number[][][][]; // Adjust based on the complexity of the coordinates
}

interface JapanGeoJSONFeature {
  type: "Feature";
  properties: JapanGeoJSONFeatureProperties;
  geometry: JapanGeoJSONGeometry;
}

interface JapanGeoJSON {
  type: "FeatureCollection";
  name: string;
  crs: {
    type: string;
    properties: { name: string };
  };
  features: JapanGeoJSONFeature[];
}

// If necessary, define a type for the properties of your GeoJSON features
type GeoJSONFeatureProperties = {
  NAME_1: string; // Adjust based on your GeoJSON properties
};

const SetView = ({
  center,
  zoom,
}: {
  center: L.LatLngExpression;
  zoom: number;
}) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
};

interface MyMapProps {
  dashboard: boolean;
  data: any;
}

interface Address {
  area: String;
  city: String;
  prefecture: String;
  street: String;
}

const Choropleth: React.FC<MyMapProps> = ({ dashboard, data }) => {
  const [color, setColor] = useState<string>("#ffff00");
  const [center, setCenter] = useState<L.LatLngExpression>([36.2048, 138.2529]);
  const [zoom, setZoom] = useState<number>(5);
  const [prefactureData, setPrefactureData] = useState<Object>({});
  const [totalNumberOfCustomers, setTotalNumberOfCustomers] =
    useState<Number>(0);

  const japanMapData = rawJapanMapData as JapanGeoJSON;
  const TotalCustomers = 100; // Example total
  console.log("choropleth zip code data: ", data);

  // const buildPrefactureData = () => {
  //   const prefData = {};
  //   for (let pref in data.zipCodeData) {
  //     let prefactureName = postal_code.get(pref, function (address) {
  //       translateAndCapitalize(address.prefecture, function (prefectureEn) {
  //         return prefectureEn;
  //       });
  //     });
  //     if (prefactureName in prefData) {
  //       prefData[prefactureName] += data.zipCodeData[pref];
  //     } else {
  //       prefData[prefactureName] = data.zipCodeData[pref];
  //     }
  //   }

  //   return prefData;
  // };

  useEffect(() => {
    const buildPrefectureData = async (rawData) => {
      const prefData = {};
      const zipCodes = Object.keys(rawData.zipCodes);
      console.log("zipcodes: ", zipCodes);
      // I think problem is here promises are not getting resolved or fullfilled
      await Promise.all(
        zipCodes.map(async (zipCode) => {
          try {
            const address: Address = await new Promise((resolve, reject) => {
              postal_code.get(zipCode, (data) => {
                if (data && data.prefecture) {
                  resolve(data);
                } else {
                  reject(new Error(`No data for zipCode: ${zipCode}`));
                }
              });
            });

            console.log("address: ", address);

            if (address && address.prefecture) {
              const prefectureEn = await translateAndCapitalize(
                address.prefecture
              );
              console.log("prefecture name: ", prefectureEn);
              prefData[prefectureEn] =
                (prefData[prefectureEn] || 0) + rawData.zipCodes[zipCode];
            }
          } catch (error) {
            console.error(`Error processing zip code ${zipCode}:`, error);
          }
        })
      );

      setPrefactureData(prefData);
      setTotalNumberOfCustomers(parseInt(rawData.totalNumberOfZipcodes, 10));
    };

    if (data && data.zipCodes) {
      buildPrefectureData(data)
        .then(() => {
          console.log("Prefecture data built successfully.", prefactureData);
        })
        .catch((error) => {
          console.error("Error building prefecture data:", error);
        });
    }
  }, [data, prefactureData]);

  const myRetrievedData = {
    // Example data
    Aichi: 20,
    Osaka: 20,
    Tokyo: 60,
    // ...
  };

  // Adjust the style based on the number of customers
  const getStyle = (feature: any): L.PathOptions => {
    // Assuming properties have the same structure as JapanGeoJSONFeatureProperties
    const properties = feature.properties as JapanGeoJSONFeatureProperties;

    if (properties && properties.NAME_1) {
      const regionName = properties.NAME_1;
      const numberOfCustomers = myRetrievedData[regionName] || 0;

      const fillOpacity = Math.min(numberOfCustomers / TotalCustomers, 1); // Ensuring opacity is between 0 and 1

      return {
        fillColor: "red",
        fillOpacity: fillOpacity,
        color: "black",
        weight: 2,
      };
    } else {
      // Default style if properties are not available
      return {
        fillColor: "red",
        fillOpacity: 0.5,
        color: "black",
        weight: 2,
      };
    }
  };

  const getNumberOfCustomers = (regionName: string) => {
    return myRetrievedData[regionName] || 0;
  };

  const onEachCountry = (
    country: GeoJSON.Feature<GeoJSON.Geometry, GeoJSONFeatureProperties>,
    layer: Layer
  ) => {
    const countryName = country.properties?.NAME_1; // Adjust based on Japan GeoJSON properties
    const numberOfCustomers = getNumberOfCustomers(countryName);
    const fillOpacity = Math.min(numberOfCustomers / TotalCustomers, 1);
    // if (myRetrievedData[countryName]) {
    //   console.log("no of customers: ", numberOfCustomers);
    //   console.log("region: ", countryName);
    // }
    // Bind tooltip
    if (countryName) {
      // console.log(
      //   `Processing: ${countryName}, Customers: ${numberOfCustomers}`
      // );
      layer.bindTooltip(
        `Region: ${countryName}<br>Customers: ${numberOfCustomers}`
      );
    }

    // Mouseover event
    layer.on("mouseover", (e) => {
      const layer = e.target;
      layer.setStyle({
        weight: 5, // Increase border weight
        fillOpacity: 1, // You can adjust opacity if needed
      });
    });

    // Mouseout event
    layer.on("mouseout", (e) => {
      const layer = e.target;
      layer.setStyle({
        weight: 2, // Reset border weight to original
        fillOpacity: fillOpacity, // Reset opacity to original
      });
    });
  };

  const colorChange = (event: ChangeEvent<HTMLInputElement>) => {
    setColor(event.target.value);
  };

  return (
    <div>
      {dashboard ? (
        <h1 style={{ textAlign: "center", marginTop: "1rem" }}>
          Customer Conventration in Regieon
        </h1>
      ) : (
        <></>
      )}

      <MapContainer
        style={{ height: "80vh", borderRadius: "20px" }}
        center={center}
        zoom={zoom}
      >
        <SetView center={center} zoom={zoom} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <GeoJSON
          style={getStyle}
          data={japanMapData}
          onEachFeature={onEachCountry as any} // Casting as any to avoid type mismatch
        />
      </MapContainer>
      {/* <input type="color" value={color} onChange={colorChange} /> */}
    </div>
  );
};

export default Choropleth;
