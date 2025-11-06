import { NextRequest, NextResponse } from 'next/server';

/**
 * Event resource APIs are temporarily disabled during the MongoDB migration.
 */
export function GET(_request: NextRequest) {
  return NextResponse.json(
    { error: 'This API is temporarily disabled during the MongoDB migration' },
    { status: 503 }
  );
}

export function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: 'This API is temporarily disabled during the MongoDB migration' },
    { status: 503 }
  );
}
