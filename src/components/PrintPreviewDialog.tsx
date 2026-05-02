import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, X } from "lucide-react";

interface PrintPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Full HTML body content to render inside the A4 frame */
  html: string;
  /** Inline <style> rules applied inside the iframe (page styles, etc.) */
  styles?: string;
  /** Title shown in the header bar */
  title: string;
  /** Suggested filename — shown to user before printing/saving */
  filename?: string;
  /** Page orientation hint for @page */
  orientation?: "portrait" | "landscape";
  /** Optional callback when user clicks Save as PDF */
  onSavePdf?: () => void | Promise<void>;
}

/**
 * Reusable A4 print preview modal. Renders the print HTML inside a sandboxed iframe
 * so the user can confirm layout and filename **before** committing to print/save.
 */
const PrintPreviewDialog = ({
  open, onOpenChange, html, styles = "", title, filename, orientation = "portrait", onSavePdf,
}: PrintPreviewDialogProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!open) return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head>
      <style>
        @page { size: A4 ${orientation}; margin: 10mm; }
        body { margin: 0; font-family: Arial, sans-serif; background: #f5f5f5; padding: 12px; }
        .a4-page { background: #fff; box-shadow: 0 0 8px rgba(0,0,0,0.15); margin: 0 auto 16px; padding: 12mm;
                   width: ${orientation === "landscape" ? "297mm" : "210mm"};
                   min-height: ${orientation === "landscape" ? "210mm" : "297mm"}; }
        ${styles}
      </style>
    </head><body><div class="a4-page">${html}</div></body></html>`);
    doc.close();
  }, [open, html, styles, orientation]);

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 flex flex-col gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border bg-primary text-primary-foreground rounded-t-lg">
          <DialogTitle className="flex items-center justify-between gap-4">
            <span className="flex flex-col">
              <span className="text-base">📄 Print Preview — {title}</span>
              {filename && (
                <span className="text-xs font-normal opacity-80 mt-0.5">Filename: <span className="font-mono">{filename}</span></span>
              )}
            </span>
            <div className="flex gap-2">
              {onSavePdf && (
                <Button variant="secondary" size="sm" onClick={() => onSavePdf()}>
                  <Download className="mr-1 h-4 w-4" />Save PDF
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={handlePrint}>
                <Printer className="mr-1 h-4 w-4" />Print
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-primary-foreground hover:bg-primary-foreground/10">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-muted/30">
          <iframe
            ref={iframeRef}
            title="Print Preview"
            className="w-full h-full border-0 bg-muted/30"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintPreviewDialog;
