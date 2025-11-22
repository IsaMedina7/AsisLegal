# AsisLegal
Se presenta la solución al reto Hack-Kognia 1.0. Este desafío fue propuesto por KOGNIA IA.La solución implica desarrollar un prototipo funcional de un asistente legal inteligente. Este asistente tiene la capacidad de interpretar documentos jurídicos y de responder preguntas sobre su contenido a través de un chat interactivo.


El prototipo no está diseñado para redactar textos nuevos, sino que se centra en analizar la información existente en los documentos cargados por el usuario y generar respuestas contextualizadas y precisas.


El prototipo implementa RAG (Recuperación Aumentada por Generación) y modelos de lenguaje (LLM) para transformar la forma en que se accede a la información legal, facilitando la comprensión y búsqueda de contenido jurídico por parte de cualquier usuario.

## Objetivo

- Se debe permitir la carga de uno o varios documentos legales.  
- La realización de consultas en lenguaje natural sobre el contenido de los documentos es un requisito esencial para garantizar la precisión y la coherencia de la información.  
- Se requiere la generación de respuestas fundamentadas y contextualizadas, basadas en los textos cargados.  
- Operar desde una URL pública con interfaz básica y clara, que evidencie la integración real de los componentes.

## Contexto del Problema

El volumen de documentos legales en empresas, entidades públicas y organizaciones crece constantemente.  
La búsqueda manual de información relevante es compleja y consume tiempo, y los usuarios generalmente no cuentan con herramientas intuitivas que les permitan consultar y comprender textos jurídicos extensos.  

El asistente busca resolver esta dificultad, haciendo accesible y entendible la información legal.

# Arquitectura Técnica

## RAG
Cuando un usuario sube uno o más archivos PDF y formula una pregunta, el sistema primero guarda los archivos en una carpeta temporal (temp). Luego, utiliza PyPDFLoader de LangChain para leer el contenido de cada PDF. Dado que los modelos de lenguaje tienen límites en la cantidad de texto que pueden procesar a la vez, el texto de los documentos se divide en fragmentos más pequeños y manejables, llamados chunks, utilizando el RecursiveCharacterTextSplitter. Este paso es vital para la precisión de la búsqueda.

Cada uno de estos chunks de texto se convierte en una representación numérica (un vector) mediante el proceso de Embedding. El código utiliza GoogleGenerativeAIEmbeddings (con el modelo text-embedding-004) para esta tarea. Estos vectores, junto con su texto original asociado, se almacenan inmediatamente en una base de datos vectorial en memoria, Chroma. Este almacén de vectores actúa como el índice de conocimiento o memoria a largo plazo específica para los documentos subidos por el usuario.

La pregunta del usuario se vectoriza de la misma manera. El código configura un Retriever sobre el almacén de Chroma para buscar los 5 chunks cuyos vectores sean más similares (semánticamente) al vector de la pregunta. Estos fragmentos recuperados son la información contextual relevante. Finalmente, se utiliza una cadena de RetrievalQA que toma estos fragmentos y la pregunta, y se los pasa al LLM (Gemini 1.5 Flash) para generar una respuesta final coherente y fundamentada únicamente en la información recuperada.

Una vez generada la respuesta textual, el sistema añade valor creando una versión de audio de esa respuesta (codificada en Base64), lo que permite una experiencia de usuario más rica. La respuesta final incluye el texto generado, el audio y una lista de las fuentes originales (nombres de los archivos PDF) que contribuyeron a la respuesta. Finalmente, el código garantiza la limpieza borrando todos los archivos temporales subidos, liberando recursos y manteniendo la privacidad.
