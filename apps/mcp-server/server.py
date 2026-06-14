import os
import psycopg2
from pymongo import MongoClient
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP Server
mcp = FastMCP("DatabaseServer")

# Database Connection Helpers
def get_pg_connection():
    return psycopg2.connect(
        host=os.environ.get('PGHOST', '127.0.0.1'),
        port=os.environ.get('PGPORT', '5434'),
        user=os.environ.get('PGUSER', 'localadmin'),
        password=os.environ.get('PGPASSWORD', 'localadmin'),
        dbname=os.environ.get('PGDATABASE', 'hercules')
    )

def get_mongo_collection(collection_name: str):
    mongo_uri = os.environ.get('MONGO_URI', 'mongodb://127.0.0.1:27017')
    client = MongoClient(mongo_uri)
    db = client['hercules']
    return db[collection_name]

@mcp.tool()
def postgres_query(sql: str) -> list[dict]:
    """
    Executes a read-only SQL query against the PostgreSQL database.
    WARNING: Do not run destructive queries like DROP, DELETE, or UPDATE.
    """
    if "drop" in sql.lower() or "delete" in sql.lower() or "update" in sql.lower():
        return [{"error": "Destructive queries are not allowed via this MCP tool."}]
    
    try:
        conn = get_pg_connection()
        cursor = conn.cursor()
        cursor.execute(sql)
        
        # If it's not a SELECT query, just commit and return
        if not cursor.description:
            conn.commit()
            return [{"status": "Query executed successfully. No rows returned."}]

        rows = cursor.fetchall()
        col_names = [desc[0] for desc in cursor.description]
        
        results = []
        for row in rows:
            results.append(dict(zip(col_names, row)))
            
        cursor.close()
        conn.close()
        return results
    except Exception as e:
        return [{"error": str(e)}]


@mcp.tool()
def mongo_find(collection: str, query: dict = None, limit: int = 100) -> list[dict]:
    """
    Executes a find query against a MongoDB collection.
    """
    try:
        col = get_mongo_collection(collection)
        q = query or {}
        cursor = col.find(q).limit(limit)
        
        results = []
        for doc in cursor:
            # Convert ObjectId to string to be JSON serializable
            if '_id' in doc:
                doc['_id'] = str(doc['_id'])
            results.append(doc)
            
        return results
    except Exception as e:
        return [{"error": str(e)}]


if __name__ == "__main__":
    print("Starting DatabaseServer MCP Server via SSE on port 5001...")
    # Using SSE transport allows connections from the Antigravity SDK over HTTP
    mcp.run(transport="sse", port=5001)
