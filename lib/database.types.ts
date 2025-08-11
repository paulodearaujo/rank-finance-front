export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      blog_articles: {
        Row: {
          category: string;
          created_at: string | null;
          id: string;
          imported_at: string | null;
          markdown: string;
          name: string;
          published_at: string | null;
          updated_at: string | null;
          url: string;
        };
        Insert: {
          category?: string;
          created_at?: string | null;
          id: string;
          imported_at?: string | null;
          markdown?: string;
          name: string;
          published_at?: string | null;
          updated_at?: string | null;
          url: string;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          id?: string;
          imported_at?: string | null;
          markdown?: string;
          name?: string;
          published_at?: string | null;
          updated_at?: string | null;
          url?: string;
        };
        Relationships: [];
      };
      blog_articles_metrics: {
        Row: {
          amplitude_conversions: number | null;
          created_at: string | null;
          gsc_clicks: number | null;
          gsc_ctr: number | null;
          gsc_impressions: number | null;
          gsc_position: number | null;
          id: string;
          updated_at: string | null;
          url: string;
          week_ending: string;
        };
        Insert: {
          amplitude_conversions?: number | null;
          created_at?: string | null;
          gsc_clicks?: number | null;
          gsc_ctr?: number | null;
          gsc_impressions?: number | null;
          gsc_position?: number | null;
          id?: string;
          updated_at?: string | null;
          url: string;
          week_ending: string;
        };
        Update: {
          amplitude_conversions?: number | null;
          created_at?: string | null;
          gsc_clicks?: number | null;
          gsc_ctr?: number | null;
          gsc_impressions?: number | null;
          gsc_position?: number | null;
          id?: string;
          updated_at?: string | null;
          url?: string;
          week_ending?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blog_articles_metrics_url_fk";
            columns: ["url"];
            isOneToOne: false;
            referencedRelation: "blog_articles";
            referencedColumns: ["url"];
          },
        ];
      };
      blog_cluster_metrics: {
        Row: {
          avg_similarity: number | null;
          cluster_coherence: number | null;
          cluster_density: number | null;
          cluster_id: number;
          cluster_size: number;
          cluster_variance: number | null;
          created_at: string | null;
          id: string;
          min_similarity: number | null;
          pillar_candidate_url: string | null;
          pillar_similarity_score: number | null;
          run_id: string;
          updated_at: string | null;
        };
        Insert: {
          avg_similarity?: number | null;
          cluster_coherence?: number | null;
          cluster_density?: number | null;
          cluster_id: number;
          cluster_size: number;
          cluster_variance?: number | null;
          created_at?: string | null;
          id?: string;
          min_similarity?: number | null;
          pillar_candidate_url?: string | null;
          pillar_similarity_score?: number | null;
          run_id: string;
          updated_at?: string | null;
        };
        Update: {
          avg_similarity?: number | null;
          cluster_coherence?: number | null;
          cluster_density?: number | null;
          cluster_id?: number;
          cluster_size?: number;
          cluster_variance?: number | null;
          created_at?: string | null;
          id?: string;
          min_similarity?: number | null;
          pillar_candidate_url?: string | null;
          pillar_similarity_score?: number | null;
          run_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "blog_cluster_metrics_pillar_url_fk";
            columns: ["pillar_candidate_url"];
            isOneToOne: false;
            referencedRelation: "blog_articles";
            referencedColumns: ["url"];
          },
        ];
      };
      blog_clusters: {
        Row: {
          cluster_id: number;
          cluster_name: string | null;
          created_at: string | null;
          distance: number | null;
          id: string;
          parent_id: number | null;
          parent_name: string | null;
          run_id: string;
          updated_at: string | null;
          url: string;
        };
        Insert: {
          cluster_id: number;
          cluster_name?: string | null;
          created_at?: string | null;
          distance?: number | null;
          id?: string;
          parent_id?: number | null;
          parent_name?: string | null;
          run_id: string;
          updated_at?: string | null;
          url: string;
        };
        Update: {
          cluster_id?: number;
          cluster_name?: string | null;
          created_at?: string | null;
          distance?: number | null;
          id?: string;
          parent_id?: number | null;
          parent_name?: string | null;
          run_id?: string;
          updated_at?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blog_clusters_url_fk";
            columns: ["url"];
            isOneToOne: false;
            referencedRelation: "blog_articles";
            referencedColumns: ["url"];
          },
        ];
      };
      blog_embeddings: {
        Row: {
          created_at: string | null;
          dimension: number;
          embedding: number[];
          id: string;
          model: string;
          updated_at: string | null;
          url: string;
        };
        Insert: {
          created_at?: string | null;
          dimension?: number;
          embedding: number[];
          id?: string;
          model?: string;
          updated_at?: string | null;
          url: string;
        };
        Update: {
          created_at?: string | null;
          dimension?: number;
          embedding?: number[];
          id?: string;
          model?: string;
          updated_at?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blog_embeddings_url_fk";
            columns: ["url"];
            isOneToOne: false;
            referencedRelation: "blog_articles";
            referencedColumns: ["url"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
