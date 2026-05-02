export interface UniversityLocation {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  building?: string;
  floor?: string;
  facilities?: string[];
}

export const UNIVERSITY_LOCATIONS: UniversityLocation[] = [
  {
    id: "main-campus",
    name: "Main Campus Building",
    description: "Central administrative building of Chandigarh University",
    latitude: 30.7633,
    longitude: 76.7794,
    building: "Building A",
    floor: "Ground",
    facilities: ["Main Office", "Registration", "Counseling"],
  },
  {
    id: "library",
    name: "Central Library",
    description: "Multi-story library with extensive book and digital collection",
    latitude: 30.7635,
    longitude: 76.7796,
    building: "Building B",
    floor: "1-5",
    facilities: ["Study Areas", "Computer Labs", "Discussion Rooms"],
  },
  {
    id: "it-block",
    name: "IT Block",
    description: "Information Technology department and labs",
    latitude: 30.7637,
    longitude: 76.7798,
    building: "Building C",
    floor: "1-4",
    facilities: ["Computer Labs", "Classrooms", "Research Center"],
  },
  {
    id: "cafeteria",
    name: "Student Cafeteria",
    description: "Main dining facility for students and staff",
    latitude: 30.764,
    longitude: 76.7802,
    building: "Building D",
    floor: "Ground",
    facilities: ["Food Court", "Seating Area", "Payment Counter"],
  },
  {
    id: "sports",
    name: "Sports Complex",
    description: "Athletics and sports facilities",
    latitude: 30.7642,
    longitude: 76.7804,
    building: "Sports Wing",
    floor: "Ground",
    facilities: ["Basketball Court", "Gym", "Swimming Pool"],
  },
  {
    id: "hostel",
    name: "Student Hostel",
    description: "Residential accommodation for students",
    latitude: 30.7645,
    longitude: 76.7807,
    building: "Hostel Block",
    facilities: ["Rooms", "Common Area", "Laundry"],
  },
];

// Map location IDs to their data - can be updated with real QR code mappings
export const QR_CODE_LOCATION_MAP: Record<string, string> = {
  "qr-main-campus": "main-campus",
  "qr-library": "library",
  "qr-it-block": "it-block",
  "qr-cafeteria": "cafeteria",
  "qr-sports": "sports",
  "qr-hostel": "hostel",
};

export function getLocationById(id: string): UniversityLocation | undefined {
  return UNIVERSITY_LOCATIONS.find((loc) => loc.id === id);
}
