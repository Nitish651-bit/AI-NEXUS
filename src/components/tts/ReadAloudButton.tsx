import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Globe, Volume2, VolumeX, Loader2 } from "lucide-react";

export interface TTSLanguage {
  code: string;
  name: string;
  flag: string;
}

const POPULAR_LANGUAGES: TTSLanguage[] = [
  { code: "auto", name: "Auto-Detect", flag: "🌐" },
  { code: "en-US", name: "English (US)", flag: "🇺🇸" },
  { code: "en-GB", name: "English (UK)", flag: "🇬🇧" },
  { code: "hi-IN", name: "Hindi", flag: "🇮🇳" },
  { code: "es-ES", name: "Spanish", flag: "🇪🇸" },
  { code: "fr-FR", name: "French", flag: "🇫🇷" },
  { code: "de-DE", name: "German", flag: "🇩🇪" },
  { code: "zh-CN", name: "Chinese (Simplified)", flag: "🇨🇳" },
  { code: "ja-JP", name: "Japanese", flag: "🇯🇵" },
  { code: "ko-KR", name: "Korean", flag: "🇰🇷" },
  { code: "ar-SA", name: "Arabic", flag: "🇸🇦" },
  { code: "pt-BR", name: "Portuguese (Brazil)", flag: "🇧🇷" },
  { code: "ru-RU", name: "Russian", flag: "🇷🇺" },
];

const MORE_LANGUAGES: TTSLanguage[] = [
  { code: "it-IT", name: "Italian", flag: "🇮🇹" },
  { code: "nl-NL", name: "Dutch", flag: "🇳🇱" },
  { code: "pl-PL", name: "Polish", flag: "🇵🇱" },
  { code: "tr-TR", name: "Turkish", flag: "🇹🇷" },
  { code: "vi-VN", name: "Vietnamese", flag: "🇻🇳" },
  { code: "th-TH", name: "Thai", flag: "🇹🇭" },
  { code: "sv-SE", name: "Swedish", flag: "🇸🇪" },
  { code: "da-DK", name: "Danish", flag: "🇩🇰" },
  { code: "nb-NO", name: "Norwegian", flag: "🇳🇴" },
  { code: "fi-FI", name: "Finnish", flag: "🇫🇮" },
  { code: "el-GR", name: "Greek", flag: "🇬🇷" },
  { code: "he-IL", name: "Hebrew", flag: "🇮🇱" },
  { code: "id-ID", name: "Indonesian", flag: "🇮🇩" },
  { code: "ms-MY", name: "Malay", flag: "🇲🇾" },
  { code: "bn-IN", name: "Bengali", flag: "🇧🇩" },
  { code: "ta-IN", name: "Tamil", flag: "🇮🇳" },
  { code: "te-IN", name: "Telugu", flag: "🇮🇳" },
  { code: "gu-IN", name: "Gujarati", flag: "🇮🇳" },
  { code: "kn-IN", name: "Kannada", flag: "🇮🇳" },
  { code: "ml-IN", name: "Malayalam", flag: "🇮🇳" },
  { code: "pa-IN", name: "Punjabi", flag: "🇮🇳" },
  { code: "mr-IN", name: "Marathi", flag: "🇮🇳" },
  { code: "ur-PK", name: "Urdu", flag: "🇵🇰" },
  { code: "uk-UA", name: "Ukrainian", flag: "🇺🇦" },
  { code: "cs-CZ", name: "Czech", flag: "🇨🇿" },
  { code: "ro-RO", name: "Romanian", flag: "🇷🇴" },
  { code: "hu-HU", name: "Hungarian", flag: "🇭🇺" },
  { code: "sk-SK", name: "Slovak", flag: "🇸🇰" },
  { code: "bg-BG", name: "Bulgarian", flag: "🇧🇬" },
  { code: "hr-HR", name: "Croatian", flag: "🇭🇷" },
  { code: "sr-RS", name: "Serbian", flag: "🇷🇸" },
  { code: "sl-SI", name: "Slovenian", flag: "🇸🇮" },
  { code: "ca-ES", name: "Catalan", flag: "🏴" },
  { code: "fil-PH", name: "Filipino", flag: "🇵🇭" },
  { code: "sw-KE", name: "Swahili", flag: "🇰🇪" },
  { code: "af-ZA", name: "Afrikaans", flag: "🇿🇦" },
  { code: "am-ET", name: "Amharic", flag: "🇪🇹" },
  { code: "ka-GE", name: "Georgian", flag: "🇬🇪" },
  { code: "hy-AM", name: "Armenian", flag: "🇦🇲" },
  { code: "km-KH", name: "Khmer", flag: "🇰🇭" },
  { code: "lo-LA", name: "Lao", flag: "🇱🇦" },
  { code: "my-MM", name: "Myanmar", flag: "🇲🇲" },
  { code: "si-LK", name: "Sinhala", flag: "🇱🇰" },
  { code: "ne-NP", name: "Nepali", flag: "🇳🇵" },
];

