import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useCatch, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { getSupabase } from "~/supabase.server";

export async function loader({ request, params }: LoaderArgs) {
  invariant(params.noteId, "noteId not found");

  const { data, error, status } = await getSupabase(request)
    .from('entities')
    .select()
    .eq('id', params.noteId);
  
    console.log(error)
  if (error) {
    throw new Response(error.message, { status });
  }
  return json({ item: data[0] });
}

export async function action({ request, params }: ActionArgs) {
  invariant(params.noteId, "noteId not found");

  await getSupabase(request).from('entities')
    .delete()
    .eq('id', params.noteId)

  return redirect("/notes");
}

export default function NoteDetailsPage() {
  const { item } = useLoaderData<typeof loader>();

  return (
    <div>
      <h3 className="text-2xl font-bold">{item.name}</h3>
      <p>{item.email}</p>
      <p>{item.tin}</p>
      <p>{item.deviceno}</p>
      <hr className="my-4" />
      <div className="flex space-x-4">
        <Form method="post">
          <button
            type="submit"
            className="rounded bg-green-700  py-2 px-4 text-white hover:bg-green-800 focus:bg-green-400"
          >
            Get Quickbooks Config
          </button>
        </Form>
        <Form method="post">
          <button
            type="submit"
            className="rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
          >
            Delete
          </button>
        </Form>
      </div>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return <div>An unexpected error occurred: {error.message}</div>;
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return <div>Note not found</div>;
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}
