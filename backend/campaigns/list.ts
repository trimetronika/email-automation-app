import { api } from "encore.dev/api";
import { campaignsDB } from "./db";
import type { Campaign } from "./create";

export interface ListCampaignsResponse {
  campaigns: Campaign[];
}

// Lists all campaigns for the current user.
export const list = api<void, ListCampaignsResponse>(
  { auth: false, expose: true, method: "GET", path: "/campaigns" },
  async () => {
    // For development, use a default user ID
    const userId = "dev-user-1";

    const campaigns = await campaignsDB.queryAll<Campaign>`
      SELECT id, name, template_id as "templateId", user_id as "userId", status, 
             scheduled_at as "scheduledAt", started_at as "startedAt", completed_at as "completedAt",
             total_recipients as "totalRecipients", sent_count as "sentCount", failed_count as "failedCount",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM campaigns 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return { campaigns };
  }
);
