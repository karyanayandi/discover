import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core"

export const postViews = pgTable(
  "post_views",
  {
    id: serial("id").primaryKey(),
    uri: varchar("uri", { length: 500 }).notNull(),
    viewedAt: timestamp("viewed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ipHash: varchar("ip_hash", { length: 64 }).notNull(),
    userAgentHash: varchar("user_agent_hash", { length: 64 }).notNull(),
    fingerprint: varchar("fingerprint", { length: 64 }),
    sessionId: varchar("session_id", { length: 64 }),
  },
  (table) => ({
    uriIdx: index("uri_idx").on(table.uri),
    viewedAtIdx: index("viewed_at_idx").on(table.viewedAt),
  }),
)

export const viewAggregates = pgTable("view_aggregates", {
  uri: varchar("uri", { length: 500 }).primaryKey(),
  totalViews: integer("total_views").notNull().default(0),
  views24h: integer("views_24h").notNull().default(0),
  views7d: integer("views_7d").notNull().default(0),
  views30d: integer("views_30d").notNull().default(0),
  lastUpdated: timestamp("last_updated", { withTimezone: true })
    .notNull()
    .defaultNow(),
})
