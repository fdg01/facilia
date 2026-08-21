// modules/quoter/domain/dag-validator.ts
import type { DagNode, DagEdge } from './entities'

export function isAcyclic(nodes: DagNode[], edges: DagEdge[]): boolean {
  const adjacency = buildAdjacency(nodes, edges)
  const visited = new Set<string>()
  const inStack = new Set<string>()

  function dfs(nodeId: string): boolean {
    if (inStack.has(nodeId)) return false
    if (visited.has(nodeId)) return true

    visited.add(nodeId)
    inStack.add(nodeId)

    const neighbors = adjacency.get(nodeId) ?? []
    for (const neighbor of neighbors) {
      if (!dfs(neighbor)) return false
    }

    inStack.delete(nodeId)
    return true
  }

  return nodes.every((n) => dfs(n.id))
}

function buildAdjacency(nodes: DagNode[], edges: DagEdge[]): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const node of nodes) {
    map.set(node.id, [])
  }
  for (const edge of edges) {
    const neighbors = map.get(edge.sourceId) ?? []
    neighbors.push(edge.targetId)
    map.set(edge.sourceId, neighbors)
  }
  return map
}
