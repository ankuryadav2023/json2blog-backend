import 'dotenv/config';
import { ChatOpenAI } from "@langchain/openai";
import { createClient } from 'pexels';
import { fal } from "@fal-ai/client";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

export class WriterAgent{
    private pexelsClient: any;
    private llm: ChatOpenAI;
    private getStcokImagesTool: any;
    private generateImageTool: any;
    private tools: any[];
    private llmWithTools: any;
    private systemPromptForWriterAgent: SystemMessage;

    constructor() {
        this.pexelsClient = createClient(process.env.PEXELS_API_KEY!);
        fal.config({
            credentials: process.env.FAL_API_KEY!
        });
        this.llm = new ChatOpenAI({ model: "gpt-4o-mini" });
        
        this.getStcokImagesTool = tool(
            async ({ query })=>{
                const response = await this.pexelsClient.photos.search({ query, orientation: 'portrait' });
                return JSON.stringify(response.photos.map(photo => ({ url: photo.src.original, alt: photo.alt })));
            },
            {
                name: "getStcokImagesTool",
                description: "Use this tool to get stock images from a query.",
                schema: z.object({
                    query: z.string(),
                })
            }
        );
        
        this.generateImageTool = tool(
            async ({ prompt })=>{
                const result = await fal.subscribe("fal-ai/flux/dev", {
                    input: { prompt }
                });
                return result.data.images[0].url;
            },
            {
                name: "generateImageTool",
                description: "Use this tool to generate an image from a prompt.",
                schema: z.object({
                    prompt: z.string(),
                })
            }
        );
        
        this.tools = [
            this.getStcokImagesTool,
            this.generateImageTool
        ];

        this.llmWithTools = this.llm.bindTools(this.tools);

        this.systemPromptForWriterAgent = new SystemMessage(`You are an excellent blog writer. Your task is to write a blog based on the user prompt and provided research. Also you have access to 2 tools which you can use to get images for the blog. Return the response in the following JSON schema:
        {
            "name": "blog_post_schema",
            "strict": true,
            "schema": {
                "type": "object",
                "description": "Defines the structure of a blog post, including the title and a list of content blocks.",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "The main title of the blog post."
                    },
                    "blocks": {
                        "type": "array",
                        "description": "An ordered list of content blocks for a blog post. Each block can be text, image, text-text, image-text, text-image, or image-image.",
                        "items": {
                            "type": "object",
                            "properties": {
                                "type": {
                                    "type": "string",
                                    "description": "The type of content block.",
                                    "enum": [
                                        "text",
                                        "image",
                                        "text-text",
                                        "image-text",
                                        "text-image",
                                        "image-image"
                                    ]
                                },
                                "text": {
                                    "type": "string",
                                    "description": "Text content for blocks with type 'text', 'image-text', or 'text-image'."
                                },
                                "text1": {
                                    "type": "string",
                                    "description": "First text section for 'text-text' blocks."
                                },
                                "text2": {
                                    "type": "string",
                                    "description": "Second text section for 'text-text' blocks."
                                },
                                "image": {
                                    "type": "string",
                                    "format": "uri",
                                    "description": "Image URL for blocks with a single image."
                                },
                                "image1": {
                                    "type": "string",
                                    "format": "uri",
                                    "description": "First image URL for 'image-image' blocks."
                                },
                                "image2": {
                                    "type": "string",
                                    "format": "uri",
                                    "description": "Second image URL for 'image-image' blocks."
                                },
                                "imageAlt": {
                                    "type": "string",
                                    "description": "Alt text for the 'image' property."
                                },
                                "imageAlt1": {
                                    "type": "string",
                                    "description": "Alt text for the 'image1' property."
                                },
                                "imageAlt2": {
                                    "type": "string",
                                    "description": "Alt text for the 'image2' property."
                                }
                            },
                            "required": ["type"],
                            "additionalProperties": false,
                            "allOf": [
                                {
                                    "if": { "properties": { "type": { "const": "text" } } },
                                    "then": { "required": ["text"] }
                                },
                                {
                                    "if": { "properties": { "type": { "const": "image" } } },
                                    "then": { "required": ["image", "imageAlt"] }
                                },
                                {
                                    "if": { "properties": { "type": { "const": "text-text" } } },
                                    "then": { "required": ["text1", "text2"] }
                                },
                                {
                                    "if": { "properties": { "type": { "const": "image-text" } } },
                                    "then": { "required": ["image", "imageAlt", "text"] }
                                },
                                {
                                    "if": { "properties": { "type": { "const": "text-image" } } },
                                    "then": { "required": ["text", "image", "imageAlt"] }
                                },
                                {
                                    "if": { "properties": { "type": { "const": "image-image" } } },
                                    "then": { "required": ["image1", "image2", "imageAlt1", "imageAlt2"] }
                                }
                            ]
                        }
                    }
                },
                "required": ["title", "blocks"],
                "additionalProperties": false
            }
        }`)
    }

    async invoke(prompt: string) {
        console.log('Starting writer agent with prompt:', prompt);
        let messages = [this.systemPromptForWriterAgent, new HumanMessage(prompt)];
        let finalResponse: string = '';
        let end_execution = false;
        while (!end_execution) {
            console.log('Invoking LLM...');
            try {
                const response = await this.llmWithTools.invoke(messages);
                messages.push(response);
                if (response.response_metadata.finish_reason === 'tool_calls') {
                    for (let i = 0; i < response.tool_calls.length; i++) {
                        console.log('Executing tool:', response.tool_calls[i].name, 'with args:', response.tool_calls[i].args);
                        if (response.tool_calls[i].name === 'getStcokImagesTool') messages.push(await this.getStcokImagesTool.invoke(response.tool_calls[i]));
                        else messages.push(await this.generateImageTool.invoke(response.tool_calls[i]))
                    }
                } else {
                    console.log(response.content);
                    finalResponse = response.content;
                    end_execution = true;
                }
            } catch (e) {
                console.log(`Error in executing agent: ${e.message}`);
                finalResponse = e.message;
                end_execution = true;
            }
        }
        return finalResponse;
    }
    
}