export type CampusLocationPreset = {
  name: string;
  building: string;
  floor: string;
  latitude: number;
  longitude: number;
  address?: string;
  mapsQuery?: string;
  confidence?: "official-address" | "map-listing" | "approximate";
};

const CU_UP_ADDRESS =
  "Chandigarh University, Lucknow - Kanpur Highway - 27, Unnao, Uttar Pradesh, India";

// Address is from culko.in footer/contact section. Coords are currently approximate around
// the listed campus area and should be replaced with exact surveyed campus points when available.
export const campusLocationPresets: CampusLocationPreset[] = [
  {
    name: "Main Entry Gate",
    building: "Entry Zone",
    floor: "Ground",
    latitude: 26.8432,
    longitude: 80.9491,
    address: CU_UP_ADDRESS,
    mapsQuery: "Chandigarh University Lucknow Uttar Pradesh",
    confidence: "map-listing",
  },
  {
    name: "Academic Block A",
    building: "Academic Zone",
    floor: "Ground",
    latitude: 26.8438,
    longitude: 80.9502,
    address: CU_UP_ADDRESS,
    mapsQuery: "Chandigarh University Academic Block A",
    confidence: "approximate",
  },
  {
    name: "Academic Block B",
    building: "Academic Zone",
    floor: "Ground",
    latitude: 26.8442,
    longitude: 80.9507,
    address: CU_UP_ADDRESS,
    mapsQuery: "Chandigarh University Academic Block B",
    confidence: "approximate",
  },
  {
    name: "Central Library",
    building: "Library",
    floor: "First",
    latitude: 26.8441,
    longitude: 80.9512,
    address: CU_UP_ADDRESS,
    mapsQuery: "Chandigarh University Central Library",
    confidence: "approximate",
  },
  {
    name: "Innovation Lab",
    building: "Tech Lab",
    floor: "Second",
    latitude: 26.8436,
    longitude: 80.9515,
    address: CU_UP_ADDRESS,
    mapsQuery: "Chandigarh University Innovation Lab",
    confidence: "approximate",
  },
  {
    name: "Student Cafeteria",
    building: "Food Court",
    floor: "Ground",
    latitude: 26.8446,
    longitude: 80.9498,
    address: CU_UP_ADDRESS,
    mapsQuery: "Chandigarh University Cafeteria",
    confidence: "approximate",
  },
  {
    name: "Sports Arena",
    building: "Sports Complex",
    floor: "Ground",
    latitude: 26.8429,
    longitude: 80.9509,
    address: CU_UP_ADDRESS,
    mapsQuery: "Chandigarh University Sports Complex",
    confidence: "approximate",
  },
  {
    name: "Admin Block",
    building: "Administration",
    floor: "Ground",
    latitude: 26.8439,
    longitude: 80.9519,
    address: CU_UP_ADDRESS,
    mapsQuery: "Chandigarh University Admin Block",
    confidence: "approximate",
  },
];
