'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input, Button, Card, Badge } from '@/components/ui';
import { useCart, formatPkr } from '@/lib/cart';
import { getAuthToken } from '@/lib/auth-store';

/* Cash-on-Delivery checkout (PKR), wired to the backend. Reads the real cart, requires a signed-in
   user (Sanctum), and POSTs each cart line to the BFF (/api/shop/checkout), which fans out to the
   backend's one-DeviceOrder-per-call endpoint. Clears the cart and confirms on success. */

interface ShippingForm {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

const EMPTY: ShippingForm = {
  name: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'Pakistan',
};

export function CheckoutClient() {
  const router = useRouter();
  const { items, subtotal, count, ready, clear } = useCart();
  const [form, setForm] = React.useState<ShippingForm>(EMPTY);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [warning, setWarning] = React.useState<string | null>(null);
  const [orderCount, setOrderCount] = React.useState(0);
  const [done, setDone] = React.useState(false);

  const set = (k: keyof ShippingForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setWarning(null);

    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    // Auth gate — checkout requires a signed-in user. The httpOnly session cookie isn't readable
    // here, so we use the client auth-store token (set on sign-in) as the signal and the Bearer.
    const token = getAuthToken();
    if (!token) {
      router.push('/login?next=/checkout');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: items.map((i) => ({ product_id: i.productId, quantity: i.qty })),
          shipping_name: form.name.trim(),
          shipping_phone: form.phone.trim(),
          shipping_address: {
            street: form.street.trim(),
            city: form.city.trim(),
            state: form.state.trim() || undefined,
            postal_code: form.postal_code.trim(),
            country: form.country.trim() || 'Pakistan',
          },
        }),
      });

      if (res.status === 401) {
        router.push('/login?next=/checkout');
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok && res.status !== 207) {
        setError(data?.message ?? 'We couldn’t place your order. Please check your details and try again.');
        return;
      }

      // Success (201) or partial success (207). Clear the cart and confirm.
      const placed = Array.isArray(data?.orders) ? data.orders.length : 0;
      setOrderCount(placed);
      if (data?.partial) {
        const failed = Array.isArray(data?.results)
          ? data.results.filter((r: { ok: boolean }) => !r.ok)
          : [];
        const first = failed[0]?.error;
        setWarning(
          `${placed} of ${items.length} item${items.length === 1 ? '' : 's'} ordered. ${
            first ?? 'Some items could not be ordered.'
          } We’ll call to sort out the rest.`,
        );
      }
      clear();
      setDone(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Card>
        <div className="grid place-items-center gap-3 p-8 text-center">
          <Badge variant="success" dot>Order placed</Badge>
          <h2 className="text-[length:var(--text-2xl)] font-extrabold">Thank you!</h2>
          <p className="max-w-[420px] text-[var(--text-secondary)]">
            We&apos;ve received {orderCount === 1 ? 'your order' : `${orderCount} orders`} and will call to confirm your
            cash-on-delivery {orderCount === 1 ? 'delivery' : 'deliveries'} shortly.
          </p>
          {warning && (
            <p className="max-w-[420px] text-[length:var(--text-sm)]" style={{ color: 'var(--warning)' }}>{warning}</p>
          )}
          <div className="mt-1 flex flex-wrap justify-center gap-3">
            <Link href="/my/orders" className="tad-btn tad-btn--primary">View my orders</Link>
            <Link href="/shop" className="tad-btn tad-btn--secondary">Continue shopping</Link>
          </div>
        </div>
      </Card>
    );
  }

  if (ready && items.length === 0) {
    return (
      <Card>
        <div className="grid place-items-center gap-3 p-10 text-center">
          <h2 className="text-[length:var(--text-2xl)] font-extrabold">Your cart is empty</h2>
          <p className="max-w-[380px] text-[var(--text-secondary)]">Add a device to your cart before checking out.</p>
          <Link href="/shop" className="tad-btn tad-btn--primary tad-btn--lg">Browse the shop</Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
      <form onSubmit={handleSubmit} className="grid gap-4">
        <h2 className="text-[length:var(--text-xl)] font-bold">Delivery details</h2>
        {error && (
          <div
            className="rounded-[var(--radius-lg)] px-4 py-3 text-[length:var(--text-sm)]"
            style={{ color: 'var(--danger)', background: 'var(--danger-bg)', border: '1px solid color-mix(in srgb, var(--danger) 28%, transparent)' }}
          >
            {error}
          </div>
        )}
        <Input label="Full name" required placeholder="Your name" value={form.name} onChange={set('name')} />
        <Input label="Phone" required mono placeholder="03xx xxxxxxx" value={form.phone} onChange={set('phone')} />
        <Input label="Street address" required placeholder="House, street, area" value={form.street} onChange={set('street')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="City" required placeholder="Lahore" value={form.city} onChange={set('city')} />
          <Input label="Province / State" placeholder="Punjab" value={form.state} onChange={set('state')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Postal code" required mono placeholder="54000" value={form.postal_code} onChange={set('postal_code')} />
          <Input label="Country" required placeholder="Pakistan" value={form.country} onChange={set('country')} />
        </div>
        <Button type="submit" size="lg" block loading={busy} disabled={busy || !ready}>
          {busy ? 'Placing order…' : 'Place order · Cash on delivery'}
        </Button>
        <p className="text-center text-[length:var(--text-xs)] text-[var(--text-muted)]">
          No online payment — pay in cash when your device is delivered.
        </p>
      </form>

      <Card
        title="Order summary"
        footer={
          <div className="flex items-center justify-between">
            <span className="font-bold">Total</span>
            <span className="tad-data text-[length:var(--text-lg)] font-semibold">{formatPkr(subtotal)}</span>
          </div>
        }
      >
        <div className="grid gap-3">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between gap-3">
              <span>
                {item.name}
                <br />
                <span className="tad-data text-[length:var(--text-xs)] text-[var(--text-muted)]">{item.sku} · ×{item.qty}</span>
              </span>
              <span className="tad-data">{formatPkr(item.price * item.qty)}</span>
            </div>
          ))}
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Delivery</span>
            <span className="tad-data">Free</span>
          </div>
          <Badge variant="brand">Cash on delivery · PKR · {count} item{count === 1 ? '' : 's'}</Badge>
        </div>
      </Card>
    </div>
  );
}
