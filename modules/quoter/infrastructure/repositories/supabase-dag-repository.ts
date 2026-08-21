// modules/quoter/infrastructure/repositories/supabase-dag-repository.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { DagRepository, CreateNodeInput, EditNodeInput, CreateEdgeInput } from '../../domain/repositories'
import type { DagNode, DagEdge, DagOption } from '../../domain/entities'
import { mapDbNodeToDomain, mapDbEdgeToDomain, mapDbOptionToDomain } from '../supabase/mappers'

export class SupabaseDagRepository implements DagRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getActiveDag(): Promise<{ nodes: DagNode[]; edges: DagEdge[]; options: DagOption[] }> {
    const [nodesRes, edgesRes, optionsRes] = await Promise.all([
      this.client.from('dag_nodes').select('*').eq('active', true).order('sort_order'),
      this.client.from('dag_edges').select('*').eq('active', true).order('sort_order'),
      this.client.from('dag_options').select('*').eq('active', true).order('sort_order'),
    ])

    if (nodesRes.error) throw nodesRes.error
    if (edgesRes.error) throw edgesRes.error
    if (optionsRes.error) throw optionsRes.error

    return {
      nodes: (nodesRes.data ?? []).map(mapDbNodeToDomain),
      edges: (edgesRes.data ?? []).map(mapDbEdgeToDomain),
      options: (optionsRes.data ?? []).map(mapDbOptionToDomain),
    }
  }

  async createNode(input: CreateNodeInput): Promise<DagNode> {
    const { data, error } = await this.client
      .from('dag_nodes')
      .insert({
        code: input.code,
        label: input.label,
        description: input.description ?? null,
        type: input.type,
        line: input.line ?? null,
        price_type: input.priceType ?? 'no_price',
        base_price: input.basePrice ?? null,
        variable_id: input.variableId ?? null,
        consumable_id: input.consumableId ?? null,
        rule_id: input.ruleId ?? null,
        sort_order: input.sortOrder ?? 0,
      })
      .select()
      .single()

    if (error) throw error
    return mapDbNodeToDomain(data)
  }

  async editNode(id: string, input: EditNodeInput): Promise<DagNode> {
    const updates: Record<string, unknown> = {}
    if (input.label !== undefined) updates.label = input.label
    if (input.description !== undefined) updates.description = input.description
    if (input.type !== undefined) updates.type = input.type
    if (input.line !== undefined) updates.line = input.line
    if (input.priceType !== undefined) updates.price_type = input.priceType
    if (input.basePrice !== undefined) updates.base_price = input.basePrice
    if (input.variableId !== undefined) updates.variable_id = input.variableId
    if (input.consumableId !== undefined) updates.consumable_id = input.consumableId
    if (input.ruleId !== undefined) updates.rule_id = input.ruleId
    if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder
    if (input.active !== undefined) updates.active = input.active

    const { data, error } = await this.client
      .from('dag_nodes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return mapDbNodeToDomain(data)
  }

  async deleteNode(id: string): Promise<void> {
    const { error } = await this.client
      .from('dag_nodes')
      .update({ active: false })
      .eq('id', id)

    if (error) throw error
  }

  async createEdge(input: CreateEdgeInput): Promise<DagEdge> {
    const { data, error } = await this.client
      .from('dag_edges')
      .insert({
        source_id: input.sourceId,
        target_id: input.targetId,
        condition: input.condition ?? null,
        sort_order: input.sortOrder ?? 0,
      })
      .select()
      .single()

    if (error) {
      if (error.message.includes('DAG_INVALID')) {
        throw new Error('DAG_INVALID: edge creates a cycle')
      }
      throw error
    }
    return mapDbEdgeToDomain(data)
  }

  async deleteEdge(id: string): Promise<void> {
    const { error } = await this.client
      .from('dag_edges')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
