import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

const generateCuid = () => createId();

// Enums
export const monitorTypeEnum = pgEnum('monitor_type', ['HTTP', 'PING']);
export const monitorStatusEnum = pgEnum('monitor_status', [
  'operational',
  'degraded',
  'down',
  'maintenance',
]);
export const incidentStatusEnum = pgEnum('incident_status', [
  'investigating',
  'identified',
  'monitoring',
  'resolved',
]);
export const incidentSeverityEnum = pgEnum('incident_severity', [
  'operational',
  'degraded',
  'major_outage',
  'maintenance',
]);

// Tables
export const statusPageAdmins = pgTable('status_page_admins', {
  id: text('id')
    .primaryKey()
    .$defaultFn(generateCuid),
  userId: uuid('user_id').notNull(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const barIntervalEnum = pgEnum('bar_interval', ['hourly', '6h', 'daily']);

export const statusPageConfig = pgTable('status_page_config', {
  id: text('id')
    .primaryKey()
    .$defaultFn(generateCuid),
  name: text('name').notNull().default('Status Page'),
  description: text('description'),
  logoUrl: text('logo_url'),
  customDomain: text('custom_domain'),
  barInterval: text('bar_interval').notNull().default('hourly'),
  notificationEmail: text('notification_email'),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// Monitor Groups (Components)
export const monitorGroups = pgTable('monitor_groups', {
  id: text('id')
    .primaryKey()
    .$defaultFn(generateCuid),
  name: text('name').notNull(),
  description: text('description'),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const monitors = pgTable(
  'monitors',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(generateCuid),
    name: text('name').notNull(),
    url: text('url').notNull(),
    type: monitorTypeEnum('type').notNull().default('HTTP'),
    intervalMinutes: integer('interval_minutes').notNull().default(5),
    status: monitorStatusEnum('status').notNull().default('operational'),
    lastCheckedAt: timestamp('last_checked_at', { mode: 'date', withTimezone: true }),
    responseTimeMs: integer('response_time_ms'),
    groupId: text('group_id').references(() => monitorGroups.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('monitors_status_idx').on(table.status)]
);

export const monitorChecks = pgTable(
  'monitor_checks',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(generateCuid),
    monitorId: text('monitor_id')
      .notNull()
      .references(() => monitors.id, { onDelete: 'cascade' }),
    status: monitorStatusEnum('status').notNull(),
    responseTimeMs: integer('response_time_ms'),
    checkedAt: timestamp('checked_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('monitor_checks_monitor_idx').on(table.monitorId),
    index('monitor_checks_checked_at_idx').on(table.checkedAt),
  ]
);

// Maintenance Windows
export const maintenanceWindows = pgTable(
  'maintenance_windows',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(generateCuid),
    title: text('title').notNull(),
    description: text('description'),
    startsAt: timestamp('starts_at', { mode: 'date', withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { mode: 'date', withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('maintenance_windows_starts_idx').on(table.startsAt),
    index('maintenance_windows_ends_idx').on(table.endsAt),
  ]
);

export const incidents = pgTable(
  'incidents',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(generateCuid),
    title: text('title').notNull(),
    description: text('description'),
    status: incidentStatusEnum('status').notNull().default('investigating'),
    severity: incidentSeverityEnum('severity').notNull().default('major_outage'),
    startedAt: timestamp('started_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
    resolvedAt: timestamp('resolved_at', { mode: 'date', withTimezone: true }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('incidents_status_idx').on(table.status),
    index('incidents_started_at_idx').on(table.startedAt),
  ]
);

export const incidentUpdates = pgTable(
  'incident_updates',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(generateCuid),
    incidentId: text('incident_id')
      .notNull()
      .references(() => incidents.id, { onDelete: 'cascade' }),
    message: text('message').notNull(),
    status: incidentStatusEnum('status').notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('incident_updates_incident_idx').on(table.incidentId)]
);

export const subscribers = pgTable('subscribers', {
  id: text('id')
    .primaryKey()
    .$defaultFn(generateCuid),
  email: text('email').notNull(),
  verified: boolean('verified').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Relations
export const monitorGroupsRelations = relations(monitorGroups, ({ many }) => ({
  monitors: many(monitors),
}));

export const monitorsRelations = relations(monitors, ({ many, one }) => ({
  checks: many(monitorChecks),
  group: one(monitorGroups, { fields: [monitors.groupId], references: [monitorGroups.id] }),
}));

export const monitorChecksRelations = relations(monitorChecks, ({ one }) => ({
  monitor: one(monitors),
}));

export const incidentUpdatesRelations = relations(incidentUpdates, ({ one }) => ({
  incident: one(incidents),
}));

export const incidentsRelations = relations(incidents, ({ many }) => ({
  updates: many(incidentUpdates),
}));
