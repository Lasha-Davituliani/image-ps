import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema({ 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: (doc, ret) => {     
      const result = ret as any;
      delete result.totalStorageUsed;
      delete result.password;
      delete result.__v;
      return result;
    }
  },
  toObject: { virtuals: true } 
})
export class User {
    @Prop({ type: String })
    fullName: string;

    @Prop({ type: String, unique: true })
    email: string;

    @Prop({ type: String, select: false })
    password: string;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'image' }] })
    images: Types.ObjectId[];

    @Prop({ type: Number, default: 0 })
    totalStorageUsed: number;
}

export const userSchema = SchemaFactory.createForClass(User);


userSchema.virtual('totalStorageUsedMB').get(function() {
    if (!this.totalStorageUsed) return "0.00 MB";
    return (this.totalStorageUsed / (1024 * 1024)).toFixed(2) + " MB";
});