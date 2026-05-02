# Location Info - Feature Documentation

## Overview
The Location Info feature allows students to scan QR codes to quickly find their current location in the university. When you click "Location Info" in the sidebar, a dialog opens where you can scan a QR code to see exactly where you are.

## Features

📍 **Simple Location Display**
- Scan a QR code to see your current location
- Clear display: "You are at: [Location Name]"
- Shows building and floor information
- One-click to scan another location

🎯 **Easy Access**
- Available in the student sidebar navbar as "Location Info" option
- Click the MapPin icon to open the scanner
- Works from any page in the student portal

## How to Use

### 1. Open Location Info
- Log in to the Student Portal
- In the left sidebar, click **"Location Info"** (with MapPin icon)
- A dialog will open

### 2. Scan a QR Code
- Click **"Scan QR Code"** button
- Point your camera at any university location QR code
- The scanner will automatically detect and process the code
- Your current location will be displayed

### 3. View Your Location
- See the location name in large, clear text
- Building and floor information (if available)
- Click **"Scan Another"** to scan a different location
- Close dialog when done

## Pre-configured Locations

The following university locations are available for QR code mapping:

| QR Code ID | Location | Building | Facilities |
|-----------|----------|----------|-----------|
| `qr-main-campus` | Main Campus Building | Building A | Main Office, Registration, Counseling |
| `qr-library` | Central Library | Building B | Study Areas, Computer Labs, Discussion Rooms |
| `qr-it-block` | IT Block | Building C | Computer Labs, Classrooms, Research Center |
| `qr-cafeteria` | Student Cafeteria | Building D | Food Court, Seating Area, Payment Counter |
| `qr-sports` | Sports Complex | Sports Wing | Basketball Court, Gym, Swimming Pool |
| `qr-hostel` | Student Hostel | Hostel Block | Rooms, Common Area, Laundry |

## Adding Custom Locations

To add new university locations:

1. Edit [src/constants/university-locations.ts](src/constants/university-locations.ts)
2. Add a new location object to the `UNIVERSITY_LOCATIONS` array:

```typescript
{
  id: "unique-location-id",
  name: "Location Name",
  description: "Location description",
  latitude: 30.7633,
  longitude: 76.7794,
  building: "Building Name",
  floor: "Floor Info",
  facilities: ["Facility 1", "Facility 2", "Facility 3"],
}
```

3. Map your QR code to this location in `QR_CODE_LOCATION_MAP`:

```typescript
export const QR_CODE_LOCATION_MAP: Record<string, string> = {
  "your-qr-code-id": "unique-location-id",
};
```

## Customization

### Change Button Appearance
Edit [src/components/portal/portal-nav.tsx](src/components/portal/portal-nav.tsx) to modify the "Location Info" button styling or icon.

### Change Scanner Speed
In [src/components/location-scanner.tsx](src/components/location-scanner.tsx), adjust the `fps` (frames per second):
```typescript
fps: 10, // Increase for faster scanning, decrease for better accuracy
```

### Change Scanner Box Size
```typescript
qrbox: { width: 250, height: 250 }, // Larger box = easier scanning
```

## Camera Permissions

On first use, you'll be prompted to allow camera access:
- **Mobile**: Grant camera permission in app settings
- **Desktop**: Grant camera access in browser permission popup
- **Browser**: Check your browser's site permissions for the domain

## Troubleshooting

### Camera Not Working
- Check browser permissions for camera access
- Ensure good lighting for QR code scanning
- Try disabling and re-enabling camera in browser settings

### QR Code Not Scanning
- Ensure QR code is clear and well-lit
- Try moving camera closer/farther from QR code
- Verify the QR code is properly mapped in `QR_CODE_LOCATION_MAP`

### Location Not Found
- Check that the location ID is correctly mapped in [src/constants/university-locations.ts](src/constants/university-locations.ts)
- Verify the location exists in the `UNIVERSITY_LOCATIONS` array

## Project Structure

```
src/
├── components/
│   ├── location-scanner.tsx         # Main scanner component
│   └── portal/
│       └── portal-nav.tsx           # Navbar with Location Info option
├── constants/
│   └── university-locations.ts      # Location data and mapping
└── app/
    └── student/
        └── dashboard/
            └── page.tsx
```

## Dependencies

- **html5-qrcode** (v2.3.8): QR code scanning library
- **@radix-ui**: UI components (Dialog, Button, Card)
- **lucide-react**: Icons (MapPin, Camera, etc.)

## Performance

- Dialog lazy-loads camera only when needed
- Camera scanner runs at 10 fps for balance between speed and accuracy
- Minimal performance impact on student portal

## Browser Compatibility

- ✅ Chrome/Edge (v90+)
- ✅ Firefox (v88+)
- ✅ Safari (v14+)
- ⚠️ Requires HTTPS or localhost (camera API requirement)

## Future Enhancements

Possible improvements:
- Voice guidance for camera alignment
- Batch QR code scanning
- Location search by name
- Campus map overlay
- Nearby locations recommendation
- History of scanned locations
