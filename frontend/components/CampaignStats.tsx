import { useQuery } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BarChart3, Mail, Eye, MousePointer, AlertCircle } from "lucide-react";

interface CampaignStatsProps {
  campaign: any;
  onClose: () => void;
}

export default function CampaignStats({ campaign, onClose }: CampaignStatsProps) {
  const backend = useBackend();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["campaign-stats", campaign.id],
    queryFn: () => backend.campaigns.getStats({ campaignId: campaign.id }),
  });

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Campaign Statistics</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const statCards = [
    {
      title: "Total Recipients",
      value: stats?.totalRecipients || 0,
      icon: Mail,
      color: "text-blue-600",
    },
    {
      title: "Emails Sent",
      value: stats?.sentCount || 0,
      icon: BarChart3,
      color: "text-green-600",
    },
    {
      title: "Failed",
      value: stats?.failedCount || 0,
      icon: AlertCircle,
      color: "text-red-600",
    },
    {
      title: "Opened",
      value: stats?.openedCount || 0,
      icon: Eye,
      color: "text-purple-600",
    },
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Campaign Statistics: {campaign.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {statCards.map((stat) => (
              <Card key={stat.title}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Rates */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Open Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.openRate?.toFixed(1) || 0}%
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Click Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.clickRate?.toFixed(1) || 0}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Campaign Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium">{campaign.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span>{new Date(campaign.createdAt).toLocaleString()}</span>
                </div>
                {campaign.scheduledAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Scheduled:</span>
                    <span>{new Date(campaign.scheduledAt).toLocaleString()}</span>
                  </div>
                )}
                {campaign.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span>{new Date(campaign.completedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
