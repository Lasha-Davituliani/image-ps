import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { AwsModule } from 'src/aws/aws.module';
import { ImageSchema } from './schema/image.schema';
import { userSchema } from 'src/users/schema/user.schema';

@Module({
    imports: [
        AwsModule,
        MongooseModule.forFeature([
            { name: 'image', schema: ImageSchema },
            {name:"user", schema: userSchema}
        ])
    ],
    controllers: [ImagesController],
    providers: [ImagesService],
})
export class ImagesModule {}