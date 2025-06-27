import L from 'leaflet';

const redPin = new L.Icon({
  iconUrl: '/red-pin.svg',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
  tooltipAnchor: [16, -16],
  shadowUrl: undefined,
  shadowSize: undefined,
  shadowAnchor: undefined,
  className: ''
});

export default redPin;
