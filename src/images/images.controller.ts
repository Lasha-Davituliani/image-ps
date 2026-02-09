import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    Body,
    UploadedFile,
    UseInterceptors,
    UseGuards,
    Req,
    Res,
    Query,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ImagesService } from './images.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { ListImagesDto, TransformImageDto } from './dto/image.dto';

@Controller('images')
@UseGuards(AuthGuard)
export class ImagesController {
    constructor(private readonly imagesService: ImagesService) {}

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadImage(
        @UploadedFile() file: Express.Multer.File,
        @Req() req: any
    ) {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Only image files are allowed');
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            throw new BadRequestException('File size must not exceed 10MB');
        }

        return this.imagesService.uploadImage(req.userId, file);
    }

    @Post(':id/transform')
    async transformImage(
        @Param('id') id: string,
        @Body() transformDto: TransformImageDto,
        @Req() req: any
    ) {
        return this.imagesService.transformImage(req.userId, id, transformDto);
    }

    @Get()
    async listImages(
        @Query() listDto: ListImagesDto,
        @Req() req: any
    ) {
        return this.imagesService.listImages(req.userId, listDto);
    }

    @Get(':id')
    async getImageDetails(
        @Param('id') id: string,
        @Req() req: any
    ) {
        return this.imagesService.getImageDetails(req.userId, id);
    }

    @Get(':id/download')
    async downloadImage(
        @Param('id') id: string,
        @Req() req: any,
        @Res() res: Response
    ) {
        const { buffer, mimeType, originalName } = await this.imagesService.getImage(
            req.userId,
            id
        );

        res.set({
            'Content-Type': mimeType,
            'Content-Disposition': `attachment; filename="${originalName}"`,
        });

        res.send(buffer);
    }

    @Get(':id/view')
    async viewImage(
        @Param('id') id: string,
        @Req() req: any,
        @Res() res: Response
    ) {
        const { buffer, mimeType } = await this.imagesService.getImage(
            req.userId,
            id
        );

        res.set({
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=31536000',
        });

        res.send(buffer);
    }

    @Delete(':id')
    async deleteImage(
        @Param('id') id: string,
        @Req() req: any
    ) {
        return this.imagesService.deleteImage(req.userId, id);
    }
}