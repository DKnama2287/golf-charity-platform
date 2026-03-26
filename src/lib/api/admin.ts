export async function getAdminOverview() {
  const response = await fetch("/api/v1/admin/reports/summary", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load admin overview.");
  }

  return response.json();
}

export async function getAdminUsers() {
  const response = await fetch("/api/v1/admin/users", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load admin users.");
  }

  return response.json();
}

export async function getAdminCharities() {
  const response = await fetch("/api/v1/admin/charities", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load admin charities.");
  }

  return response.json();
}

export async function simulateAdminDraw(payload: {
  drawMonth: string;
  mode: "random" | "algorithm";
}) {
  const response = await fetch("/api/v1/draws/simulate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to simulate draw.");
  }

  return response.json();
}

export async function runAdminDraw(payload: {
  drawMonth: string;
  mode: "random" | "algorithm";
}) {
  const response = await fetch("/api/v1/draws/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to run draw.");
  }

  return response.json();
}

export async function reviewWinnerVerification(
  verificationId: string,
  payload: { status: "approved" | "rejected"; rejectionReason?: string },
) {
  const response = await fetch(`/api/v1/admin/verifications/${verificationId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to review winner verification.");
  }

  return response.json();
}
