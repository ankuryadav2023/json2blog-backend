import 'dotenv/config';
import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

@Injectable()
export class FormatterAgent {
    private llm: ChatOpenAI;
    private llmWithStructuredOutput: any;
    private systemPromptForFormatterAgent: SystemMessage;

    constructor() {
        this.llm = new ChatOpenAI({ model: "gpt-4o-mini" });

        this.llmWithStructuredOutput = this.llm.withStructuredOutput({
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
            });

        this.systemPromptForFormatterAgent = new SystemMessage('Your task is to format the provided response from an LLM into a structured output.');
    }

    async invoke(prompt: string) {
        console.log('Starting formatter agent with prompt:', prompt);
        try {
            const messages = [this.systemPromptForFormatterAgent, new HumanMessage(prompt)];
            const response = await this.llmWithStructuredOutput.invoke(messages);
            console.log('Formatted response:', response);
            return response;
        } catch (error) {
            console.log(`Error in formatter agent: ${error.message}`);
            throw error;
        }
    }
}