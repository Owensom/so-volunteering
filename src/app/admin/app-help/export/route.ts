import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SupportAdminRow = {
  user_id: string;
};

type SupportRequestRow = {
  id: string;
  user_id: string | null;
  user_type: string;
  name: string | null;
  email: string | null;
  category: string;
  message: string;
  status: string;
  page_context: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

function formatCategory(category: string) {
  if (category === "stuck_using_app") return "Stuck using the app";
  if (category === "something_not_working") return "Something is not working";
  if (category === "account_or_profile") return "Account or profile help";
  if (category === "opportunity_help") return "Opportunity help";
  if (category === "report_problem") return "Report a problem";
  if (category === "safety_or_safeguarding") {
    return "Safety or safeguarding concern";
  }

  return category;
}

function formatStatus(status: string) {
  if (status === "reviewing") return "Reviewing";
  if (status === "resolved") return "Resolved";
  if (status === "closed") return "Closed";
  return "New";
}

function formatUserType(userType: string) {
  if (userType === "organisation") return "Organisation";
  if (userType === "volunteer") return "Volunteer";
  return "Unknown";
}

function csvCell(value: string | null | undefined) {
  const safeValue = value ?? "";
  return `"${safeValue.replaceAll('"', '""')}"`;
}

function formatCsvDate(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(date);
}

function buildCsv(rows: SupportRequestRow[]) {
  const headers = [
    "Request ID",
    "Submitted",
    "Updated",
    "User type",
    "Name",
    "Email",
    "Category",
    "Status",
    "Page / area",
    "Message",
    "Internal note",
    "Linked user ID",
  ];

  const csvRows = rows.map((request) => [
    request.id,
    formatCsvDate(request.created_at),
    formatCsvDate(request.updated_at),
    formatUserType(request.user_type),
    request.name ?? "",
    request.email ?? "",
    formatCategory(request.category),
    formatStatus(request.status),
    request.page_context ?? "",
    request.message,
    request.admin_note ?? "",
    request.user_id ?? "",
  ]);

  return [
    headers.map(csvCell).join(","),
    ...csvRows.map((row) => row.map(csvCell).join(",")),
  ].join("\n");
}

function buildFileName() {
  const today = new Date().toISOString().slice(0, 10);
  return `so-volunteering-app-help-requests-${today}.csv`;
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: supportAdmin } = await supabase
    .from("support_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle<SupportAdminRow>();

  if (!supportAdmin) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const { data: requests, error } = await supabase
    .from("support_requests")
    .select(
      "id,user_id,user_type,name,email,category,message,status,page_context,admin_note,created_at,updated_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Could not export app help requests" },
      { status: 500 },
    );
  }

  const rows = (requests as SupportRequestRow[] | null) ?? [];
  const csv = buildCsv(rows);
  const fileName = buildFileName();

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
