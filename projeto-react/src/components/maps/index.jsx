import React, { useEffect, useRef } from 'react';


const Maps = () => {

    const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
    const mapRef = useRef();

    useEffect(() => {
        const loadGoogleMapScript = () => {
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=console.debug&libraries=maps,marker&v=beta`;
            script.defer = true;
            script.async = true;
            script.onload = () => initializeMap();
            document.body.appendChild(script);
        };

        const initializeMap = (coordinates) => {
            const pos = coordinates || {
              lat: 39.3999,
              lng: -8.2245, // Coordenadas para o centro de Portugal Continental
            };
          
            mapRef.current = new window.google.maps.Map(document.getElementById("googleMap"), {
              center: pos,
              zoom: 7, // Zoom ajustado para mostrar Portugal Continental
              mapTypeId: window.google.maps.MapTypeId.HYBRID
            });

            mapRef.current.addListener("click", handleClick);
          };

          const handleClick = (e) => {
    const marker = new window.google.maps.Marker({
        position: { lat: e.latLng.lat(), lng: e.latLng.lng() },
        map: mapRef.current,
    });

    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ location: marker.getPosition() }, (results, status) => {
        if (status === "OK") {
            if (results[0]) {
                const ConcelhoName = results[0].address_components.find(component => component.types.includes('administrative_area_level_2')).long_name;

                const infoWindow = new window.google.maps.InfoWindow({
                    content: 
                    `<div>
                        <p><span style="font-size: 14px; color: black;"><b>Coordenadas:</b></span> ${e.latLng.lat()}, ${e.latLng.lng()}</p>
                        <p><span style="font-size: 14px; color: black;"><b>Concelho:</b></span> ${ConcelhoName}</p>
                    </div>`,
                });

                infoWindow.open(mapRef.current, marker);
            } else {
                window.alert("No results found");
            }
        } else {
            window.alert("Geocoder failed due to: " + status);
        }
    });
};
     
        loadGoogleMapScript();

    }, []);

    return (
        <div className='text-2xl font-bold pt-14'>
            <div id="googleMap" style={{ width: '100%', height: '870px' }}></div>
        </div>
    );
};

export default Maps;