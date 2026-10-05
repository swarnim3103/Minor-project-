import { useRef, useState } from "react";
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

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // rear camera on phones
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStarted(true);
      setError("");
    } catch (err) {
      console.error("Camera access failed:", err);
      setError("Could not access camera. Please check permissions or use file upload instead.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function captureAndConvert() {
    if (!videoRef.current) return;
    setCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.92);

      // Convert the captured image into a single-page PDF
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imageDataUrl, "JPEG", 0, 0, canvas.width, canvas.height);

      const pdfBlob = pdf.output("blob");
      const file = new File([pdfBlob], `scan-${Date.now()}.pdf`, { type: "application/pdf" });

      stopCamera();
      onCapture(file);
    } catch (err) {
      console.error("Capture/conversion failed:", err);
      setError("Could not process the scan. Please try again.");
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
            style={{ width: "100%", maxWidth: 480, borderRadius: 8, background: "#000" }}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={captureAndConvert} disabled={capturing}>
              {capturing ? "Processing..." : "Capture & Use"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ScanCapture;