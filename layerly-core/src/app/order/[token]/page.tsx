import { eq } from 'drizzle-orm';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Logo } from '@/components/layout/Logo';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { formatCurrency } from '@/lib/format';

interface PublicOrderPageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicOrderPage({ params }: PublicOrderPageProps) {
  const { token } = await params;

  const order = await db.query.orders.findFirst({
    where: eq(orders.shareToken, token),
    with: {
      printEntries: {
        with: {
          filament: true,
        },
      },
      user: {
        columns: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!order) {
    return notFound();
  }

  // Calculate totals
  const totalCost = order.printEntries.reduce((acc, item) => {
    const qty = item.qty || 1;
    const price = item.price || 0;
    return acc + price * qty;
  }, 0);

  const totalItems = order.printEntries.reduce((acc, item) => acc + (item.qty || 1), 0);

  // Prepare email content
  // Try to reconstruct the public URL (this is server side, so we use env or a placeholder)
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000';
  const publicUrl = `${baseUrl}/order/${token}`;

  const subject = encodeURIComponent(`Quote acceptance: ${order.title}`);

  const body = encodeURIComponent(
    `Hello,\n\nI accept the quote for the order: ${order.title}\nAmount to pay: ${formatCurrency(totalCost)}\nQuote link: ${publicUrl}\n\n---\nMy shipping / invoice details:\nName / Company: \nVAT ID (optional): \nAddress: \nPhone: \nDelivery method (Pickup/Courier): \n\n---\nAdditional notes:\n\n\nBest regards,\n`
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <div className="w-40 sm:w-48">
              <Logo variant="dark" />
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2" />
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Order Quote</h1>
              <p className="text-xs text-slate-500">#{order.title}</p>
            </div>
          </Link>
          {order.customerName && (
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                For client
              </p>
              <p className="font-medium text-slate-800">{order.customerName}</p>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h2 className="font-bold text-slate-700">Order items</h2>
                <span className="text-sm font-medium text-slate-500">
                  {totalItems} pcs
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {order.printEntries.map((item) => (
                  <div key={item.id} className="p-6 flex gap-4 items-start sm:items-center">
                    {/* Image / Icon */}
                    <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center relative">
                      {item.filament?.image ? (
                        <Image
                          src={item.filament.image}
                          alt="Filament"
                          fill
                          sizes="64px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div
                          className="w-full h-full"
                          style={{
                            backgroundColor:
                              item.filament?.colorHex?.split(',')[0] || item.color || '#cbd5e1',
                          }}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 text-lg truncate">{item.name}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-slate-300"
                            style={{
                              backgroundColor:
                                item.filament?.colorHex?.split(',')[0] || item.color || '#cbd5e1',
                            }}
                          ></span>
                          {item.brand || item.filament?.brand}{' '}
                          {item.filament?.materialName || 'Material'}
                        </span>
                        {item.weight > 0 && (
                          <span className="flex items-center gap-1">
                            <i className="fa-solid fa-weight-hanging text-slate-400 text-xs"></i>
                            {item.weight}g
                          </span>
                        )}
                        {(item.timeH > 0 || item.timeM > 0) && (
                          <span className="flex items-center gap-1">
                            <i className="fa-regular fa-clock text-slate-400 text-xs"></i>
                            {item.timeH}h {item.timeM}m
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-slate-400 font-medium mb-0.5">
                        {item.qty} x {formatCurrency(item.price)}
                      </div>
                      <div className="font-bold text-slate-900 text-lg">
                        {formatCurrency(item.price * (item.qty || 1))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {order.notes && (
              <div className="bg-blue-50 text-blue-800 p-6 rounded-2xl border border-blue-100 text-sm leading-relaxed">
                <p className="font-bold mb-1 flex items-center gap-2">
                  <i className="fa-solid fa-circle-info"></i> Order notes
                </p>
                {order.notes}
              </div>
            )}
          </div>

          {/* Right Column: Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
              <div className="p-6 space-y-4">
                <h3 className="font-bold text-slate-800 text-lg">Summary</h3>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between text-slate-600 text-sm">
                    <span>Total items</span>
                    <span className="font-medium">{totalItems}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-sm">
                    <span>Deadline</span>
                    <span className="font-medium">
                      {order.deadline
                        ? new Date(order.deadline).toLocaleDateString('en-GB')
                        : 'To be agreed'}
                    </span>
                  </div>

                  <div className="border-t border-dashed border-slate-200 my-4 pt-4 flex justify-between items-baseline">
                    <span className="font-bold text-slate-800 text-lg">Amount due</span>
                    <span className="font-extrabold text-slate-900 text-3xl">
                      {formatCurrency(totalCost)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <Link
                    href={`mailto:${order.user.email}?subject=${subject}&body=${body}`}
                    className="block w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-xl font-bold shadow-lg shadow-blue-200 transition-all"
                  >
                    Accept / Contact
                  </Link>
                </div>

                <p className="text-xs text-center text-slate-400 pt-2">
                  Quote prepared by: {order.user.name || order.user.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
