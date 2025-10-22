import 'dotenv/config';
import { ChatOpenAI } from "@langchain/openai";
import { TavilySearch } from "@langchain/tavily";
import { DynamicStructuredTool, tool } from "@langchain/core/tools";
import axios from 'axios';
import { z } from "zod";
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

export class ResearcherAgent{
    private llm: ChatOpenAI;
    private tavilySearchTool: TavilySearch;
    private firecrawlScrapeTool: DynamicStructuredTool<any>;
    private tools: any[];
    private llmWithTools: any;
    private systemPromptForResearcherAgent: SystemMessage;

    constructor(){
        this.llm = new ChatOpenAI({ model: "gpt-4o-mini" });
        this.tavilySearchTool = new TavilySearch({
        maxResults: 5,
        topic: "general"
        });

        this.firecrawlScrapeTool = tool(
            async ({ url }) => {
                try {
                const response = await axios.post('https://api.firecrawl.dev/v2/scrape', {
                    url: url,
                    formats: ['markdown']
                }, {
                    headers: {
                    'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
                    'Content-Type': 'application/json'
                    }
                });
                return JSON.stringify(response.data);
                } catch (error) {
                console.log(error.message);
                return JSON.stringify(error.message);
                }
            },
            {
                name: "firecrawlScrapeTool",
                description: "Use this tool to scrape a webpage content",
                schema: z.object({
                    url: z.string(),
                })
            }
        );

        this.tools = [
        this.tavilySearchTool,
        this.firecrawlScrapeTool
        ];

        this.llmWithTools = this.llm.bindTools(this.tools);

        this.systemPromptForResearcherAgent = new SystemMessage('You are an excellent researcher. Your task is to reasearch on provided urls or topic.')
    }

    async invoke(prompt: string) {
        console.log('Starting researcher agent with prompt:', prompt);
        let messages = [this.systemPromptForResearcherAgent, new HumanMessage(prompt)];
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
                        if (response.tool_calls[i].name === 'firecrawlScrapeTool') messages.push(await this.firecrawlScrapeTool.invoke(response.tool_calls[i]));
                        else messages.push(await this.tavilySearchTool.invoke(response.tool_calls[i]))
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