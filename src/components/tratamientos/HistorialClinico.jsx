import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, X } from "lucide-react";
import toastr from "toastr";
import { getHistorialPdfUrl, setHistorialPdfUrl } from "@/lib/historialPdf";

export default function HistorialClinico({ mascotaId, onClose, autoGeneratePdf, className = "" }) {
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [autoRan, setAutoRan] = useState(false);

  const apiBase = import.meta.env.VITE_API_URL || "https://apivet.strategtic.com";

  const fetchPdfUrl = async () => {
    const cached = getHistorialPdfUrl(mascotaId);
    if (cached) return cached;

    const endpoint = mascotaId
      ? `${apiBase}/api/mascotas/${mascotaId}/historial-pdf`
      : "";
    if (!endpoint) throw new Error("No PDF endpoint");

    const res = await fetch(endpoint);
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.data?.url) {
      throw new Error("No se pudo obtener el PDF.");
    }
    setHistorialPdfUrl(mascotaId, json.data.url);
    return json.data.url;
  };

  const buildPdfViewerUrl = (url) => {
    if (!url) return "";
    const hash = "toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=page-width";
    return url.includes("#") ? `${url}&${hash}` : `${url}#${hash}`;
  };

  const handlePreviewPDF = async () => {
    setPdfError("");
    setPdfLoading(true);
    try {
      const url = await fetchPdfUrl();
      setPdfUrl(url);
    } catch (error) {
      setPdfError("No se pudo cargar la vista previa del PDF.");
      toastr.error("No se pudo cargar la vista previa del PDF.");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const url = await fetchPdfUrl();
      const link = document.createElement("a");
      link.href = url;
      link.download = "historial_clinico.pdf";
      link.target = "_blank";
      link.rel = "noreferrer";
      link.click();
    } catch (error) {
      toastr.error("No se pudo descargar el PDF.");
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (autoGeneratePdf && mascotaId && !autoRan) {
      setAutoRan(true);
      fetchPdfUrl().catch(() => {});
    }
  }, [autoGeneratePdf, mascotaId, autoRan]);

  useEffect(() => {
    if (!mascotaId) return;
    setPdfUrl("");
    setPdfError("");
    handlePreviewPDF();
  }, [mascotaId]);

  return (
    <Card className={`bg-white shadow-xl flex flex-col rounded-2xl overflow-hidden border border-slate-200/80 ${className}`}>
      <CardHeader className="bg-white text-slate-900 flex-shrink-0 border-b border-slate-200/70 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold leading-tight">Historial Clinico</CardTitle>
              <p className="text-xs text-slate-500 mt-1">Vista previa del PDF generado</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-4 h-4 mr-2" />
              {downloading ? "Descargando..." : "Descargar PDF"}
            </Button>
            {onClose && (
              <Button
                variant="secondary"
                size="icon"
                onClick={onClose}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 overflow-hidden flex-1 bg-slate-50">
        {pdfError && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3 mb-4 border border-red-100">
            {pdfError}
          </div>
        )}
        {pdfUrl ? (
          <div className="h-full w-full bg-slate-200/70 rounded-2xl p-2 sm:p-3 border border-slate-200 shadow-inner">
            <iframe
              title="Historial clinico PDF"
              src={buildPdfViewerUrl(pdfUrl)}
              className="w-full h-full rounded-xl bg-white shadow-md border border-slate-200"
              allow="fullscreen"
            />
          </div>
        ) : (
          <div className="text-sm text-slate-600 p-6 bg-white rounded-xl border border-slate-200">
            {pdfLoading ? "Cargando vista previa..." : "No hay vista previa disponible."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
