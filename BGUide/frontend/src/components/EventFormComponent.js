import React, { useRef, useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinusCircle } from "@fortawesome/free-solid-svg-icons";
import "../css/NewEvent.css"; // Import the CSS file
import L from "leaflet";
import useDebounce from "../hooks/useDebounce";
import axios from "axios";

export default function EventFormComponent({ initialData = {}, onSubmit, creatorId }) {
  const [coordinates, setCoordinates] = useState({
    lat: initialData.location?.latitude || 31.25181,
    lng: initialData.location?.longitude || 34.7913,
  });
  const [showMap, setShowMap] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [lineup, setLineup] = useState(initialData.lineup || [""]);
  const [startDate, setStartDate] = useState(
    initialData.startDate ? new Date(initialData.startDate) : null
  );
  const [endDate, setEndDate] = useState(
    initialData.endDate ? new Date(initialData.endDate) : null
  );
  const [paymentLinks, setPaymentLinks] = useState(
    initialData.paymentLinks || [""]
  );
  const [description, setDescription] = useState(initialData.description || "");
  const nameRef = useRef();
  const isPrivateRef = useRef();
  const [locationName, setLocationName] = useState(initialData.location?.name || "");
  const debouncedSearchValue = useDebounce(locationName, 500);
  const [isDropdown, setIsDropdown] = useState(false);
  const [possibleLocations, setPossibleLocations] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [locationErrorMessage, setLocationErrorMessage] = useState("");

  useEffect(() => {
    if (initialData.location) {
      setCoordinates({
        lat: initialData.location.latitude,
        lng: initialData.location.longitude,
      });
      setLocationName(initialData.location.name);
    }
    if (initialData.name) {
      nameRef.current.value = initialData.name;
    }
    if (initialData.isPrivate) {
      isPrivateRef.current.checked = initialData.isPrivate;
    }
  }, [initialData]);

  useEffect(() => {
    const getPossibleLocations = async () => {
      const data = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${debouncedSearchValue
          .split(" ")
          .join("%20")}&format=json`
      );

      setPossibleLocations(
        data.data.map(({ display_name, boundingbox }) => ({
          name: display_name,
          latitude:
            (parseFloat(boundingbox[0]) + parseFloat(boundingbox[1])) / 2,
          longitude:
            (parseFloat(boundingbox[2]) + parseFloat(boundingbox[3])) / 2,
        }))
      );
    };
    getPossibleLocations();
  }, [debouncedSearchValue]);

  const handleMapClick = async (e) => {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    setCoordinates({ lat, lng });

    // Fetch the address using Nominatim API
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`
      );
      const data = await response.json();
      if (data && data.address) {
        setLocationName(data.display_name);
        setPossibleLocations([]);
        setLocationErrorMessage("");
      } else {
        setLocationName("noAddress");
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      setLocationName("noAddress");
    }
  };

  const LocationMarker = () => {
    useMapEvents({
      click: handleMapClick,
    });
    return coordinates.lat && coordinates.lng ? (
      <Marker
        position={[coordinates.lat, coordinates.lng]}
        icon={L.icon({
          iconUrl: "./PinPoint.png",
          iconSize: [20, 30],
          shadowSize: [50, 64],
          iconAnchor: [12, 36],
          shadowAnchor: [4, 62],
          popupAnchor: [-3, -76],
        })}
      />
    ) : null;
  };

  const validateDates = () => {
    const currentDate = new Date();
    if (startDate && startDate < currentDate) {
      setWarningMessage("Start date cannot be in the past.");
      return false;
    }
    if (startDate && endDate && endDate <= startDate) {
      setWarningMessage("End date must be after the start date.");
      return false;
    }
    setWarningMessage("");
    return true;
  };

  const validateLocation = () => {
    if (locationName === "") {
      setLocationErrorMessage("Please select a location from the suggestions.");
      return false;
    }
    setLocationErrorMessage("");
    return true;
  };

  const handleSubmitFormData = async (e) => {
    e.preventDefault();

    if (!validateDates() || !validateLocation()) {
      setErrorMessage("Please correct the errors before submitting.");
      return;
    }

    const formData = new FormData();
    formData.append("name", nameRef.current.value);
    formData.append("isPrivate", isPrivateRef.current.checked);
    formData.append("startDate", startDate.toISOString());
    formData.append("endDate", endDate.toISOString());
    formData.append("description", description);
    formData.append(
      "location",
      JSON.stringify({
        name: locationName,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
      })
    );
    formData.append("lineup", JSON.stringify(lineup));
    formData.append("paymentLinks", JSON.stringify(paymentLinks));
    if (file) {
      formData.append("photo", file);
    }
    formData.append("creatorId", creatorId);

    await onSubmit(formData);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleLineupChange = (index, value) => {
    const newLineup = [...lineup];
    newLineup[index] = value;
    setLineup(newLineup);
  };

  const handleAddLineup = () => {
    setLineup([...lineup, ""]);
  };

  const handleRemoveLineup = (index) => {
    const newLineup = lineup.filter((_, i) => i !== index);
    setLineup(newLineup);
  };

  const handlePaymentLinkChange = (index, value) => {
    const newPaymentLinks = [...paymentLinks];
    newPaymentLinks[index] = value;
    setPaymentLinks(newPaymentLinks);
  };

  const handleAddPaymentLink = () => {
    setPaymentLinks([...paymentLinks, ""]);
  };

  const handleRemovePaymentLink = (index) => {
    const newPaymentLinks = paymentLinks.filter((_, i) => i !== index);
    setPaymentLinks(newPaymentLinks);
  };

  const handleDescriptionChange = (value) => {
    setDescription(value);
  };

  return (
    <form className="event-form" onSubmit={handleSubmitFormData}>
      <div className="form-group">
        <label>Name</label>
        <input
          type="text"
          required
          ref={nameRef}
          defaultValue={initialData.name || ""}
        />
      </div>
      <div className="form-group">
        <label>Private</label>
        <input
          type="checkbox"
          ref={isPrivateRef}
          defaultChecked={initialData.isPrivate || false}
        />
      </div>
      <div className="form-group">
        <label>Start Date and Time</label>
        <DatePicker
          selected={startDate}
          onChange={(date) => {
            setStartDate(date);
            validateDates();
          }}
          showTimeSelect
          dateFormat="Pp"
          required
        />
        {warningMessage && startDate && (
          <p className="warning-message">{warningMessage}</p>
        )}
      </div>
      <div className="form-group">
        <label>End Date and Time</label>
        <DatePicker
          selected={endDate}
          onChange={(date) => {
            setEndDate(date);
            validateDates();
          }}
          showTimeSelect
          dateFormat="Pp"
          required
        />
        {warningMessage && endDate && (
          <p className="warning-message">{warningMessage}</p>
        )}
      </div>
      <input type="file" onChange={handleFileChange} />
      {preview && <img src={preview} alt="Preview" />}
      <div className="form-group">
        <label>Location Name</label>
        {locationErrorMessage && (
          <p className="error-message">{locationErrorMessage}</p>
        )}
        <input
          type="text"
          id="location-input"
          onChange={async (e) => {
            setLocationName(e.target.value);
            if (e.target.value === "") {
              setIsDropdown(false);
              return;
            }
            setIsDropdown(true);
          }}
          value={locationName}
          onBlur={validateLocation}
        />
        {isDropdown && (
          <div id="location-dropdown">
            {possibleLocations.length > 0 &&
              possibleLocations.map(({ name, latitude, longitude }, i) => (
                <p
                  onClick={() => {
                    setIsDropdown(false);
                    setLocationName(name);
                    setCoordinates({ lat: latitude, lng: longitude });
                    setPossibleLocations([]);
                    setLocationErrorMessage("");
                  }}
                  key={i}
                >
                  {name}
                </p>
              ))}
          </div>
        )}
      </div>
      <div className="form-group">
        <button type="button" onClick={() => setShowMap(!showMap)}>
          {showMap ? "Hide Map" : "Choose in Map"}
        </button>
      </div>
      {showMap && (
        <div className="form-group">
          <label>Pick Location on Map</label>
          <MapContainer
            key={JSON.stringify(coordinates)}
            center={[coordinates.lat, coordinates.lng]}
            zoom={13}
            style={{ height: "300px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <LocationMarker />
          </MapContainer>
        </div>
      )}
      <div className="form-group">
        <label>Lineup</label>
        {lineup.map((artist, index) => (
          <div key={index} className="lineup-item">
            <input
              type="text"
              value={artist}
              onChange={(e) => handleLineupChange(index, e.target.value)}
              required
            />
            {index > 0 && (
              <button
                type="button"
                onClick={() => handleRemoveLineup(index)}
                className="remove-artist-btn"
              >
                <FontAwesomeIcon icon={faMinusCircle} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddLineup}
          className="add-artist-btn"
        >
          Add Artist
        </button>
      </div>
      <div className="form-group">
        <label>Payment Links</label>
        {paymentLinks.map((link, index) => (
          <div key={index} className="payment-link-item">
            <input
              type="text"
              value={link}
              onChange={(e) => handlePaymentLinkChange(index, e.target.value)}
              required
            />
            {index > 0 && (
              <button
                type="button"
                onClick={() => handleRemovePaymentLink(index)}
                className="remove-payment-link-btn"
              >
                <FontAwesomeIcon icon={faMinusCircle} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddPaymentLink}
          className="add-payment-link-btn"
        >
          Add Payment Link
        </button>
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea
          className="description-item"
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          required
        />
        </div>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <button type="submit">Submit</button>
    </form>
  );
}
