"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";
import {
  LocateFixed,
  MapPinned,
  Navigation,
  QrCode,
  ScanLine,
  Upload,
} from "lucide-react";
import QRCode from "qrcode";
import { PortalNav } from "@/components/portal/portal-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { campusLocationPresets } from "@/constants/campus-locations";
import { useAuth } from "@/hooks/use-auth";

type ParsedLocation = {
  source: "formatted" | "json" | "geo" | "url" | "text";
  raw: string;
  name: string;
  query?: string;
  latitude?: number;
  longitude?: number;
};

type ScanHistoryItem = {
  id: string;
  scannedAt: string;
  location: ParsedLocation;
};

type GeneratedPresetQr = {
  id: string;
  name: string;
  payload: string;
  image: string;
};

const SCAN_HISTORY_KEY = "cu-campus-qr-scan-history";

function bilingual(english: string, hindi: string): string {
  return `${english} / ${hindi}`;
}

async function createQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    width: 360,
    margin: 2,
    color: {
      dark: "#111827",
      light: "#ffffff",
    },
  });
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const num = Number.parseFloat(value);
    if (Number.isFinite(num)) return num;
  }
  return undefined;
}

function buildCampusQrMessage(input: {
  name: string;
  building?: string;
  floor?: string;
  latitude?: number;
  longitude?: number;
}): string {
  const lines = [
    "CU-UP Campus Location",
    `Place: ${input.name}`,
    `Building: ${input.building || "Not specified"}`,
    `Floor: ${input.floor || "Not specified"}`,
  ];

  if (input.latitude != null && input.longitude != null) {
    lines.push(`Coordinates: ${input.latitude}, ${input.longitude}`);
    lines.push(
      `Maps: https://www.google.com/maps/search/?api=1&query=${input.latitude},${input.longitude}`,
    );
  }

  return lines.join("\n");
}

function parseFormattedPayload(text: string): ParsedLocation | null {
  const lower = text.toLowerCase();
  if (!lower.includes("cu-up campus location") && !lower.includes("place:")) {
    return null;
  }

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const readField = (key: string): string | undefined => {
    const line = lines.find((item) =>
      item.toLowerCase().startsWith(`${key.toLowerCase()}:`),
    );
    if (!line) return undefined;
    return line.slice(line.indexOf(":") + 1).trim();
  };

  const name = readField("Place") || "Campus Location";
  const coords = readField("Coordinates");
  if (coords) {
    const [latStr, lngStr] = coords.split(",").map((value) => value.trim());
    const latitude = parseNumber(latStr);
    const longitude = parseNumber(lngStr);

    if (latitude != null && longitude != null) {
      return {
        source: "formatted",
        raw: text,
        name,
        latitude,
        longitude,
        query: `${latitude},${longitude}`,
      };
    }
  }

  const query = readField("Maps") || name;
  return {
    source: "formatted",
    raw: text,
    name,
    query,
  };
}

function parseQrPayload(raw: string): ParsedLocation {
  const text = raw.trim();

  const formatted = parseFormattedPayload(text);
  if (formatted) return formatted;

  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const latitude = parseNumber(parsed.lat ?? parsed.latitude);
    const longitude = parseNumber(parsed.lng ?? parsed.lon ?? parsed.longitude);
    const name =
      (typeof parsed.name === "string" && parsed.name.trim()) ||
      (typeof parsed.location === "string" && parsed.location.trim()) ||
      "Campus Location";

    if (latitude != null && longitude != null) {
      return {
        source: "json",
        raw,
        name,
        latitude,
        longitude,
        query: `${latitude},${longitude}`,
      };
    }

    const query =
      (typeof parsed.query === "string" && parsed.query.trim()) ||
      (typeof parsed.address === "string" && parsed.address.trim()) ||
      name;

    return {
      source: "json",
      raw,
      name,
      query,
    };
  } catch {
    // Continue to non-JSON parser strategies.
  }

  if (text.startsWith("geo:")) {
    const coords = text.replace("geo:", "").split("?")[0];
    const [latStr, lngStr] = coords.split(",");
    const latitude = parseNumber(latStr);
    const longitude = parseNumber(lngStr);
    if (latitude != null && longitude != null) {
      return {
        source: "geo",
        raw,
        name: "Campus Geo Point",
        latitude,
        longitude,
        query: `${latitude},${longitude}`,
      };
    }
  }

  try {
    const url = new URL(text);
    const q = url.searchParams.get("q") || url.searchParams.get("query");

    if (q) {
      const [latStr, lngStr] = q.split(",");
      const latitude = parseNumber(latStr);
      const longitude = parseNumber(lngStr);

      if (latitude != null && longitude != null) {
        return {
          source: "url",
          raw,
          name: "Campus QR Location",
          latitude,
          longitude,
          query: `${latitude},${longitude}`,
        };
      }

      return {
        source: "url",
        raw,
        name: "Campus QR Location",
        query: q,
      };
    }

    return {
      source: "url",
      raw,
      name: "Campus QR URL",
      query: text,
    };
  } catch {
    // Not a URL. Fallback to plain text.
  }

  return {
    source: "text",
    raw,
    name: text,
    query: text,
  };
}

