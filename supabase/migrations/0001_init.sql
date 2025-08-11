-- Schema baseline for blog tables
-- Extensions required
create extension if not exists "uuid-ossp";

set role postgres;
set search_path to public;

-- Table: blog_articles
create table if not exists public.blog_articles (
  id text primary key,
  url text not null,
  name text not null,
  markdown text not null default ''::text,
  category text not null default ''::text,
  published_at timestamptz null,
  imported_at timestamptz null default current_timestamp,
  created_at timestamptz null default current_timestamp,
  updated_at timestamptz null default current_timestamp
);

create unique index if not exists blog_articles_url_key on public.blog_articles (url);
create index if not exists idx_blog_articles_category on public.blog_articles (category);
create index if not exists idx_blog_articles_published_at on public.blog_articles (published_at);
create index if not exists idx_blog_articles_url on public.blog_articles (url);

-- Table: blog_articles_metrics
create table if not exists public.blog_articles_metrics (
  id uuid primary key default uuid_generate_v4(),
  url text not null,
  week_ending date not null,
  gsc_clicks integer null default 0,
  gsc_impressions integer null default 0,
  gsc_ctr real null default 0.0,
  gsc_position real null default 0.0,
  amplitude_conversions integer null default 0,
  created_at timestamptz null default current_timestamp,
  updated_at timestamptz null default current_timestamp,
  constraint blog_articles_metrics_url_fk foreign key (url) references public.blog_articles(url) on delete cascade
);

create unique index if not exists blog_articles_metrics_url_week_ending_key on public.blog_articles_metrics (url, week_ending);
create index if not exists idx_blog_metrics_clicks on public.blog_articles_metrics (gsc_clicks);
create index if not exists idx_blog_metrics_conversions on public.blog_articles_metrics (amplitude_conversions);
create index if not exists idx_blog_metrics_url on public.blog_articles_metrics (url);
create index if not exists idx_blog_metrics_url_week on public.blog_articles_metrics (url, week_ending);
create index if not exists idx_blog_metrics_week_ending on public.blog_articles_metrics (week_ending);

-- Table: blog_cluster_metrics
create table if not exists public.blog_cluster_metrics (
  id uuid primary key default uuid_generate_v4(),
  run_id text not null,
  cluster_id integer not null,
  cluster_size integer not null,
  pillar_candidate_url text null,
  cluster_coherence real null,
  cluster_density real null,
  cluster_variance real null,
  avg_similarity real null,
  min_similarity real null,
  pillar_similarity_score real null,
  created_at timestamptz null default current_timestamp,
  updated_at timestamptz null default current_timestamp,
  constraint blog_cluster_metrics_pillar_url_fk foreign key (pillar_candidate_url) references public.blog_articles(url) on delete set null
);

create unique index if not exists blog_cluster_metrics_run_id_cluster_id_key on public.blog_cluster_metrics (run_id, cluster_id);
create index if not exists idx_blog_cluster_metrics_cluster_id on public.blog_cluster_metrics (cluster_id);
create index if not exists idx_blog_cluster_metrics_run_id on public.blog_cluster_metrics (run_id);

-- Table: blog_clusters
create table if not exists public.blog_clusters (
  id uuid primary key default uuid_generate_v4(),
  run_id text not null,
  url text not null,
  cluster_id integer not null,
  cluster_name text null,
  parent_id integer null,
  parent_name text null,
  distance real null default 0.0,
  created_at timestamptz null default current_timestamp,
  updated_at timestamptz null default current_timestamp,
  constraint blog_clusters_url_fk foreign key (url) references public.blog_articles(url) on delete cascade
);

create unique index if not exists blog_clusters_run_id_url_key on public.blog_clusters (run_id, url);
create index if not exists idx_blog_clusters_cluster_id on public.blog_clusters (cluster_id);
create index if not exists idx_blog_clusters_parent_id on public.blog_clusters (parent_id);
create index if not exists idx_blog_clusters_run_id on public.blog_clusters (run_id);
create index if not exists idx_blog_clusters_url on public.blog_clusters (url);

-- Table: blog_embeddings
create table if not exists public.blog_embeddings (
  id uuid primary key default uuid_generate_v4(),
  url text not null,
  embedding real[] not null,
  model text not null default 'text-embedding-005',
  dimension integer not null default 1536,
  created_at timestamptz null default current_timestamp,
  updated_at timestamptz null default current_timestamp,
  constraint blog_embeddings_url_fk foreign key (url) references public.blog_articles(url) on delete cascade
);

create unique index if not exists blog_embeddings_url_key on public.blog_embeddings (url);
create index if not exists idx_blog_embeddings_url on public.blog_embeddings (url);
