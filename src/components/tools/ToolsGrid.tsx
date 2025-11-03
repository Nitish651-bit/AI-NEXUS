import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ExternalLink } from "lucide-react";

interface AITool {
  id: string;
  name: string;
  category: string;
  description: string;
  rating: number;
  isPremium: boolean;
  isPopular: boolean;
}

const mockTools: AITool[] = [
  // Chat & Assistants
  { id: "1", name: "ChatGPT (OpenAI)", category: "Chat & Assistants", description: "Conversational LLM for chat, coding, writing, multi-modal prompts.", rating: 4.9, isPremium: true, isPopular: true },
  { id: "2", name: "Gemini AI", category: "Chat & Assistants", description: "Advanced AI assistant for complex reasoning and creative tasks.", rating: 4.8, isPremium: true, isPopular: true },
  { id: "3", name: "Claude (Anthropic)", category: "Chat & Assistants", description: "Safe and helpful AI assistant for thoughtful conversations.", rating: 4.7, isPremium: true, isPopular: true },
  { id: "4", name: "Perplexity AI", category: "Chat & Assistants", description: "AI-powered search and answer engine with citations.", rating: 4.6, isPremium: false, isPopular: true },
  { id: "5", name: "Pi AI", category: "Chat & Assistants", description: "Personal AI companion for meaningful conversations.", rating: 4.4, isPremium: false, isPopular: false },
  { id: "6", name: "Character.AI", category: "Chat & Assistants", description: "Chat with AI-powered characters and personalities.", rating: 4.5, isPremium: false, isPopular: true },
  
  // Code & Developer Tools
  { id: "7", name: "GitHub Copilot", category: "Code & Developer Tools", description: "AI pair programmer for code completion and suggestions.", rating: 4.8, isPremium: true, isPopular: true },
  { id: "8", name: "Cursor", category: "Code & Developer Tools", description: "AI-first code editor with intelligent assistance.", rating: 4.7, isPremium: true, isPopular: true },
  { id: "9", name: "Tabnine", category: "Code & Developer Tools", description: "AI code completion for faster development.", rating: 4.5, isPremium: true, isPopular: false },
  { id: "10", name: "Replit Ghostwriter", category: "Code & Developer Tools", description: "AI coding assistant integrated into Replit.", rating: 4.4, isPremium: true, isPopular: false },
  { id: "11", name: "CodeWhisperer", category: "Code & Developer Tools", description: "Amazon's AI coding companion.", rating: 4.3, isPremium: false, isPopular: false },
  { id: "12", name: "Codeium", category: "Code & Developer Tools", description: "Free AI-powered code acceleration.", rating: 4.6, isPremium: false, isPopular: true },
  
  // Search & Research
  { id: "13", name: "Consensus", category: "Search & Research", description: "AI-powered search for scientific research papers.", rating: 4.7, isPremium: false, isPopular: true },
  { id: "14", name: "Elicit", category: "Search & Research", description: "AI research assistant for academic literature.", rating: 4.6, isPremium: false, isPopular: true },
  { id: "15", name: "You.com", category: "Search & Research", description: "AI-powered search engine with summarization.", rating: 4.4, isPremium: false, isPopular: false },
  { id: "16", name: "Phind", category: "Search & Research", description: "AI search engine for developers and technical queries.", rating: 4.5, isPremium: false, isPopular: true },
  { id: "17", name: "Bing AI", category: "Search & Research", description: "Microsoft's AI-enhanced search experience.", rating: 4.3, isPremium: false, isPopular: false },
  { id: "18", name: "Komo AI", category: "Search & Research", description: "Private AI search with instant answers.", rating: 4.2, isPremium: false, isPopular: false },
  
  // Prompting & Agents
  { id: "19", name: "LangChain", category: "Prompting & Agents", description: "Framework for developing LLM-powered applications.", rating: 4.8, isPremium: false, isPopular: true },
  { id: "20", name: "AutoGPT", category: "Prompting & Agents", description: "Autonomous AI agents for task completion.", rating: 4.6, isPremium: false, isPopular: true },
  { id: "21", name: "AgentGPT", category: "Prompting & Agents", description: "Deploy autonomous AI agents in your browser.", rating: 4.5, isPremium: false, isPopular: false },
  { id: "22", name: "BabyAGI", category: "Prompting & Agents", description: "Task-driven autonomous agent framework.", rating: 4.4, isPremium: false, isPopular: false },
  { id: "23", name: "Prompt Perfect", category: "Prompting & Agents", description: "Optimize your prompts for better AI responses.", rating: 4.3, isPremium: false, isPopular: false },
  { id: "24", name: "PromptBase", category: "Prompting & Agents", description: "Marketplace for buying and selling prompts.", rating: 4.2, isPremium: false, isPopular: false },
  
  // Vector DB & Embeddings
  { id: "25", name: "Pinecone", category: "Vector DB & Embeddings", description: "Vector database for ML applications.", rating: 4.7, isPremium: true, isPopular: true },
  { id: "26", name: "Weaviate", category: "Vector DB & Embeddings", description: "Open-source vector search engine.", rating: 4.6, isPremium: false, isPopular: true },
  { id: "27", name: "Qdrant", category: "Vector DB & Embeddings", description: "Vector similarity search engine.", rating: 4.5, isPremium: false, isPopular: false },
  { id: "28", name: "Milvus", category: "Vector DB & Embeddings", description: "Cloud-native vector database.", rating: 4.4, isPremium: false, isPopular: false },
  { id: "29", name: "Chroma", category: "Vector DB & Embeddings", description: "AI-native embedding database.", rating: 4.5, isPremium: false, isPopular: true },
  { id: "30", name: "pgvector", category: "Vector DB & Embeddings", description: "Vector similarity search for PostgreSQL.", rating: 4.6, isPremium: false, isPopular: false },
  
  // Data Science & MLOps
  { id: "31", name: "Weights & Biases", category: "Data Science & MLOps", description: "ML experiment tracking and model management.", rating: 4.8, isPremium: true, isPopular: true },
  { id: "32", name: "Hugging Face", category: "Data Science & MLOps", description: "Platform for ML models and datasets.", rating: 4.9, isPremium: false, isPopular: true },
  { id: "33", name: "MLflow", category: "Data Science & MLOps", description: "Open-source platform for ML lifecycle.", rating: 4.6, isPremium: false, isPopular: true },
  { id: "34", name: "Comet ML", category: "Data Science & MLOps", description: "ML platform for tracking experiments.", rating: 4.5, isPremium: true, isPopular: false },
  { id: "35", name: "Neptune.ai", category: "Data Science & MLOps", description: "Metadata store for MLOps.", rating: 4.4, isPremium: true, isPopular: false },
  { id: "36", name: "Dataiku", category: "Data Science & MLOps", description: "Enterprise AI platform for data teams.", rating: 4.5, isPremium: true, isPopular: false },
  
  // Analytics & BI
  { id: "37", name: "ThoughtSpot", category: "Analytics & BI", description: "AI-powered analytics and business intelligence.", rating: 4.6, isPremium: true, isPopular: true },
  { id: "38", name: "Tableau AI", category: "Analytics & BI", description: "Visual analytics with AI insights.", rating: 4.7, isPremium: true, isPopular: true },
  { id: "39", name: "Power BI AI", category: "Analytics & BI", description: "Microsoft's AI-enhanced business analytics.", rating: 4.5, isPremium: true, isPopular: true },
  { id: "40", name: "Looker AI", category: "Analytics & BI", description: "Google's AI-powered BI platform.", rating: 4.4, isPremium: true, isPopular: false },
  { id: "41", name: "Sigma Computing", category: "Analytics & BI", description: "Cloud analytics with AI capabilities.", rating: 4.3, isPremium: true, isPopular: false },
  { id: "42", name: "Mode Analytics", category: "Analytics & BI", description: "Collaborative analytics platform.", rating: 4.4, isPremium: true, isPopular: false },
  
  // Marketing & Content
  { id: "43", name: "Jasper AI", category: "Marketing & Content", description: "AI content creation for marketing teams.", rating: 4.7, isPremium: true, isPopular: true },
  { id: "44", name: "Copy.ai", category: "Marketing & Content", description: "AI-powered copywriting assistant.", rating: 4.6, isPremium: true, isPopular: true },
  { id: "45", name: "Writesonic", category: "Marketing & Content", description: "AI writing for blogs, ads, and social media.", rating: 4.5, isPremium: true, isPopular: true },
  { id: "46", name: "Rytr", category: "Marketing & Content", description: "AI writing assistant for content creation.", rating: 4.4, isPremium: true, isPopular: false },
  { id: "47", name: "Anyword", category: "Marketing & Content", description: "Data-driven AI copywriting platform.", rating: 4.5, isPremium: true, isPopular: false },
  { id: "48", name: "Grammarly AI", category: "Marketing & Content", description: "AI-powered writing enhancement.", rating: 4.8, isPremium: true, isPopular: true },
  
  // Ads & Sales
  { id: "49", name: "Persado", category: "Ads & Sales", description: "AI-generated marketing language.", rating: 4.5, isPremium: true, isPopular: false },
  { id: "50", name: "Phrasee", category: "Ads & Sales", description: "AI for marketing copy optimization.", rating: 4.4, isPremium: true, isPopular: false },
  { id: "51", name: "Lavender AI", category: "Ads & Sales", description: "AI email coach for sales teams.", rating: 4.6, isPremium: true, isPopular: true },
  { id: "52", name: "Gong.io", category: "Ads & Sales", description: "Revenue intelligence platform.", rating: 4.7, isPremium: true, isPopular: true },
  { id: "53", name: "Drift", category: "Ads & Sales", description: "Conversational AI for sales.", rating: 4.5, isPremium: true, isPopular: true },
  { id: "54", name: "Chorus.ai", category: "Ads & Sales", description: "Conversation intelligence platform.", rating: 4.6, isPremium: true, isPopular: false },
  
  // Design & Image Generation
  { id: "55", name: "DALL-E 3", category: "Design & Image Generation", description: "Generate high-quality images from text descriptions.", rating: 4.8, isPremium: true, isPopular: true },
  { id: "56", name: "Midjourney", category: "Design & Image Generation", description: "Create stunning AI-generated artwork and images.", rating: 4.9, isPremium: true, isPopular: true },
  { id: "57", name: "Stable Diffusion", category: "Design & Image Generation", description: "Open-source text-to-image generation.", rating: 4.7, isPremium: false, isPopular: true },
  { id: "58", name: "Adobe Firefly", category: "Design & Image Generation", description: "Adobe's AI image generation suite.", rating: 4.6, isPremium: true, isPopular: true },
  { id: "59", name: "Canva AI", category: "Design & Image Generation", description: "AI-powered design tools in Canva.", rating: 4.7, isPremium: true, isPopular: true },
  { id: "60", name: "Lexica Art", category: "Design & Image Generation", description: "Stable Diffusion search and generation.", rating: 4.4, isPremium: false, isPopular: false },
  
  // Video & Avatars
  { id: "61", name: "Runway ML", category: "Video & Avatars", description: "AI tools for video editing and generation.", rating: 4.8, isPremium: true, isPopular: true },
  { id: "62", name: "Synthesia", category: "Video & Avatars", description: "AI video generation with avatars.", rating: 4.7, isPremium: true, isPopular: true },
  { id: "63", name: "D-ID", category: "Video & Avatars", description: "Create AI-powered digital humans.", rating: 4.6, isPremium: true, isPopular: true },
  { id: "64", name: "HeyGen", category: "Video & Avatars", description: "AI video platform with talking avatars.", rating: 4.7, isPremium: true, isPopular: true },
  { id: "65", name: "Pictory AI", category: "Video & Avatars", description: "Turn text into videos automatically.", rating: 4.5, isPremium: true, isPopular: false },
  { id: "66", name: "Descript", category: "Video & Avatars", description: "AI-powered video and podcast editing.", rating: 4.6, isPremium: true, isPopular: true },
  
  // Audio & Voice & Music
  { id: "67", name: "ElevenLabs", category: "Audio & Voice & Music", description: "Natural-sounding text-to-speech and voice cloning.", rating: 4.8, isPremium: true, isPopular: true },
  { id: "68", name: "Murf AI", category: "Audio & Voice & Music", description: "AI voice generator for voiceovers.", rating: 4.6, isPremium: true, isPopular: true },
  { id: "69", name: "Play.ht", category: "Audio & Voice & Music", description: "AI text-to-speech voice generator.", rating: 4.5, isPremium: true, isPopular: false },
  { id: "70", name: "AIVA", category: "Audio & Voice & Music", description: "AI music composition assistant.", rating: 4.4, isPremium: true, isPopular: false },
  { id: "71", name: "Soundraw", category: "Audio & Voice & Music", description: "AI music generator for creators.", rating: 4.3, isPremium: true, isPopular: false },
  { id: "72", name: "Beatoven.ai", category: "Audio & Voice & Music", description: "AI-generated royalty-free music.", rating: 4.4, isPremium: true, isPopular: false },
  
  // Speech & Transcription
  { id: "73", name: "Otter.ai", category: "Speech & Transcription", description: "AI meeting notes and transcription.", rating: 4.7, isPremium: true, isPopular: true },
  { id: "74", name: "Whisper (OpenAI)", category: "Speech & Transcription", description: "Open-source speech recognition.", rating: 4.8, isPremium: false, isPopular: true },
  { id: "75", name: "AssemblyAI", category: "Speech & Transcription", description: "AI-powered speech-to-text API.", rating: 4.6, isPremium: true, isPopular: true },
  { id: "76", name: "Rev AI", category: "Speech & Transcription", description: "Automated transcription service.", rating: 4.5, isPremium: true, isPopular: false },
  { id: "77", name: "Sonix", category: "Speech & Transcription", description: "Fast, accurate transcription platform.", rating: 4.4, isPremium: true, isPopular: false },
  { id: "78", name: "Trint", category: "Speech & Transcription", description: "AI transcription for media professionals.", rating: 4.3, isPremium: true, isPopular: false },
  
  // Forensics & Detection
  { id: "79", name: "GPTZero", category: "Forensics & Detection", description: "Detect AI-generated text.", rating: 4.5, isPremium: false, isPopular: true },
  { id: "80", name: "Originality.AI", category: "Forensics & Detection", description: "AI content detection and plagiarism checker.", rating: 4.4, isPremium: true, isPopular: true },
  { id: "81", name: "Copyleaks", category: "Forensics & Detection", description: "AI content detection platform.", rating: 4.3, isPremium: true, isPopular: false },
  { id: "82", name: "Turnitin AI", category: "Forensics & Detection", description: "Academic integrity and AI detection.", rating: 4.6, isPremium: true, isPopular: true },
  { id: "83", name: "Content at Scale AI Detector", category: "Forensics & Detection", description: "Free AI content detection tool.", rating: 4.2, isPremium: false, isPopular: false },
  { id: "84", name: "Winston AI", category: "Forensics & Detection", description: "AI content detection for educators.", rating: 4.3, isPremium: true, isPopular: false },
  
  // 3D & AR & Animation
  { id: "85", name: "Luma AI", category: "3D & AR & Animation", description: "AI-powered 3D capture and rendering.", rating: 4.7, isPremium: true, isPopular: true },
  { id: "86", name: "Kaedim", category: "3D & AR & Animation", description: "2D images to 3D models with AI.", rating: 4.5, isPremium: true, isPopular: false },
  { id: "87", name: "Polycam", category: "3D & AR & Animation", description: "3D scanning with LiDAR and AI.", rating: 4.6, isPremium: true, isPopular: true },
  { id: "88", name: "Masterpiece Studio", category: "3D & AR & Animation", description: "AI-assisted 3D model creation.", rating: 4.4, isPremium: true, isPopular: false },
  { id: "89", name: "Spline AI", category: "3D & AR & Animation", description: "AI-powered 3D design tool.", rating: 4.5, isPremium: true, isPopular: true },
  { id: "90", name: "Ponzu", category: "3D & AR & Animation", description: "AI texture generation for 3D models.", rating: 4.3, isPremium: true, isPopular: false },
  
  // Productivity & Docs
  { id: "91", name: "Notion AI", category: "Productivity & Docs", description: "AI writing assistant built into Notion.", rating: 4.7, isPremium: true, isPopular: true },
  { id: "92", name: "Mem", category: "Productivity & Docs", description: "AI-powered knowledge workspace.", rating: 4.5, isPremium: true, isPopular: false },
  { id: "93", name: "Reflect", category: "Productivity & Docs", description: "AI note-taking with backlinking.", rating: 4.4, isPremium: true, isPopular: false },
  { id: "94", name: "Taskade", category: "Productivity & Docs", description: "AI-powered collaboration and tasks.", rating: 4.3, isPremium: true, isPopular: false },
  { id: "95", name: "Motion", category: "Productivity & Docs", description: "AI calendar and task management.", rating: 4.6, isPremium: true, isPopular: true },
  { id: "96", name: "Reclaim AI", category: "Productivity & Docs", description: "Smart calendar scheduling.", rating: 4.5, isPremium: true, isPopular: true },
  
  // Education & Tutoring
  { id: "97", name: "Khan Academy AI", category: "Education & Tutoring", description: "AI tutor for personalized learning.", rating: 4.7, isPremium: false, isPopular: true },
  { id: "98", name: "Duolingo Max", category: "Education & Tutoring", description: "AI-powered language learning.", rating: 4.8, isPremium: true, isPopular: true },
  { id: "99", name: "Quizlet AI", category: "Education & Tutoring", description: "AI study tools and flashcards.", rating: 4.5, isPremium: true, isPopular: true },
  { id: "100", name: "Gradescope", category: "Education & Tutoring", description: "AI-assisted grading platform.", rating: 4.4, isPremium: true, isPopular: false },
  { id: "101", name: "Century Tech", category: "Education & Tutoring", description: "AI-powered learning platform.", rating: 4.3, isPremium: true, isPopular: false },
  { id: "102", name: "Photomath", category: "Education & Tutoring", description: "AI math problem solver.", rating: 4.6, isPremium: true, isPopular: true },
  
  // Healthcare & Bio
  { id: "103", name: "PathAI", category: "Healthcare & Bio", description: "AI-powered pathology diagnosis.", rating: 4.7, isPremium: true, isPopular: false },
  { id: "104", name: "Tempus", category: "Healthcare & Bio", description: "AI precision medicine platform.", rating: 4.6, isPremium: true, isPopular: false },
  { id: "105", name: "DeepMind Health", category: "Healthcare & Bio", description: "AI for healthcare diagnostics.", rating: 4.8, isPremium: true, isPopular: true },
  { id: "106", name: "Butterfly Network", category: "Healthcare & Bio", description: "AI-powered ultrasound imaging.", rating: 4.5, isPremium: true, isPopular: false },
  { id: "107", name: "Freenome", category: "Healthcare & Bio", description: "AI for early cancer detection.", rating: 4.6, isPremium: true, isPopular: false },
  { id: "108", name: "Ada Health", category: "Healthcare & Bio", description: "AI symptom assessment app.", rating: 4.4, isPremium: false, isPopular: true },
  
  // Security & Fraud
  { id: "109", name: "Darktrace", category: "Security & Fraud", description: "AI cybersecurity threat detection.", rating: 4.7, isPremium: true, isPopular: true },
  { id: "110", name: "Abnormal Security", category: "Security & Fraud", description: "AI email security platform.", rating: 4.6, isPremium: true, isPopular: false },
  { id: "111", name: "Sift", category: "Security & Fraud", description: "AI fraud prevention platform.", rating: 4.5, isPremium: true, isPopular: false },
  { id: "112", name: "DataVisor", category: "Security & Fraud", description: "AI fraud detection engine.", rating: 4.4, isPremium: true, isPopular: false },
  { id: "113", name: "Vectra AI", category: "Security & Fraud", description: "AI network threat detection.", rating: 4.6, isPremium: true, isPopular: true },
  { id: "114", name: "Forcepoint", category: "Security & Fraud", description: "AI-powered data security.", rating: 4.3, isPremium: true, isPopular: false },
  
  // Enterprise & No-Code
  { id: "115", name: "Zapier AI", category: "Enterprise & No-Code", description: "AI-powered workflow automation.", rating: 4.7, isPremium: true, isPopular: true },
  { id: "116", name: "Make (Integromat)", category: "Enterprise & No-Code", description: "Visual automation platform.", rating: 4.6, isPremium: true, isPopular: true },
  { id: "117", name: "Retool AI", category: "Enterprise & No-Code", description: "Build internal tools with AI.", rating: 4.5, isPremium: true, isPopular: false },
  { id: "118", name: "Bubble AI", category: "Enterprise & No-Code", description: "No-code app builder with AI.", rating: 4.4, isPremium: true, isPopular: true },
  { id: "119", name: "Builder.ai", category: "Enterprise & No-Code", description: "AI-powered app development.", rating: 4.3, isPremium: true, isPopular: false },
  { id: "120", name: "Airtable AI", category: "Enterprise & No-Code", description: "AI-enhanced database platform.", rating: 4.6, isPremium: true, isPopular: true },
  
  // Specialized & Vertical
  { id: "121", name: "Harvey AI", category: "Specialized & Vertical", description: "AI for legal professionals.", rating: 4.6, isPremium: true, isPopular: false },
  { id: "122", name: "CoCounsel", category: "Specialized & Vertical", description: "AI legal research assistant.", rating: 4.5, isPremium: true, isPopular: false },
  { id: "123", name: "Spellbook", category: "Specialized & Vertical", description: "AI for contract drafting.", rating: 4.4, isPremium: true, isPopular: false },
  { id: "124", name: "Blueprint", category: "Specialized & Vertical", description: "AI for architecture and design.", rating: 4.3, isPremium: true, isPopular: false },
  { id: "125", name: "Findem", category: "Specialized & Vertical", description: "AI talent acquisition platform.", rating: 4.5, isPremium: true, isPopular: false },
  { id: "126", name: "Gloat", category: "Specialized & Vertical", description: "AI talent marketplace.", rating: 4.4, isPremium: true, isPopular: false },
  
  // Creative & Misc
  { id: "127", name: "ChatPDF", category: "Creative & Misc", description: "Chat with your PDF documents.", rating: 4.6, isPremium: false, isPopular: true },
  { id: "128", name: "Humata AI", category: "Creative & Misc", description: "AI-powered document analysis.", rating: 4.4, isPremium: true, isPopular: false },
  { id: "129", name: "Beautiful.ai", category: "Creative & Misc", description: "AI-powered presentation maker.", rating: 4.5, isPremium: true, isPopular: true },
  { id: "130", name: "Tome", category: "Creative & Misc", description: "AI storytelling and presentations.", rating: 4.6, isPremium: true, isPopular: true },
  { id: "131", name: "Designs.ai", category: "Creative & Misc", description: "AI creative suite for designers.", rating: 4.3, isPremium: true, isPopular: false },
  { id: "132", name: "Remove.bg", category: "Creative & Misc", description: "AI background removal tool.", rating: 4.7, isPremium: true, isPopular: true },
  { id: "133", name: "Cleanup.pictures", category: "Creative & Misc", description: "AI object removal from images.", rating: 4.5, isPremium: false, isPopular: false },
  { id: "134", name: "Topaz Labs", category: "Creative & Misc", description: "AI image enhancement suite.", rating: 4.6, isPremium: true, isPopular: true },
  { id: "135", name: "Let's Enhance", category: "Creative & Misc", description: "AI image upscaling and enhancement.", rating: 4.4, isPremium: true, isPopular: false },
  { id: "136", name: "Palette.fm", category: "Creative & Misc", description: "AI photo colorization tool.", rating: 4.3, isPremium: false, isPopular: false },
  { id: "137", name: "Lensa AI", category: "Creative & Misc", description: "AI avatar and photo editor.", rating: 4.5, isPremium: true, isPopular: true },
  { id: "138", name: "Prisma", category: "Creative & Misc", description: "AI art filters and effects.", rating: 4.4, isPremium: true, isPopular: false },
  { id: "139", name: "Artbreeder", category: "Creative & Misc", description: "Collaborative AI art creation.", rating: 4.5, isPremium: false, isPopular: true },
  { id: "140", name: "NightCafe", category: "Creative & Misc", description: "AI art generator platform.", rating: 4.4, isPremium: false, isPopular: false },
  { id: "141", name: "Craiyon", category: "Creative & Misc", description: "Free AI image generator.", rating: 4.2, isPremium: false, isPopular: false },
  { id: "142", name: "DeepDream", category: "Creative & Misc", description: "Google's AI art generator.", rating: 4.3, isPremium: false, isPopular: false },
  { id: "143", name: "Wombo Dream", category: "Creative & Misc", description: "AI-powered art creation app.", rating: 4.4, isPremium: false, isPopular: true },
  { id: "144", name: "StarryAI", category: "Creative & Misc", description: "AI art generator from text.", rating: 4.3, isPremium: false, isPopular: false },
  { id: "145", name: "Deep Art Effects", category: "Creative & Misc", description: "AI artistic style transfer.", rating: 4.2, isPremium: true, isPopular: false },
  { id: "146", name: "Fotor AI", category: "Creative & Misc", description: "AI photo editing suite.", rating: 4.5, isPremium: true, isPopular: false },
  { id: "147", name: "Luminar AI", category: "Creative & Misc", description: "AI-powered photo editor.", rating: 4.6, isPremium: true, isPopular: true },
  { id: "148", name: "PhotoRoom", category: "Creative & Misc", description: "AI background remover and editor.", rating: 4.5, isPremium: true, isPopular: true },
  { id: "149", name: "Runway Erase", category: "Creative & Misc", description: "AI object removal from videos.", rating: 4.4, isPremium: true, isPopular: false },
  { id: "150", name: "Unscreen", category: "Creative & Misc", description: "AI video background removal.", rating: 4.3, isPremium: true, isPopular: false },
];

interface ToolsGridProps {
  searchQuery: string;
  selectedCategory: string;
}

export function ToolsGrid({ searchQuery, selectedCategory }: ToolsGridProps) {
  const filteredTools = mockTools.filter((tool) => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">All AI Tools</h2>
        <p className="text-sm text-muted-foreground">{filteredTools.length} tools found</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTools.map((tool) => (
          <Card key={tool.id} className="hover:shadow-holo transition-all duration-300 hover:border-primary/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{tool.name}</CardTitle>
                  <CardDescription className="text-xs mt-1">{tool.category}</CardDescription>
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-medium">{tool.rating}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                {tool.isPremium && (
                  <Badge variant="secondary" className="text-xs">Premium</Badge>
                )}
                {tool.isPopular && (
                  <Badge className="bg-primary text-primary-foreground text-xs">Popular</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{tool.description}</p>
              <Button className="w-full" variant="outline">
                Try Now
                <ExternalLink className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No tools found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
