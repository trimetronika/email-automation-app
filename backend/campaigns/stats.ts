import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { campaignsDB } from "./db";

export interface CampaignStatsRequest {
  campaignId: number;
}

export interface CampaignStats {
  campaignId: number;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  openedCount: number;
  clickedCount: number;
  openRate: number;
  clickRate: number;
}

// Gets statistics for a specific campaign.
export const getStats = api<CampaignStatsRequest, CampaignStats>(
  { auth: true, expose: true, method: "GET", path: "/campaigns/:campaignId/stats" },
  async (req) => {
    const auth = getAuthData()!;

    // Get campaign basic stats
    const campaign = await campaignsDB.queryRow<{
      total_recipients: number;
      sent_count: number;
      failed_count: number;
    }>`
      SELECT total_recipients, sent_count, failed_count
      FROM campaigns 
      WHERE id = ${req.campaignId} AND user_id = ${auth.userID}
    `;

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Get engagement stats
    const engagement = await campaignsDB.queryRow<{
      opened_count: number;
      clicked_count: number;
    }>`
      SELECT 
        COUNT(CASE WHEN status IN ('opened', 'clicked') THEN 1 END) as opened_count,
        COUNT(CASE WHEN status = 'clicked' THEN 1 END) as clicked_count
      FROM campaign_recipients 
      WHERE campaign_id = ${req.campaignId}
    `;

    const openedCount = engagement?.opened_count || 0;
    const clickedCount = engagement?.clicked_count || 0;
    const sentCount = campaign.sent_count;

    return {
      campaignId: req.campaignId,
      totalRecipients: campaign.total_recipients,
      sentCount: sentCount,
      failedCount: campaign.failed_count,
      openedCount: openedCount,
      clickedCount: clickedCount,
      openRate: sentCount > 0 ? (openedCount / sentCount) * 100 : 0,
      clickRate: sentCount > 0 ? (clickedCount / sentCount) * 100 : 0,
    };
  }
);
