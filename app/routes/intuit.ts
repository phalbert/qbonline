import { LoaderArgs } from "@remix-run/node";


export async function loader({ params }: LoaderArgs) {

  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
    },
  });
}