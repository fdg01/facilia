// modules/portal/infrastructure/repositories/supabase-communication-repository.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CommunicationRepository } from '../../domain/portal-repositories'
import type { Communication } from '../../domain/portal-entities'

function mapRowToCommunication(row: Record<string, unknown>): Communication {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    sentBy: (row.sent_by ?? null) as string | null,
    subject: row.subject as string,
    body: row.body as string,
    type: row.type as Communication['type'],
    read: row.read as boolean,
    createdAt: new Date(row.created_at as string),
    readAt: row.read_at ? new Date(row.read_at as string) : null,
  }
}

export class SupabaseCommunicationRepository implements CommunicationRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByOrganization(organizationId: string): Promise<{ data: Communication[]; unread: number }> {
    const { data, error } = await this.client
      .from('communications')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    if (error) throw error
    const communications = (data ?? []).map((r) => mapRowToCommunication(r as unknown as Record<string, unknown>))
    const unread = communications.filter((c) => !c.read).length
    return { data: communications, unread }
  }

  async findByIdAndOrganization(id: string, organizationId: string): Promise<Communication | null> {
    const { data, error } = await this.client
      .from('communications')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    return mapRowToCommunication(data as unknown as Record<string, unknown>)
  }

  async markAsRead(id: string): Promise<void> {
    const { error } = await this.client
      .from('communications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  }
}
