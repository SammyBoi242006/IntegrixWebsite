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
    const { contacts, assistantId, phoneNumberId, apiKey, name, scheduledAt, orgId } = await req.json();

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

    const response = await fetch("https://api.vapi.ai/campaign", {
      method: "POST",
      headers: vapiHeaders,
      body: JSON.stringify({
        name: name || `Campaign - ${new Date().toISOString()}`,
        assistantId: assistantId,
        phoneNumberId: phoneNumberId,
        customers: contacts.map((phone: string) => ({ number: phone })),
        ...(scheduledAt && { scheduledAt })
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("VAPI Campaign Error Details:", JSON.stringify(data, null, 2));
      return new Response(
        JSON.stringify({
          error: "VAPI Campaign API Error",
          message: data.message || "Unknown VAPI error",
          details: data
        }),
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
