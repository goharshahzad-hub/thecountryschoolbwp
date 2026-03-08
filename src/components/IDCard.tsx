import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import logo from "@/assets/logo.jpg";

interface CardData {
  photo_url?: string;
  id_number: string;
  name: string;
  subtitle: string; // class or designation
  extra_lines: string[]; // father name, phone, etc.
  type: "student" | "teacher" | "staff";
}

interface IDCardProps {
  data: CardData;
  schoolName?: string;
  campus?: string;
  phone?: string;
}

const IDCard = ({ data, schoolName = "The Country School", campus = "Model Town Fahad Campus", phone = "+92 322 6107000" }: IDCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = cardRef.current;
    if (!content) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>ID Card - ${data.name}</title>
      <style>
        @media print { @page { size: 3.375in 2.125in; margin: 0; } body { margin: 0; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; }
        .id-card { width: 3.375in; height: 2.125in; border: 2px solid #1a365d; border-radius: 8px; overflow: hidden; background: #fff; display: flex; flex-direction: column; }
        .id-header { background: linear-gradient(135deg, #1a365d, #2563eb); color: #fff; padding: 4px 8px; display: flex; align-items: center; gap: 6px; }
        .id-logo { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(255,255,255,0.4); }
        .id-school { font-size: 9px; font-weight: 700; line-height: 1.2; }
        .id-campus { font-size: 6.5px; opacity: 0.85; }
        .id-body { flex: 1; display: flex; padding: 6px 8px; gap: 8px; }
        .id-photo { width: 60px; height: 75px; border: 1.5px solid #1a365d; border-radius: 4px; object-fit: cover; background: #f0f4f8; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .id-photo-placeholder { font-size: 7px; color: #94a3b8; text-align: center; padding: 4px; }
        .id-info { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 2px; }
        .id-name { font-size: 10px; font-weight: 700; color: #1a365d; }
        .id-detail { font-size: 7px; color: #475569; line-height: 1.4; }
        .id-detail strong { color: #1a365d; }
        .id-badge { display: inline-block; background: #1a365d; color: #fff; font-size: 6px; padding: 1px 5px; border-radius: 3px; font-weight: 600; text-transform: uppercase; }
        .id-footer { background: #f0f4f8; padding: 2px 8px; text-align: center; font-size: 6px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style></head><body>${content.outerHTML}</body></html>`);
    w.document.close();
    w.onload = () => { w.print(); w.onafterprint = () => w.close(); };
  };

  const typeLabel = data.type === "student" ? "STUDENT" : data.type === "teacher" ? "TEACHER" : "STAFF";

  return (
    <div className="inline-block">
      <div ref={cardRef} className="w-[3.375in] h-[2.125in] border-2 border-[hsl(var(--primary))] rounded-lg overflow-hidden bg-background flex flex-col shadow-lg" style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[hsl(222,47%,23%)] to-[hsl(217,91%,60%)] text-white px-2 py-1 flex items-center gap-1.5">
          <img src={logo} alt="Logo" className="w-7 h-7 rounded-full object-cover border border-white/40" />
          <div>
            <div className="text-[9px] font-bold leading-tight">{schoolName}</div>
            <div className="text-[6.5px] opacity-85">{campus}</div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex px-2 py-1.5 gap-2">
          <div className="w-[60px] h-[75px] border-[1.5px] border-[hsl(var(--primary))] rounded flex-shrink-0 overflow-hidden bg-muted flex items-center justify-center">
            {data.photo_url ? (
              <img src={data.photo_url} alt={data.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[7px] text-muted-foreground text-center px-1">No Photo</span>
            )}
          </div>
          <div className="flex-1 flex flex-col justify-center gap-0.5">
            <span className="inline-block bg-[hsl(222,47%,23%)] text-white text-[6px] px-1.5 py-[1px] rounded font-semibold uppercase w-fit">{typeLabel}</span>
            <div className="text-[10px] font-bold text-[hsl(222,47%,23%)] leading-tight">{data.name}</div>
            <div className="text-[7.5px] text-muted-foreground font-medium">{data.subtitle}</div>
            {data.extra_lines.map((line, i) => (
              <div key={i} className="text-[7px] text-muted-foreground leading-snug" dangerouslySetInnerHTML={{ __html: line }} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-muted/50 border-t border-border px-2 py-[2px] text-center text-[6px] text-muted-foreground">
          {phone} | If found, please return to {schoolName}
        </div>
      </div>

      <Button variant="outline" size="sm" className="mt-2" onClick={handlePrint}>
        <Printer className="mr-2 h-3.5 w-3.5" />Print ID Card
      </Button>
    </div>
  );
};

export default IDCard;