function toMapsSearchUrl(location: ParsedLocation): string {
  if (location.latitude != null && location.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.query ?? location.name)}`;
}

function toMapsDirectionsUrl(
  location: ParsedLocation,
  current: GeolocationCoordinates | null,
): string {
  const destination =
    location.latitude != null && location.longitude != null
      ? `${location.latitude},${location.longitude}`
      : encodeURIComponent(location.query ?? location.name);

  if (!current) {
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  }

  return `https://www.google.com/maps/dir/?api=1&origin=${current.latitude},${current.longitude}&destination=${destination}`;
}

export default function StudentLocationPage() {
  const auth = useAuth("student");
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanLoopRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const zxingControlsRef = useRef<IScannerControls | null>(null);
  const detectorRef = useRef<{
    detect: (
      source: ImageBitmapSource,
    ) => Promise<Array<{ rawValue?: string }>>;
  } | null>(null);

  const [scannerStatus, setScannerStatus] = useState(
    bilingual("Ready to scan QR", "QR scan karne ke liye ready"),
  );
  const [isScanning, setIsScanning] = useState(false);
  const [parsedLocation, setParsedLocation] = useState<ParsedLocation | null>(
    null,
  );
  const [manualPayload, setManualPayload] = useState("");
  const [currentLocation, setCurrentLocation] =
    useState<GeolocationCoordinates | null>(null);

  const [spotName, setSpotName] = useState("");
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [generatedPayload, setGeneratedPayload] = useState("");
  const [generatedQr, setGeneratedQr] = useState("");
  const [generatedPresetQrs, setGeneratedPresetQrs] = useState<
    GeneratedPresetQr[]
  >([]);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);

  const saveHistory = useCallback((items: ScanHistoryItem[]) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(items));
  }, []);

  const addHistory = useCallback(
    (location: ParsedLocation) => {
      setScanHistory((prev) => {
        const item: ScanHistoryItem = {
          id: crypto.randomUUID(),
          scannedAt: new Date().toISOString(),
          location,
        };
        const deduped = prev.filter(
          (entry) => entry.location.raw !== location.raw,
        );
        const next = [item, ...deduped].slice(0, 12);
        saveHistory(next);
        return next;
      });
    },
    [saveHistory],
  );

  const stopCamera = useCallback(() => {
    if (scanLoopRef.current != null) {
      window.cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    if (zxingControlsRef.current) {
      zxingControlsRef.current.stop();
      zxingControlsRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const onDecoded = useCallback(
    (payload: string) => {
      const parsed = parseQrPayload(payload);
      setParsedLocation(parsed);
      setScannerStatus(
        bilingual(
          `QR detected (${parsed.source})`,
          `QR mil gaya (${parsed.source})`,
        ),
      );
      addHistory(parsed);
      stopCamera();
    },
    [addHistory, stopCamera],
  );

  const scanFrame = useCallback(async () => {
    const detector = detectorRef.current;
    const video = videoRef.current;

    if (!detector || !video || video.readyState < 2) {
      scanLoopRef.current = window.requestAnimationFrame(() => {
        void scanFrame();
      });
      return;
    }

    try {
      const barcodes = await detector.detect(video);
      const firstValue = barcodes[0]?.rawValue?.trim();
      if (firstValue) {
        onDecoded(firstValue);
        return;
      }
    } catch {
      // Ignore one-off detector frame errors.
    }

    scanLoopRef.current = window.requestAnimationFrame(() => {
      void scanFrame();
    });
  }, [onDecoded]);

  const startCameraScan = useCallback(async () => {
    stopCamera();

    if (detectorRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setScannerStatus("Scanning in progress...");
        setScannerStatus(
          bilingual("Scanning in progress...", "Scan chal raha hai..."),
        );
        setIsScanning(true);
        void scanFrame();
      } catch {
        setScannerStatus(
          bilingual(
            "Camera permission denied or camera unavailable.",
            "Camera permission nahi mila ya camera available nahi hai.",
          ),
        );
        stopCamera();
      }
      return;
    }

    if (!zxingReaderRef.current || !videoRef.current) {
      setScannerStatus(
        bilingual(
          "QR scanner is not available in this browser. Use image/manual analyze.",
          "Is browser me QR scanner available nahi hai. Image/manual analyze use karein.",
        ),
      );
      return;
    }

    try {
      const controls = await zxingReaderRef.current.decodeFromConstraints(
        {
          video: { facingMode: { ideal: "environment" } },
        },
        videoRef.current,
        (result) => {
          const text = result?.getText().trim();
          if (!text) return;
          onDecoded(text);
        },
      );
      zxingControlsRef.current = controls;
      setScannerStatus(
        bilingual("Scanning in progress...", "Scan chal raha hai..."),
      );
      setIsScanning(true);
    } catch {
      setScannerStatus(
        bilingual(
          "Unable to access camera in this browser.",
          "Is browser me camera access nahi ho pa raha.",
        ),
      );
      stopCamera();
    }
  }, [onDecoded, scanFrame, stopCamera]);

  const scanImageUpload = useCallback(
    async (file: File) => {
      if (detectorRef.current) {
        try {
          const bitmap = await createImageBitmap(file);
          const results = await detectorRef.current.detect(bitmap);
          bitmap.close();

          const firstValue = results[0]?.rawValue?.trim();
          if (!firstValue) {
            setScannerStatus(
              bilingual(
                "No QR found in uploaded image.",
                "Uploaded image me QR nahi mila.",
              ),
            );
            return;
          }

          onDecoded(firstValue);
          return;
        } catch {
          setScannerStatus(
            bilingual(
              "Unable to read the uploaded image.",
              "Uploaded image read nahi ho pa rahi.",
            ),
          );
          return;
        }
      }

      if (!zxingReaderRef.current) {
        setScannerStatus(
          bilingual(
            "QR scanner is not supported in this browser.",
            "Is browser me QR scanner support nahi hai.",
          ),
        );
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      try {
        const result =
          await zxingReaderRef.current.decodeFromImageUrl(objectUrl);
        const text = result.getText().trim();
        if (!text) {
          setScannerStatus(
            bilingual(
              "No QR found in uploaded image.",
              "Uploaded image me QR nahi mila.",
            ),
          );
          return;
        }
        onDecoded(text);
      } catch {
        setScannerStatus(
          bilingual(
            "Unable to read the uploaded image.",
            "Uploaded image read nahi ho pa rahi.",
          ),
        );
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    },
    [onDecoded],
  );

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setScannerStatus(
        bilingual(
          "Geolocation is not available in this browser.",
          "Is browser me geolocation available nahi hai.",
        ),
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation(position.coords);
      },
      () => {
        setScannerStatus(
          bilingual(
            "Unable to fetch your current location.",
            "Aapki current location fetch nahi ho pa rahi.",
          ),
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const copyLocationDetails = useCallback(async (location: ParsedLocation) => {
    const details = [
      `Place: ${location.name}`,
      location.query ? `Location: ${location.query}` : null,
      location.latitude != null && location.longitude != null
        ? `Coordinates: ${location.latitude}, ${location.longitude}`
        : null,
      `Maps: ${toMapsSearchUrl(location)}`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(details);
      setScannerStatus(
        bilingual("Location details copied.", "Location details copy ho gaye."),
      );
    } catch {
      setScannerStatus(
        bilingual(
          "Copy failed. Please copy manually.",
          "Copy fail hua. Kripya manually copy karein.",
        ),
      );
    }
  }, []);

  const generateCampusQr = useCallback(async () => {
    const lat = parseNumber(latitude);
    const lng = parseNumber(longitude);
    const label = spotName.trim();

    if (!label) {
      setScannerStatus(
        bilingual(
          "Please enter a place name before generating QR.",
          "QR banane se pehle place name dalen.",
        ),
      );
      return;
    }

    const raw = buildCampusQrMessage({
      name: label,
      building: building.trim() || undefined,
      floor: floor.trim() || undefined,
      latitude: lat,
      longitude: lng,
    });
    const qr = await createQrDataUrl(raw);

    setGeneratedPayload(raw);
    setGeneratedQr(qr);
    setScannerStatus(
      bilingual(
        "QR generated successfully.",
        "QR safalta se generate ho gaya.",
      ),
    );
  }, [building, floor, latitude, longitude, spotName]);

  const generatePresetPack = useCallback(async () => {
    const results = await Promise.all(
      campusLocationPresets.map(async (preset) => {
        const payload = buildCampusQrMessage({
          name: preset.name,
          building: preset.building,
          floor: preset.floor,
          latitude: preset.latitude,
          longitude: preset.longitude,
        });

        return {
          id: crypto.randomUUID(),
          name: preset.name,
          payload,
          image: await createQrDataUrl(payload),
        } satisfies GeneratedPresetQr;
      }),
    );

    setGeneratedPresetQrs(results);
    setScannerStatus(
      bilingual(
        "Preset campus QR pack generated.",
        "Preset campus QR pack generate ho gaya.",
      ),
    );
  }, []);

  const hasScannedLocation = useMemo(
    () => parsedLocation != null,
    [parsedLocation],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(SCAN_HISTORY_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as ScanHistoryItem[];
      if (Array.isArray(parsed)) {
        setScanHistory(parsed.slice(0, 12));
      }
    } catch {
      // Ignore malformed local history data.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    zxingReaderRef.current = new BrowserMultiFormatReader();

    if (!("BarcodeDetector" in window)) {
      detectorRef.current = null;
      return;
    }

    const BarcodeDetectorCtor = (
      window as unknown as {
        BarcodeDetector: new (options?: {
          formats?: string[];
        }) => {
          detect: (
            source: ImageBitmapSource,
          ) => Promise<Array<{ rawValue?: string }>>;
        };
      }
    ).BarcodeDetector;

    detectorRef.current = new BarcodeDetectorCtor({
      formats: ["qr_code"],
    });

    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  if (auth.loading) return <LoadingScreen />;
  if (!auth.authenticated) return null;

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <PortalNav
        role="student"
        name={auth.name}
        email={auth.email}
        onLogout={auth.logout}
      />

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
              Campus QR Locator
            </h1>
            <p className="text-zinc-500 mt-1">
              Scan QR to know where you are, see your live position, and
              navigate yourself.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ScanLine className="h-5 w-5 text-red-600" /> QR Scanner &
                  Analyzer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl bg-black/95 p-2">
                  <video
                    ref={videoRef}
                    className="w-full aspect-video rounded-lg object-cover"
                    playsInline
                    muted
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {!isScanning ? (
                    <Button
                      onClick={() => void startCameraScan()}
                      className="gap-2"
                    >
                      <ScanLine className="h-4 w-4" /> Start Camera Scan
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      onClick={stopCamera}
                      className="gap-2"
                    >
                      Stop Scan
                    </Button>
                  )}

                  <Label
                    htmlFor="qr-upload"
                    className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <Upload className="mr-2 h-4 w-4" /> Scan from Image
                  </Label>
                  <input
                    id="qr-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      void scanImageUpload(file);
                      event.currentTarget.value = "";
                    }}
                  />
                </div>

                <p className="text-sm text-zinc-500">{scannerStatus}</p>

                <div className="rounded-xl border p-3 bg-zinc-50 dark:bg-zinc-900 space-y-2">
                  <Label htmlFor="manual-qr">Manual Analyze (fallback)</Label>
                  <Input
                    id="manual-qr"
                    placeholder="Paste QR text / maps URL / geo:lat,lng"
                    value={manualPayload}
                    onChange={(event) => setManualPayload(event.target.value)}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      const payload = manualPayload.trim();
                      if (!payload) {
                        setScannerStatus(
                          bilingual(
                            "Paste a QR message first.",
                            "Pehle QR message paste karein.",
                          ),
                        );
                        return;
                      }
                      onDecoded(payload);
                    }}
                  >
                    Analyze Payload
                  </Button>
                </div>

                {hasScannedLocation && parsedLocation && (
                  <div className="rounded-xl border p-4 space-y-3 bg-white dark:bg-zinc-900">
                    <div className="text-sm text-zinc-500">
                      Detected Location
                    </div>
                    <div className="font-semibold text-zinc-900 dark:text-white">
                      {parsedLocation.name}
                    </div>
                    {parsedLocation.query && (
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        {parsedLocation.query}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={getCurrentLocation}
                      >
                        <LocateFixed className="h-4 w-4" /> See Your Location
                      </Button>
                      <Button
                        className="gap-2"
                        onClick={() => {
                          window.open(
                            toMapsDirectionsUrl(
                              parsedLocation,
                              currentLocation,
                            ),
                            "_blank",
                            "noopener,noreferrer",
                          );
                        }}
                      >
                        <Navigation className="h-4 w-4" /> Navigate Yourself
                      </Button>
                      <Button
                        variant="secondary"
                        className="gap-2"
                        onClick={() => {
                          window.open(
                            toMapsSearchUrl(parsedLocation),
                            "_blank",
                            "noopener,noreferrer",
                          );
                        }}
                      >
                        <MapPinned className="h-4 w-4" /> Open in Maps
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => void copyLocationDetails(parsedLocation)}
                      >
                        Copy Details
                      </Button>
                    </div>
                    {currentLocation && (
                      <p className="text-xs text-zinc-500">
                        Your location: {currentLocation.latitude.toFixed(6)},{" "}
                        {currentLocation.longitude.toFixed(6)}
                      </p>
                    )}
                  </div>
                )}

                <div className="rounded-xl border p-4 bg-white dark:bg-zinc-900 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      Recent Scans
                    </p>
                    {scanHistory.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setScanHistory([]);
                          saveHistory([]);
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>

                  {scanHistory.length === 0 ? (
                    <p className="text-xs text-zinc-500">
                      No scans yet. Scan any campus QR and it will appear here.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {scanHistory.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border p-2.5 bg-zinc-50 dark:bg-zinc-800"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                {item.location.name}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {new Date(item.scannedAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  window.open(
                                    toMapsSearchUrl(item.location),
                                    "_blank",
                                    "noopener,noreferrer",
                                  );
                                }}
                              >
                                Open
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  window.open(
                                    toMapsDirectionsUrl(
                                      item.location,
                                      currentLocation,
                                    ),
                                    "_blank",
                                    "noopener,noreferrer",
                                  );
                                }}
                              >
                                Navigate
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-red-600" /> QR Producer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="spot-name">Place Name</Label>
                    <Input
                      id="spot-name"
                      placeholder="Example: Block A - Main Gate"
                      value={spotName}
                      onChange={(event) => setSpotName(event.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="building">Building</Label>
                      <Input
                        id="building"
                        placeholder="Block A"
                        value={building}
                        onChange={(event) => setBuilding(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="floor">Floor</Label>
                      <Input
                        id="floor"
                        placeholder="Ground Floor"
                        value={floor}
                        onChange={(event) => setFloor(event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        placeholder="26.7794"
                        value={latitude}
                        onChange={(event) => setLatitude(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        placeholder="80.8951"
                        value={longitude}
                        onChange={(event) => setLongitude(event.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => void generateCampusQr()}
                  className="gap-2"
                >
                  <QrCode className="h-4 w-4" /> Generate Campus QR
                </Button>

                {generatedQr && (
                  <div className="rounded-xl border p-4 bg-white dark:bg-zinc-900 space-y-3">
                    <img
                      src={generatedQr}
                      alt="Generated Campus QR"
                      className="w-56 h-56 object-contain rounded-md border mx-auto"
                    />
                    <p className="text-xs text-zinc-500 text-center">
                      Scan this QR from another phone to test analyzer and
                      navigation.
                    </p>
                    <details>
                      <summary className="cursor-pointer text-xs text-zinc-500">
                        View generated message
                      </summary>
                      <pre className="mt-2 max-h-28 overflow-auto rounded bg-zinc-100 dark:bg-zinc-800 p-2 text-xs whitespace-pre-wrap">
                        {generatedPayload}
                      </pre>
                    </details>
                  </div>
                )}

                <div className="rounded-xl border p-4 bg-zinc-50 dark:bg-zinc-900 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      Quick Campus QR Pack
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => void generatePresetPack()}
                    >
                      Generate Presets
                    </Button>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Ready set of common campus points for printing and
                    placement.
                  </p>

                  {generatedPresetQrs.length > 0 && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {generatedPresetQrs.map((preset) => (
                        <div
                          key={preset.id}
                          className="rounded-lg border bg-white dark:bg-zinc-900 p-3 space-y-2"
                        >
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {preset.name}
                          </p>
                          <img
                            src={preset.image}
                            alt={`${preset.name} QR`}
                            className="w-32 h-32 border rounded"
                          />
                          <a
                            href={preset.image}
                            download={`${preset.name.toLowerCase().replaceAll(" ", "-")}-qr.png`}
                            className="text-xs text-red-700 hover:underline"
                          >
                            Download QR
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-zinc-500 text-sm">Loading locator…</p>
      </div>
    </div>
  );
}
