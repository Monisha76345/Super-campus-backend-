import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class S3ClientService implements OnModuleInit {
  private readonly logger = new Logger(S3ClientService.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    const endpointHost = config.get<string>("storage.endpoint") ?? "127.0.0.1";
    const port = config.get<number>("storage.port") ?? 9000;
    const useSSL = config.get<boolean>("storage.useSSL") === true;
    this.bucket = config.get<string>("storage.bucket") ?? "supercampus-storage";
    this.client = new S3Client({
      endpoint: `${useSSL ? "https" : "http"}://${endpointHost}:${port}`,
      region: "us-east-1",
      credentials: {
        accessKeyId: config.get<string>("storage.accessKey") ?? "",
        secretAccessKey: config.get<string>("storage.secretKey") ?? "",
      },
      forcePathStyle: true,
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Created MinIO bucket ${this.bucket}`);
      } catch (err) {
        this.logger.warn(`MinIO bucket check skipped: ${(err as Error).message}`);
      }
    }
  }

  async uploadBuffer(key: string, body: Buffer, metadata: Record<string, string>): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: metadata["Content-Type"],
        Metadata: metadata,
      }),
    );
  }

  async downloadFile(key: string) {
    return this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async getMetaData(key: string) {
    const head = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
    return {
      mimetype: head.ContentType || head.Metadata?.["x-amz-meta-mimetype"] || "application/octet-stream",
      filename: head.Metadata?.["x-amz-meta-filename"] || "file",
    };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
