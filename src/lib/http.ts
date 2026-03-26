import { NextResponse } from "next/server";

export function successResponse(data: unknown, message?: string, status = 200) {
  return NextResponse.json(
    {
      success: true,
      ...(message ? { message } : {}),
      data,
    },
    { status },
  );
}

export function errorResponse(message: string, status = 400, errors?: unknown) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...(errors ? { errors } : {}),
    },
    { status },
  );
}
