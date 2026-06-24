import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/* BFF for multi-item checkout. The backend (CheckoutController::store) creates ONE DeviceOrder per
   call, so a multi-line cart is checked out by POSTing once per line with the SAME shipping info;
   we aggregate the per-line results. Auth is required (auth:sanctum): the client sends its Sanctum
   token as `Authorization: Bearer …`; missing/empty → 401 (the client then sends the user to login). */

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'https://api.track-any-device.com';

interface ShippingAddress {
  street: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
}

interface CheckoutLine {
  product_id: number;
  quantity: number;
}

interface CheckoutRequest {
  items: CheckoutLine[];
  shipping_name: string;
  shipping_phone: string;
  shipping_address: ShippingAddress;
}

interface LineResult {
  product_id: number;
  quantity: number;
  ok: boolean;
  status: number;
  /** The created DeviceOrder (on success) or the backend error body (on failure). */
  data: unknown;
  error?: string;
}

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get('Authorization');
  if (auth?.startsWith('Bearer ')) {
    const t = auth.slice(7).trim();
    return t.length ? t : null;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const token = getToken(req);
  if (!token) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as CheckoutRequest | null;
  const items = Array.isArray(body?.items) ? body!.items : [];
  if (!body || items.length === 0) {
    return NextResponse.json({ message: 'Your cart is empty.' }, { status: 422 });
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // One DeviceOrder per cart line, same shipping info. Sequential so a backend stock/limit error on
  // one line is reported precisely (and we don't hammer the API in parallel).
  const results: LineResult[] = [];
  for (const line of items) {
    const payload = {
      product_id: line.product_id,
      quantity: line.quantity,
      shipping_name: body.shipping_name,
      shipping_phone: body.shipping_phone,
      shipping_address: body.shipping_address,
    };

    try {
      const res = await fetch(`${API_URL}/api/shop/checkout`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      // If the backend rejects auth on any line, surface 401 immediately.
      if (res.status === 401) {
        return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
      }

      results.push({
        product_id: line.product_id,
        quantity: line.quantity,
        ok: res.ok,
        status: res.status,
        data,
        error: res.ok
          ? undefined
          : ((data as { message?: string })?.message ?? `Checkout failed (${res.status})`),
      });
    } catch {
      results.push({
        product_id: line.product_id,
        quantity: line.quantity,
        ok: false,
        status: 502,
        data: {},
        error: 'Could not reach the order service. Please try again.',
      });
    }
  }

  const orders = results.filter((r) => r.ok).map((r) => (r.data as { data?: unknown })?.data ?? r.data);
  const failures = results.filter((r) => !r.ok);

  // All lines failed → bubble up the most relevant status (first failure) so the UI shows the error.
  if (orders.length === 0) {
    return NextResponse.json(
      { message: failures[0]?.error ?? 'Checkout failed.', results },
      { status: failures[0]?.status ?? 502 },
    );
  }

  // Full or partial success. 207 (Multi-Status) when some lines failed so the client can warn.
  return NextResponse.json(
    { orders, results, partial: failures.length > 0 },
    { status: failures.length > 0 ? 207 : 201 },
  );
}
