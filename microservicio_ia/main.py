import os
import shutil
import base64
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from typing import List
import google.generativeai as genai

# --- TUS IMPORTACIONES DE LANGCHAIN ---
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain.chains import RetrievalQA
from dotenv import load_dotenv

# 1. Configuración Básica
load_dotenv()
app = FastAPI()

# Configura tu API KEY aquí o en el .env
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")  # Asegúrate de tener esto en tu .env
genai.configure(api_key=GOOGLE_API_KEY)


# --- TU LÓGICA DE AUDIO (Adaptada a función interna) ---
def generar_audio_b64(texto):
    try:
        # Intenta usar gTTS para asegurar compatibilidad rápida
        from gtts import gTTS
        from io import BytesIO

        mp3_fp = BytesIO()
        tts = gTTS(text=texto, lang="es")
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        return base64.b64encode(mp3_fp.read()).decode("utf-8")
    except Exception as e:
        print(f"Error audio: {e}")
        return None


# --- EL ENDPOINT (Aquí ocurre la magia) ---
@app.post("/api/chat-documentos")
async def chat_documentos(
    files: List[UploadFile] = File(...),  # Recibe N archivos
    query: str = Form(...),  # Recibe la pregunta
):
    temp_files = []
    try:
        # A. GUARDAR ARCHIVOS TEMPORALMENTE
        # Necesitamos guardarlos en disco para que PyPDFLoader los pueda leer
        if not os.path.exists("temp"):
            os.makedirs("temp")

        saved_paths = []
        for file in files:
            file_path = f"temp/{file.filename}"
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            saved_paths.append(file_path)
            temp_files.append(file_path)

        # B. TU LÓGICA RAG (Adaptada para ser dinámica)
        all_splits = []

        # Procesamos cada PDF subido
        for path in saved_paths:
            loader = PyPDFLoader(path)
            docs = loader.load()
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000, chunk_overlap=150
            )
            splits = text_splitter.split_documents(docs)
            all_splits.extend(splits)

        # C. CREAR VECTOR STORE Y LLM
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004", google_api_key=GOOGLE_API_KEY
        )

        # Creamos Chroma en memoria con todos los documentos juntos
        vectorstore = Chroma.from_documents(documents=all_splits, embedding=embeddings)

        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash", temperature=0.1, google_api_key=GOOGLE_API_KEY
        )

        # Usamos RetrievalQA (Más robusto que Agent para documentos dinámicos mezclados)
        qa_chain = RetrievalQA.from_chain_type(
            llm,
            retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
            return_source_documents=True,
        )

        # D. OBTENER RESPUESTA
        resultado = qa_chain.invoke({"query": query})
        respuesta_texto = resultado["result"]

        # E. GENERAR AUDIO
        audio_b64 = generar_audio_b64(respuesta_texto)

        return {
            "status": "success",
            "respuesta": respuesta_texto,
            "audio": audio_b64,  # Laravel decodificará esto o lo pondrá en <audio>
            "fuentes_usadas": [
                d.metadata.get("source") for d in resultado.get("source_documents", [])
            ],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # F. LIMPIEZA (Borrar archivos temporales)
        for path in temp_files:
            if os.path.exists(path):
                os.remove(path)
