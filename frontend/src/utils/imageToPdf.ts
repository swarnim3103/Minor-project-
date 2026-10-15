import jsPDF from "jspdf";

export async function convertImageFileToPdf(imageFile: File): Promise<File> {
  const imageDataUrl = await readFileAsDataUrl(imageFile);
  const { width, height } = await getImageDimensions(imageDataUrl);

  const pdf = new jsPDF({
    orientation: width > height ? "landscape" : "portrait",
    unit: "px",
    format: [width, height],
  });

  const format = imageFile.type === "image/png" ? "PNG" : "JPEG";
  pdf.addImage(imageDataUrl, format, 0, 0, width, height);

  const pdfBlob = pdf.output("blob");
  return new File([pdfBlob], `${imageFile.name.replace(/\.[^.]+$/, "")}.pdf`, {
    type: "application/pdf",
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = dataUrl;
  });
}