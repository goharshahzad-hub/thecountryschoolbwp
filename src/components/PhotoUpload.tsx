import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotoUploadProps {
  currentUrl: string;
  onUpload: (url: string) => void;
  folder: "students" | "teachers" | "staff";
  id: string;
}

const PhotoUpload = ({ currentUrl, onUpload, folder, id }: PhotoUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(currentUrl || "");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file (JPG, PNG)", variant: "destructive" });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 2MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${folder}/${id || Date.now()}.${fileExt}`;

    const { error } = await supabase.storage.from("photos").upload(filePath, file, { upsert: true });

    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("photos").getPublicUrl(filePath);
    setPreview(publicUrl);
    onUpload(publicUrl);
    setUploading(false);
    toast({ title: "Photo uploaded" });
  };

  const handleRemove = () => {
    setPreview("");
    onUpload("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="col-span-2 space-y-2">
      <label className="text-sm font-medium leading-none">Photograph</label>
      <div className="flex items-start gap-4">
        {/* Photo placeholder / preview */}
        <div className="relative flex-shrink-0 w-[120px] h-[150px] rounded-md border-2 border-dashed border-muted-foreground/30 bg-muted/20 flex items-center justify-center overflow-hidden">
          {preview ? (
            <>
              <img src={preview} alt="Photo" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-1 right-1 rounded-full bg-destructive/90 p-0.5 text-destructive-foreground hover:bg-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <Camera className="h-8 w-8 text-muted-foreground/40" />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-3.5 w-3.5" />
            {uploading ? "Uploading..." : "Upload Photo"}
          </Button>
          <div className="text-[10px] leading-tight text-muted-foreground space-y-0.5">
            <p className="font-medium">Photo Guidelines:</p>
            <p>• Passport size: 1×1.3 inches (300×390 px)</p>
            <p>• Format: JPG or PNG, max 2MB</p>
            <p>• White/light background, front-facing</p>
            <p>• Minimum resolution: 300 DPI</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoUpload;
