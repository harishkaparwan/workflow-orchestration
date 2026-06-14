import asyncio
from google.antigravity import Agent, LocalAgentConfig, types

async def main():
    print("Initializing Google Antigravity Agent with DatabaseServer MCP...")
    
    # Configure the SSE Transport to connect to our FastMCP server on port 5001
    mcp_servers = [
        types.McpStreamableHttpServer(
            name="database-server",
            url="http://localhost:8000/sse"
        )
    ]
    
    config = LocalAgentConfig(
        mcp_servers=mcp_servers,
        # Default model is typically fine, but you can configure it explicitly if needed
        # model="models/gemini-2.5-flash"
    )
    
    # The Antigravity Agent automatically discovers the tools from the MCP server
    async with Agent(config) as agent:
        print("Connected! Asking the agent to query the database...")
        
        # Test the Postgres tool
        prompt = "Using the postgres_query tool, tell me the names of the tables in the public schema of the postgres database."
        print(f"\nUser: {prompt}")
        
        response = await agent.chat(prompt)
        print(f"Agent: {await response.text()}")

        # Test the Mongo tool
        prompt2 = "Using the mongo_find tool, check the 'events' collection and tell me if there are any events."
        print(f"\nUser: {prompt2}")
        
        response2 = await agent.chat(prompt2)
        print(f"Agent: {await response2.text()}")

if __name__ == "__main__":
    asyncio.run(main())
