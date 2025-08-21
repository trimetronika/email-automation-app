import { api } from "encore.dev/api";
import { campaignsDB } from "../campaigns/db";
import { contactsDB } from "../contacts/db";
import { templatesDB } from "../templates/db";

export interface DashboardOverview {
  totalContacts: number;
  totalTemplates: number;
  totalCampaigns: number;
  recentCampaigns: {
    id: number;
    name: string;
    status: string;
    sentCount: number;
    totalRecipients: number;
    createdAt: Date;
  }[];
  emailsSentToday: number;
  emailsThisMonth: number;
}

// Gets dashboard overview statistics.
export const getOverview = api<void, DashboardOverview>(
  { auth: false, expose: true, method: "GET", path: "/dashboard/overview" },
  async () => {
    // For development, use a default user ID
    const userId = "dev-user-1";

    // Get total counts
    const contactCount = await contactsDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM contacts WHERE user_id = ${userId}
    `;

    const templateCount = await templatesDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM email_templates WHERE user_id = ${userId} AND is_active = true
    `;

    const campaignCount = await campaignsDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM campaigns WHERE user_id = ${userId}
    `;

    // Get recent campaigns
    const recentCampaigns = await campaignsDB.queryAll<{
      id: number;
      name: string;
      status: string;
      sent_count: number;
      total_recipients: number;
      created_at: Date;
    }>`
      SELECT id, name, status, sent_count, total_recipients, created_at
      FROM campaigns 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 5
    `;

    // Get emails sent today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const emailsToday = await campaignsDB.queryRow<{ total: number }>`
      SELECT COALESCE(SUM(sent_count), 0) as total
      FROM campaigns 
      WHERE user_id = ${userId} AND completed_at >= ${today}
    `;

    // Get emails sent this month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const emailsThisMonth = await campaignsDB.queryRow<{ total: number }>`
      SELECT COALESCE(SUM(sent_count), 0) as total
      FROM campaigns 
      WHERE user_id = ${userId} AND completed_at >= ${monthStart}
    `;

    return {
      totalContacts: contactCount?.count || 0,
      totalTemplates: templateCount?.count || 0,
      totalCampaigns: campaignCount?.count || 0,
      recentCampaigns: recentCampaigns.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        sentCount: campaign.sent_count,
        totalRecipients: campaign.total_recipients,
        createdAt: campaign.created_at,
      })),
      emailsSentToday: emailsToday?.total || 0,
      emailsThisMonth: emailsThisMonth?.total || 0,
    };
  }
);
