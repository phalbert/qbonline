import type { ActionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import * as React from "react";


import { getSupabase } from "~/supabase.server";

export async function action({ request }: ActionArgs) {

  const formData = await request.formData();
  const name = formData.get("name");
  const email = formData.get("email");
  const tin = formData.get("tin");
  const deviceno = formData.get("device_no");

  if (typeof name !== "string" || name.length === 0) {
    return json(
      { errors: { name: "Name is required", email: null } },
      { status: 400 }
    );
  }

  if (typeof email !== "string" || email.length === 0) {
    return json(
      { errors: { email: "Email is required", name: null } },
      { status: 400 }
    );
  }

  const { data, error, status } = await getSupabase(request)
    .from("entities")
    .insert({
      name,
      email,
      tin,
      deviceno,
      meta: {
        should_invoice: true,
        should_receipt: false,
        commodity_code: "801992"
      }
    })
    .select()

  if (error) {
    return json(
      { errors: { email: error.message, name: null } },
      { status: status }
    );
  }

  console.log(data)

  return redirect(`/notes/${data[0].id}`);
}

export default function NewNotePage() {
  const actionData = useActionData<typeof action>();
  const nameRef = React.useRef<HTMLInputElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const tinRef = React.useRef<HTMLInputElement>(null);
  const devicenoRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (actionData?.errors?.name) {
      nameRef.current?.focus();
    } else if (actionData?.errors?.email) {
      emailRef.current?.focus();
    }
  }, [actionData]);

  return (
    <Form
      method="post"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
      }}
    >
      <div className="flex w-full space-x-4">
        <div>
          <label className="flex w-full flex-col gap-1">
            <span>Name: </span>
            <input
              ref={nameRef}
              name="name"
              className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
              aria-invalid={actionData?.errors?.name ? true : undefined}
              aria-errormessage={
                actionData?.errors?.name ? "title-error" : undefined
              }
            />
          </label>
          {actionData?.errors?.name && (
            <div className="pt-1 text-red-700" id="title-error">
              {actionData.errors.name}
            </div>
          )}
        </div>
        <div>
          <label className="flex w-full flex-col gap-1">
            <span>Email: </span>
            <input
              ref={nameRef}
              name="email"
              type="email"
              className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
              aria-invalid={actionData?.errors?.email ? true : undefined}
              aria-errormessage={
                actionData?.errors?.name ? "title-error" : undefined
              }
            />
          </label>
          {actionData?.errors?.email && (
            <div className="pt-1 text-red-700" id="title-error">
              {actionData.errors.email}
            </div>
          )}
        </div>
      </div>
      <div className="flex w-full space-x-4">
        <div>
          <label className="flex w-full flex-col gap-1">
            <span>TIN: </span>
            <input
              ref={tinRef}
              name="tin"
              className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
            />
          </label>
        </div>
        <div>
          <label className="flex w-full flex-col gap-1">
            <span>Device No: </span>
            <input
              ref={devicenoRef}
              name="device_no"
              className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
            />
          </label>
        </div>
      </div>


      <div className="text-right">
        <button
          type="submit"
          className="rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Save
        </button>
      </div>
    </Form>
  );
}
