// modules/portal/infrastructure/repositories/supabase-request-repository.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { RequestRepository, RequestEventRepository } from '../../domain/portal-repositories'
import type { ClientRequest, RequestEvent } from '../../domain/portal-entities'

function mapRowToRequest(row: Record<string, unknown>): ClientRequest {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    createdBy: row.created_by as string,
    type: row.type as ClientRequest['type'],
    subject: row.subject as string,
    description: row.description as string,
    status: row.status as ClientRequest['status'],
    priority: row.priority as ClientRequest['priority'],
    assignedTo: (row.assigned_to ?? null) as string | null,
    resolution: (row.resolution ?? null) as string | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    resolvedAt: row.resolved_at ? new Date(row.resolved_at as string) : null,
  }
}

function mapRowToEvent(row: Record<string, unknown>): RequestEvent {
  return {
    id: row.id as string,
    requestId: row.request_id as string,
    type: row.type as RequestEvent['type'],
    author: (row.author ?? null) as string | null,
    content: (row.content ?? null) as string | null,
    previousStatus: (row.previous_status ?? null) as string | null,
    newStatus: (row.new_status ?? null) as string | null,
    createdAt: new Date(row.created_at as string),
  }
}

export class SupabaseRequestRepository implements RequestRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByOrganization(organizationId: string): Promise<ClientRequest[]> {
    const { data, error } = await this.client
      .from('requests')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((r) => mapRowToRequest(r as unknown as Record<string, unknown>))
  }

  async findByIdAndOrganization(id: string, organizationId: string): Promise<ClientRequest | null> {
    const { data, error } = await this.client
      .from('requests')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    return mapRowToRequest(data as unknown as Record<string, unknown>)
  }

  async create(input: {
    organizationId: string; createdBy: string; type: string;
    subject: string; description: string; priority: string
  }): Promise<ClientRequest> {
    const { data, error } = await this.client.from('requests').insert({
      organization_id: input.organizationId,
      created_by: input.createdBy,
      type: input.type,
      subject: input.subject,
      description: input.description,
      priority: input.priority,
    }).select().single()
    if (error) throw error
    return mapRowToRequest(data as unknown as Record<string, unknown>)
  }
}

export class SupabaseRequestEventRepository implements RequestEventRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByRequest(requestId: string): Promise<RequestEvent[]> {
    const { data, error } = await this.client
      .from('request_events')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map((r) => mapRowToEvent(r as unknown as Record<string, unknown>))
  }

  async create(input: {
    requestId: string; type: 'created' | 'comment' | 'status_change' | 'assigned' | 'resolved';
    author: string | null; content: string | null;
    previousStatus: string | null; newStatus: string | null
  }): Promise<RequestEvent> {
    const { data, error } = await this.client.from('request_events').insert({
      request_id: input.requestId,
      type: input.type,
      author: input.author,
      content: input.content,
      previous_status: input.previousStatus,
      new_status: input.newStatus,
    }).select().single()
    if (error) throw error
    return mapRowToEvent(data as unknown as Record<string, unknown>)
  }
}
