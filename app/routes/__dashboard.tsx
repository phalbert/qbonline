import { Outlet } from "@remix-run/react";
import DashboardLayout from "~/components/layouts/main";

export default function Auth() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
