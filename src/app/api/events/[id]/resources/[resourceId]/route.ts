import { NextRequest, NextResponse } from 'next/server';

/**
 * Resource APIs are temporarily disabled during the MongoDB migration.
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
