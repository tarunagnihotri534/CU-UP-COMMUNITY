"use client";

import { useState, useRef, useCallback } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { MapPin, X, Camera } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getLocationById,
  QR_CODE_LOCATION_MAP,
  type UniversityLocation,
} from "@/constants/university-locations";

interface LocationScannerState {
  isScanning: boolean;
  currentLocation: UniversityLocation | null;
  error: string | null;
}

interface LocationScannerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LocationScanner({
  isOpen,
  onOpenChange,
}: LocationScannerProps) {
  const [state, setState] = useState<LocationScannerState>({
    isScanning: false,
    currentLocation: null,
    error: null,
  });

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const qrReaderRef = useRef<HTMLDivElement>(null);

  const handleQRCodeScanned = useCallback((decodedText: string) => {
    const locationId = QR_CODE_LOCATION_MAP[decodedText];
    const location = getLocationById(locationId || decodedText);

    if (location) {
      setState((prev) => ({
        ...prev,
        currentLocation: location,
        isScanning: false,
        error: null,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        error: `Location not found for QR code: ${decodedText}`,
        isScanning: false,
      }));
    }
  }, []);

  const stopScanning = useCallback(() => {
    if (scannerRef.current) {
      try {
        (scannerRef.current as any).pause();
      } catch (err) {
        // Ignore pause errors
      }
      scannerRef.current = null;
    }
    setState((prev) => ({ ...prev, isScanning: false }));
  }, []);

  const startScanning = useCallback(() => {
    setState((prev) => ({ ...prev, isScanning: true, error: null }));

    if (qrReaderRef.current && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        qrReaderRef.current.id,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          videoConstraints: {
            facingMode: "environment",
          },
        },
        false,
      );

      try {
        (scannerRef.current as any).render(
          (decodedText: string) => {
            handleQRCodeScanned(decodedText);
            stopScanning();
          },
          () => {
            // Keep scanning
          },
        );
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: `Camera access failed: ${err instanceof Error ? err.message : String(err)}`,
          isScanning: false,
        }));
      }
    }
  }, [handleQRCodeScanned, stopScanning]);

  const closeDialog = () => {
    if (state.isScanning) {
      stopScanning();
    }
    setState((prev) => ({
      ...prev,
      isScanning: false,
      currentLocation: null,
      error: null,
    }));
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Your Location
          </DialogTitle>
          <DialogDescription>
            {state.currentLocation
              ? "You are currently at:"
              : state.isScanning
                ? "Point your camera at a QR code"
                : "Scan a QR code to find your location"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scanner */}
          {!state.currentLocation && !state.isScanning && (
            <div className="space-y-4">
              <Button
                onClick={startScanning}
                className="w-full gap-2"
                size="lg"
              >
                <Camera className="w-5 h-5" />
                Scan QR Code
              </Button>
            </div>
          )}

          {state.isScanning && (
            <div className="space-y-4">
              <div
                id="qr-reader-location"
                ref={qrReaderRef}
                className="w-full bg-gray-900 rounded-lg overflow-hidden"
                style={{ minHeight: "300px" }}
              />
              <Button
                onClick={stopScanning}
                variant="destructive"
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Stop
              </Button>
            </div>
          )}

          {/* Location Result - Simple Display */}
          {state.currentLocation && (
            <div className="space-y-4">
              <Card className="border-2 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Your current location:
                  </p>
                  <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {state.currentLocation.name}
                  </h2>
                  {state.currentLocation.building && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {state.currentLocation.building}
                      {state.currentLocation.floor &&
                        ` • Floor ${state.currentLocation.floor}`}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Button
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    currentLocation: null,
                    isScanning: false,
                  }))
                }
                className="w-full"
              >
                Scan Another
              </Button>
            </div>
          )}

          {/* Error */}
          {state.error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-300">
                {state.error}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
