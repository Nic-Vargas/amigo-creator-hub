import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import {
  createClient,
  SupabaseClient,
} from '@supabase/supabase-js';

import { randomUUID } from 'crypto';

@Injectable()
export class SupabaseStorageService {
  private readonly supabase:
    SupabaseClient;

  private readonly bucket: string;

  constructor(
    private readonly configService:
      ConfigService,
  ) {
    const supabaseUrl =
      this.configService.get<string>(
        'SUPABASE_URL',
      );

    const supabaseServiceKey =
      this.configService.get<string>(
        'SUPABASE_SERVICE_KEY',
      );

    const bucket =
      this.configService.get<string>(
        'SUPABASE_BUCKET',
      );

    if (
      !supabaseUrl ||
      !supabaseServiceKey ||
      !bucket
    ) {
      throw new Error(
        'Faltan SUPABASE_URL, SUPABASE_SERVICE_KEY o SUPABASE_BUCKET.',
      );
    }

    this.bucket = bucket;

    this.supabase = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }

  async uploadMovementAttachment(
    file: Express.Multer.File,
    context: {
      companyId: string;
      recobroCaseId: string;
    },
  ) {
    this.validateFile(file);

    const safeFileName =
      this.sanitizeFileName(
        file.originalname,
      );

    const storagePath = [
      context.companyId,
      'recobros',
      context.recobroCaseId,
      `${Date.now()}-${randomUUID()}-${safeFileName}`,
    ].join('/');

    const { error } =
      await this.supabase.storage
        .from(this.bucket)
        .upload(
          storagePath,
          file.buffer,
          {
            contentType:
              file.mimetype,

            upsert: false,
          },
        );

    if (error) {
      throw new InternalServerErrorException(
        `No fue posible subir ${file.originalname}: ${error.message}`,
      );
    }

    return {
      storagePath,
    };
  }

  async createSignedUrl(
    storagePath: string,
    expiresIn = 600,
  ) {
    const { data, error } =
      await this.supabase.storage
        .from(this.bucket)
        .createSignedUrl(
          storagePath,
          expiresIn,
        );

    if (error || !data?.signedUrl) {
      throw new InternalServerErrorException(
        error?.message ??
          'No fue posible generar la URL firmada.',
      );
    }

    return data.signedUrl;
  }

  async removeFiles(
    storagePaths: string[],
  ) {
    if (!storagePaths.length) {
      return;
    }

    const { error } =
      await this.supabase.storage
        .from(this.bucket)
        .remove(storagePaths);

    if (error) {
      throw new InternalServerErrorException(
        `No fue posible eliminar los archivos: ${error.message}`,
      );
    }
  }

  private validateFile(
    file: Express.Multer.File,
  ) {
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
    ];

    if (
      !allowedMimeTypes.includes(
        file.mimetype,
      )
    ) {
      throw new BadRequestException(
        'Solo se permiten archivos PDF, JPG, JPEG o PNG.',
      );
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      throw new BadRequestException(
        'El archivo supera el límite de 10 MB.',
      );
    }
  }

  private sanitizeFileName(
    fileName: string,
  ) {
    return fileName
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        '',
      )
      .replace(
        /[^a-zA-Z0-9._-]/g,
        '-',
      )
      .replace(/-+/g, '-')
      .toLowerCase();
  }
}