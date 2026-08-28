import { createClient } from '@supabase/supabase-js'

export const CHECKOFF_TABLE = 'checkoff_todo_items_v1'

export const supabase = createClient(
  'https://fgomaujsdblpzxhnnqrg.supabase.co',
  'sb_publishable_JOUqLZDnfGu_yCa6k6FVDQ_AYwpr72i',
)
