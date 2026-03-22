"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Keyboard,
  Search,
  CheckCircle,
  XCircle,
  RotateCcw,
  MapPin,
  Package,
  ArrowRight,
  Sparkles,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  lookupItem,
  getStatusLabel,
  getStatusColor,
  getStatusBg,
  getLocationString,
  ALL_SKUS,
  type ReturnItem,
  type ItemStatus,
} from "@/lib/mock-data";

type Step = "scan" | "review" | "override" | "location";

interface ProcessingResult {
  item: ReturnItem;
  finalStatus: ItemStatus;
  wasOverridden: boolean;
}

export default function ReturnsStation() {
  const [step, setStep] = useState<Step>("scan");
  const [skuInput, setSKUInput] = useState("");
  const [scanMode, setScanMode] = useState<"text" | "camera">("text");
  const [currentItem, setCurrentItem] = useState<ReturnItem | null>(null);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        if (state === 2) {
          await html5QrCodeRef.current.stop();
        }
      } catch (e) {
        // ignore cleanup errors
      }
      html5QrCodeRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!scannerRef.current) return;
    setIsScanning(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText: string) => {
          handleScan(decodedText);
          stopCamera();
        },
        () => {}
      );
    } catch (err) {
      setError("Camera access denied or unavailable. Try typing the SKU instead.");
      setScanMode("text");
      setIsScanning(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    if (scanMode === "camera" && step === "scan") {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [scanMode, step, startCamera, stopCamera]);

  useEffect(() => {
    if (scanMode === "text" && step === "scan" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [scanMode, step]);

  function handleScan(code: string) {
    setError(null);
    const item = lookupItem(code);
    if (item) {
      setCurrentItem(item);
      setStep("review");
      setSKUInput("");
      setIsScanning(false);
    } else {
      setError(`Item "${code}" not found. Try: ${ALL_SKUS.slice(0, 3).join(", ")}`);
    }
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (skuInput.trim()) {
      handleScan(skuInput.trim());
    }
  }

  function handleAcceptAI() {
    if (!currentItem) return;
    setProcessingResult({
      item: currentItem,
      finalStatus: currentItem.aiStatus,
      wasOverridden: false,
    });
    setStep("location");
  }

  function handleOverrideSelect(status: ItemStatus) {
    if (!currentItem) return;
    setProcessingResult({
      item: currentItem,
      finalStatus: status,
      wasOverridden: true,
    });
    setStep("location");
  }

  function handleReset() {
    stopCamera();
    setStep("scan");
    setCurrentItem(null);
    setProcessingResult(null);
    setSKUInput("");
    setError(null);
    setIsScanning(false);
    setProcessedCount((c) => c + 1);
  }

  const stepIndex = step === "scan" ? 0 : step === "review" ? 1 : step === "override" ? 1.5 : 2;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3">
        <div className="mx-auto max-w-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Package className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">Returns Station</h1>
              <p className="text-xs text-muted-foreground">Scan → Verify → Route</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {processedCount} processed
          </Badge>
        </div>
      </header>

      {/* Progress */}
      <div className="mx-auto max-w-lg px-4 pt-4">
        <div className="flex items-center gap-1 mb-4">
          {["Scan", "Verify", "Route"].map((label, i) => (
            <div key={label} className="flex-1 flex items-center gap-1">
              <div className="flex-1">
                <div
                  className={`h-1.5 rounded-full transition-colors duration-300 ${
                    i <= stepIndex ? "bg-primary" : "bg-muted"
                  }`}
                />
                <p
                  className={`text-xs mt-1 ${
                    i <= stepIndex
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-lg px-4 pb-8">
        <AnimatePresence mode="wait">
          {/* STEP 1: SCAN */}
          {step === "scan" && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Search className="h-4 w-4 text-primary" />
                    Scan Return Item
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Mode toggle */}
                  <div className="flex gap-1 p-1 bg-muted rounded-lg">
                    <button
                      onClick={() => {
                        stopCamera();
                        setScanMode("text");
                        setIsScanning(false);
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                        scanMode === "text"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Keyboard className="h-3.5 w-3.5" />
                      Type SKU
                    </button>
                    <button
                      onClick={() => setScanMode("camera")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                        scanMode === "camera"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Camera className="h-3.5 w-3.5" />
                      Camera
                    </button>
                  </div>

                  {/* Text input */}
                  {scanMode === "text" && (
                    <form onSubmit={handleTextSubmit} className="space-y-3">
                      <Input
                        ref={inputRef}
                        value={skuInput}
                        onChange={(e) => {
                          setSKUInput(e.target.value);
                          setError(null);
                        }}
                        placeholder="Enter SKU (e.g. SKU-10234)"
                        className="text-center text-base font-mono h-12"
                        autoComplete="off"
                      />
                      <Button type="submit" className="w-full h-11" disabled={!skuInput.trim()}>
                        <Search className="h-4 w-4 mr-2" />
                        Look Up Item
                      </Button>
                    </form>
                  )}

                  {/* Camera scanner */}
                  {scanMode === "camera" && (
                    <div className="space-y-3">
                      <div
                        className="relative rounded-lg overflow-hidden bg-black aspect-[4/3]"
                      >
                        <div id="qr-reader" ref={scannerRef} className="w-full h-full" />
                        {isScanning && (
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-x-0 h-0.5 bg-primary/80 animate-scan-line" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-center text-muted-foreground">
                        Point camera at the barcode on the return label
                      </p>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-start gap-2"
                    >
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  {/* Demo SKUs */}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Quick test — tap a SKU:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_SKUS.slice(0, 5).map((sku) => (
                        <button
                          key={sku}
                          onClick={() => handleScan(sku)}
                          className="text-xs px-2 py-1 rounded-md bg-muted hover:bg-muted/80 font-mono transition-colors"
                        >
                          {sku}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* STEP 2: REVIEW AI STATUS */}
          {step === "review" && currentItem && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {/* Item info */}
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center text-2xl">
                      {currentItem.imageEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-sm truncate">{currentItem.name}</h2>
                      <p className="text-xs text-muted-foreground">{currentItem.category}</p>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">
                        {currentItem.sku} · ${currentItem.originalPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI recommendation */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Recommendation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className={`p-4 rounded-xl border-2 ${getStatusBg(currentItem.aiStatus)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Suggested Status</p>
                        <p className={`text-xl font-bold ${getStatusColor(currentItem.aiStatus)}`}>
                          {getStatusLabel(currentItem.aiStatus)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                        <p className="text-xl font-bold text-foreground">
                          {currentItem.aiConfidence}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Is this correct?</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={handleAcceptAI}
                        className="h-12 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        onClick={() => setStep("override")}
                        variant="outline"
                        className="h-12"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Override
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="w-full text-muted-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Scan different item
              </Button>
            </motion.div>
          )}

          {/* STEP 2.5: OVERRIDE */}
          {step === "override" && currentItem && (
            <motion.div
              key="override"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Override Status</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Select the correct status for{" "}
                    <span className="font-medium text-foreground">{currentItem.name}</span>
                  </p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(["resell", "pre-love", "discard"] as ItemStatus[]).map((status) => {
                    const isAISuggestion = status === currentItem.aiStatus;
                    return (
                      <button
                        key={status}
                        onClick={() => handleOverrideSelect(status)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.01] active:scale-[0.99] ${
                          getStatusBg(status)
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">
                              {status === "resell" ? "💰" : status === "pre-love" ? "💜" : "🗑️"}
                            </div>
                            <div>
                              <p className={`font-semibold ${getStatusColor(status)}`}>
                                {getStatusLabel(status)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {status === "resell"
                                  ? "Item is in sellable condition"
                                  : status === "pre-love"
                                  ? "Gently used, can be resold at discount"
                                  : "Item cannot be resold"}
                              </p>
                            </div>
                          </div>
                          {isAISuggestion && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              AI pick
                            </Badge>
                          )}
                          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("review")}
                className="w-full text-muted-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Back to review
              </Button>
            </motion.div>
          )}

          {/* STEP 3: LOCATION */}
          {step === "location" && processingResult && (
            <motion.div
              key="location"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {/* Success banner */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                      Item Classified
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      Status: <span className="font-medium">{getStatusLabel(processingResult.finalStatus)}</span>
                      {processingResult.wasOverridden && (
                        <span className="ml-1">(overridden from {getStatusLabel(processingResult.item.aiStatus)})</span>
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Item recap */}
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-xl">
                      {processingResult.item.imageEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-sm truncate">
                        {processingResult.item.name}
                      </h2>
                      <p className="text-xs font-mono text-muted-foreground">
                        {processingResult.item.sku}
                      </p>
                    </div>
                    <Badge
                      className={`${
                        processingResult.finalStatus === "resell"
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          : processingResult.finalStatus === "pre-love"
                          ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                          : "bg-red-100 text-red-700 hover:bg-red-100"
                      }`}
                    >
                      {getStatusLabel(processingResult.finalStatus)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Location card */}
              <Card className="border-2 border-primary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Place Item Here
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {[
                      { label: "Aisle", value: processingResult.item.location.aisle },
                      { label: "Shelf", value: processingResult.item.location.shelf },
                      { label: "Bin", value: processingResult.item.location.bin },
                    ].map((loc) => (
                      <div
                        key={loc.label}
                        className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10"
                      >
                        <p className="text-xs text-muted-foreground mb-0.5">{loc.label}</p>
                        <p className="text-2xl font-bold text-primary">{loc.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-sm font-medium">
                      {getLocationString(processingResult.item.location)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Next item */}
              <Button onClick={handleReset} className="w-full h-12" size="lg">
                <RefreshCw className="h-4 w-4 mr-2" />
                Scan Next Return
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

