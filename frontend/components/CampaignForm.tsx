import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CampaignFormProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
  isLoading: boolean;
}

export default function CampaignForm({ onSubmit, onClose, isLoading }: CampaignFormProps) {
  const backend = useBackend();
  const [formData, setFormData] = useState({
    name: "",
    templateId: "",
    contactIds: [] as number[],
    scheduledAt: "",
  });

  const { data: templatesData } = useQuery({
    queryKey: ["templates"],
    queryFn: () => backend.templates.list(),
  });

  const { data: contactsData } = useQuery({
    queryKey: ["contacts-all"],
    queryFn: () => backend.contacts.list({ limit: 1000 }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      templateId: parseInt(formData.templateId),
      scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt) : undefined,
    };
    onSubmit(submitData);
  };

  const handleContactToggle = (contactId: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      contactIds: checked
        ? [...prev.contactIds, contactId]
        : prev.contactIds.filter(id => id !== contactId)
    }));
  };

  const selectAllContacts = () => {
    const allIds = contactsData?.contacts.map(c => c.id) || [];
    setFormData(prev => ({ ...prev, contactIds: allIds }));
  };

  const clearAllContacts = () => {
    setFormData(prev => ({ ...prev, contactIds: [] }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Email Campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Q1 Product Launch"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="template">Email Template *</Label>
            <Select
              value={formData.templateId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, templateId: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templatesData?.templates.map((template) => (
                  <SelectItem key={template.id} value={template.id.toString()}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Schedule (Optional)</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
            />
            <p className="text-xs text-gray-500">
              Leave empty to create as draft. You can send it manually later.
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Recipients * ({formData.contactIds.length} selected)</Label>
              <div className="space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAllContacts}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearAllContacts}
                >
                  Clear All
                </Button>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
              {contactsData?.contacts && contactsData.contacts.length > 0 ? (
                contactsData.contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`contact-${contact.id}`}
                      checked={formData.contactIds.includes(contact.id)}
                      onCheckedChange={(checked) => 
                        handleContactToggle(contact.id, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`contact-${contact.id}`}
                      className="text-sm flex-1 cursor-pointer"
                    >
                      <span className="font-medium">{contact.name}</span>
                      <span className="text-gray-500 ml-2">{contact.email}</span>
                      {contact.company && (
                        <span className="text-gray-400 ml-2">({contact.company})</span>
                      )}
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No contacts available. Create some contacts first.
                </p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || formData.contactIds.length === 0}
            >
              {isLoading ? "Creating..." : "Create Campaign"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
