import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import * as path from 'path';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: Minio.Client;
  private readonly bucketName = process.env.MINIO_BUCKET || 'propellants';

  constructor() {
    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'propellant_admin',
      secretKey: process.env.MINIO_SECRET_KEY || 'propellant_secret_pass',
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucketName);
      if (!exists) {
        await this.client.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`Created Minio bucket: ${this.bucketName}`);

        const publicReadPolicy = JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        });
        await this.client.setBucketPolicy(this.bucketName, publicReadPolicy);
      } else {
        this.logger.log(`Minio bucket ready: ${this.bucketName}`);
      }
    } catch (err) {
      this.logger.warn(`Minio initialization notice: ${err.message}. Files can still be uploaded when Minio is active.`);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    prefix: 'propellant' | 'exhaust' = 'propellant',
  ): Promise<{ fileName: string; fileUrl: string }> {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const ext = rawExt || (file.mimetype.includes('video') ? '.mp4' : '.jpg');
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const latinFileName = `${prefix}_${timestamp}_${randomSuffix}${ext}`;

    await this.client.putObject(
      this.bucketName,
      latinFileName,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype },
    );

    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const fileUrl = `${protocol}://${endpoint}:${port}/${this.bucketName}/${latinFileName}`;

    return {
      fileName: latinFileName,
      fileUrl,
    };
  }
}
