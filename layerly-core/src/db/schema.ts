import crypto from 'node:crypto';
import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// Helper for CUID generation
const generateCuid = () => createId();
// Helper for UUID generation
const generateUuid = () => crypto.randomUUID();

// Enums
export const orderStatusEnum = pgEnum('OrderStatus', [
  'QUOTE',
  'IN_PRODUCTION',
  'READY',
  'SHIPPED',
]);

// --- Supabase Auth Models ---
// Note: auth.users is managed by Supabase Auth
// user_profiles extends auth.users with application-specific data

export const userProfiles = pgTable(
  'user_profiles',
  {
    id: uuid('id').primaryKey(), // References auth.users(id)
    email: text('email').notNull(),
    name: text('name'),
    image: text('image'),
    isAdmin: boolean('is_admin').default(false).notNull(),
    role: text('role').default('USER').notNull(), // USER, ADMIN
    twoFactorEnabled: boolean('two_factor_enabled').default(false).notNull(),
    subscriptionTier: text('subscription_tier').default('HOBBY').notNull(), // HOBBY, MAKER, FARM
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('user_profiles_email_idx').on(table.email),
    // Foreign key to auth.users is handled by Supabase, not Drizzle
  ]
);

export const passwordResetTokens = pgTable(
  'password_reset_token',
  {
    id: text('id').primaryKey().$defaultFn(generateCuid),
    userId: uuid('userId').notNull(), // References user_profiles.id
    tokenHash: text('tokenHash').notNull(),
    expiresAt: timestamp('expiresAt', { mode: 'date', withTimezone: true }).notNull(),
    usedAt: timestamp('usedAt', { mode: 'date', withTimezone: true }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('password_reset_token_user_idx').on(table.userId),
    index('password_reset_token_expires_idx').on(table.expiresAt),
  ]
);

// --- Business Models ---

export const notifications = pgTable(
  'notification',
  {
    id: text('id').primaryKey().$defaultFn(generateCuid),
    userId: uuid('userId').notNull(), // References user_profiles.id (which references auth.users.id)
    type: text('type').notNull(), // INFO, SUCCESS, WARNING, ERROR, SYSTEM
    title: text('title').notNull(),
    message: text('message').notNull(),
    link: text('link'),
    isRead: boolean('isRead').default(false).notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('notification_userId_idx').on(table.userId),
    index('notification_isRead_idx').on(table.isRead),
    foreignKey({
      name: 'notification_user_fk',
      columns: [table.userId],
      foreignColumns: [userProfiles.id],
    }).onDelete('cascade'),
  ]
);

export const subscriptionPlans = pgTable('subscription_plan', {
  id: text('id').primaryKey(), // 'HOBBY', 'MAKER', 'FARM'
  name: text('name').notNull(),
  maxFilaments: integer('maxFilaments').notNull(),
  maxPrinters: integer('maxPrinters').notNull(),
  pdfExport: boolean('pdfExport').default(false).notNull(),
  clientManagement: boolean('clientManagement').default(false).notNull(),
  ordersAccess: boolean('ordersAccess').default(false).notNull(),
  csvExport: boolean('csvExport').default(false).notNull(),
  advancedAnalytics: boolean('advancedAnalytics').default(false).notNull(),
  multiUser: boolean('multiUser').default(false).notNull(),
  prioritySupport: boolean('prioritySupport').default(false).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const activityLogs = pgTable(
  'activity_log',
  {
    id: text('id').primaryKey().$defaultFn(generateUuid),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: text('entityId'),
    details: jsonb('details'),
    userId: uuid('userId').notNull(), // References user_profiles.id
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('activity_log_userId_idx').on(table.userId),
    index('activity_log_action_idx').on(table.action),
    index('activity_log_entity_idx').on(table.entity),
    index('activity_log_createdAt_idx').on(table.createdAt),
    foreignKey({
      name: 'activity_log_user_fk',
      columns: [table.userId],
      foreignColumns: [userProfiles.id],
    }).onDelete('cascade'),
  ]
);

export const globalFilaments = pgTable(
  'global_filament',
  {
    id: text('id').primaryKey().$defaultFn(generateCuid),
    externalId: integer('externalId'),
    materialName: text('materialName').notNull(),
    materialType: text('materialType'),
    brand: text('brand').notNull(),
    color: text('color').notNull(),
    colorHex: text('colorHex'),
    spoolPrice: doublePrecision('spoolPrice'),
    spoolWeight: doublePrecision('spoolWeight'),
    density: doublePrecision('density'),
    image: text('image'),
    website: text('website'),
    sku: text('sku'),
    printTempMin: integer('printTempMin'),
    printTempMax: integer('printTempMax'),
    bedTemp: integer('bedTemp'),
    printSpeed: integer('printSpeed'),
    fanSpeed: integer('fanSpeed'),
    flowRatio: doublePrecision('flowRatio'),
    diameter: doublePrecision('diameter').default(1.75),
    mechanicalProps: text('mechanicalProps'),
    applications: text('applications'),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex('global_filament_external_id_idx').on(table.externalId)]
);

export const filaments = pgTable(
  'filament',
  {
    id: text('id').primaryKey().$defaultFn(generateCuid),
    userId: uuid('userId'), // References user_profiles.id
    materialName: text('materialName').notNull(),
    brand: text('brand').notNull(),
    color: text('color').notNull(),
    colorHex: text('colorHex'),
    image: text('image'),
    materialType: text('materialType'),
    spoolPrice: doublePrecision('spoolPrice').notNull(),
    spoolWeight: doublePrecision('spoolWeight').notNull(),
    density: doublePrecision('density'),
    costPerGram: doublePrecision('costPerGram'),
    remainingWeight: doublePrecision('remainingWeight'),
    notes: text('notes'),
    deletedAt: timestamp('deletedAt', { mode: 'date' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('filament_userId_idx').on(table.userId),
    foreignKey({
      name: 'filament_user_fk',
      columns: [table.userId],
      foreignColumns: [userProfiles.id],
    }).onDelete('cascade'),
  ]
);

export const printerStatusEnum = pgEnum('PrinterStatus', [
  'available',
  'in_use',
  'maintenance',
]);

export const printerTypeEnum = pgEnum('PrinterType', ['FDM', 'SLA', 'SLS']);

export const printers = pgTable(
  'printer',
  {
    id: text('id').primaryKey().$defaultFn(generateCuid),
    userId: uuid('userId').notNull(), // References user_profiles.id
    name: text('name').notNull(),
    model: text('model'),
    type: printerTypeEnum('type').default('FDM').notNull(),
    status: printerStatusEnum('status').default('available').notNull(),
    location: text('location'),
    ipAddress: text('ipAddress'), // IPv4 or IPv6, max 45 chars
    lastMaintenance: timestamp('lastMaintenance', { mode: 'date' }),
    notes: text('notes'),
    currentMaterialId: text('currentMaterialId'), // FK to filament.id (loaded spool)
    power: integer('power').notNull(),
    costPerHour: doublePrecision('costPerHour'),
    purchaseDate: timestamp('purchaseDate', { mode: 'date' }),
    isDefault: boolean('isDefault').default(false).notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('printer_userId_idx').on(table.userId),
    index('printer_currentMaterialId_idx').on(table.currentMaterialId),
    foreignKey({
      name: 'printer_user_fk',
      columns: [table.userId],
      foreignColumns: [userProfiles.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'printer_current_material_fk',
      columns: [table.currentMaterialId],
      foreignColumns: [filaments.id],
    }).onDelete('set null'),
  ]
);

export const customers = pgTable(
  'customer',
  {
    id: text('id').primaryKey().$defaultFn(generateCuid),
    userId: uuid('userId').notNull(), // References user_profiles.id
    firstName: text('firstName'),
    lastName: text('lastName'),
    companyName: text('companyName'),
    /** B2B = company, B2C = private person */
    type: text('type'),
    /** Contact person name (B2B) */
    contactPerson: text('contactPerson'),
    /** active | inactive */
    status: text('status').default('active'),
    /** Categories/tags (e.g. Obudowy, FDM) */
    tags: text('tags').array(),
    email: text('email'),
    phone: text('phone'),
    nip: text('nip'),
    street: text('street'),
    city: text('city'),
    zipCode: text('zipCode'),
    country: text('country'),
    notes: text('notes'),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('customer_userId_idx').on(table.userId),
    foreignKey({
      name: 'customer_user_fk',
      columns: [table.userId],
      foreignColumns: [userProfiles.id],
    }).onDelete('cascade'),
  ]
);

export const orders = pgTable(
  'print_order',
  {
    id: text('id').primaryKey().$defaultFn(generateCuid),
    userId: uuid('userId').notNull(), // References user_profiles.id
    customerId: text('customerId'),
    title: text('title').notNull(),
    customerName: text('customerName'),
    status: orderStatusEnum('status').default('QUOTE').notNull(),
    shareToken: text('shareToken'),
    deadline: timestamp('deadline', { mode: 'date' }),
    notes: text('notes'),
    deletedAt: timestamp('deletedAt', { mode: 'date' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('print_order_share_token_idx').on(table.shareToken),
    index('print_order_userId_idx').on(table.userId),
    index('print_order_status_idx').on(table.status),
    index('print_order_customerId_idx').on(table.customerId),
    foreignKey({
      name: 'print_order_user_fk',
      columns: [table.userId],
      foreignColumns: [userProfiles.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'print_order_customer_fk',
      columns: [table.customerId],
      foreignColumns: [customers.id],
    }).onDelete('set null'),
  ]
);

export const printEntries = pgTable(
  'print_entry',
  {
    id: text('id').primaryKey().$defaultFn(generateCuid),
    userId: uuid('userId').notNull(), // References user_profiles.id
    printerId: text('printerId').notNull(),
    filamentId: text('filamentId'),
    orderId: text('orderId'),
    name: text('name').notNull(),
    brand: text('brand'),
    color: text('color'),
    weight: doublePrecision('weight').notNull(),
    timeH: integer('timeH').notNull(),
    timeM: integer('timeM').notNull(),
    qty: integer('qty').default(1).notNull(),
    price: doublePrecision('price').notNull(),
    profit: doublePrecision('profit').notNull(),
    totalCost: doublePrecision('totalCost').notNull(),
    extraCost: doublePrecision('extraCost'),
    manualPrice: doublePrecision('manualPrice'),
    advancedSettings: jsonb('advancedSettings'),
    /** Full calculator state snapshot for restore (filaments[], hardware[], packaging[], labor, machine, vatRate, customMargin, etc.). */
    calculatorSnapshot: jsonb('calculatorSnapshot'),
    /** success | failed | canceled */
    status: text('status').default('success').notNull(),
    /** Display name of the person who started the print (operator). */
    operatorName: text('operatorName'),
    notes: text('notes'),
    errorReason: text('errorReason'),
    date: timestamp('date', { mode: 'date' }).defaultNow().notNull(),
    deletedAt: timestamp('deletedAt', { mode: 'date' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('print_entry_userId_idx').on(table.userId),
    index('print_entry_printerId_idx').on(table.printerId),
    index('print_entry_filamentId_idx').on(table.filamentId),
    index('print_entry_orderId_idx').on(table.orderId),
    foreignKey({
      name: 'print_entry_user_fk',
      columns: [table.userId],
      foreignColumns: [userProfiles.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'print_entry_printer_fk',
      columns: [table.printerId],
      foreignColumns: [printers.id],
    }),
    foreignKey({
      name: 'print_entry_filament_fk',
      columns: [table.filamentId],
      foreignColumns: [filaments.id],
    }),
    foreignKey({
      name: 'print_entry_order_fk',
      columns: [table.orderId],
      foreignColumns: [orders.id],
    }).onDelete('set null'),
  ]
);

export const userSettings = pgTable(
  'user_settings',
  {
    id: text('id').primaryKey().$defaultFn(generateCuid),
    userId: uuid('userId').notNull(), // References user_profiles.id
    energyRate: doublePrecision('energyRate').default(1.15).notNull(),
    defaultPrinterId: text('defaultPrinterId'),
    useGravatar: boolean('useGravatar').default(true).notNull(),
    language: text('language').default('en').notNull(),
    /** Low stock notification: below this % of full spool (0–100). Default 20. */
    lowStockAlertPercent: integer('lowStockAlertPercent').default(20).notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('user_settings_user_idx').on(table.userId),
    foreignKey({
      name: 'user_settings_user_fk',
      columns: [table.userId],
      foreignColumns: [userProfiles.id],
    }).onDelete('cascade'),
  ]
);

export const globalSettings = pgTable('global_settings', {
  key: text('key').primaryKey(), // e.g., 'maintenance_mode'
  value: jsonb('value').notNull(), // e.g., { enabled: true }
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const newsletterSubscribers = pgTable('newsletter_subscriber', {
  id: text('id').primaryKey().$defaultFn(generateCuid),
  email: text('email').notNull(),
  isVerified: boolean('isVerified').default(false).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('newsletter_subscriber_email_idx').on(table.email)
]);

// --- Relations ---

export const userProfilesRelations = relations(userProfiles, ({ one, many }) => ({
  printers: many(printers),
  orders: many(orders),
  printEntries: many(printEntries),
  settings: one(userSettings, {
    fields: [userProfiles.id],
    references: [userSettings.userId],
  }),
  filaments: many(filaments),
  activities: many(activityLogs),
  notifications: many(notifications),
  customers: many(customers),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(userProfiles, {
    fields: [notifications.userId],
    references: [userProfiles.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(userProfiles, {
    fields: [activityLogs.userId],
    references: [userProfiles.id],
  }),
}));

export const filamentsRelations = relations(filaments, ({ one, many }) => ({
  user: one(userProfiles, {
    fields: [filaments.userId],
    references: [userProfiles.id],
  }),
  printEntries: many(printEntries),
  printersUsingAsCurrent: many(printers),
}));

export const printersRelations = relations(printers, ({ one, many }) => ({
  user: one(userProfiles, {
    fields: [printers.userId],
    references: [userProfiles.id],
  }),
  currentMaterial: one(filaments, {
    fields: [printers.currentMaterialId],
    references: [filaments.id],
  }),
  printEntries: many(printEntries),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(userProfiles, {
    fields: [customers.userId],
    references: [userProfiles.id],
  }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(userProfiles, {
    fields: [orders.userId],
    references: [userProfiles.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  printEntries: many(printEntries),
}));

export const printEntriesRelations = relations(printEntries, ({ one }) => ({
  user: one(userProfiles, {
    fields: [printEntries.userId],
    references: [userProfiles.id],
  }),
  printer: one(printers, {
    fields: [printEntries.printerId],
    references: [printers.id],
  }),
  filament: one(filaments, {
    fields: [printEntries.filamentId],
    references: [filaments.id],
  }),
  order: one(orders, {
    fields: [printEntries.orderId],
    references: [orders.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(userProfiles, {
    fields: [userSettings.userId],
    references: [userProfiles.id],
  }),
}));
