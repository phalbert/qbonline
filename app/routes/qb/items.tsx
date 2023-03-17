import { LoaderArgs } from "@remix-run/server-runtime";
import { getItems } from "~/qb.server";


export async function loader({ request }: LoaderArgs) {
    return await getItems(request);
}

