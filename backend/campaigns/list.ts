import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { campaignsDB } from "./db";
import type { Campaign } from "./create";

export interface ListCampaignsResponse {
  campaigns: Campaign[];
}

// Lists all campaigns for the current user.
export const list = api<void, ListCampaignsResponse>(
  { auth: true, expose: true, method: "GET", path: "/campaigns" },
  async () => {
    const auth = getAuthData()!;

    const campaigns = await campaignsDB.queryAll<Campaign>`
      SELECT id, name, template_id as "templateId", user_id as "userId", status, 
             scheduled_at as "scheduledAt", started_at as "startedAt", completed_at as "completedAt",
             total_recipients as "totalRecipients", sent_count as "sentCount", failed_count as "failedCount",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM campaigns 
      WHERE user_id = ${auth.userID}
      ORDER BY created_at DESC
    `;

    return { campaigns };
  }
);
