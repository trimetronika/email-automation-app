import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Send, BarChart3, Play } from "lucide-react";
import CampaignForm from "../components/CampaignForm";
import CampaignStats from "../components/CampaignStats";

export default function Campaigns() {
  const [showForm, setShowForm] = useState(false);
  const [statsCampaign, setStatsCampaign] = useState<any>(null);
  const backend = useBackend();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: campaignsData, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => backend.campaigns.list(),
  });

  const createMutation = useMutation({
    mutationFn: backend.campaigns.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setShowForm(false);
      toast({
        title: "Success",
        description: "Campaign created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating campaign:", error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    },
  });

  const sendMutation = useMutation({
    mutationFn: (campaignId: number) => backend.campaigns.send({ campaignId }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({
        title: "Campaign Sent",
        description: result.message,
      });
    },
    onError: (error) => {
      console.error("Error sending campaign:", error);
      toast({
        title: "Error",
        description: "Failed to send campaign",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "sending":
        return "bg-blue-100 text-blue-800";
      case "scheduled":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const canSendCampaign = (campaign: any) => {
    return campaign.status === "draft" || campaign.status === "scheduled";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Email Campaigns</h1>
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Campaign</span>
        </Button>
      </div>

      {/* Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Send className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {campaignsData?.campaigns?.length || 0}
              </p>
              <p className="text-sm text-gray-600">Total Campaigns</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : campaignsData?.campaigns && campaignsData.campaigns.length > 0 ? (
            <div className="space-y-4">
              {campaignsData.campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                        <p className="text-sm text-gray-600">
                          {campaign.sentCount} of {campaign.totalRecipients} emails sent
                        </p>
                        {campaign.scheduledAt && (
                          <p className="text-xs text-gray-500">
                            Scheduled for {new Date(campaign.scheduledAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Created {new Date(campaign.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStatsCampaign(campaign)}
                      className="flex items-center space-x-1"
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Stats</span>
                    </Button>
                    {canSendCampaign(campaign) && (
                      <Button
                        size="sm"
                        onClick={() => sendMutation.mutate(campaign.id)}
                        disabled={sendMutation.isPending}
                        className="flex items-center space-x-1"
                      >
                        <Play className="h-4 w-4" />
                        <span>Send Now</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Send className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first email campaign.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign Form Modal */}
      {showForm && (
        <CampaignForm
          onSubmit={(data) => createMutation.mutate(data)}
          onClose={() => setShowForm(false)}
          isLoading={createMutation.isPending}
        />
      )}

      {/* Campaign Stats Modal */}
      {statsCampaign && (
        <CampaignStats
          campaign={statsCampaign}
          onClose={() => setStatsCampaign(null)}
        />
      )}
    </div>
  );
}
