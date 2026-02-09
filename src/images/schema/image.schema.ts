import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema({ timestamps: true })
export class Image {
    @Prop({ type: Types.ObjectId, ref: 'user', required: true })
    userId: Types.ObjectId;

    @Prop({ type: String, required: true })
    fileName: string;

    @Prop({ type: String, required: true })
    s3Key: string;

    @Prop({ type: String, required: true })
    originalName: string;

    @Prop({ type: String })
    mimeType: string;

    @Prop({ type: Number })
    size: number;

    @Prop({ type: Number })
    width: number;

    @Prop({ type: Number })
    height: number;

    @Prop({ type: String, default: 'active' })
    status: string;
}

export const ImageSchema = SchemaFactory.createForClass(Image);