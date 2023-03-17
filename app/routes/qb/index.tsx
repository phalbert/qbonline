import { ActionArgs, redirect } from "@remix-run/server-runtime";
import { authorise } from "~/qb.server";

export async function action({ request }: ActionArgs) {
    const uri = await authorise();
    return redirect(uri);
}