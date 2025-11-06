import { NextRequest, NextResponse } from 'next/server';

/**
 * Timeline APIs are temporarily disabled during the MongoDB migration.
 * They currently respond with 503 to make the status explicit.
 */
export function PUT(_request: NextRequest) {
  return NextResponse.json(
    { error: 'This API is temporarily disabled during the MongoDB migration' },
    { status: 503 }
  );
}

export function DELETE(_request: NextRequest) {
  return NextResponse.json(
    { error: 'This API is temporarily disabled during the MongoDB migration' },
    { status: 503 }
  );
}
