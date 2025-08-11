// Generated manually from current public schema snapshot
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      blog_articles: {
        Row: {
          id: string;
          url: string;
          name: string;
          markdown: string;
          category: string;
          published_at: string | null; // timestamptz
          imported_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["blog_articles"]["Row"]> & {
          id: string;
          url: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["blog_articles"]["Row"]>;
      };
      blog_articles_metrics: {
        Row: {
          id: string; // uuid
          url: string;
          week_ending: string; // date
          gsc_clicks: number | null;
          gsc_impressions: number | null;
          gsc_ctr: number | null;
          gsc_position: number | null;
          amplitude_conversions: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["blog_articles_metrics"]["Row"]> & {
          url: string;
          week_ending: string;
        };
        Update: Partial<Database["public"]["Tables"]["blog_articles_metrics"]["Row"]>;
      };
      blog_cluster_metrics: {
        Row: {
          id: string; // uuid
          run_id: string;
          cluster_id: number;
          cluster_size: number;
          pillar_candidate_url: string | null;
          cluster_coherence: number | null;
          cluster_density: number | null;
          cluster_variance: number | null;
          avg_similarity: number | null;
          min_similarity: number | null;
          pillar_similarity_score: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["blog_cluster_metrics"]["Row"]> & {
          run_id: string;
          cluster_id: number;
          cluster_size: number;
        };
        Update: Partial<Database["public"]["Tables"]["blog_cluster_metrics"]["Row"]>;
      };
      blog_clusters: {
        Row: {
          id: string; // uuid
          run_id: string;
          url: string;
          cluster_id: number;
          cluster_name: string | null;
          parent_id: number | null;
          parent_name: string | null;
          distance: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["blog_clusters"]["Row"]> & {
          run_id: string;
          url: string;
          cluster_id: number;
        };
        Update: Partial<Database["public"]["Tables"]["blog_clusters"]["Row"]>;
      };
      blog_embeddings: {
        Row: {
          id: string; // uuid
          url: string;
          embedding: number[]; // real[]
          model: string;
          dimension: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["blog_embeddings"]["Row"]> & {
          url: string;
          embedding: number[];
        };
        Update: Partial<Database["public"]["Tables"]["blog_embeddings"]["Row"]>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}


