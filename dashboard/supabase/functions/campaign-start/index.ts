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

    // Build VAPI payload
    const vapiPayload: any = {
      assistantId: assistantId,
      customer: {
        number: phoneNumber
      },
      metadata: {
        campaignId: campaignId
      }
    };

    if (phoneNumberId) {
      vapiPayload.phoneNumberId = phoneNumberId;
    }

    console.log(`Sending request to VAPI for ${phoneNumber}...`);

    const response = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: vapiHeaders,
      body: JSON.stringify(vapiPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("VAPI API Error Details:", JSON.stringify(data, null, 2));

      const errorMessage = data.message || (data.error && typeof data.error === 'string' ? data.error : "Unknown VAPI error");

      return new Response(
        JSON.stringify({
          success: false,
          error: "VAPI API Error",
          message: errorMessage,
          vapiStatus: response.status,
          details: data
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, callId: data.id, status: data.status }),
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
