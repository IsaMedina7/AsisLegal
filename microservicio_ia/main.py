import os
import shutil
import base64
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from typing import List
import google.generativeai as genai
from dotenv import load_dotenv

# --- IMPORTACIONES CORREGIDAS (NUEVA VERSIÓN LANGCHAIN) ---
# 1. Loaders (vienen de community)
from langchain_community.document_loaders import PyPDFLoader
# 2. Splitters (AHORA ESTÁN EN SU PROPIO PAQUETE)
from langchain_text_splitters import RecursiveCharacterTextSplitter
# 3. Vector Stores (vienen de community)
from langchain_community.vectorstores import Chroma
# 4. Google GenAI
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
# 5. Chains
from langchain.chains import RetrievalQA

# 1. Configuración Básica
load_dotenv()
app = FastAPI()

# Configura tu API KEY aquí o en el .env
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") 
genai.configure(api_key=GOOGLE_API_KEY)

# --- TU LÓGICA DE AUDIO ---
def generar_audio_b64(texto):
    try:
        from gtts import gTTS
        from io import BytesIO
        mp3_fp = BytesIO()
        tts = gTTS(text=texto, lang='es')
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        return base64.b64encode(mp3_fp.read()).decode('utf-8')
    except Exception as e:
        print(f"Error audio: {e}")
        return None

# --- EL ENDPOINT ---
@app.post("/api/chat-documentos")
async def chat_documentos(
    files: List[UploadFile] = File(...), 
    query: str = Form(...)
):
    temp_files = []
    try:
        # A. GUARDAR ARCHIVOS TEMPORALMENTE
        if not os.path.exists("temp"):
            os.makedirs("temp")

        saved_paths = []
        for file in files:
            file_path = f"temp/{file.filename}"
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            saved_paths.append(file_path)
            temp_files.append(file_path)

        # B. TU LÓGICA RAG
        all_splits = []
        
        # Procesamos cada PDF subido
        for path in saved_paths:
            loader = PyPDFLoader(path)
            docs = loader.load()
            # Usamos el splitter importado correctamente
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
            splits = text_splitter.split_documents(docs)
            all_splits.extend(splits)

        # C. CREAR VECTOR STORE Y LLM
        embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004", google_api_key=GOOGLE_API_KEY)
        
        vectorstore = Chroma.from_documents(
            documents=all_splits,
            embedding=embeddings
        )
        
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.1, google_api_key=GOOGLE_API_KEY)

        qa_chain = RetrievalQA.from_chain_type(
            llm,
            retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
            return_source_documents=True
        )

        # D. OBTENER RESPUESTA
        resultado = qa_chain.invoke({"query": query})
        respuesta_texto = resultado["result"]
        
        # E. GENERAR AUDIO
        audio_b64 = generar_audio_b64(respuesta_texto)

        return {
            "status": "success",
            "respuesta": respuesta_texto,
            "audio": audio_b64,
            "fuentes_usadas": [d.metadata.get('source') for d in resultado.get("source_documents", [])]
        }

    except Exception as e:
        print(f"ERROR EN SERVIDOR: {e}") # Print para ver error en consola
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # F. LIMPIEZA
        for path in temp_files:
            if os.path.exists(path):
                os.remove(path)
