import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    this.bucketName = this.configService.get<string>('SUPABASE_BUCKET', 'media');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('Supabase credentials not configured. File uploads will fail.');
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.logger.log('Supabase client initialized successfully');
  }

  /**
   * Загрузить файл в Supabase Storage
   */
  async uploadFile(
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<{ url: string; path: string } | null> {
    if (!this.supabase) {
      this.logger.error('Supabase client not initialized');
      return null;
    }

    try {
      const path = `uploads/${Date.now()}-${filename}`;

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(path, buffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (error) {
        this.logger.error('Failed to upload file to Supabase:', error);
        return null;
      }

      // Get public URL
      const { data: publicUrlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(path);

      return {
        url: publicUrlData.publicUrl,
        path: data.path,
      };
    } catch (error) {
      this.logger.error('Error uploading file to Supabase:', error);
      return null;
    }
  }

  /**
   * Удалить файл из Supabase Storage
   */
  async deleteFile(path: string): Promise<boolean> {
    if (!this.supabase) {
      this.logger.error('Supabase client not initialized');
      return false;
    }

    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([path]);

      if (error) {
        this.logger.error('Failed to delete file from Supabase:', error);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Error deleting file from Supabase:', error);
      return false;
    }
  }

  /**
   * Проверить существование файла
   */
  async fileExists(path: string): Promise<boolean> {
    if (!this.supabase) {
      return false;
    }

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list('uploads', {
          search: path,
        });

      return !error && data && data.length > 0;
    } catch (error) {
      return false;
    }
  }
}
