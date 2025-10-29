import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";

@Schema({timestamps: true})
export class Blog {
    @Prop({required: true})
    userId: string;

    @Prop({required: true})
    title: string;

    @Prop({required: true, type: [Object]})
    content: object[];

    @Prop({ required: true, enum: ['draft', 'published'] })
    status: 'draft' | 'published';

    @Prop({required: true})
    deleted: boolean;
}

export const blogSchema = SchemaFactory.createForClass(Blog);