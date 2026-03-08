import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GalleryItem } from "@/hooks/useWebsiteContent";

interface GalleryManagerProps {
  gallery: GalleryItem[];
  setGallery: (gallery: GalleryItem[]) => void;
}

const GalleryManager = ({ gallery, setGallery }: GalleryManagerProps) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `gallery/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("photos").upload(path, file);
    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);
    setGallery([...gallery, { url: urlData.publicUrl, caption: "" }]);
    setUploading(false);
    toast.success("Image uploaded!");
    if (fileRef.current) fileRef.current.value = "";
  };

  const updateCaption = (index: number, caption: string) => {
    const updated = [...gallery];
    updated[index] = { ...updated[index], caption };
    setGallery(updated);
  };

  const removeImage = (index: number) => {
    setGallery(gallery.filter((_, i) => i !== index));
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display">Photo Gallery</CardTitle>
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
            {uploading ? "Uploading..." : "Add Photo"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {gallery.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No gallery images yet. Click "Add Photo" to upload.</p>
        )}
        {gallery.map((item, i) => (
          <div key={i} className="flex items-center gap-3 rounded-md border border-border p-3">
            <img src={item.url} alt={item.caption || "Gallery"} className="h-16 w-16 rounded-md object-cover" />
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Caption</Label>
              <Input value={item.caption} onChange={e => updateCaption(i, e.target.value)} placeholder="Optional caption" />
            </div>
            <Button variant="ghost" size="icon" onClick={() => removeImage(i)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default GalleryManager;
