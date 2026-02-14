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
    const { contacts, assistantId, phoneNumberId, apiKey, name, scheduledAt } = await req.json();

    if (!contacts || !assistantId || !apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters (contacts, assistantId, apiKey)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a VAPI Campaign
    // Based on https://docs.vapi.ai/api-reference/campaigns/campaign-controller-create
    const response = await fetch("https://api.vapi.ai/campaign", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name || `Campaign - ${new Date().toISOString()}`,
        assistantId: assistantId,
        phoneNumberId: phoneNumberId,
        customers: contacts.map((phone: string) => ({ number: phone })),
        // Include scheduledAt if provided
        ...(scheduledAt && { scheduledAt })
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("VAPI Campaign Error:", data);
      return new Response(
        JSON.stringify({ error: "VAPI Campaign API Error", details: data }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      JSON.stringify({ error: "Internal server error", details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
