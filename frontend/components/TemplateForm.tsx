import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TemplateFormProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
  isLoading: boolean;
}

export default function TemplateForm({ onSubmit, onClose, isLoading }: TemplateFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    htmlContent: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById("htmlContent") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.htmlContent;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = before + `{{${variable}}}` + after;
      
      setFormData(prev => ({ ...prev, htmlContent: newText }));
      
      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
      }, 0);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Email Template</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g., Welcome Email"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              placeholder="e.g., Welcome to {{perusahaan}}, {{nama}}!"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="htmlContent">Email Content *</Label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-600">Quick variables:</span>
                {["nama", "perusahaan", "email"].map((variable) => (
                  <Button
                    key={variable}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertVariable(variable)}
                    className="text-xs"
                  >
                    {`{{${variable}}}`}
                  </Button>
                ))}
              </div>
              <Textarea
                id="htmlContent"
                value={formData.htmlContent}
                onChange={(e) => handleChange("htmlContent", e.target.value)}
                placeholder="Dear {{nama}},&#10;&#10;Welcome to our service! We're excited to have {{perusahaan}} as our partner.&#10;&#10;Best regards,&#10;The Team"
                rows={10}
                required
              />
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Use variables like {`{{nama}}`} and {`{{perusahaan}}`} to personalize your emails. 
              These will be automatically replaced with contact information when sending.
            </p>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Template"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
