import "mapa-gcba/dist/assets/css/main.css";
import MapaInteractivo from "mapa-gcba/dist/models/MapaInteractivo";
import autoComplete from "@tarekraafat/autocomplete.js";
import { getAutocompleter } from 'autocompleter-caba/dist/src/utils/autocompleterSingleton.js';
import dotenv from 'dotenv';
dotenv.config();

const interactiveMap = new MapaInteractivo("mapa");
const switchPlaces = document.querySelector("#switchPlaces");
const clientId = process.env.CLIENT_ID_PROD;
const clientSecret = process.env.CLIENT_SECRET_PROD;
const apiBaseUrl = process.env.PROD;

/* Obtención de coordenadas */
async function handleClick(e) {
  const { lat, lng } = e.latlng;
  if (!switchPlaces.checked) interactiveMap.map.flyTo({ lat, lng }, 16);
  interactiveMap.reverseGeocoding(e);
}

/* Función para mostrar lugares */
function handleChangeSwitchPlaces(e) {
  if (e.target.checked) {
    interactiveMap.setReverseOptions({
      active: true,
      type: "places",
      radius: 1000,
    });
  } else {
    interactiveMap.setReverseOptions({
      active: true,
      type: "address",
      radius: 0,
    });
  }
}

interactiveMap.map.addEventListener("click", (e) => handleClick(e));
switchPlaces.addEventListener("change", handleChangeSwitchPlaces);

const autocompleter = getAutocompleter();
autocompleter.setCredentials(clientId, clientSecret);
autocompleter.setApiBaseUrl(apiBaseUrl)
autocompleter.setGeocodingMethod("geocodificacion_directa");

/* Opciones de metodos de geocodificación */
// autocompleter.setGeocodingMethod("geocodificacion_directa");
// autocompleter.setGeocodingMethod("interpolacion_entre_puertas");
// autocompleter.setGeocodingMethod("interseccion_calles");
// autocompleter.setGeocodingMethod("interpolacion_eje");
// autocompleter.setGeocodingMethod("direccion_atipica");


const autoCompleteJS = new autoComplete({
  selector: "#autoComplete",
  placeHolder: "Buscar una dirección",
  debounce: 500,
  threshold: 3,
  submit: true,
  searchEngine: (_, record) => record,
  data: {
    src: async (query) => {
      try {
        // Fetch Data from external Source
        const res = await autocompleter.getSuggestions(query);
        return res.filter((data) => !data.error);
      } catch (error) {
        console.log({ error });
      }
    },
    keys: ["value"],
  },
  resultsList: {
    maxResults: undefined,
    elemnt: (list, data) => {
      console.log({ list, data });
      if (!data.results.length) {
        // Create "No Results" message element
        const message = document.createElement("div");
        // Add class to the created element
        message.setAttribute("class", "no_result");
        // Add message text content
        message.innerHTML = `<span>Found No Results for "${data.query}"</span>`;
        // Append message element to the results list
        list.prepend(message);
      }
    },
    noResults: true,
  },
  resultItem: {
    highlight: true,
  },
  events: {
    input: {
      selection: (event) => {
        const direccion = event.detail.selection.value.value;
        autoCompleteJS.input.value = direccion;
        console.log("direccion " + direccion);
        autocompleter
          .getSearch(direccion)
          .then((resultados) => {
            if (resultados.status_code !== 200) {
              console.log(resultados.status_code);
              return Promise.reject(resultados.error);
            }

            console.log(resultados.data);

            if (
              resultados.data.coordenadas?.x &&
              resultados.data.coordenadas?.y
            ) {
              interactiveMap.setMarkerView(
                resultados.data.coordenadas.y,
                resultados.data.coordenadas.x
              );
              return;
            }
            interactiveMap.setMarkerView(
              resultados.data.coordenada_y,
              resultados.data.coordenada_x,
            );
          })
          .catch((error) => {
            console.log(error);
          });
      },
    },
  },
});