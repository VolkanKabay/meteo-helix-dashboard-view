import { Location } from '../components/LocationSelector';

export const locations: Location[] = [
  {
    id: 'kaiserplatz',
    name: 'Kaiserplatz',
    deviceId: 'c055eef5-b6dc-406e-ad5a-65dec60db90e',
    coordinates: {
      lat: 49.010414,
      lon: 8.388769
    },
    description: 'Leuchtstellennummer 56099 - Zentrum Karlsruhe'
  },
  {
    id: 'albtalbahnhof',
    name: 'Albtalbahnhof',
    deviceId: '7ceb0590-e2f0-4f9e-a3dc-5257a4729f57',
    coordinates: {
      lat: 48.992736,
      lon: 8.395454
    },
    description: 'Leuchtstellennummer 17968 - Südstadt Karlsruhe'
  }
];

export const getDefaultLocation = (): Location => {
  return locations[0]; // Kaiserplatz as default
};

export const getLocationById = (id: string): Location | undefined => {
  return locations.find(location => location.id === id);
};

export const getLocationByDeviceId = (deviceId: string): Location | undefined => {
  return locations.find(location => location.deviceId === deviceId);
}; 