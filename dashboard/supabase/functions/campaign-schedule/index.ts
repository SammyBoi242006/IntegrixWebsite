import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { contacts, assistantId, phoneNumberId, apiKey, name, scheduledAt, orgId, campaignId } = await req.json();

    if (!contacts || !assistantId || !apiKey) {
      console.error("Missing required parameters:", { contacts: !!contacts, assistantId: !!assistantId, apiKey: !!apiKey });
      return new Response(
        JSON.stringify({ error: "Missing required parameters (contacts, assistantId, apiKey)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Scheduling campaign "${name}" for ${contacts.length} contacts...`);

    // Call VAPI API
    const vapiHeaders: Record<string, string> = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    if (orgId) {
      vapiHeaders["x-vapi-org-id"] = orgId;
    }

    // VAPI Scheduling logic
    let earliestAt = scheduledAt || new Date().toISOString();
    // Ensure accurate ISO string without fractional seconds
    earliestAt = new Date(earliestAt).toISOString().split('.')[0] + 'Z';

    // VAPI requires a latestAt time, and it MUST be within 1 hour of earliestAt
    const latestAt = new Date(new Date(earliestAt).getTime() + 55 * 60 * 1000).toISOString().split('.')[0] + 'Z';

    const vapiPayload: any = {
      name: name || `Campaign - ${new Date().toISOString()}`,
      assistantId: assistantId,
      customers: contacts.map((phone: string) => ({
        number: phone,
        assistantOverrides: {
          variableValues: {
            campaignId: campaignId
          }
        }
      })),
      schedulePlan: {
        earliestAt: earliestAt,
        latestAt: latestAt
      }
    };

    if (phoneNumberId) {
      vapiPayload.phoneNumberId = phoneNumberId;
    }

    console.log("VAPI Project Payload (v4):", JSON.stringify(vapiPayload, null, 2));

    const response = await fetch("https://api.vapi.ai/campaign", {
      method: "POST",
      headers: vapiHeaders,
      body: JSON.stringify(vapiPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("VAPI Campaign Error Details:", JSON.stringify(data, null, 2));
      return new Response(
        JSON.stringify({
          success: false,
          error: "VAPI Campaign API Error",
          message: data.message || "Unknown VAPI error",
          details: data
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        campaignId: data.id,
        message: "VAPI Campaign created successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        message: (error as Error).message,
        details: error
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
