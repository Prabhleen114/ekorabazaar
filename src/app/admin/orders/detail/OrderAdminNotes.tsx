'use client'

import { useState } from 'react'
import { Lock, Plus, Edit2, Trash2, Check, X } from 'lucide-react'

export interface AdminOrderNoteItem {
  id: string
  orderId: string
  content: string
  createdAt: string
  updatedAt: string
  author?: {
    id: string
    name?: string | null
    email?: string | null
  } | null
}

export default function OrderAdminNotes({
  orderId,
  initialNotes = [],
}: {
  orderId: string
  initialNotes: AdminOrderNoteItem[]
}) {
  const [notes, setNotes] = useState<AdminOrderNoteItem[]>(initialNotes)
  const [newContent, setNewContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newContent.trim()) return
    setSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add note')
      setNotes((prev) => [data.note, ...prev])
      setNewContent('')
      setSuccessMsg('Private admin note saved.')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error saving note')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveEdit = async (noteId: string) => {
    if (!editContent.trim()) return
    setSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update note')
      setNotes((prev) => prev.map((n) => (n.id === noteId ? data.note : n)))
      setEditingId(null)
      setSuccessMsg('Note updated.')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error updating note')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    setSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/notes/${noteId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete note')
      setNotes((prev) => prev.filter((n) => n.id !== noteId))
      setConfirmDeleteId(null)
      setSuccessMsg('Note deleted.')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error deleting note')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-amber-200/80 overflow-hidden">
      <div className="p-4 border-b border-amber-100 bg-amber-50/70 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-700" />
          <h2 className="font-semibold text-gray-900">Private Admin Notes</h2>
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
          Admin Only &bull; Internal
        </span>
      </div>

      <div className="p-4 space-y-4">
        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleAddNote} className="space-y-2.5">
          <textarea
            rows={3}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Add internal operational notes, packing instructions, vendor follow-up, or special remarks (never shared with customer)..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !newContent.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-black disabled:opacity-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {submitting ? 'Saving...' : 'Add Private Note'}
            </button>
          </div>
        </form>

        <div className="space-y-2.5 pt-2 border-t border-gray-100">
          {notes.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-3">
              No private notes recorded for this order yet.
            </p>
          ) : (
            notes.map((note) => {
              const isEditing = editingId === note.id
              const isConfirmDelete = confirmDeleteId === note.id
              const wasEdited =
                new Date(note.updatedAt).getTime() - new Date(note.createdAt).getTime() > 2000

              return (
                <div key={note.id} className="p-3 rounded-lg bg-amber-50/40 border border-amber-100 space-y-2">
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-gray-300 rounded bg-white text-gray-700"
                        >
                          <X className="w-3 h-3" /> Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(note.id)}
                          disabled={submitting || !editContent.trim()}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {note.content}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-gray-500">
                        <div>
                          <span className="font-medium text-gray-700">
                            {note.author?.name || note.author?.email || 'Admin'}
                          </span>{' '}
                          &bull;{' '}
                          {new Date(note.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                          {wasEdited && (
                            <span className="ml-1 text-gray-400">
                              (edited{' '}
                              {new Date(note.updatedAt).toLocaleString('en-IN', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                              )
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isConfirmDelete ? (
                            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                              <span className="text-red-800 font-medium">Delete?</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteNote(note.id)}
                                disabled={submitting}
                                className="font-bold text-red-700 hover:text-red-900"
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(note.id)
                                  setEditContent(note.content)
                                  setErrorMsg('')
                                  setSuccessMsg('')
                                }}
                                className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium"
                              >
                                <Edit2 className="w-3 h-3" /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(note.id)}
                                className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-medium"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
