// modules/operations/infrastructure/repositories/supabase-storage-repository.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { StorageRepository } from '../../domain/repositories'

export class SupabaseStorageRepository implements StorageRepository {
  constructor(private readonly client: SupabaseClient) {}

  async createSignedUploadUrl(storagePath: string, contentType: string, expiresInSec: number): Promise<string> {
    const { data, error } = await this.client.storage
      .from('evidence')
      .createSignedUploadUrl(storagePath, { upsert: false })
    if (error) throw error
    return data.signedUrl
  }

  async uploadBuffer(storagePath: string, buffer: Buffer, contentType: string): Promise<void> {
    const { error } = await this.client.storage
      .from('evidence')
      .upload(storagePath, buffer, { contentType })
    if (error) throw error
  }

  async createSignedDownloadUrl(storagePath: string, expiresInSec: number): Promise<string> {
    const { data, error } = await this.client.storage
      .from('evidence')
      .createSignedUrl(storagePath, expiresInSec)
    if (error) throw error
    return data.signedUrl
  }
}
