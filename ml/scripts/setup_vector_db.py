"""
Setup Milvus vector database for RAG system.

Creates collection for mental health knowledge base with embeddings.

Usage:
    python setup_vector_db.py --collection mental_health_kb --dim 384
"""

import argparse
from pymilvus import (
    connections,
    utility,
    FieldSchema,
    CollectionSchema,
    DataType,
    Collection,
)


def create_collection(collection_name, embedding_dim=384):
    """
    Create Milvus collection for knowledge base.
    
    Args:
        collection_name: Name of collection
        embedding_dim: Dimension of embeddings (384 for bge-small, 1536 for OpenAI)
    """
    # Define schema
    fields = [
        FieldSchema(name="id", dtype=DataType.VARCHAR, is_primary=True, max_length=100),
        FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=embedding_dim),
        FieldSchema(name="content", dtype=DataType.VARCHAR, max_length=65535),
        FieldSchema(name="title", dtype=DataType.VARCHAR, max_length=500),
        FieldSchema(name="category", dtype=DataType.VARCHAR, max_length=100),
    ]
    
    schema = CollectionSchema(
        fields=fields,
        description="Mental health knowledge base for RAG",
        enable_dynamic_field=True
    )
    
    # Check if collection exists
    if utility.has_collection(collection_name):
        print(f"Collection '{collection_name}' already exists. Dropping...")
        utility.drop_collection(collection_name)
    
    # Create collection
    collection = Collection(name=collection_name, schema=schema)
    print(f"✅ Created collection: {collection_name}")
    
    # Create index for fast similarity search
    index_params = {
        "metric_type": "COSINE",
        "index_type": "IVF_FLAT",
        "params": {"nlist": 128}
    }
    
    collection.create_index(
        field_name="embedding",
        index_params=index_params
    )
    print(f"✅ Created index on 'embedding' field")
    
    return collection


def test_connection():
    """Test Milvus connection"""
    try:
        connections.connect(
            alias="default",
            host=os.getenv('MILVUS_HOST', 'localhost'),
            port=os.getenv('MILVUS_PORT', '19530')
        )
        print("✅ Connected to Milvus")
        
        # List collections
        collections = utility.list_collections()
        print(f"Existing collections: {collections}")
        
        return True
    except Exception as e:
        print(f"❌ Failed to connect to Milvus: {e}")
        print("Make sure Milvus is running:")
        print("  docker-compose -f ../docker-compose.ml.yml up -d milvus")
        return False


def main():
    parser = argparse.ArgumentParser(description='Setup Milvus vector database')
    parser.add_argument('--collection', default='mental_health_kb', help='Collection name')
    parser.add_argument('--dim', type=int, default=384, help='Embedding dimension')
    parser.add_argument('--test', action='store_true', help='Test connection only')
    
    args = parser.parse_args()
    
    import os
    from dotenv import load_dotenv
    load_dotenv()
    
    # Connect to Milvus
    if not test_connection():
        return
    
    if args.test:
        print("\n✅ Connection test successful!")
        return
    
    # Create collection
    print(f"\nCreating collection: {args.collection}")
    print(f"Embedding dimension: {args.dim}")
    
    collection = create_collection(args.collection, args.dim)
    
    # Load collection (required for operations)
    collection.load()
    
    print(f"\n✅ Setup complete!")
    print(f"Collection: {args.collection}")
    print(f"Fields: id, embedding({args.dim}), content, title, category")
    print(f"Index: IVF_FLAT with cosine similarity")


if __name__ == '__main__':
    main()
