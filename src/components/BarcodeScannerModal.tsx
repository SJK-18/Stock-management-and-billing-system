import React, { useEffect, useRef, useState } from "react";
import { Camera, X, Scan, AlertCircle, CheckCircle2, Volume2, Sparkles } from "lucide-react";
import { soundManager } from "../utils/barcodeUtils";
import { Product } from "../types";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeDetected: (barcode: string) => void;
  sampleProducts?: Product[];
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onBarcodeDetected,
  sampleProducts = []
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>("");
  const [scannedSuccess, setScannedSuccess] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setScannedSuccess(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        setCameraError("Camera access is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setCameraActive(true);
        startScanningLoop();
      }
    } catch (err: any) {
      console.warn("Camera could not be started:", err);
      setHasCamera(false);
      setCameraError(err.message || "Camera permission denied or camera unavailable.");
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleDetection = (code: string) => {
    soundManager.playSuccess();
    setScannedSuccess(code);
    setTimeout(() => {
      onBarcodeDetected(code);
      onClose();
    }, 450);
  };

  const startScanningLoop = () => {
    // Check if experimental BarcodeDetector is supported
    const hasBarcodeDetector = "BarcodeDetector" in window;
    let detector: any = null;
    if (hasBarcodeDetector) {
      try {
        detector = new (window as any).BarcodeDetector({
          formats: ["code_128", "ean_13", "ean_8", "upc_a", "upc_e", "qr_code"]
        });
      } catch (e) {
        console.log("BarcodeDetector init error", e);
      }
    }

    const scanFrame = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      if (detector) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            if (code) {
              handleDetection(code);
              return;
            }
          }
        } catch {
          // Frame error, continue
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleDetection(manualCode.trim());
      setManualCode("");
    }
  };

  if (!isOpen) return null;

  return (
    <div id="barcode-scanner-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-100">Barcode Scanner</h3>
              <p className="text-xs text-zinc-400">Aim camera at product barcode or choose a preset</p>
            </div>
          </div>
          <button
            id="close-scanner-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video / Viewfinder Area */}
        <div className="relative bg-zinc-950 aspect-[4/3] w-full flex items-center justify-center overflow-hidden">
          {hasCamera && cameraActive ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                autoPlay
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder Target Reticle */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-3/4 h-36 border-2 border-emerald-400/80 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                  {/* Laser scanning line */}
                  <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-bounce" style={{ animationDuration: "1.6s" }} />
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                  <div className="absolute -bottom-7 left-0 right-0 text-center text-[11px] font-mono tracking-wide text-emerald-300 drop-shadow">
                    ALIGN BARCODE INSIDE FRAME
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center max-w-sm">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-400 border border-zinc-700">
                <Camera className="w-7 h-7" />
              </div>
              <p className="text-sm font-medium text-zinc-200 mb-1">
                {cameraError ? "Camera Unavailable" : "Opening Camera..."}
              </p>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                {cameraError || "Make sure camera permission is allowed in your browser settings. You can also test with preset barcodes below."}
              </p>
            </div>
          )}

          {/* Success Flash Overlay */}
          {scannedSuccess && (
            <div className="absolute inset-0 bg-emerald-600/90 flex flex-col items-center justify-center text-white z-20 animate-fade-in">
              <CheckCircle2 className="w-14 h-14 mb-2 animate-scale" />
              <p className="text-lg font-bold tracking-tight">Barcode Detected!</p>
              <p className="text-sm font-mono bg-black/30 px-3 py-1 rounded-full mt-1">{scannedSuccess}</p>
            </div>
          )}
        </div>

        {/* Manual Barcode Input & Quick Simulation */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 space-y-3">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              id="manual-barcode-input"
              type="text"
              placeholder="Or enter barcode / SKU manually..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 rounded-xl bg-zinc-800 border border-zinc-700 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition-colors shrink-0"
            >
              Enter
            </button>
          </form>

          {/* Quick Click Simulator for testing without physical barcodes */}
          {sampleProducts.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Quick-Scan Simulation (Click to simulate scanning item):
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-1">
                {sampleProducts.slice(0, 6).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleDetection(p.barcode)}
                    className="text-left px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 text-xs transition-colors group flex items-center justify-between"
                  >
                    <div className="truncate pr-1">
                      <p className="text-zinc-200 font-medium truncate">{p.name}</p>
                      <p className="text-[10px] font-mono text-emerald-400">{p.barcode}</p>
                    </div>
                    <span className="text-[10px] text-zinc-400 shrink-0 group-hover:text-emerald-300">Scan</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
