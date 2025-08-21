import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Search, Upload, Users } from "lucide-react";
import ContactForm from "../components/ContactForm";
import ContactImport from "../components/ContactImport";

export default function Contacts() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const backend = useBackend();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contactsData, isLoading } = useQuery({
    queryKey: ["contacts", search],
    queryFn: () => backend.contacts.list({ search: search || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: backend.contacts.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setShowForm(false);
      toast({
        title: "Success",
        description: "Contact created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating contact:", error);
      toast({
        title: "Error",
        description: "Failed to create contact",
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: backend.contacts.importContacts,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setShowImport(false);
      toast({
        title: "Import Complete",
        description: `${result.imported} contacts imported, ${result.skipped} skipped`,
      });
    },
    onError: (error) => {
      console.error("Error importing contacts:", error);
      toast({
        title: "Error",
        description: "Failed to import contacts",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowImport(true)}
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Import CSV</span>
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Contact</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search contacts by name, email, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {contactsData?.total || 0}
              </p>
              <p className="text-sm text-gray-600">Total Contacts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts List */}
      <Card>
        <CardHeader>
          <CardTitle>All Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : contactsData?.contacts && contactsData.contacts.length > 0 ? (
            <div className="space-y-4">
              {contactsData.contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium text-gray-900">{contact.name}</h3>
                        <p className="text-sm text-gray-600">{contact.email}</p>
                      </div>
                      {contact.company && (
                        <Badge variant="secondary">{contact.company}</Badge>
                      )}
                      {contact.sector && (
                        <Badge variant="outline">{contact.sector}</Badge>
                      )}
                    </div>
                    {contact.phone && (
                      <p className="text-sm text-gray-500 mt-1">{contact.phone}</p>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new contact or importing from CSV.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Form Modal */}
      {showForm && (
        <ContactForm
          onSubmit={(data) => createMutation.mutate(data)}
          onClose={() => setShowForm(false)}
          isLoading={createMutation.isPending}
        />
      )}

      {/* Import Modal */}
      {showImport && (
        <ContactImport
          onImport={(data) => importMutation.mutate(data)}
          onClose={() => setShowImport(false)}
          isLoading={importMutation.isPending}
        />
      )}
    </div>
  );
}
