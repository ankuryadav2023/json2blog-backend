import { Module } from '@nestjs/common';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ResearcherAgent } from './agents/researcher.agent';
import { WriterAgent } from './agents/writer.agent';
import { FormatterAgent } from './agents/formatter.agent';
import { Blog, blogSchema } from './schemas/blog.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Blog.name, schema: blogSchema }])],
  controllers: [BlogController],
  providers: [BlogService, ResearcherAgent, WriterAgent, FormatterAgent]
})
export class BlogModule {}
