import { createServerClient } from "@supabase/auth-helpers-remix"


export function getSupabase(request: Request) {
    const response = new Response()
    const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
        request,
        response,
    })
    return supabase;
}

export async function getUserById(request: Request, userId: string) {
    return await getSupabase(request).from("users").select().eq('id', userId);
}