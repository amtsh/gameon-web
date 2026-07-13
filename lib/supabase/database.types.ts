export type SportKind =
  | "badminton"
  | "cricket"
  | "football"
  | "tennis"
  | "running"
  | "pickleball"
  | "basketball"
  | "volleyball"
  | "cycling";

export type SkillLevel = "any" | "beginner" | "intermediate" | "advanced";

export type CostMode = "total" | "per_person";

export type ContactMethod = "whatsapp" | "telegram";

export type LocationMode = "device_location" | "postal_code";

export type JoinRequestStatus = "pending" | "approved" | "waitlisted";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          is_onboarding_complete: boolean;
          location_mode: LocationMode;
          postal_code: string | null;
          postal_latitude: number | null;
          postal_longitude: number | null;
          contact_method: ContactMethod | null;
          contact_value: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          is_onboarding_complete?: boolean;
          location_mode?: LocationMode;
          postal_code?: string | null;
          postal_latitude?: number | null;
          postal_longitude?: number | null;
          contact_method?: ContactMethod | null;
          contact_value?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          is_onboarding_complete?: boolean;
          location_mode?: LocationMode;
          postal_code?: string | null;
          postal_latitude?: number | null;
          postal_longitude?: number | null;
          contact_method?: ContactMethod | null;
          contact_value?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sport_preferences: {
        Row: {
          id: string;
          profile_id: string;
          sport: SportKind;
          level: SkillLevel;
          is_interested: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          sport: SportKind;
          level?: SkillLevel;
          is_interested?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          sport?: SportKind;
          level?: SkillLevel;
          is_interested?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sport_preferences_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      sport_events: {
        Row: {
          id: string;
          host_id: string;
          sport: SportKind;
          title: string;
          description: string;
          cost_amount: number | null;
          cost_currency: string | null;
          cost_mode: CostMode | null;
          skill_level: SkillLevel;
          capacity: number;
          attendee_count: number;
          starts_at: string;
          ends_at: string;
          host_contact_method: ContactMethod | null;
          host_contact_value: string | null;
          venue_name: string;
          venue_address: string | null;
          venue_city: string | null;
          venue_country: string | null;
          venue_latitude: number;
          venue_longitude: number;
          created_at: string;
          auto_approve: boolean;
          is_private: boolean;
          share_token: string | null;
          cancelled_at: string | null;
        };
        Insert: {
          id?: string;
          host_id: string;
          sport: SportKind;
          title: string;
          description?: string;
          cost_amount?: number | null;
          cost_currency?: string | null;
          cost_mode?: CostMode | null;
          skill_level?: SkillLevel;
          capacity: number;
          attendee_count?: number;
          starts_at: string;
          ends_at: string;
          host_contact_method?: ContactMethod | null;
          host_contact_value?: string | null;
          venue_name: string;
          venue_address?: string | null;
          venue_city?: string | null;
          venue_country?: string | null;
          venue_latitude: number;
          venue_longitude: number;
          created_at?: string;
          auto_approve?: boolean;
          is_private?: boolean;
          share_token?: string | null;
          cancelled_at?: string | null;
        };
        Update: {
          id?: string;
          host_id?: string;
          sport?: SportKind;
          title?: string;
          description?: string;
          cost_amount?: number | null;
          cost_currency?: string | null;
          cost_mode?: CostMode | null;
          skill_level?: SkillLevel;
          capacity?: number;
          attendee_count?: number;
          starts_at?: string;
          ends_at?: string;
          host_contact_method?: ContactMethod | null;
          host_contact_value?: string | null;
          venue_name?: string;
          venue_address?: string | null;
          venue_city?: string | null;
          venue_country?: string | null;
          venue_latitude?: number;
          venue_longitude?: number;
          created_at?: string;
          auto_approve?: boolean;
          is_private?: boolean;
          share_token?: string | null;
          cancelled_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sport_events_host_id_fkey";
            columns: ["host_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      event_participants: {
        Row: {
          event_id: string;
          profile_id: string;
          joined_at: string;
        };
        Insert: {
          event_id: string;
          profile_id: string;
          joined_at?: string;
        };
        Update: {
          event_id?: string;
          profile_id?: string;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "sport_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_participants_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      event_join_requests: {
        Row: {
          id: string;
          event_id: string;
          requester_id: string;
          requester_level: SkillLevel;
          contact_method: ContactMethod;
          contact_value: string;
          status: JoinRequestStatus;
          created_at: string;
          approved_at: string | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          requester_id: string;
          requester_level?: SkillLevel;
          contact_method: ContactMethod;
          contact_value: string;
          status?: JoinRequestStatus;
          created_at?: string;
          approved_at?: string | null;
        };
        Update: {
          id?: string;
          event_id?: string;
          requester_id?: string;
          requester_level?: SkillLevel;
          contact_method?: ContactMethod;
          contact_value?: string;
          status?: JoinRequestStatus;
          created_at?: string;
          approved_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_join_requests_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "sport_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_join_requests_requester_id_fkey";
            columns: ["requester_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      public_profiles: {
        Row: {
          id: string;
          name: string;
        };
        Relationships: [];
      };
      event_player_levels: {
        Row: {
          event_id: string;
          profile_id: string;
          requester_level: SkillLevel;
        };
        Relationships: [
          {
            foreignKeyName: "event_join_requests_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "sport_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_join_requests_requester_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      approve_join_request: {
        Args: { request_id: string };
        Returns: undefined;
      };
      get_host_contact: {
        Args: { target_event_id: string };
        Returns: {
          method: ContactMethod;
          value: string;
        }[];
      };
      get_sport_event_by_share_token: {
        Args: { p_share_token: string };
        Returns: {
          id: string;
          host_id: string;
          sport: SportKind;
          title: string;
          description: string;
          cost_amount: number | null;
          cost_currency: string | null;
          cost_mode: CostMode | null;
          skill_level: SkillLevel;
          capacity: number;
          attendee_count: number;
          starts_at: string;
          ends_at: string;
          venue_name: string;
          venue_address: string | null;
          venue_city: string | null;
          venue_country: string | null;
          venue_latitude: number;
          venue_longitude: number;
          created_at: string;
          auto_approve: boolean;
          is_private: boolean;
          share_token: string;
        }[];
      };
      get_sport_event_roster: {
        Args: { p_event_id: string; p_share_token?: string | null };
        Returns: {
          profile_id: string;
          name: string;
          requester_level: SkillLevel;
          is_host: boolean;
        }[];
      };
      request_to_join_sport_event: {
        Args: {
          p_event_id: string;
          p_share_token: string | null;
          p_requester_level: SkillLevel;
          p_contact_method: ContactMethod;
          p_contact_value: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      sport_kind: SportKind;
      skill_level: SkillLevel;
      contact_method: ContactMethod;
      location_mode: LocationMode;
      join_request_status: JoinRequestStatus;
      cost_mode: CostMode;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type SportEventRow = Database["public"]["Tables"]["sport_events"]["Row"];
export type EventJoinRequestRow =
  Database["public"]["Tables"]["event_join_requests"]["Row"];
