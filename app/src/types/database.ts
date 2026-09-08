export type ItemType = "LOST" | "FOUND";
export type ItemStatus = "ACTIVE" | "RESOLVED" | "CANCELLED";
export type ClaimStatus = "PENDING" | "ACCEPTED" | "REJECTED";

// ─── Row Types ───────────────────────────────────────────────

export interface User {
  id: string;
  full_name: string;
  email?: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  description: string;
  status: ItemStatus;
  category: string | null;
  location: string | null;
  date_of_incident: string | null;
  reporter_id: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Claim {
  id: string;
  item_id: string;
  claimant_id: string;
  status: ClaimStatus;
  message: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Insert / Update Payloads ────────────────────────────────

export interface ItemInsert {
  type: ItemType;
  title: string;
  description: string;
  category?: string;
  location?: string;
  date_of_incident?: string;
  image_url?: string;
}

export interface ItemUpdate {
  title?: string;
  description?: string;
  status?: ItemStatus;
  category?: string;
  location?: string;
  date_of_incident?: string;
  image_url?: string;
}

export interface ClaimInsert {
  item_id: string;
  message?: string;
}

// ─── Joined / Enriched Types ─────────────────────────────────

export interface ItemWithReporter extends Item {
  reporter: User;
}

export interface ClaimWithClaimant extends Claim {
  claimant: User;
}

export interface ClaimWithItem extends Claim {
  item: Item;
}

// ─── Supabase Database Type ──────────────────────────────────
// Matches the GenericSchema / GenericTable shape expected by
// @supabase/postgrest-js v2.x (columns must be string[]).

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: {
          id: string;
          full_name: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      items: {
        Row: Item;
        Insert: {
          id?: string;
          type: ItemType;
          title: string;
          description: string;
          status?: ItemStatus;
          category?: string | null;
          location?: string | null;
          date_of_incident?: string | null;
          reporter_id: string;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: ItemType;
          title?: string;
          description?: string;
          status?: ItemStatus;
          category?: string | null;
          location?: string | null;
          date_of_incident?: string | null;
          reporter_id?: string;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "items_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      claims: {
        Row: Claim;
        Insert: {
          id?: string;
          item_id: string;
          claimant_id: string;
          status?: ClaimStatus;
          message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          claimant_id?: string;
          status?: ClaimStatus;
          message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "claims_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "claims_claimant_id_fkey";
            columns: ["claimant_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      item_type: ItemType;
      item_status: ItemStatus;
      claim_status: ClaimStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
