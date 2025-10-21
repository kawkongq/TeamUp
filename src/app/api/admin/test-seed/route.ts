import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Seed APIs are disabled. Use: npm run db:seed' },
    { status: 503 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'Seed APIs are disabled. Use: npm run db:seed' },
    { status: 503 }
  );
}
