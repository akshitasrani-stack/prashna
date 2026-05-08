import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xmnrpgdfwkxumzsjxjfd.supabase.co'
const supabaseKey = 'sb_publishable_f8GcVgk1Vn3dLGzl9amVwA_IPMcI4dj'

export const supabase = createClient(supabaseUrl, supabaseKey)