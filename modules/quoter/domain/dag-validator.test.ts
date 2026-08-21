// modules/quoter/domain/dag-validator.test.ts
import { describe, it, expect } from 'vitest'
import { isAcyclic } from './dag-validator'
import type { DagNode, DagEdge } from './entities'

function makeNode(id: string): DagNode {
  return {
    id, code: id, label: id, description: null, type: 'category',
    line: null, priceType: 'no_price', basePrice: null,
    variableId: null, consumableId: null, ruleId: null, order: 0, active: true,
  }
}

function makeEdge(id: string, sourceId: string, targetId: string): DagEdge {
  return { id, sourceId, targetId, condition: null, order: 0, active: true }
}

describe('isAcyclic', () => {
  it('empty DAG is acyclic', () => {
    expect(isAcyclic([], [])).toBe(true)
  })

  it('DAG with no edges is acyclic', () => {
    const nodes = [makeNode('a'), makeNode('b')]
    expect(isAcyclic(nodes, [])).toBe(true)
  })

  it('linear DAG is acyclic', () => {
    const nodes = [makeNode('a'), makeNode('b'), makeNode('c')]
    const edges = [makeEdge('e1', 'a', 'b'), makeEdge('e2', 'b', 'c')]
    expect(isAcyclic(nodes, edges)).toBe(true)
  })

  it('DAG with shared node (two paths) is acyclic', () => {
    const nodes = [makeNode('a'), makeNode('b'), makeNode('c'), makeNode('d')]
    const edges = [
      makeEdge('e1', 'a', 'd'),
      makeEdge('e2', 'b', 'd'),
      makeEdge('e3', 'c', 'd'),
    ]
    expect(isAcyclic(nodes, edges)).toBe(true)
  })

  it('DAG with cycle is detected', () => {
    const nodes = [makeNode('a'), makeNode('b'), makeNode('c')]
    const edges = [
      makeEdge('e1', 'a', 'b'),
      makeEdge('e2', 'b', 'c'),
      makeEdge('e3', 'c', 'a'),
    ]
    expect(isAcyclic(nodes, edges)).toBe(false)
  })

  it('self-loop is detected', () => {
    const nodes = [makeNode('a')]
    const edges = [makeEdge('e1', 'a', 'a')]
    expect(isAcyclic(nodes, edges)).toBe(false)
  })
})
