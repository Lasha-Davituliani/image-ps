import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class AwsService {
    private bucketName: string;
    private s3: S3Client;

    constructor() {
        this.bucketName = process.env.AWS_BUCKET_NAME!;
        this.s3 = new S3Client({
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
            region: process.env.AWS_REGION,
        });
    }

    async uploadImage(filePath: string, file: Buffer, contentType?: string) {
        if (!filePath || !file) throw new BadRequestException('File path and file are required');
        
        const config = {
            Key: filePath,
            Bucket: this.bucketName,
            Body: file,
            ContentType: contentType || 'image/jpeg',
        };

        const uploadCommand = new PutObjectCommand(config);
        await this.s3.send(uploadCommand);
        return filePath;
    }

    async getImage(filePath: string): Promise<Buffer> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: filePath,
            });

            const response = await this.s3.send(command);
            const stream = response.Body as any;
            const chunks: Uint8Array[] = [];

            for await (const chunk of stream) {
                chunks.push(chunk);
            }

            return Buffer.concat(chunks);
        } catch (error) {
            throw new BadRequestException('Image not found');
        }
    }

    async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: filePath,
        });

        return await getSignedUrl(this.s3, command, { expiresIn });
    }
}