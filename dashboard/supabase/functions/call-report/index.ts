import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VAPIWebhook {
  message: {
    timestamp: number;
    type: string;
    cost: number;
    durationSeconds: number;
    endedReason: string;
    startedAt: string;
    transcript: string;
    artifact: {
      variables: {
        phoneNumber: {
          orgId: string;
          name: string;
          number: string;
        };
        customer: {
          number: string;
        };
      };
    };
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Log headers for debugging
    const headers: Record<string, string> = {};
    req.headers.forEach((value: string, key: string) => {
      headers[key] = value;
    });
    console.log("Request Headers:", JSON.stringify(headers, null, 2));

    // Parse webhook payload
    const payload = await req.json();
    console.log("Received VAPI webhook body keys:", Object.keys(payload));

    const message = payload.message || {};
    const call = message.call || payload.call || {};
    const artifact = message.artifact || payload.artifact || {};
    const variables = artifact.variables || {};

    // Extract recording URL from artifact
    const recordingUrl =
      artifact.recordingUrl ||
      artifact.recordingURL ||
      artifact.recording_url ||
      artifact.recording?.url ||
      artifact.recording?.URL ||
      message.recordingUrl ||
      message.recordingURL ||
      call.recordingUrl ||
      call.recordingURL ||
      payload.recordingUrl ||
      payload.recordingURL ||
      "";

    // Super Robust Extraction Logic for org_id
    // Check multiple common VAPI payload paths and field names
    const orgId =
      message.orgId ||
      message.organizationId ||
      call.orgId ||
      call.organizationId ||
      payload.orgId ||
      payload.organizationId ||
      variables.orgId ||
      variables.organizationId ||
      variables.phoneNumber?.orgId ||
      headers["x-vapi-org-id"] ||
      headers["x-org-id"];

    // Extract other metadata with fallbacks
    const assistantName =
      message.assistant?.name ||
      call.assistant?.name ||
      variables.phoneNumber?.name ||
      "Unknown Assistant";

    const assistantPhoneNumber =
      message.phoneNumber?.number ||
      call.phoneNumber?.number ||
      variables.phoneNumber?.number ||
      "N/A";

    const customerPhoneNumber =
      message.customer?.number ||
      call.customer?.number ||
      variables.customer?.number ||
      "N/A";

    const transcript = message.transcript || call.transcript || payload.transcript || "";
    const callType = message.type || payload.type || "unknown";
    const endedReason = message.endedReason || call.endedReason || payload.endedReason || "unknown";

    // EXTRACT VAPI CALL ID FOR DEDUPLICATION
    const vapiCallId = call.id || message.callId || payload.callId;

    // Parse timestamp
    const rawTimestamp = message.startedAt || call.startedAt || message.timestamp || payload.timestamp;
    const startTime = rawTimestamp ? new Date(rawTimestamp).toISOString() : new Date().toISOString();

    const durationSeconds = Math.round(message.durationSeconds || call.durationSeconds || payload.durationSeconds || 0);
    const costUsd = message.cost || call.cost || payload.cost || 0;

    console.log("Extracted Data:", {
      orgIdFound: !!orgId,
      orgId: orgId,
      callType,
      vapiCallId,
      assistantName,
      hasRecording: !!recordingUrl
    });

    // FILTER: Only process the final report to avoid duplicate records for one call
    // VAPI sends many events (conversation-update, etc.) - we only want the end report.
    if (callType !== "end-of-call-report") {
      console.log(`Ignoring webhook event type: ${callType}. We only record 'end-of-call-report'.`);
      return new Response(
        JSON.stringify({
          success: true,
          message: `Event type '${callType}' ignored. Only 'end-of-call-report' is recorded.`
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate org_id exists
    if (!orgId) {
      console.error("CRITICAL: Missing org_id in VAPI webhook payload.");
      return new Response(
        JSON.stringify({
          error: "Missing org_id in webhook payload",
          message: "Could not find orgId or organizationId in common paths. Please provide your orgId in the request headers or check the payload structure.",
          debug: {
            payload_keys: Object.keys(payload),
            payload_sample: JSON.stringify(payload).substring(0, 500)
          }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up user by org_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("org_id", orgId)
      .single();

    if (profileError || !profile) {
      console.error(`ERROR: Profile not found for org_id: ${orgId}`, profileError);
      return new Response(
        JSON.stringify({
          error: "User not found for org_id",
          org_id: orgId
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Insert call record with UPSERT logic to prevent duplicates if VAPI retries
    const { data: insertedCall, error: insertError } = await supabase
      .from("calls")
      .upsert({
        user_id: profile.id,
        org_id: orgId,
        vapi_call_id: vapiCallId,
        assistant_name: assistantName,
        assistant_phone_number: assistantPhoneNumber,
        customer_phone_number: customerPhoneNumber,
        transcript: transcript,
        recording_url: recordingUrl,
        call_type: callType,
        ended_reason: endedReason,
        start_time: startTime,
        duration_seconds: durationSeconds,
        cost_usd: costUsd,
      }, {
        onConflict: 'vapi_call_id',
        ignoreDuplicates: false // We want to update with the latest data if it's the same call
      })
      .select()
      .single();

    if (insertError) {
      console.error("ERROR: Failed to insert/update call record:", insertError);
      return new Response(
        JSON.stringify({
          error: "Failed to process call record",
          details: insertError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("SUCCESS: Call record processed:", insertedCall.call_id);

    return new Response(
      JSON.stringify({
        success: true,
        call_id: insertedCall.call_id,
        message: "Call record processed successfully"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: (error as Error).message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
