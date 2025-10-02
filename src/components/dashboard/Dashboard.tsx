import { useState } from "react";
import { AIToolModal } from "./AIToolModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIToolCard } from "./AIToolCard";
import { AIHelpAgent } from "@/components/help/AIHelpAgent";
import { AutomationDashboard } from "@/components/automation/AutomationDashboard";
import { useNavigate } from "react-router-dom";
import { 
  Search,
  Filter, 
  Brain, 
  Image, 
  FileText, 
  MessageSquare, 
  Code, 
  Music, 
  Video, 
  Palette,
  BarChart3,
  Globe,
  Zap,
  LogOut,
  Bot,
  Plug
} from "lucide-react";
// Logo will be updated with uploaded image

const categories = [
  "All", "Chat & Assistants", "Code & Developer Tools", "Search & Research", 
  "Prompting & Agents", "Vector DB & Embeddings", "Data Science & MLOps", 
  "Analytics & BI", "Marketing & Content", "Ads & Sales", "Design & Image Generation", 
  "Video & Avatars", "Audio & Voice & Music", "Speech & Transcription", 
  "Forensics & Detection", "3D & AR & Animation", "Productivity & Docs", 
  "Education & Tutoring", "Healthcare & Bio", "Security & Fraud", 
  "Enterprise & No-Code", "Specialized & Vertical", "Creative & Misc"
];

