export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  apps: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      apps_scrape: {
        Row: {
          app_id: string;
          description: string | null;
          id: number;
          ranking_position: number | null;
          run_id: string;
          scraped_at: string;
          screenshots: Json | null;
          store: string;
          subtitle: string | null;
          title: string;
          url: string;
        };
      };
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
