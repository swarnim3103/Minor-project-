import { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";

interface ScanCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

function ScanCapture({ onCapture, onClose }: ScanCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [started, setStarted] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  // Attach the stream AFTER the <video> element has rendered
  useEffect(() => {
    if (started && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => {
        console.error("Video play failed:", err);
        setError("Could not start the camera preview. Please try again.");
      });
    }
  }, [started]);

  // Make sure the camera is released if this component unmounts
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startCamera() {
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "Camera access isn't available in this browser/connection. Use localhost or HTTPS, or use file upload instead."
        );
        return;
      }

      let stream: MediaStream;
      try {
        // Prefer the rear camera (phones)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch {
        // Fall back to any available camera (laptops/webcams)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setStarted(true); // the effect above attaches the stream once <video> exists
    } catch (err) {
      console.error("Camera access failed:", err);
      setError(
        err instanceof Error
          ? `Could not access camera: ${err.message}`
          : "Could not access camera. Please check permissions or use file upload instead."
      );
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setVideoReady(false);
  }

  async function captureAndConvert() {
    const video = videoRef.current;
    if (!video) return;

    if (!video.videoWidth || !video.videoHeight) {
      setError("Camera feed not ready yet. Please wait a moment and try again.");
      return;
    }

    setCapturing(true);
    setError("");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.92);

      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imageDataUrl, "JPEG", 0, 0, canvas.width, canvas.height);

      const pdfBlob = pdf.output("blob");
      const file = new File([pdfBlob], `scan-${Date.now()}.pdf`, {
        type: "application/pdf",
      });

      stopCamera();
      onCapture(file);
    } catch (err) {
      console.error("Capture/conversion failed:", err);
      setError(
        err instanceof Error
          ? `Could not process the scan: ${err.message}`
          : "Could not process the scan. Please try again."
      );
    } finally {
      setCapturing(false);
    }
  }

  function handleClose() {
    stopCamera();
    onClose();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
      {error && <div className="error-banner">{error}</div>}

      {!started ? (
        <button className="btn btn-primary" onClick={startCamera}>
          Open Camera
        </button>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={() => setVideoReady(true)}
            style={{ width: "100%", maxWidth: 480, borderRadius: 8, background: "#000" }}
          />
          {!videoReady && (
            <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
              Starting camera feed...
            </p>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={captureAndConvert}
              disabled={capturing || !videoReady}
            >
              {capturing ? "Processing..." : "Capture & Use"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ScanCapture;