import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { filaments, orders, printEntries, printers, userSettings, userProfiles } from '@/db/schema';
import { badRequest, getUserFromRequest, serverError, unauthorized } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    const scope = req.nextUrl.searchParams.get('scope') || 'user';
    const isSystemBackup = scope === 'system';

    if (isSystemBackup && !user.isAdmin) {
      return unauthorized();
    }

    type User = typeof userProfiles.$inferSelect;
    type Filament = typeof filaments.$inferSelect;
    type Printer = typeof printers.$inferSelect;
    type PrintEntry = typeof printEntries.$inferSelect;
    type Order = typeof orders.$inferSelect;
    type UserSetting = typeof userSettings.$inferSelect;

    let usersData: User[] = [];
    let filamentsData: Filament[] = [];
    let printersData: Printer[] = [];
    let printEntriesData: PrintEntry[] = [];
    let ordersData: Order[] = [];
    let userSettingsData: UserSetting[] = [];

    if (isSystemBackup) {
      [usersData, filamentsData, printersData, printEntriesData, ordersData, userSettingsData] =
        await Promise.all([
          db.query.userProfiles.findMany(),
          db.query.filaments.findMany(),
          db.query.printers.findMany(),
          db.query.printEntries.findMany(),
          db.query.orders.findMany(),
          db.query.userSettings.findMany(),
        ]);
    } else {
      // User scope backup
      [filamentsData, printersData, printEntriesData, ordersData, userSettingsData] =
        await Promise.all([
          db.query.filaments.findMany({ where: eq(filaments.userId, user.id) }),
          db.query.printers.findMany({ where: eq(printers.userId, user.id) }),
          db.query.printEntries.findMany({ where: eq(printEntries.userId, user.id) }),
          db.query.orders.findMany({ where: eq(orders.userId, user.id) }),
          db.query.userSettings.findMany({ where: eq(userSettings.userId, user.id) }),
        ]);
    }

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      type: isSystemBackup ? 'system' : 'user',
      userId: isSystemBackup ? undefined : user.id,
      data: {
        users: usersData,
        filaments: filamentsData,
        printers: printersData,
        printEntries: printEntriesData,
        orders: ordersData,
        userSettings: userSettingsData,
      },
    };

    const filename = isSystemBackup
      ? `backup-system-${new Date().toISOString().slice(0, 10)}.json`
      : `backup-user-${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Backup error:', error);
    return serverError();
  }
}

const mapDates = (item: unknown) => {
  if (typeof item !== 'object' || item === null) return item;

  const newItem = { ...(item as Record<string, unknown>) };
  for (const key in newItem) {
    if (newItem[key] && typeof newItem[key] === 'string') {
      if (
        (key.endsWith('At') ||
          key === 'date' ||
          key === 'deadline' ||
          key === 'purchaseDate' ||
          key === 'expiresAt') &&
        !Number.isNaN(Date.parse(newItem[key]))
      ) {
        newItem[key] = new Date(newItem[key]);
      }
    }
  }
  return newItem;
};

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    const body = await req.json();
    if (!body.data || !body.version) {
      return badRequest('Invalid backup file format');
    }

    const { data, type } = body;
    const isSystemRestore = type === 'system';

    if (isSystemRestore && !user.isAdmin) {
      return unauthorized();
    }

    // Transaction to ensure atomicity
    await db.transaction(async (tx) => {
      if (isSystemRestore) {
        // --- SYSTEM RESTORE (Admin only) ---
        // 1. Clean up existing data (Child tables first)
        await tx.delete(printEntries);
        await tx.delete(orders);
        await tx.delete(filaments);
        await tx.delete(printers);
        await tx.delete(userSettings);
        await tx.delete(userProfiles);

        // 2. Restore data (Parent tables first)
        // Note: userProfiles are managed by Supabase Auth, so we skip restoring them
        // Users should be restored through Supabase Admin API if needed
        if (data.userSettings?.length)
          await tx.insert(userSettings).values(data.userSettings.map(mapDates));
        if (data.printers?.length) await tx.insert(printers).values(data.printers.map(mapDates));
        if (data.filaments?.length) await tx.insert(filaments).values(data.filaments.map(mapDates));
        if (data.orders?.length) await tx.insert(orders).values(data.orders.map(mapDates));
        if (data.printEntries?.length)
          await tx.insert(printEntries).values(data.printEntries.map(mapDates));
      } else {
        // --- USER RESTORE ---
        // Determine what is being restored based on data presence
        const restorePrinters = !!data.printers?.length;
        const restoreFilaments = !!data.filaments?.length;
        const restoreOrders = !!data.orders?.length;
        const restorePrints = !!data.printEntries?.length;
        const restoreSettings = !!data.userSettings?.length;

        // 1. DELETE PHASE - Only safe to delete child tables or when wiping leaf nodes

        // If restoring prints, we must wipe existing prints for this user to avoid duplication/mess
        // (assuming "Restore" means "Replace" for transactional data like prints)
        if (restorePrints) {
          await tx.delete(printEntries).where(eq(printEntries.userId, user.id));
        }

        // If restoring orders, we can wipe orders. Prints referencing them will set orderId to null (onDelete: set null).
        // However, if we also restore prints, those new prints will reference these new orders correctly.
        if (restoreOrders) {
          await tx.delete(orders).where(eq(orders.userId, user.id));
        }

        // For Parents (Printers/Filaments), we cannot safely delete because unselected Prints might reference them.
        // We will use UPSERT (On Conflict Update) for them.

        // Settings - Safe to wipe and replace
        if (restoreSettings) {
          await tx.delete(userSettings).where(eq(userSettings.userId, user.id));
        }

        // 2. INSERT/UPSERT PHASE
        const forceUser = (item: unknown): any =>
          Object.assign({}, mapDates(item), { userId: user.id });

        if (restoreSettings && data.userSettings?.length) {
          await tx.insert(userSettings).values(data.userSettings.map(forceUser));
        }

        if (restorePrinters) {
          for (const item of data.printers) {
            const val = forceUser(item);
            await tx
              .insert(printers)
              .values(val)
              .onConflictDoUpdate({
                target: printers.id,
                set: {
                  name: val.name,
                  model: val.model,
                  power: val.power,
                  costPerHour: val.costPerHour,
                  purchaseDate: val.purchaseDate,
                  notes: val.notes,
                  isDefault: val.isDefault,
                  updatedAt: new Date(),
                },
              });
          }
        }

        if (restoreFilaments) {
          for (const item of data.filaments) {
            const val = forceUser(item);
            await tx
              .insert(filaments)
              .values(val)
              .onConflictDoUpdate({
                target: filaments.id,
                set: {
                  materialName: val.materialName,
                  brand: val.brand,
                  color: val.color,
                  colorHex: val.colorHex,
                  image: val.image,
                  materialType: val.materialType,
                  spoolPrice: val.spoolPrice,
                  spoolWeight: val.spoolWeight,
                  density: val.density,
                  costPerGram: val.costPerGram,
                  remainingWeight: val.remainingWeight,
                  notes: val.notes,
                  deletedAt: val.deletedAt,
                  updatedAt: new Date(),
                },
              });
          }
        }

        if (restoreOrders) {
          // We deleted orders above, so just insert.
          // BUT if we didn't delete (logic change?), wait.
          // We decided to delete orders because Prints have 'set null'.
          // So insert is fine.
          if (data.orders.length) {
            await tx.insert(orders).values(data.orders.map(forceUser) as any);
          }
        }

        if (restorePrints) {
          // We deleted prints above. Just insert.
          if (data.printEntries.length) {
            await tx.insert(printEntries).values(data.printEntries.map(forceUser) as any);
          }
        }
      }
    });

    return NextResponse.json({ success: true, message: 'Backup restored successfully' });
  } catch (error) {
    console.error('Restore error:', error);
    return serverError('Failed to restore backup');
  }
}
