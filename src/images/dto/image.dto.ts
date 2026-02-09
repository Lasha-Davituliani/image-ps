import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class UploadImageDto {
    @IsOptional()
    @IsString()
    description?: string;
}

export class TransformImageDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5000)
    width?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5000)
    height?: number;

    @IsOptional()
    @IsEnum(['contain', 'cover', 'fill', 'inside', 'outside'])
    fit?: 'contain' | 'cover' | 'fill' | 'inside' | 'outside';

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(360)
    rotate?: number;

    @IsOptional()
    @IsEnum(['horizontal', 'vertical', 'both'])
    flip?: 'horizontal' | 'vertical' | 'both';

    @IsOptional()
    @IsEnum(['jpeg', 'png', 'webp', 'avif'])
    format?: 'jpeg' | 'png' | 'webp' | 'avif';

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    quality?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(5000)
    cropX?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(5000)
    cropY?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5000)
    cropWidth?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5000)
    cropHeight?: number;

    @IsOptional()
    @IsString()
    watermarkText?: string;
}

export class ListImagesDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @IsOptional()
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc';
}