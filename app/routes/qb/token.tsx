import { LoaderArgs } from "@remix-run/server-runtime";
import { getSupabase } from "~/supabase.server";


export async function loader({ request }: LoaderArgs) {
    const url = new URL(request.url);
    const realmId = url.searchParams.get("realmId");

    return await getSupabase(request).from('tokens').select().eq('realm_id', realmId).single();
}
