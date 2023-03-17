import { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { getInvoices, updateInvoice } from "~/qb.server";


export async function loader({ request }: LoaderArgs) {
    return await getInvoices(request);
}

export async function action({ request }: ActionArgs) {
    return updateInvoice(request)
}