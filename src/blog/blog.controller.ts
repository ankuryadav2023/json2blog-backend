import { Controller, Post, Patch, Param, Body, ValidationPipe, HttpException } from '@nestjs/common';
import { CreateBlogDto } from './dtos/create-blog.dto';
import { BlogService } from './blog.service';
import { EditBlogDto } from './dtos/edit-blog.dto';

@Controller('blog')
export class BlogController {
    constructor(private readonly blogService: BlogService) {}

    @Post('generateFromPrompt')
    async generateBlogFromPrompt(@Body(new ValidationPipe()) body: CreateBlogDto) {
        try{
            const blog = await this.blogService.generateBlogFromPrompt(body.prompt);
            return blog;
        } catch (error) {
            console.error('Error generating blog from prompt:', error);
            throw new HttpException(error.message, error.status);
        }
    }

    @Patch(':blogId')
    async editBlog(@Param('blogId') blogId: string, @Body(new ValidationPipe()) editBlogData: EditBlogDto) {
        try{
            const blog = await this.blogService.editBlog(blogId, editBlogData);
            return blog;
        } catch (error) {
            console.error('Error editing blog:', error);
            throw new HttpException(error.message, error.status);
        }
    }

}