const aiTools = [
  // Chat / assistants / LLMs
  { id: 1, title: "ChatGPT (OpenAI)", description: "Conversational LLM for chat, coding, writing, multi-modal prompts.", category: "Chat & Assistants", rating: 4.9, icon: <MessageSquare size={20} />, isPremium: true, isPopular: true },
  { id: 2, title: "Claude (Anthropic)", description: "Safety-focused conversational assistant with instruction-following.", category: "Chat & Assistants", rating: 4.8, icon: <Brain size={20} />, isPremium: true, isPopular: true },
  { id: 3, title: "Gemini (Google)", description: "Multi-modal assistant, integrated with Google stack.", category: "Chat & Assistants", rating: 4.7, icon: <Globe size={20} />, isPremium: true, isPopular: true },
  { id: 4, title: "Perplexity", description: "Search-oriented LLM that cites sources (research & summaries).", category: "Chat & Assistants", rating: 4.6, icon: <Search size={20} />, isPremium: false, isPopular: true },
  { id: 5, title: "Microsoft Copilot", description: "LLM integrations across Office & Windows (productivity).", category: "Chat & Assistants", rating: 4.5, icon: <FileText size={20} />, isPremium: true, isPopular: false },
  { id: 6, title: "Character.ai", description: "Persona-based chatbots / roleplay.", category: "Chat & Assistants", rating: 4.2, icon: <MessageSquare size={20} />, isPremium: false, isPopular: false },
  { id: 7, title: "YouChat / You.com", description: "Search + chat integrated assistant.", category: "Chat & Assistants", rating: 4.3, icon: <Search size={20} />, isPremium: false, isPopular: false },
  { id: 8, title: "Replika", description: "Conversational companion AI / emotional support bot.", category: "Chat & Assistants", rating: 4.1, icon: <MessageSquare size={20} />, isPremium: true, isPopular: false },
  { id: 9, title: "Chatsonic (Writesonic)", description: "Chat + real-time web access for answers.", category: "Chat & Assistants", rating: 4.4, icon: <Globe size={20} />, isPremium: true, isPopular: false },
  { id: 10, title: "Hugging Face Spaces", description: "Host and run open LLMs and models.", category: "Chat & Assistants", rating: 4.6, icon: <Code size={20} />, isPremium: false, isPopular: false },

  // Code & developer tools
  { id: 11, title: "GitHub Copilot", description: "Code-completion and suggestions inside editors.", category: "Code & Developer Tools", rating: 4.8, icon: <Code size={20} />, isPremium: true, isPopular: true },
  { id: 12, title: "Replit Ghostwriter", description: "In-editor AI coding assistant with execution.", category: "Code & Developer Tools", rating: 4.6, icon: <Code size={20} />, isPremium: true, isPopular: false },
  { id: 13, title: "Tabnine", description: "AI code completion for multiple languages and IDEs.", category: "Code & Developer Tools", rating: 4.5, icon: <Code size={20} />, isPremium: true, isPopular: false },
  { id: 14, title: "Amazon CodeWhisperer", description: "Code suggestions integrated with AWS tooling.", category: "Code & Developer Tools", rating: 4.4, icon: <Code size={20} />, isPremium: false, isPopular: false },
  { id: 15, title: "Sourcery", description: "Python refactoring & improvement assistant.", category: "Code & Developer Tools", rating: 4.3, icon: <Code size={20} />, isPremium: false, isPopular: false },
  { id: 16, title: "Kite", description: "Code completions (historical).", category: "Code & Developer Tools", rating: 3.9, icon: <Code size={20} />, isPremium: false, isPopular: false },
  { id: 17, title: "CodiumAI", description: "Tests and refactors code using AI.", category: "Code & Developer Tools", rating: 4.2, icon: <Code size={20} />, isPremium: true, isPopular: false },
  { id: 18, title: "DeepCode (Snyk Code)", description: "AI security/code analysis for vulnerabilities.", category: "Code & Developer Tools", rating: 4.4, icon: <Code size={20} />, isPremium: true, isPopular: false },
  { id: 19, title: "OpenAI Codex (API)", description: "Programmatic code-generation model (via OpenAI).", category: "Code & Developer Tools", rating: 4.7, icon: <Code size={20} />, isPremium: true, isPopular: false },
  { id: 20, title: "GitGuardian", description: "Secrets detection aided by AI in repos.", category: "Code & Developer Tools", rating: 4.1, icon: <Code size={20} />, isPremium: false, isPopular: false },

  // Search / research / knowledge work
  { id: 21, title: "Elicit", description: "Research assistant for literature review and paper summarization.", category: "Search & Research", rating: 4.7, icon: <FileText size={20} />, isPremium: true, isPopular: true },
  { id: 22, title: "Scite.ai", description: "Citation analytics and evidence-based claims.", category: "Search & Research", rating: 4.5, icon: <FileText size={20} />, isPremium: true, isPopular: false },
  { id: 23, title: "Consensus", description: "Research-synthesizer that aggregates studies.", category: "Search & Research", rating: 4.4, icon: <FileText size={20} />, isPremium: false, isPopular: false },
  { id: 24, title: "Semantic Scholar", description: "Paper search enhanced by ML.", category: "Search & Research", rating: 4.3, icon: <FileText size={20} />, isPremium: false, isPopular: false },
  { id: 25, title: "Connected Papers", description: "Visual literature mapping with ML suggestions.", category: "Search & Research", rating: 4.2, icon: <FileText size={20} />, isPremium: false, isPopular: false },
  { id: 26, title: "Iris.ai", description: "Scientific paper mapping and extraction.", category: "Search & Research", rating: 4.1, icon: <FileText size={20} />, isPremium: false, isPopular: false },
  { id: 27, title: "LlamaIndex", description: "Indexing & retrieval layer for LLM-based apps.", category: "Search & Research", rating: 4.6, icon: <Brain size={20} />, isPremium: true, isPopular: false },
  { id: 28, title: "Pinecone", description: "Vector database for embeddings and similarity search.", category: "Vector DB & Embeddings", rating: 4.5, icon: <BarChart3 size={20} />, isPremium: true, isPopular: false },
  { id: 29, title: "Weaviate", description: "Vector DB with semantic search & plugins.", category: "Vector DB & Embeddings", rating: 4.4, icon: <BarChart3 size={20} />, isPremium: true, isPopular: false },

  // Prompting / Agents / Orchestration
  { id: 30, title: "LangChain", description: "Framework for chaining LLM calls into apps/agents.", category: "Prompting & Agents", rating: 4.8, icon: <Zap size={20} />, isPremium: true, isPopular: true },
  { id: 31, title: "AutoGPT", description: "Autonomous agent prototypes for tasks.", category: "Prompting & Agents", rating: 4.3, icon: <Brain size={20} />, isPremium: false, isPopular: true },
  { id: 32, title: "AgentGPT", description: "Web UI for autonomous agents.", category: "Prompting & Agents", rating: 4.2, icon: <Brain size={20} />, isPremium: false, isPopular: false },
  { id: 33, title: "Zapier AI", description: "Automate workflows with AI steps.", category: "Prompting & Agents", rating: 4.4, icon: <Zap size={20} />, isPremium: true, isPopular: false },
  { id: 34, title: "Make (Integromat)", description: "Visual automation with AI integrations.", category: "Prompting & Agents", rating: 4.3, icon: <Zap size={20} />, isPremium: true, isPopular: false },
  { id: 35, title: "Hugging Face Agents", description: "Agent patterns built on transformers.", category: "Prompting & Agents", rating: 4.1, icon: <Code size={20} />, isPremium: false, isPopular: false },
  { id: 36, title: "Flowise", description: "Low-code builder for Retrieval-Augmented Generation apps.", category: "Prompting & Agents", rating: 4.2, icon: <Brain size={20} />, isPremium: false, isPopular: false },
  { id: 37, title: "Caktus.AI", description: "Agent orchestration for specific business tasks.", category: "Prompting & Agents", rating: 4.0, icon: <Brain size={20} />, isPremium: true, isPopular: false },
  { id: 38, title: "Poe (Quora)", description: "Multi-model chat + simple orchestration.", category: "Prompting & Agents", rating: 4.1, icon: <MessageSquare size={20} />, isPremium: true, isPopular: false },
  { id: 39, title: "OpenAI Functions & Tools", description: "Programmable tool-calls from LLMs.", category: "Prompting & Agents", rating: 4.6, icon: <Code size={20} />, isPremium: true, isPopular: false },

  // Vector DB / embeddings / retrieval
  { id: 40, title: "Milvus", description: "Open-source vector database for embeddings.", category: "Vector DB & Embeddings", rating: 4.3, icon: <BarChart3 size={20} />, isPremium: false, isPopular: false },
  { id: 41, title: "Zilliz (Milvus Cloud)", description: "Managed Milvus offering.", category: "Vector DB & Embeddings", rating: 4.2, icon: <BarChart3 size={20} />, isPremium: true, isPopular: false },
  { id: 42, title: "Qdrant", description: "Vector search engine focused on performance.", category: "Vector DB & Embeddings", rating: 4.4, icon: <BarChart3 size={20} />, isPremium: true, isPopular: false },

  // Data science / AutoML / MLOps
  { id: 43, title: "DataRobot", description: "AutoML & model ops platform for enterprises.", category: "Data Science & MLOps", rating: 4.5, icon: <BarChart3 size={20} />, isPremium: true, isPopular: false },
  { id: 44, title: "H2O.ai", description: "Open-source & enterprise AutoML solutions.", category: "Data Science & MLOps", rating: 4.4, icon: <BarChart3 size={20} />, isPremium: true, isPopular: false },
  { id: 45, title: "Dataiku", description: "Collaborative data science platform with ML.", category: "Data Science & MLOps", rating: 4.3, icon: <BarChart3 size={20} />, isPremium: true, isPopular: false },
  { id: 46, title: "Azure ML", description: "Microsoft managed machine learning platform.", category: "Data Science & MLOps", rating: 4.2, icon: <BarChart3 size={20} />, isPremium: true, isPopular: false },
  { id: 47, title: "Vertex AI", description: "MLOps & model deployment on GCP.", category: "Data Science & MLOps", rating: 4.3, icon: <BarChart3 size={20} />, isPremium: true, isPopular: false },
  { id: 48, title: "AWS Sagemaker", description: "Full MLOps and model training suite.", category: "Data Science & MLOps", rating: 4.4, icon: <BarChart3 size={20} />, isPremium: true, isPopular: false },
  { id: 49, title: "Weights & Biases", description: "Experiment tracking and model monitoring.", category: "Data Science & MLOps", rating: 4.6, icon: <BarChart3 size={20} />, isPremium: true, isPopular: false },
  { id: 50, title: "MLflow", description: "Open-source experiment tracking and model registry.", category: "Data Science & MLOps", rating: 4.4, icon: <BarChart3 size={20} />, isPremium: false, isPopular: false },
  { id: 51, title: "Neptune.ai", description: "ML metadata & model management.", category: "Data Science & MLOps", rating: 4.3, icon: <BarChart3 size={20} />, isPremium: true, isPopular: false },
  { id: 52, title: "Bananas", description: "Model deployment and hosting.", category: "Data Science & MLOps", rating: 4.1, icon: <BarChart3 size={20} />, isPremium: true, isPopular: false },

  // Analytics / BI with AI
  { id: 53, title: "Tableau", description: "Natural-language analytics + visualization.", category: "Analytics & BI", rating: 4.5, icon: <BarChart3 size={20} />, isPremium: true, isPopular: false },
  { id: 54, title: "Power BI (Copilot)", description: "AI-assisted report generation in Power BI.", category: "Analytics & BI", rating: 4.4, icon: <BarChart3 size={20} />, isPremium: true, isPopular: false },
  { id: 55, title: "Looker", description: "LookML + AI augmentations.", category: "Analytics & BI", rating: 4.3, icon: <BarChart3 size={20} />, isPremium: true, isPopular: false },
  { id: 56, title: "Qlik Sense", description: "Augmented analytics.", category: "Analytics & BI", rating: 4.2, icon: <BarChart3 size={20} />, isPremium: true, isPopular: false },

  // Marketing / copy / SEO / content
  { id: 57, title: "Jasper.ai", description: "AI copywriting for ads, blogs, and marketing.", category: "Marketing & Content", rating: 4.6, icon: <FileText size={20} />, isPremium: true, isPopular: true },
  { id: 58, title: "Writesonic", description: "Multi-purpose content & chatwriter tool.", category: "Marketing & Content", rating: 4.5, icon: <FileText size={20} />, isPremium: true, isPopular: false },
  { id: 59, title: "Copy.ai", description: "Quick marketing copy and brainstorming.", category: "Marketing & Content", rating: 4.4, icon: <FileText size={20} />, isPremium: true, isPopular: false },
  { id: 60, title: "SurferSEO", description: "SEO content optimization + AI.", category: "Marketing & Content", rating: 4.3, icon: <Globe size={20} />, isPremium: true, isPopular: false },
  { id: 61, title: "Frase", description: "AI content briefs and optimization.", category: "Marketing & Content", rating: 4.2, icon: <FileText size={20} />, isPremium: true, isPopular: false },
  { id: 62, title: "MarketMuse", description: "Content planning & topical authority via AI.", category: "Marketing & Content", rating: 4.3, icon: <FileText size={20} />, isPremium: true, isPopular: false },
  { id: 63, title: "Anyword", description: "Marketing-language optimization and scoring.", category: "Marketing & Content", rating: 4.1, icon: <FileText size={20} />, isPremium: true, isPopular: false },
  { id: 64, title: "Grammarly", description: "Writing assistant for grammar, tone and clarity.", category: "Marketing & Content", rating: 4.7, icon: <FileText size={20} />, isPremium: true, isPopular: true },
  { id: 65, title: "QuillBot", description: "Paraphrasing and summarization assistant.", category: "Marketing & Content", rating: 4.4, icon: <FileText size={20} />, isPremium: false, isPopular: false },
  { id: 66, title: "Hyperwrite", description: "AI writing assistant and autocomplete.", category: "Marketing & Content", rating: 4.2, icon: <FileText size={20} />, isPremium: true, isPopular: false },

  // Ads / personalisation / sales
  { id: 67, title: "Drift", description: "AI chatbots for lead capture.", category: "Ads & Sales", rating: 4.3, icon: <MessageSquare size={20} />, isPremium: true, isPopular: false },
  { id: 68, title: "HubSpot AI", description: "CRM + AI features for sales & marketing.", category: "Ads & Sales", rating: 4.4, icon: <BarChart3 size={20} />, isPremium: true, isPopular: false },
  { id: 69, title: "Gong.io", description: "Conversation intelligence for sales coaching.", category: "Ads & Sales", rating: 4.5, icon: <MessageSquare size={20} />, isPremium: true, isPopular: false },
  { id: 70, title: "Salesforce Einstein", description: "AI features in CRM workflows.", category: "Ads & Sales", rating: 4.4, icon: <BarChart3 size={20} />, isPremium: true, isPopular: false },

  // Design / image generation / editing
  { id: 71, title: "Midjourney", description: "Creative image generation via prompts.", category: "Design & Image Generation", rating: 4.8, icon: <Image size={20} />, isPremium: true, isPopular: true },
  { id: 72, title: "DALL·E (OpenAI)", description: "Text-to-image generation with safety filters.", category: "Design & Image Generation", rating: 4.7, icon: <Image size={20} />, isPremium: true, isPopular: true },
  { id: 73, title: "Stable Diffusion", description: "Open-source text-to-image model + ecosystem.", category: "Design & Image Generation", rating: 4.6, icon: <Image size={20} />, isPremium: false, isPopular: true },
  { id: 74, title: "Adobe Firefly", description: "Generative image suite integrated into Adobe apps.", category: "Design & Image Generation", rating: 4.5, icon: <Palette size={20} />, isPremium: true, isPopular: false },
  { id: 75, title: "Runway", description: "Gen-2 video + image generative tools and editing.", category: "Design & Image Generation", rating: 4.6, icon: <Video size={20} />, isPremium: true, isPopular: false },
  { id: 76, title: "Canva AI", description: "Design templates + text-to-image tools.", category: "Design & Image Generation", rating: 4.4, icon: <Palette size={20} />, isPremium: true, isPopular: false },
  { id: 77, title: "Lensa", description: "Portrait editing and style transfers.", category: "Design & Image Generation", rating: 4.2, icon: <Image size={20} />, isPremium: true, isPopular: false },
  { id: 78, title: "Fotor", description: "Image editing with generative features.", category: "Design & Image Generation", rating: 4.1, icon: <Image size={20} />, isPremium: false, isPopular: false },
  { id: 79, title: "Picsart AI", description: "Consumer-friendly image editing & generation.", category: "Design & Image Generation", rating: 4.2, icon: <Image size={20} />, isPremium: true, isPopular: false },
  { id: 80, title: "ClipDrop", description: "Background removal, quick edits using AI.", category: "Design & Image Generation", rating: 4.3, icon: <Image size={20} />, isPremium: true, isPopular: false },
  { id: 81, title: "Remove.bg", description: "Background removal via ML.", category: "Design & Image Generation", rating: 4.4, icon: <Image size={20} />, isPremium: false, isPopular: false },
  { id: 82, title: "DeepArt / Prisma", description: "Style-transfer image apps.", category: "Design & Image Generation", rating: 4.0, icon: <Image size={20} />, isPremium: false, isPopular: false },
  { id: 83, title: "PhotoRoom", description: "e-commerce image editing with AI.", category: "Design & Image Generation", rating: 4.3, icon: <Image size={20} />, isPremium: true, isPopular: false },
  { id: 84, title: "Topaz Labs", description: "Image enhancement & upscaling.", category: "Design & Image Generation", rating: 4.5, icon: <Image size={20} />, isPremium: true, isPopular: false },

  // Video generation / editing / avatars
  { id: 85, title: "Synthesia", description: "Text-to-video with AI avatars & multilingual voices.", category: "Video & Avatars", rating: 4.6, icon: <Video size={20} />, isPremium: true, isPopular: true },
  { id: 86, title: "HeyGen", description: "AI video avatars and TTV.", category: "Video & Avatars", rating: 4.5, icon: <Video size={20} />, isPremium: true, isPopular: false },
  { id: 87, title: "Pictory", description: "Turn text or long video into edited short videos.", category: "Video & Avatars", rating: 4.3, icon: <Video size={20} />, isPremium: true, isPopular: false },
  { id: 88, title: "Descript", description: "Audio/video editor with overdub voice cloning.", category: "Video & Avatars", rating: 4.4, icon: <Video size={20} />, isPremium: true, isPopular: false },
  { id: 89, title: "Kaiber", description: "AI-driven music-video style generation.", category: "Video & Avatars", rating: 4.2, icon: <Video size={20} />, isPremium: true, isPopular: false },
  { id: 90, title: "Synthesys", description: "AI voice + video avatar generator.", category: "Video & Avatars", rating: 4.1, icon: <Video size={20} />, isPremium: true, isPopular: false },
  { id: 91, title: "InVideo", description: "Template-based video generation with AI aids.", category: "Video & Avatars", rating: 4.2, icon: <Video size={20} />, isPremium: true, isPopular: false },

  // Audio / voice / music
  { id: 92, title: "ElevenLabs", description: "Ultra-realistic text-to-speech and voice cloning.", category: "Audio & Voice & Music", rating: 4.8, icon: <Music size={20} />, isPremium: true, isPopular: true },
  { id: 93, title: "Murf.ai", description: "Voice-over generator for videos and presentations.", category: "Audio & Voice & Music", rating: 4.4, icon: <Music size={20} />, isPremium: true, isPopular: false },
  { id: 94, title: "Resemble.ai", description: "Custom voice cloning and TTS.", category: "Audio & Voice & Music", rating: 4.3, icon: <Music size={20} />, isPremium: true, isPopular: false },
  { id: 95, title: "AIVA", description: "AI-composed music for media.", category: "Audio & Voice & Music", rating: 4.2, icon: <Music size={20} />, isPremium: true, isPopular: false },
  { id: 96, title: "Soundraw", description: "Royalty-free AI music generation.", category: "Audio & Voice & Music", rating: 4.1, icon: <Music size={20} />, isPremium: true, isPopular: false },
  { id: 97, title: "Boomy", description: "Quick AI music creation & distribution.", category: "Audio & Voice & Music", rating: 4.0, icon: <Music size={20} />, isPremium: false, isPopular: false },
  { id: 98, title: "Amper Music", description: "AI soundtrack composer for creators.", category: "Audio & Voice & Music", rating: 4.1, icon: <Music size={20} />, isPremium: true, isPopular: false },
  { id: 99, title: "Sonantic", description: "Expressive TTS for media.", category: "Audio & Voice & Music", rating: 4.2, icon: <Music size={20} />, isPremium: true, isPopular: false },

  // Speech / meeting / transcription
  { id: 100, title: "Otter.ai", description: "Meeting transcription and notes.", category: "Speech & Transcription", rating: 4.5, icon: <FileText size={20} />, isPremium: true, isPopular: true },
  { id: 101, title: "Rev.ai", description: "Speech-to-text and captions.", category: "Speech & Transcription", rating: 4.4, icon: <FileText size={20} />, isPremium: true, isPopular: false },
  { id: 102, title: "Sonix", description: "Automated transcription and translation.", category: "Speech & Transcription", rating: 4.3, icon: <FileText size={20} />, isPremium: true, isPopular: false },
  { id: 103, title: "Fireflies.ai", description: "Meeting capture + summaries.", category: "Speech & Transcription", rating: 4.4, icon: <FileText size={20} />, isPremium: true, isPopular: false },
  { id: 104, title: "Veed.io", description: "Video editing with auto-captions.", category: "Speech & Transcription", rating: 4.2, icon: <Video size={20} />, isPremium: true, isPopular: false },

  // Image/video forensics & detection
  { id: 105, title: "Sensity", description: "Deepfake detection and monitoring.", category: "Forensics & Detection", rating: 4.3, icon: <Search size={20} />, isPremium: true, isPopular: false },
  { id: 106, title: "Amber Video", description: "Media provenance & verification tooling.", category: "Forensics & Detection", rating: 4.2, icon: <Video size={20} />, isPremium: true, isPopular: false },
  { id: 107, title: "Truepic", description: "Image & video authentication using capture chains.", category: "Forensics & Detection", rating: 4.1, icon: <Image size={20} />, isPremium: true, isPopular: false },
  { id: 108, title: "Reality Defender", description: "Deepfake & synthetic detection APIs.", category: "Forensics & Detection", rating: 4.2, icon: <Search size={20} />, isPremium: true, isPopular: false },

  // 3D / AR / animation / motion capture
  { id: 109, title: "NVIDIA Omniverse", description: "3D collaboration, simulation, and AI tools.", category: "3D & AR & Animation", rating: 4.5, icon: <Palette size={20} />, isPremium: true, isPopular: false },
  { id: 110, title: "Adobe Substance", description: "Textures & material generation.", category: "3D & AR & Animation", rating: 4.3, icon: <Palette size={20} />, isPremium: true, isPopular: false },
  { id: 111, title: "Didimo", description: "AI-driven 3D avatar creation from photos.", category: "3D & AR & Animation", rating: 4.1, icon: <Palette size={20} />, isPremium: true, isPopular: false },
  { id: 112, title: "DeepMotion", description: "Motion capture and animation via AI.", category: "3D & AR & Animation", rating: 4.2, icon: <Video size={20} />, isPremium: true, isPopular: false },

  // Productivity / docs / notes
  { id: 113, title: "Notion AI", description: "Writing, summarization, and workspace automation.", category: "Productivity & Docs", rating: 4.6, icon: <FileText size={20} />, isPremium: true, isPopular: true },
  { id: 114, title: "Mem.ai", description: "Personal knowledge assistant with semantic search.", category: "Productivity & Docs", rating: 4.3, icon: <Brain size={20} />, isPremium: true, isPopular: false },
  { id: 115, title: "Roam Research", description: "Note-linking with AI support.", category: "Productivity & Docs", rating: 4.2, icon: <FileText size={20} />, isPremium: true, isPopular: false },
  { id: 116, title: "Superhuman", description: "Faster email workflows with AI.", category: "Productivity & Docs", rating: 4.4, icon: <FileText size={20} />, isPremium: true, isPopular: false },

  // Education / tutoring
  { id: 117, title: "Khanmigo", description: "Tutor-style LLM for learning.", category: "Education & Tutoring", rating: 4.5, icon: <FileText size={20} />, isPremium: true, isPopular: false },
  { id: 118, title: "Socratic", description: "Homework help using AI.", category: "Education & Tutoring", rating: 4.3, icon: <FileText size={20} />, isPremium: false, isPopular: false },
  { id: 119, title: "Quizlet AI", description: "Study-mode with AI-generated flashcards.", category: "Education & Tutoring", rating: 4.2, icon: <FileText size={20} />, isPremium: true, isPopular: false },
  { id: 120, title: "Coursera Labs", description: "Course help and code auto-grading.", category: "Education & Tutoring", rating: 4.1, icon: <FileText size={20} />, isPremium: true, isPopular: false },

  // Healthcare / bioinformatics
  { id: 121, title: "IBM Watson Health", description: "Clinical decision support.", category: "Healthcare & Bio", rating: 4.0, icon: <FileText size={20} />, isPremium: true, isPopular: false },
  { id: 122, title: "Tempus / PathAI", description: "AI in pathology & diagnostics.", category: "Healthcare & Bio", rating: 4.2, icon: <FileText size={20} />, isPremium: true, isPopular: false },

  // Security / fraud / detection
  { id: 123, title: "Darktrace", description: "Network anomaly detection using ML.", category: "Security & Fraud", rating: 4.3, icon: <Search size={20} />, isPremium: true, isPopular: false },
  { id: 124, title: "CrowdStrike", description: "Threat detection with machine learning.", category: "Security & Fraud", rating: 4.4, icon: <Search size={20} />, isPremium: true, isPopular: false },
  { id: 125, title: "Sift / Fraugster", description: "Fraud detection pipelines using ML.", category: "Security & Fraud", rating: 4.2, icon: <Search size={20} />, isPremium: true, isPopular: false },

  // Enterprise / low-code / no-code AI platforms
  { id: 126, title: "C3.ai", description: "Enterprise AI applications & platforms.", category: "Enterprise & No-Code", rating: 4.1, icon: <BarChart3 size={20} />, isPremium: true, isPopular: false },
  { id: 127, title: "Akkio", description: "No-code predictive models for business users.", category: "Enterprise & No-Code", rating: 4.0, icon: <BarChart3 size={20} />, isPremium: true, isPopular: false },
  { id: 128, title: "Obviously AI", description: "No-code ML for predictions from spreadsheets.", category: "Enterprise & No-Code", rating: 3.9, icon: <BarChart3 size={20} />, isPremium: true, isPopular: false },
  { id: 129, title: "Peltarion", description: "Operationalize deep learning platform.", category: "Enterprise & No-Code", rating: 4.0, icon: <BarChart3 size={20} />, isPremium: true, isPopular: false },
  { id: 130, title: "Spell.run", description: "MLops & model orchestration.", category: "Enterprise & No-Code", rating: 4.1, icon: <BarChart3 size={20} />, isPremium: true, isPopular: false },

  // Specialized / vertical AI tools
  { id: 131, title: "Legal Robot / Harvey", description: "Contracts review & legal drafting assistance.", category: "Specialized & Vertical", rating: 4.2, icon: <FileText size={20} />, isPremium: true, isPopular: false },
  { id: 132, title: "Casetext / CoCounsel", description: "Legal research using LLMs.", category: "Specialized & Vertical", rating: 4.3, icon: <FileText size={20} />, isPremium: true, isPopular: false },
  { id: 133, title: "Primer", description: "Intelligence analysis & summarization for enterprises.", category: "Specialized & Vertical", rating: 4.1, icon: <FileText size={20} />, isPremium: true, isPopular: false },
  { id: 134, title: "Clarifai", description: "Visual recognition & custom computer vision models.", category: "Specialized & Vertical", rating: 4.2, icon: <Image size={20} />, isPremium: true, isPopular: false },
  { id: 135, title: "Tractable", description: "AI for insurance claims & damage assessment.", category: "Specialized & Vertical", rating: 4.0, icon: <BarChart3 size={20} />, isPremium: true, isPopular: false },

  // Creative aids & miscellany
  { id: 136, title: "CopyMonkey", description: "E-commerce product description generator.", category: "Creative & Misc", rating: 4.0, icon: <FileText size={20} />, isPremium: true, isPopular: false },
  { id: 137, title: "Reface", description: "Face-swap app for entertainment.", category: "Creative & Misc", rating: 3.8, icon: <Image size={20} />, isPremium: false, isPopular: false },
  { id: 138, title: "FaceApp", description: "Photo face edits.", category: "Creative & Misc", rating: 3.9, icon: <Image size={20} />, isPremium: true, isPopular: false },
  { id: 139, title: "Autodraw", description: "Sketch-to-icon recognition and completion.", category: "Creative & Misc", rating: 4.1, icon: <Palette size={20} />, isPremium: false, isPopular: false },
  { id: 140, title: "Browse.ai", description: "Web data extraction with automation + AI interpretation.", category: "Creative & Misc", rating: 4.2, icon: <Globe size={20} />, isPremium: true, isPopular: false },
  { id: 141, title: "AI Dungeon", description: "Procedural, story-driven LLM game environment.", category: "Creative & Misc", rating: 4.0, icon: <MessageSquare size={20} />, isPremium: true, isPopular: false },

  // Additional popular tools to reach 150
  { id: 142, title: "Claude 3 Haiku", description: "Fast and efficient AI assistant for quick tasks.", category: "Chat & Assistants", rating: 4.5, icon: <Brain size={20} />, isPremium: true, isPopular: false },
  { id: 143, title: "Bard (Gemini)", description: "Google's conversational AI with web access.", category: "Chat & Assistants", rating: 4.4, icon: <Globe size={20} />, isPremium: false, isPopular: false },
  { id: 144, title: "Anthropic Claude Pro", description: "Advanced version of Claude with higher usage limits.", category: "Chat & Assistants", rating: 4.7, icon: <Brain size={20} />, isPremium: true, isPopular: false },
  { id: 145, title: "GPT-4 Turbo", description: "Faster and more efficient version of GPT-4.", category: "Chat & Assistants", rating: 4.8, icon: <Brain size={20} />, isPremium: true, isPopular: false },
  { id: 146, title: "Codex by GitHub", description: "Advanced code generation and completion.", category: "Code & Developer Tools", rating: 4.6, icon: <Code size={20} />, isPremium: true, isPopular: false },
  { id: 147, title: "DALL-E 2", description: "Previous generation image generation model.", category: "Design & Image Generation", rating: 4.4, icon: <Image size={20} />, isPremium: true, isPopular: false },
  { id: 148, title: "ChatGPT Plus", description: "Premium version with GPT-4 access and faster responses.", category: "Chat & Assistants", rating: 4.9, icon: <Brain size={20} />, isPremium: true, isPopular: true },
  { id: 149, title: "Stability AI", description: "Open source AI models for various applications.", category: "Creative & Misc", rating: 4.3, icon: <Zap size={20} />, isPremium: false, isPopular: false },
  { id: 150, title: "Hugging Face Hub", description: "Repository of AI models and datasets.", category: "Enterprise & No-Code", rating: 4.5, icon: <Code size={20} />, isPremium: false, isPopular: true }
];

