# Test the webhook using PowerShell
# Run this in PowerShell from the dashboard directory

$body = @{
    message = @{
        timestamp = 1709232465976
        type = "end-of-call-report"
        cost = 0.0352
        durationSeconds = 15
        endedReason = "customer-ended-call"
        startedAt = "2025-02-13T00:00:00.000Z"
        transcript = "AI: Hello!`nUser: Hi there!"
        artifact = @{
            variables = @{
                phoneNumber = @{
                    orgId = "6a12163e-1f88-4b4e-a8c8-16a9f68dc1b3"
                    name = "Test Assistant"
                    number = "+16126423441"
                }
                customer = @{
                    number = "+19342034111"
                }
            }
        }
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "https://jlhrtipmazwousefzjqe.supabase.co/functions/v1/call-report" -Method Post -Body $body -ContentType "application/json"
