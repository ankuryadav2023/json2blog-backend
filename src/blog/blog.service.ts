import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { Blog } from './schemas/blog.schema';
import { ResearcherAgent } from './agents/researcher.agent';
import { WriterAgent } from './agents/writer.agent';
import { FormatterAgent } from './agents/formatter.agent';
import { InjectModel } from '@nestjs/mongoose';
import { EditBlogDto } from './dtos/edit-blog.dto';

@Injectable()
export class BlogService {
    constructor(
        @InjectModel(Blog.name) private readonly blogModel: Model<Blog>,
        private readonly researcherAgent: ResearcherAgent,
        private readonly writerAgent: WriterAgent,
        private readonly formatterAgent: FormatterAgent,
    ) {}

    async generateBlogFromPrompt(prompt: string) {
        try{
            const researchData = await this.researcherAgent.invoke(prompt);
            const rawBlog = await this.writerAgent.invoke(researchData);
            const formattedBlog = await this.formatterAgent.invoke(rawBlog);
            const blog=await this.blogModel.create({
                userId: 'user123',
                title: formattedBlog.title,
                content: formattedBlog.blocks,
                status: 'draft',
                deleted: false,
            });
            return blog;
        } catch (error) {
            console.error('Error generating blog from prompt:', error);
            throw error;
        }
    }

    async editBlog(id: string, editBlogDto: EditBlogDto) {
        try{
            const blog = await this.blogModel.findById(id);
            if(blog){
                blog.title = editBlogDto.title;
                blog.content = editBlogDto.content;
                await blog.save();
                return blog;
            } else {
                throw new NotFoundException('Blog not found');
            }
        } catch (error) {
            console.error('Error editing blog:', error);
            throw error;
        }
    }
}
