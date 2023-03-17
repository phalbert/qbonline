import { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { getReceipts, updateReceipt } from "~/qb.server";


export async function loader({ request }: LoaderArgs) {
    return await getReceipts(request);
}

export async function action({ request }: ActionArgs) {
    return updateReceipt(request)
}