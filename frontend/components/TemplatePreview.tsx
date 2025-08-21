import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TemplatePreviewProps {
  template: any;
  onClose: () => void;
}

export default function TemplatePreview({ template, onClose }: TemplatePreviewProps) {
  const backend = useBackend();
  const [variables, setVariables] = useState<Record<string, string>>({
    nama: "John Doe",
    perusahaan: "Acme Corp",
    email: "john@acme.com",
  });

  const previewMutation = useMutation({
    mutationFn: (data: any) => backend.templates.preview(data),
  });

  const handlePreview = () => {
    previewMutation.mutate({
      subject: template.subject,
      htmlContent: template.htmlContent,
      variables,
    });
  };

  const handleVariableChange = (key: string, value: string) => {
    setVariables(prev => ({ ...prev, [key]: value }));
  };

  // Auto-preview on mount
  useState(() => {
    handlePreview();
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview: {template.name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Variables Panel */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Test Variables</h3>
            {template.variables && template.variables.length > 0 ? (
              <div className="space-y-3">
                {template.variables.map((variable: string) => (
                  <div key={variable} className="space-y-1">
                    <Label htmlFor={variable}>{variable}</Label>
                    <Input
                      id={variable}
                      value={variables[variable] || ""}
                      onChange={(e) => handleVariableChange(variable, e.target.value)}
                      placeholder={`Enter ${variable}`}
                    />
                  </div>
                ))}
                <Button onClick={handlePreview} className="w-full">
                  Update Preview
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No variables in this template</p>
            )}
          </div>
          
          {/* Preview Panel */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Email Preview</h3>
            {previewMutation.data ? (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <p className="text-sm text-gray-600">Subject:</p>
                  <p className="font-medium">{previewMutation.data.subject}</p>
                </div>
                <div className="p-4">
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: previewMutation.data.htmlContent.replace(/\n/g, '<br>') 
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center">
                <p className="text-gray-500">
                  {previewMutation.isPending ? "Loading preview..." : "Click 'Update Preview' to see the email"}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
