import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import sharp from 'sharp';
import { AwsService } from 'src/aws/aws.service';
import { Image } from './schema/image.schema';
import { TransformImageDto, ListImagesDto } from './dto/image.dto';
import { User } from 'src/users/schema/user.schema';

@Injectable()
export class ImagesService {
    constructor(
        private awsService: AwsService,
        @InjectModel('image') private imageModel: Model<Image>,
        @InjectModel('user') private userModel: Model<User>,
    ) {}

    async uploadImage(userId: string, file: Express.Multer.File) {
        try {
            const metadata = await sharp(file.buffer).metadata();

            const fileId = new Types.ObjectId().toString();
            const extension = file.mimetype.split('/')[1];
            const filePath = `images/${userId}/${fileId}.${extension}`;

            await this.awsService.uploadImage(filePath, file.buffer, file.mimetype);

            const image = await this.imageModel.create({
                userId: new Types.ObjectId(userId),
                fileName: fileId,
                s3Key: filePath,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                width: metadata.width,
                height: metadata.height,
            });

            await this.userModel.findByIdAndUpdate(userId, {
                $push: { images: image._id },
                $inc: { totalStorageUsed: file.size },
            });

            return {
                id: image._id,
                userId: image.userId,
                fileName: image.fileName,
                originalName: image.originalName,
                size: image.size,
                width: image.width,
                height: image.height,
                createdAt: image['createdAt'],
            };
        } catch (error) {
            throw new BadRequestException('Failed to upload image');
        }
    }

    async transformImage(userId: string, imageId: string, transformDto: TransformImageDto) {    
        const image = await this.imageModel.findOne({
            _id: imageId,
            userId: new Types.ObjectId(userId),
        });

        if (!image) {
            throw new NotFoundException('Image not found');
        }

        try {            
            const originalBuffer = await this.awsService.getImage(image.s3Key);

            let transformer = sharp(originalBuffer);

            if (transformDto.cropX !== undefined && transformDto.cropY !== undefined &&
                transformDto.cropWidth && transformDto.cropHeight) {
                transformer = transformer.extract({
                    left: transformDto.cropX,
                    top: transformDto.cropY,
                    width: transformDto.cropWidth,
                    height: transformDto.cropHeight,
                });
            }

            if (transformDto.width || transformDto.height) {
                transformer = transformer.resize({
                    width: transformDto.width,
                    height: transformDto.height,
                    fit: transformDto.fit || 'cover',
                });
            }

            if (transformDto.rotate) {
                transformer = transformer.rotate(transformDto.rotate);
            }

            if (transformDto.flip) {
                if (transformDto.flip === 'horizontal' || transformDto.flip === 'both') {
                    transformer = transformer.flop();
                }
                if (transformDto.flip === 'vertical' || transformDto.flip === 'both') {
                    transformer = transformer.flip();
                }
            }

            if (transformDto.watermarkText) {
                const svgText = `
                    <svg width="200" height="50">
                        <text x="10" y="30" font-size="20" fill="white" fill-opacity="0.5">
                            ${transformDto.watermarkText}
                        </text>
                    </svg>
                `;
                transformer = transformer.composite([{
                    input: Buffer.from(svgText),
                    gravity: 'southeast',
                }]);
            }

            const format = transformDto.format || 'jpeg';
            const quality = transformDto.quality || 80;

            if (format === 'jpeg') {
                transformer = transformer.jpeg({ quality });
            } else if (format === 'png') {
                transformer = transformer.png({ quality });
            } else if (format === 'webp') {
                transformer = transformer.webp({ quality });
            } else if (format === 'avif') {
                transformer = transformer.avif({ quality });
            }

            const transformedBuffer = await transformer.toBuffer();
            const metadata = await sharp(transformedBuffer).metadata();
            
            const transformedFileId = new Types.ObjectId().toString();
            const transformedPath = `images/${userId}/transformed/${transformedFileId}.${format}`;
            await this.awsService.uploadImage(
                transformedPath,
                transformedBuffer,
                `image/${format}`
            );
            
            const transformedImage = await this.imageModel.create({
                userId: new Types.ObjectId(userId),
                fileName: transformedFileId,
                s3Key: transformedPath,
                originalName: `transformed_${image.originalName}`,
                mimeType: `image/${format}`,
                size: transformedBuffer.length,
                width: metadata.width,
                height: metadata.height,
            });

            return {
                id: transformedImage._id,
                fileName: transformedImage.fileName,
                originalName: transformedImage.originalName,
                size: transformedImage.size,
                width: transformedImage.width,
                height: transformedImage.height,
                format,
                createdAt: transformedImage['createdAt'],
            };
        } catch (error) {
            throw new BadRequestException('Failed to transform image: ' + error.message);
        }
    }

