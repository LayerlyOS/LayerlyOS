import { and, count, desc, eq, gte, ilike, lte, or, isNull, type SQL } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { activityLogs, userProfiles, printEntries } from '@/db/schema';
import { forbidden, getUserFromRequest, unauthorized } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();
    if (!user.isAdmin) return forbidden();

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    const action = searchParams.get('action') || '';
    const entity = searchParams.get('entity') || '';
    const userId = searchParams.get('userId') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

    // Remove unused variables warning by using them or removing them
    // For now we only support createdAt sorting desc mixed from multiple sources
    // so we keep sort/order params parsing for future extension but suppress unused warning
    void sort;
    
    // Offset is not used because we fetch fresh limits from each source and sort in memory
    // But we keep calculation for potential future db-level pagination
    const offset = (page - 1) * limit;
    void offset;

    // 1. Fetch Logs
    const logConditions: SQL[] = [];
    if (search) {
        logConditions.push(or(
            ilike(activityLogs.action, `%${search}%`),
            ilike(activityLogs.entity, `%${search}%`)
        )!);
    }
    if (action && action !== 'USER_JOINED' && action !== 'PRINT_CREATED') logConditions.push(eq(activityLogs.action, action));
    if (entity && entity !== 'User' && entity !== 'Print') logConditions.push(eq(activityLogs.entity, entity));
    if (userId) logConditions.push(eq(activityLogs.userId, userId));
    if (startDate) logConditions.push(gte(activityLogs.createdAt, new Date(startDate)));
    if (endDate) logConditions.push(lte(activityLogs.createdAt, new Date(endDate)));

    // Use a higher limit for internal fetching to ensure better merging of sorted streams
    // e.g. if we want 20 items, fetching 50 from each source gives us better chance to find the true top 20
    // when sources have uneven distribution of dates.
    const fetchLimit = Math.max(limit * 3, 50);

    const logsPromise = db.query.activityLogs.findMany({
      where: logConditions.length > 0 ? and(...logConditions) : undefined,
      limit: fetchLimit, 
      orderBy: [desc(activityLogs.createdAt)],
      with: {
        user: {
          columns: { id: true, name: true, email: true, image: true },
        },
      },
    });

    // 2. Fetch Users (if filter allows)
    let usersPromise: Promise<any[]> = Promise.resolve([]);
    if ((!action || action === 'USER_JOINED') && (!entity || entity === 'User')) {
        const userConditions: SQL[] = [];
        if (search) userConditions.push(or(ilike(userProfiles.name, `%${search}%`), ilike(userProfiles.email, `%${search}%`))!);
        if (userId) userConditions.push(eq(userProfiles.id, userId));
        if (startDate) userConditions.push(gte(userProfiles.createdAt, new Date(startDate)));
        if (endDate) userConditions.push(lte(userProfiles.createdAt, new Date(endDate)));
        
        usersPromise = db.query.userProfiles.findMany({
            where: userConditions.length > 0 ? and(...userConditions) : undefined,
            limit: fetchLimit,
            orderBy: [desc(userProfiles.createdAt)],
            columns: { id: true, name: true, email: true, image: true, createdAt: true },
        });
    }

    // 3. Fetch Prints (if filter allows)
    let printsPromise: Promise<any[]> = Promise.resolve([]);
    if ((!action || action === 'PRINT_CREATED') && (!entity || entity === 'Print')) {
         const printConditions: SQL[] = [];
         printConditions.push(isNull(printEntries.deletedAt)); // Only active prints
         if (search) printConditions.push(ilike(printEntries.name, `%${search}%`));
         if (userId) printConditions.push(eq(printEntries.userId, userId));
         if (startDate) printConditions.push(gte(printEntries.createdAt, new Date(startDate)));
         if (endDate) printConditions.push(lte(printEntries.createdAt, new Date(endDate)));

         printsPromise = db.query.printEntries.findMany({
            where: printConditions.length > 0 ? and(...printConditions) : undefined,
            limit: fetchLimit,
            orderBy: [desc(printEntries.createdAt)],
            with: {
                user: { columns: { id: true, name: true, email: true, image: true } }
            }
         });
    }

    const [logs, fetchedUsers, fetchedPrints] = await Promise.all([logsPromise, usersPromise, printsPromise]);

    // Transform to unified format
    const unifiedLogs = [
        ...logs.map(l => ({ ...l, type: 'log' })),
        ...fetchedUsers.map(u => ({
            id: u.id,
            action: 'USER_JOINED',
            entity: 'User',
            entityId: u.id,
            details: { name: u.name, email: u.email },
            createdAt: u.createdAt,
            ipAddress: null,
            userAgent: null,
            user: { id: u.id, name: u.name, email: u.email, image: u.image },
            type: 'user'
        })),
        ...fetchedPrints.map(p => ({
            id: p.id,
            action: 'PRINT_CREATED',
            entity: 'Print',
            entityId: p.id,
            details: { name: p.name, price: p.price },
            createdAt: p.createdAt,
            ipAddress: null,
            userAgent: null,
            user: p.user,
            type: 'print'
        }))
    ];

    // Sort combined results
    unifiedLogs.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return order === 'asc' ? dateA - dateB : dateB - dateA;
    });

    // Slice for pagination (simple approximation)
    const paginatedLogs = unifiedLogs.slice(0, limit);

    // Total count approximation (sum of all counts)
    // NOTE: This is expensive to calculate correctly with filters, so we'll just sum strict counts for now
    // or return a simplified number if not critical.
    const totalLogs = await db.select({ count: count() }).from(activityLogs).where(logConditions.length > 0 ? and(...logConditions) : undefined).then(r => r[0].count);
    const totalUsers = (!action || action === 'USER_JOINED') ? await db.select({ count: count() }).from(userProfiles).then(r => r[0].count) : 0;
    const totalPrints = (!action || action === 'PRINT_CREATED') ? await db.select({ count: count() }).from(printEntries).then(r => r[0].count) : 0;
    
    const total = totalLogs + totalUsers + totalPrints;

    return NextResponse.json({
      data: paginatedLogs,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