interface DashboardProps {
  userEmail: string;
  onLogout: () => void;
}

export function Dashboard({ userEmail, onLogout }: DashboardProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTool, setSelectedTool] = useState<typeof aiTools[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"tools" | "automation">("tools");

  const handleToolClick = (tool: typeof aiTools[0]) => {
    setSelectedTool(tool);
    setIsModalOpen(true);
  };

  const filteredTools = aiTools.filter(tool => {
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-card border-b border-holo-blue/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg">
                  <img src="/lovable-uploads/c2ed5a9d-749a-43c7-9f54-039c35fd9ee9.png" alt="AI Nexus Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">AI Nexus</h1>
                  <p className="text-sm text-muted-foreground">150+ AI Tools & Automation</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <Button
                  variant={activeTab === "tools" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("tools")}
                  className="gap-2"
                >
                  <Brain size={16} />
                  AI Tools
                </Button>
                <Button
                  variant={activeTab === "automation" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("automation")}
                  className="gap-2"
                >
                  <Bot size={16} />
                  Automation
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/integrations')}
                  className="gap-2"
                >
                  <Plug size={16} />
                  Integrations
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">Welcome, {userEmail}</span>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut size={16} />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "tools" && (
        <>
        {/* Search and Filters */}
        <div className="space-y-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Search AI tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 border-holo-blue/30 focus:border-holo-blue"
              />
            </div>
            <Button variant="outline" size="lg">
              <Filter size={16} />
              Filter
            </Button>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? "bg-holo-blue text-background shadow-glow"
                    : "bg-secondary text-secondary-foreground hover:bg-holo-blue/20"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 text-center border border-holo-blue/20">
            <h3 className="text-3xl font-bold text-holo-blue">150</h3>
            <p className="text-muted-foreground">AI Tools</p>
          </div>
          <div className="glass-card p-6 text-center border border-holo-blue/20">
            <h3 className="text-3xl font-bold text-holo-blue">23</h3>
            <p className="text-muted-foreground">Categories</p>
          </div>
          <div className="glass-card p-6 text-center border border-holo-blue/20">
            <h3 className="text-3xl font-bold text-holo-blue">24/7</h3>
            <p className="text-muted-foreground">Available</p>
          </div>
        </div>

        {/* AI Tools Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">
              {selectedCategory === "All" ? "All AI Tools" : selectedCategory}
            </h2>
            <span className="text-muted-foreground">
              {filteredTools.length} tools found
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTools.map((tool) => (
              <AIToolCard
                key={tool.id}
                title={tool.title}
                description={tool.description}
                category={tool.category}
                rating={tool.rating}
                icon={tool.icon}
                isPremium={tool.isPremium}
                isPopular={tool.isPopular}
                onClick={() => handleToolClick(tool)}
              />
            ))}
          </div>
        </div>
        </>
        )}

        {activeTab === "automation" && (
          <AutomationDashboard />
        )}

        {/* AI Tool Modal */}
        {selectedTool && (
          <AIToolModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            tool={selectedTool}
          />
        )}

        {/* AI Help Agent */}
        <AIHelpAgent />
      </div>
    </div>
  );
}