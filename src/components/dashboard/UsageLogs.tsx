import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  RefreshCw, 
  Search, 
  Clock, 
  User, 
  FileText, 
  AlertCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format } from "date-fns";

interface ActivityLog {
  id: string;
  created_at: string;
  user_id: string;
  tool_name: string;
  tool_category: string;
  input_text: string | null;
  output_text: string | null;
}

export function UsageLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('user_activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) {
        throw fetchError;
      }

      setLogs(data || []);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('usage-logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity'
        },
        (payload) => {
          setLogs(prev => [payload.new as ActivityLog, ...prev].slice(0, 100));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filteredLogs = logs.filter(log => 
    log.tool_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.tool_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.input_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.output_text?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const truncateText = (text: string | null, maxLength: number = 100) => {
    if (!text) return 'N/A';
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  };

  if (isLoading) {
    return (
      <Card className="glass-card border border-holo-blue/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="text-holo-blue" size={20} />
            Usage Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border border-holo-blue/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="text-holo-blue" size={20} />
            Usage Logs
            <Badge variant="outline" className="ml-2">
              {filteredLogs.length} entries
            </Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search logs by tool, category, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center gap-2 text-destructive p-4 rounded-lg bg-destructive/10">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="mx-auto mb-2 opacity-50" size={40} />
            <p>No usage logs found</p>
            <p className="text-sm">Logs will appear here when you use AI tools</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {filteredLogs.map(log => {
                const isExpanded = expandedLogs.has(log.id);
                const isError = log.output_text?.toLowerCase().includes('error');
                
                return (
                  <div 
                    key={log.id} 
                    className={`p-4 rounded-lg border transition-all ${
                      isError 
                        ? 'border-destructive/30 bg-destructive/5' 
                        : 'border-holo-blue/20 bg-card/50 hover:bg-card/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {log.tool_name}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {log.tool_category}
                          </Badge>
                          {isError && (
                            <Badge variant="destructive" className="text-xs">
                              Error
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                          </span>
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {log.user_id.slice(0, 8)}...
                          </span>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Input:</span>
                            <p className="text-sm mt-1 text-foreground">
                              {isExpanded ? log.input_text || 'N/A' : truncateText(log.input_text)}
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Output:</span>
                            <p className={`text-sm mt-1 ${isError ? 'text-destructive' : 'text-foreground'}`}>
                              {isExpanded ? log.output_text || 'N/A' : truncateText(log.output_text)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {(log.input_text?.length || 0) > 100 || (log.output_text?.length || 0) > 100 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(log.id)}
                          className="shrink-0"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
