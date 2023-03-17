import { ActionArgs, json, redirect } from "@remix-run/server-runtime";
import * as crypto from "crypto";


export const action = async ({ request }: ActionArgs) => {
    
    var webhookPayload = JSON.stringify(request.body);

    if (request.method !== "POST") {
      return json({ message: "Method not allowed" }, 405);
    }
    const payload = await request.json();
  
    /* Validate the webhook */
    const signature = request.headers.get(
      "X-Hub-Signature-256"
    );

    /**
     * Validates the payload with the intuit-signature hash
     */
    var hash = crypto.createHmac('sha256', "config.webhooksVerifier").update(webhookPayload).digest('base64');
    

    if (signature !== hash) {
      return json({ message: "Signature mismatch" }, 401);
    }
  
    /* process the webhook (e.g. enqueue a background job) */
    console.log(payload);
  
    return json({ success: true }, 200);
  };