    async getImage(userId: string, imageId: string) {
        const image = await this.imageModel.findOne({
            _id: imageId,
            userId: new Types.ObjectId(userId),
        });

        if (!image) {
            throw new NotFoundException('Image not found');
        }

        const imageBuffer = await this.awsService.getImage(image.s3Key);

        return {
            buffer: imageBuffer,
            mimeType: image.mimeType,
            originalName: image.originalName,
        };
    }

    async getImageDetails(userId: string, imageId: string) {
        const image = await this.imageModel.findOne({
            _id: imageId,
            userId: new Types.ObjectId(userId),
        });

        if (!image) {
            throw new NotFoundException('Image not found');
        }
        
        const signedUrl = await this.awsService.getSignedUrl(image.s3Key);

        return {
            id: image._id,
            fileName: image.fileName,
            originalName: image.originalName,
            mimeType: image.mimeType,
            size: `${(image.size / 1024).toFixed(2)} KB`,
            width: image.width,
            height: image.height,
            url: signedUrl,
            createdAt: image['createdAt'],
            updatedAt: image['updatedAt'],
        };
    }
    
    async listImagesPublic(listDto: ListImagesDto) {
    const { limit = 10, page = 1, sortBy = 'createdAt', sortOrder = 'desc' } = listDto;
    const skip = (page - 1) * limit;

    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const query = {}; 

    const [images, total] = await Promise.all([
        this.imageModel
            .find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean(),
        this.imageModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        data: images.map(img => ({
            id: img._id,
            userId: img.userId, 
            fileName: img.fileName,
            originalName: img.originalName,
            mimeType: img.mimeType,
            size: `${(img.size / 1024).toFixed(2)} KB`, 
            width: img.width,
            height: img.height,
            createdAt: img['createdAt'],
        })),
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };
}
    async listImages(userId: string, listDto: ListImagesDto) {
        const { limit = 10, page = 1, sortBy = 'createdAt', sortOrder = 'desc' } = listDto;
        const skip = (page - 1) * limit;

        const sortOptions: any = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [images, total] = await Promise.all([
            this.imageModel
                .find({ userId: new Types.ObjectId(userId) })
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .lean(),
            this.imageModel.countDocuments({ userId: new Types.ObjectId(userId) }),
        ]);

        const totalPages = Math.ceil(total / limit);        

        return {
            data: images.map(img => ({
                id: img._id,
                fileName: img.fileName,
                originalName: img.originalName,
                mimeType: img.mimeType,
                size: `${(img.size / 1024).toFixed(2)} KB`,
                width: img.width,
                height: img.height,
                createdAt: img['createdAt'],
            })),
            pagination: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
    }

    async deleteImage(userId: string, imageId: string) {
        const image = await this.imageModel.findOne({
            _id: imageId,
            userId: new Types.ObjectId(userId),
        });

        if (!image) {
            throw new NotFoundException('Image not found');
        }

        await this.awsService.deleteFile(image.s3Key);
        await this.imageModel.deleteOne({ _id: imageId });

        await this.userModel.findByIdAndUpdate(userId, {
            $pull: { images: imageId },
            $inc: { totalStorageUsed: -image.size } 
        });

        return { message: 'Image and physical file deleted successfully' };
    }
}