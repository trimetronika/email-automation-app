import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, FileText } from "lucide-react";

interface ContactImportProps {
  onImport: (data: any) => void;
  onClose: () => void;
  isLoading: boolean;
}

export default function ContactImport({ onImport, onClose, isLoading }: ContactImportProps) {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const contacts = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const contact: any = {};
          
          headers.forEach((header, index) => {
            const value = values[index] || '';
            switch (header) {
              case 'name':
              case 'nama':
                contact.name = value;
                break;
              case 'email':
                contact.email = value;
                break;
              case 'company':
              case 'perusahaan':
                contact.company = value;
                break;
              case 'sector':
              case 'sektor':
                contact.sector = value;
                break;
              case 'phone':
              case 'telepon':
                contact.phone = value;
                break;
              case 'notes':
              case 'catatan':
                contact.notes = value;
                break;
            }
          });
          
          return contact;
        })
        .filter(contact => contact.name && contact.email);
      
      setCsvData(contacts);
    };
    
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (csvData.length > 0) {
      onImport({ contacts: csvData });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Contacts from CSV</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>CSV File</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Choose CSV File</span>
                </Button>
              </div>
              {fileName && (
                <p className="mt-2 text-sm text-gray-600">{fileName}</p>
              )}
            </div>
          </div>
          
          {csvData.length > 0 && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  {csvData.length} contacts ready to import
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  Expected columns: name, email, company, sector, phone, notes
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={isLoading || csvData.length === 0}
            >
              {isLoading ? "Importing..." : `Import ${csvData.length} Contacts`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
