from langchain_community.document_loaders import DirectoryLoader
from langchain_community.vectorstores import InMemoryVectorStore
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

VECTOR_STORE = None


def load_documents():
    loader = DirectoryLoader("rag/data", glob="*.txt")
    documents = loader.load()
    return documents


def create_vector_store():
    global VECTOR_STORE
    documents = load_documents()
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=300, chunk_overlap=50
    )
    chunks = text_splitter.split_documents(documents)
    VECTOR_STORE = InMemoryVectorStore.from_documents(chunks, embeddings)
    return VECTOR_STORE


def search(query, k=3):
    if VECTOR_STORE is None:
        create_vector_store()
    docs = VECTOR_STORE.similarity_search(query, k=k)
    return "\n\n---\n\n".join(doc.page_content for doc in docs)


def get_sources(query, k=3):
    if VECTOR_STORE is None:
        create_vector_store()
    docs = VECTOR_STORE.similarity_search(query, k=k)
    return [
        {"source": doc.metadata.get("source", "unknown"), "content": doc.page_content[:200]}
        for doc in docs
    ]