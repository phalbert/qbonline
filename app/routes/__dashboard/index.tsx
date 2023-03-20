import { json, LoaderArgs } from "@remix-run/node";
import { authenticate } from "~/qb.server";
import { setSesisonData } from "~/session.server";
import { getSupabase } from "~/supabase.server";


export async function loader({ request }: LoaderArgs) {

  const url = new URL(request.url);
  const authResult = {
    code: url.searchParams.get("code"),
    state: url.searchParams.get("state"),
    realmId: url.searchParams.get("realmId")
  }

  var result = await authenticate(request.url);

  if (result) {
    const { data } = await getSupabase(request).from('entities')
      .select()
      .limit(1)
      .single()

    const token = result?.token;
    if (token) {
      const tokenObj = {
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        access_expires_in: token.expires_in,
        refresh_expires_in: token.x_refresh_token_expires_in,
      }

      const { count } = await getSupabase(request).from('tokens').select().eq('realm_id', token.realmId)

      if (count! > 0) {
        await getSupabase(request).from('tokens')
          .update({
            ...tokenObj,
            updated_at: new Date()
          }).eq('realm_id', token.realmId)
      }
      else {
        await getSupabase(request).from('tokens')
          .upsert({
            realm_id: token.realmId,
            ...tokenObj,
            entity_id: data?.id,
            updated_at: new Date()
          })
      }
      await setSesisonData(request, "meta", token);
    }
  }


  return json(authResult);
}

export default function Index() {

  return (
    <form method="post" action="/qb">
      <button
        className="flex items-center justify-center rounded-md border border-transparent"
        type="submit"
      >
        <img
          src="C2QB_white_btn_lg_default.png"
          alt=""
          className="h-10"
        />
      </button>
    </form>
  );
}
