import { ActionArgs, json } from "@remix-run/server-runtime";
import * as crypto from "crypto";
import { getSupabase } from "~/supabase.server";


export const action = async ({ request }: ActionArgs) => {

  // Verify the signature of the webhook event
  const signature = request.headers.get('intuit-signature');
  const payload = await request.json();

  if (signature) return json({ msg: 'Invalid signature' }, 401);

  // const secret = '48effaa9-5726-47a8-8048-a1d12bc010e4'; // replace with your actual webhook secret
  // const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('base64');

  // if (signature !== expectedSignature) {
  //   console.error('Invalid webhook signature');
  //   return json({ msg: 'Invalid signature' }, 400);
  // }

  const realmEvents = payload.eventNotifications[0].dataChangeEvent.entities

  console.log(realmEvents)

  for (const event of realmEvents) {
    if (["Invoice", "SaleReceipt", "Item"].includes(event.name) && event.operation === "Create") {
      await getSupabase(request).from("qb_events").insert({
        qb_id: event.id,
        name: event.name,
        operation: event.operation,
        updated_at: event.lastUpdated
      })
    }
  }

  return json({ success: true }, 200);
};