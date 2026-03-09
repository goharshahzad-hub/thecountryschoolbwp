import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { classOptions } from "@/lib/constants";
import { format } from "date-fns";

interface DiaryEntry {
  id: string;
  class_name: string;
  section: string;
  subject: string;
  homework_text: string;
  date: string;
}

interface DiaryWhatsAppProps {
  entries: DiaryEntry[];
}

const DiaryWhatsApp = ({ entries }: DiaryWhatsAppProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("A");
  const [sending, setSending] = useState(false);

  const todayEntries = entries.filter(e => {
    if (selectedClass && e.class_name !== selectedClass) return false;
    if (selectedSection && e.section !== selectedSection) return false;
    return true;
  });

  const buildMessage = () => {
    if (todayEntries.length === 0) return "";
    const date = todayEntries[0]?.date ? format(new Date(todayEntries[0].date), "dd MMM yyyy") : "";
    let msg = `📚 *The Country School — Diary*\n📅 ${date}\n📖 Class: ${selectedClass}-${selectedSection}\n\n`;
    todayEntries.forEach(e => {
      msg += `📝 *${e.subject}*\n${e.homework_text}\n\n`;
    });
    msg += `_Please ensure your child completes the homework._`;
    return msg;
  };

  const handleSendToParents = async () => {
    if (!selectedClass) {
      toast({ title: "Select a class first", variant: "destructive" });
      return;
    }
    if (todayEntries.length === 0) {
      toast({ title: "No diary entries found for this class", variant: "destructive" });
      return;
    }

    setSending(true);
    // Fetch students with WhatsApp numbers for the selected class
    const { data: students } = await supabase
      .from("students")
      .select("name, whatsapp, phone")
      .eq("class", selectedClass)
      .eq("section", selectedSection)
      .eq("status", "Active");

    setSending(false);

    if (!students || students.length === 0) {
      toast({ title: "No students found in this class", variant: "destructive" });
      return;
    }

    const message = encodeURIComponent(buildMessage());
    const contacts = students
      .map(s => s.whatsapp || s.phone)
      .filter(Boolean);

    if (contacts.length === 0) {
      toast({ title: "No WhatsApp numbers found for students", variant: "destructive" });
      return;
    }

    // Open WhatsApp for first contact, show list for rest
    const firstNumber = contacts[0]!.replace(/[^0-9+]/g, "");
    window.open(`https://wa.me/${firstNumber}?text=${message}`, "_blank");

    toast({
      title: `WhatsApp opened for ${contacts.length} parents`,
      description: "Message pre-filled. Send to each parent individually or use WhatsApp Web broadcast.",
    });
    setOpen(false);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <MessageSquare className="mr-2 h-4 w-4 text-green-600" />WhatsApp Alert
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              Send Diary via WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {classOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedClass && (
              <div className="rounded-md border bg-muted/50 p-3 text-sm">
                <p className="font-medium mb-1">Preview ({todayEntries.length} entries):</p>
                <pre className="whitespace-pre-wrap text-xs text-muted-foreground max-h-[200px] overflow-y-auto">
                  {buildMessage() || "No entries found."}
                </pre>
              </div>
            )}

            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={handleSendToParents}
              disabled={sending || !selectedClass}
            >
              {sending ? "Loading..." : "📱 Send to Parents' WhatsApp"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Opens WhatsApp with pre-filled message. Use broadcast for multiple parents.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DiaryWhatsApp;
