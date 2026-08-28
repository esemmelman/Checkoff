export type CheckoffItem = {
  checkoff_id: string
  checkoff_user_id: string | null
  checkoff_name: string
  checkoff_check_yn: boolean
  checkoff_rich_text_html: string
  checkoff_created_at: string
  checkoff_updated_at: string
}

export type Filter = 'unchecked' | 'checked' | 'all'
