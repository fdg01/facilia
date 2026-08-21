'use client'

import { apiUrl } from "@/lib/api-url"
import { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  Background, Controls, MiniMap,
  addEdge, applyEdgeChanges, applyNodeChanges,
  type Node, type Edge, type OnNodesChange,
  type OnEdgesChange, type OnConnect, type Connection,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { DagNode, DagEdge } from '@modules/quoter/domain/entities'

interface DagData {
  nodes: DagNode[]
  edges: DagEdge[]
  options: unknown[]
}

const nodeColors: Record<string, string> = {
  root: '#3b82f6',
  category: '#6366f1',
  option: '#8b5cf6',
  input: '#ec4899',
  consumable: '#f59e0b',
  extra: '#10b981',
  closing: '#ef4444',
}

export function DagEditor() {
  const [dag, setDag] = useState<DagData | null>(null)
  const [rfNodes, setRfNodes] = useState<Node[]>([])
  const [rfEdges, setRfEdges] = useState<Edge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<DagNode | null>(null)
  const [showNodeForm, setShowNodeForm] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(apiUrl('/api/dag'))
        const json = await res.json()
        if (json.error) throw new Error(json.error.message)
        setDag(json.data)
        // Convert to React Flow format
        const nodes: Node[] = json.data.nodes.map((n: DagNode, i: number) => ({
          id: n.id,
          type: 'default',
          position: { x: 100 + (i % 4) * 220, y: 80 + Math.floor(i / 4) * 120 },
          data: {
            label: `${n.label}\n(${n.type})`,
          },
          style: {
            background: nodeColors[n.type] ?? '#e5e7eb',
            color: 'white',
            border: 'none',
          },
        }))
        const edges: Edge[] = json.data.edges.map((e: DagEdge) => ({
          id: e.id,
          source: e.sourceId,
          target: e.targetId,
          animated: true,
        }))
        setRfNodes(nodes)
        setRfEdges(edges)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar DAG')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setRfNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setRfEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  )

  const onConnect: OnConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return
      try {
        const res = await fetch(apiUrl('/api/admin/dag/edges'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceId: connection.source,
            targetId: connection.target,
          }),
        })
        const json = await res.json()
        if (json.error) {
          setError(json.error.message)
          return
        }
        setRfEdges((eds) => addEdge({ ...connection, id: json.data.id, animated: true }, eds))
        setError(null)
      } catch {
        setError('Error al crear arista')
      }
    },
    [],
  )

  const handleDeleteEdge = useCallback(async (edgeId: string) => {
    try {
      const res = await fetch(apiUrl(`/api/admin/dag/edges/${edgeId}`), { method: 'DELETE' })
      const json = await res.json()
      if (json.error) {
        setError(json.error.message)
        return
      }
      setRfEdges((eds) => eds.filter((e) => e.id !== edgeId))
      setError(null)
    } catch {
      setError('Error al eliminar arista')
    }
  }, [])

  const handleDeleteNode = useCallback(async (nodeId: string) => {
    if (!confirm('¿Eliminar este nodo?')) return
    try {
      const res = await fetch(apiUrl(`/api/admin/dag/nodes/${nodeId}`), { method: 'DELETE' })
      const json = await res.json()
      if (json.error) {
        setError(json.error.message)
        return
      }
      setRfNodes((nds) => nds.filter((n) => n.id !== nodeId))
      setRfEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
      setSelectedNode(null)
      setError(null)
    } catch {
      setError('Error al eliminar nodo')
    }
  }, [])

  const handleCreateNode = useCallback(async (data: {
    code: string; label: string; type: DagNode['type']; line?: DagNode['line'];
    priceType?: DagNode['priceType']; basePrice?: number;
  }) => {
    try {
      const res = await fetch(apiUrl('/api/admin/dag/nodes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.error) {
        setError(json.error.message)
        return
      }
      const newNode: Node = {
        id: json.data.id,
        type: 'default',
        position: { x: 300, y: 300 },
        data: { label: `${json.data.label} (${json.data.type})` },
        style: { background: nodeColors[json.data.type] ?? '#e5e7eb', color: 'white', border: 'none' },
      }
      setRfNodes((nds) => [...nds, newNode])
      setShowNodeForm(false)
      setError(null)
    } catch {
      setError('Error al crear nodo')
    }
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><p className="text-gray-500">Cargando editor DAG...</p></div>
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Editor de DAG</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNodeForm(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 text-sm"
          >
            + Nuevo nodo
          </button>
          {selectedNode && (
            <button
              onClick={() => handleDeleteNode(selectedNode.id)}
              className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 text-sm"
            >
              Eliminar nodo
            </button>
          )}
        </div>
      </div>

      <div className="h-[600px] border border-gray-200 rounded-lg overflow-hidden">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeDoubleClick={(_, edge) => handleDeleteEdge(edge.id)}
          onNodeClick={(_, node) => {
            const dagNode = dag?.nodes.find((n) => n.id === node.id)
            setSelectedNode(dagNode ?? null)
          }}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      <p className="text-xs text-gray-500">
        Doble clic en una arista para eliminarla. Arrastrá para conectar nodos.
      </p>

      {selectedNode && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold">Nodo seleccionado</h3>
          <p className="text-sm text-gray-600 mt-1">
            <strong>{selectedNode.label}</strong> — Tipo: {selectedNode.type},
            Línea: {selectedNode.line ?? '—'},
            Precio: {selectedNode.priceType} ({selectedNode.basePrice ?? '—'})
          </p>
        </div>
      )}

      {showNodeForm && (
        <NodeForm
          onSubmit={handleCreateNode}
          onCancel={() => setShowNodeForm(false)}
        />
      )}
    </div>
  )
}

interface NodeFormProps {
  onSubmit: (data: {
    code: string; label: string; type: DagNode['type']; line?: DagNode['line'];
    priceType?: DagNode['priceType']; basePrice?: number;
  }) => void
  onCancel: () => void
}

function NodeForm({ onSubmit, onCancel }: NodeFormProps) {
  const [code, setCode] = useState('')
  const [label, setLabel] = useState('')
  const [type, setType] = useState<DagNode['type']>('category')
  const [line, setLine] = useState<DagNode['line'] | ''>('')
  const [priceType, setPriceType] = useState<DagNode['priceType']>('no_price')
  const [basePrice, setBasePrice] = useState('')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-20">
      <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
        <h3 className="text-lg font-bold">Nuevo nodo</h3>
        <div>
          <label className="block text-sm font-medium mb-1">Código</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} className="w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Label</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tipo</label>
          <select value={type} onChange={(e) => setType(e.target.value as DagNode['type'])} className="w-full rounded border px-3 py-2">
            <option value="root">Root</option>
            <option value="category">Categoría</option>
            <option value="option">Opción</option>
            <option value="input">Input</option>
            <option value="consumable">Insumo</option>
            <option value="extra">Extra</option>
            <option value="closing">Cierre</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Línea</label>
          <select value={line ?? ''} onChange={(e) => setLine(e.target.value as DagNode['line'] | '')} className="w-full rounded border px-3 py-2">
            <option value="">—</option>
            <option value="clean">Clean</option>
            <option value="care">Care</option>
            <option value="continuity">Continuity</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tipo de precio</label>
          <select value={priceType} onChange={(e) => setPriceType(e.target.value as DagNode['priceType'])} className="w-full rounded border px-3 py-2">
            <option value="no_price">Sin precio</option>
            <option value="fixed">Fijo</option>
            <option value="per_m2">Por m²</option>
            <option value="per_unit">Por unidad</option>
            <option value="calculated">Calculado</option>
          </select>
        </div>
        {priceType !== 'no_price' && (
          <div>
            <label className="block text-sm font-medium mb-1">Precio base</label>
            <input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className="w-full rounded border px-3 py-2" />
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button onClick={onCancel} className="flex-1 rounded-lg border px-4 py-2 hover:bg-gray-50">Cancelar</button>
          <button
            onClick={() => onSubmit({
              code, label, type,
              line: line || undefined,
              priceType: priceType === 'no_price' ? undefined : priceType,
              basePrice: basePrice ? Number(basePrice) : undefined,
            })}
            disabled={!code || !label}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Crear
          </button>
        </div>
      </div>
    </div>
  )
}