interface ReadAloudButtonProps {
  onSpeak: (lang?: string) => void;
  isSpeaking: boolean;
  isLoading: boolean;
  compact?: boolean;
}

export function ReadAloudButton({ onSpeak, isSpeaking, isLoading, compact = false }: ReadAloudButtonProps) {
  const [selectedLang, setSelectedLang] = useState<TTSLanguage>(POPULAR_LANGUAGES[0]);
  const [showMore, setShowMore] = useState(false);

  const handleSpeak = () => {
    onSpeak(selectedLang.code === "auto" ? undefined : selectedLang.code);
  };

  const handleSelectLang = (lang: TTSLanguage) => {
    setSelectedLang(lang);
  };

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isLoading}
            className="h-5 w-auto gap-1 p-0 px-1 opacity-70 hover:opacity-100"
          >
            {isLoading ? (
              <Loader2 size={10} className="animate-spin" />
            ) : isSpeaking ? (
              <VolumeX size={10} />
            ) : (
              <Volume2 size={10} />
            )}
            <span className="text-[9px]">{selectedLang.flag}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto bg-popover border border-border shadow-lg z-[100]">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Speak in selected language
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={handleSpeak}
            className="gap-2 font-medium text-primary"
          >
            {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {isSpeaking ? "Stop" : `Read Aloud (${selectedLang.flag})`}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Select Language
          </DropdownMenuLabel>
          {POPULAR_LANGUAGES.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleSelectLang(lang)}
              className={`gap-2 ${selectedLang.code === lang.code ? "bg-accent" : ""}`}
            >
              <span>{lang.flag}</span>
              <span className="text-sm">{lang.name}</span>
            </DropdownMenuItem>
          ))}
          {showMore && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                More Languages
              </DropdownMenuLabel>
              {MORE_LANGUAGES.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => handleSelectLang(lang)}
                  className={`gap-2 ${selectedLang.code === lang.code ? "bg-accent" : ""}`}
                >
                  <span>{lang.flag}</span>
                  <span className="text-sm">{lang.name}</span>
                </DropdownMenuItem>
              ))}
            </>
          )}
          {!showMore && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowMore(true)} className="gap-2 text-primary">
                <Globe size={14} />
                <span className="text-sm">Show all 50+ languages...</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSpeak}
        disabled={isLoading}
        className={`rounded-r-none ${isSpeaking ? "border-primary text-primary" : ""}`}
      >
        {isLoading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : isSpeaking ? (
          <VolumeX size={14} />
        ) : (
          <Volume2 size={14} />
        )}
        {isSpeaking ? "Stop" : "Read Aloud"}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`rounded-l-none border-l-0 px-1.5 ${isSpeaking ? "border-primary text-primary" : ""}`}
          >
            <span className="text-xs mr-0.5">{selectedLang.flag}</span>
            <ChevronDown size={12} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto bg-popover border border-border shadow-lg z-[100]">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Select Language
          </DropdownMenuLabel>
          {POPULAR_LANGUAGES.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleSelectLang(lang)}
              className={`gap-2 ${selectedLang.code === lang.code ? "bg-accent" : ""}`}
            >
              <span>{lang.flag}</span>
              <span className="text-sm">{lang.name}</span>
            </DropdownMenuItem>
          ))}
          {showMore && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                More Languages
              </DropdownMenuLabel>
              {MORE_LANGUAGES.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => handleSelectLang(lang)}
                  className={`gap-2 ${selectedLang.code === lang.code ? "bg-accent" : ""}`}
                >
                  <span>{lang.flag}</span>
                  <span className="text-sm">{lang.name}</span>
                </DropdownMenuItem>
              ))}
            </>
          )}
          {!showMore && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowMore(true)} className="gap-2 text-primary">
                <Globe size={14} />
                <span className="text-sm">Show all 50+ languages...</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
