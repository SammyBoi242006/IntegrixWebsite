import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phoneNumber, assistantId, phoneNumberId, apiKey, userId, orgId, campaignId } = await req.json();

    if (!phoneNumber || !assistantId || !apiKey) {
      console.error("Missing required parameters:", { phoneNumber: !!phoneNumber, assistantId: !!assistantId, apiKey: !!apiKey });
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Triggering call for ${phoneNumber} using assistant ${assistantId}...`);

    // Call VAPI API
    const vapiHeaders: Record<string, string> = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    if (orgId) {
      vapiHeaders["x-vapi-org-id"] = orgId;
    }

    // Attach campaignId to the call using custom headers or metadata if VAPI supports it in headers?
    // Better to put it in the body as assistant overrides or customer metadata.
    // We will use customer.metadata to store campaignId safely.

    // Note: VAPI supports 'customer' object with 'metadata'.

    const response = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: vapiHeaders,
      body: JSON.stringify({
        assistantId: assistantId,
        phoneNumberId: phoneNumberId,
        customer: {
          number: phoneNumber,
          metadata: {
            campaignId: campaignId
          }
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("VAPI API Error Details:", JSON.stringify(data, null, 2));
      return new Response(
        JSON.stringify({
          error: "VAPI API Error",
          message: data.message || "Unknown VAPI error",
          details: data
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, callId: data.id, status: data.status }),
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
