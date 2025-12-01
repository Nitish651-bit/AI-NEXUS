import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Users, Activity, Database, RefreshCw, ArrowLeft } from "lucide-react";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

interface UserActivity {
  id: string;
  user_id: string;
  tool_name: string;
  tool_category: string;
  created_at: string;
}

export default function AdminDebug() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Load profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Load recent activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from("user_activity")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (activitiesError) throw activitiesError;
      setActivities(activitiesData || []);

      toast({
        title: "Data loaded",
        description: `Found ${profilesData?.length || 0} users and ${activitiesData?.length || 0} activities`,
      });
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Database className="h-8 w-8" />
              Admin Debug Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              View user registrations and activity data
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to App
            </Button>
            <Button onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{profiles.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Total Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activities.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Database Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="default">Connected</Badge>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registered Users</CardTitle>
            <CardDescription>
              All users in the profiles table
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found. Users will appear here after registration.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.email}</TableCell>
                      <TableCell>{profile.full_name || "N/A"}</TableCell>
                      <TableCell className="font-mono text-xs">{profile.id.slice(0, 8)}...</TableCell>
                      <TableCell>{new Date(profile.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest 50 tool usage records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No activities found. Activities will appear here as users interact with AI tools.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Tool Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-mono text-xs">{activity.user_id.slice(0, 8)}...</TableCell>
                      <TableCell>{activity.tool_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{activity.tool_category}</Badge>
                      </TableCell>
                      <TableCell>{new Date(activity.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}