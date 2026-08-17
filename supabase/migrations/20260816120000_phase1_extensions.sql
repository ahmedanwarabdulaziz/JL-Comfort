-- Phase 1: Firebase -> Supabase migration
-- Extensions needed by the schema migration that follows.

create extension if not exists pgcrypto;
