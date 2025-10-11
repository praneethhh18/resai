
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LogOut, LifeBuoy, HelpCircle, ChevronRight, Palette, Ruler, Trash2 } from 'lucide-react';
import { useContext } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { Recipe, RecipeSummary } from '@/lib/types';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '@/lib/utils';
import { ThemeContext } from './theme-context';
import { NotificationBell } from './notification-bell';
import { Switch } from '../ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';


interface ProfileSidebarProps {
    recentlyViewed: (RecipeSummary | Recipe)[];
    onClearChatHistory: () => void;
    measurementSystem: 'metric' | 'imperial';
    onMeasurementSystemChange: (system: 'metric' | 'imperial') => void;
    onOpenSupport: () => void;
    onOpenFaq: () => void;
}

const themes = [
    { name: 'orange', color: 'hsl(34 91% 64%)' },
    { name: 'blue', color: 'hsl(217 91% 60%)' },
    { name: 'green', color: 'hsl(142 76% 36%)' },
    { name: 'rose', color: 'hsl(346 83% 49%)' },
];

export function ProfileSidebar({ recentlyViewed, onClearChatHistory, measurementSystem, onMeasurementSystemChange, onOpenSupport, onOpenFaq }: ProfileSidebarProps) {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const themeContext = useContext(ThemeContext);

  if (!themeContext) {
    // This should not happen if the component is wrapped in ThemeProvider
    throw new Error("ProfileSidebar must be used within a ThemeProvider");
  }

  const { currentTheme, onThemeChange } = themeContext;

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await auth.signOut();
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
      router.push('/signin');
    } catch (error) {
      console.error("Sign out error:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to sign out. Please try again." });
    }
  };

  return (
    <ScrollArea className="w-full h-full bg-card">
        <div className="w-full h-full flex flex-col p-6">
            <div className="flex justify-end mb-6">
                <NotificationBell />
            </div>

            <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                <Image
                    src={user?.photoURL || "https://i.pravatar.cc/150?u=a042581f4e29026704d"}
                    alt={user?.displayName || "User"}
                    width={100}
                    height={100}
                    className="rounded-full"
                />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary rotate-45"></div>
                </div>
                <h2 className="text-xl font-bold">{user?.displayName || 'Foodie'}</h2>
                <p className="text-sm text-muted-foreground mb-3">Welcome to your dashboard</p>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="mt-2">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </div>
            
            <div className="my-6 text-center">
                 <p className="text-3xl font-bold">{recentlyViewed.length}</p>
                 <p className="text-sm text-muted-foreground">Recipes Visited</p>
            </div>

            <Separator className="my-4" />

             <div className="flex flex-col gap-2 text-sm">
                <Button variant="ghost" className="justify-start gap-3 px-3" onClick={onOpenSupport}>
                    <LifeBuoy className="h-5 w-5 text-muted-foreground" />
                    <span>Support</span>
                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                </Button>
                <Button variant="ghost" className="justify-start gap-3 px-3" onClick={onOpenFaq}>
                    <HelpCircle className="h-5 w-5 text-muted-foreground" />
                    <span>FAQ</span>
                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                </Button>
             </div>
            
            <div className="pt-6 space-y-4">
                <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase">Website Settings</h3>
                <div className="grid gap-4 px-3">
                    <div className="grid gap-2">
                        <Label htmlFor="language" className="text-sm">Language</Label>
                        <Select defaultValue="en">
                            <SelectTrigger id="language">
                                <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="es">Español</SelectItem>
                                <SelectItem value="fr">Français</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid gap-2">
                        <Label className="text-sm flex items-center gap-2">
                            <Palette className="w-4 h-4" />
                            Color Theme
                        </Label>
                        <div className="flex items-center gap-2">
                            {themes.map((t) => (
                                <button
                                    key={t.name}
                                    className={cn(
                                        "w-8 h-8 rounded-full border-2 transition-all",
                                        currentTheme === t.name ? 'border-primary' : 'border-transparent'
                                    )}
                                    onClick={() => onThemeChange(t.name)}
                                >
                                    <div
                                        className="w-full h-full rounded-full"
                                        style={{ backgroundColor: t.color }}
                                    />
                                    <span className="sr-only">{t.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label className="text-sm flex items-center gap-2">
                           <Ruler className="w-4 h-4" />
                           Measurement System
                        </Label>
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="measurement-switch" className="text-sm text-muted-foreground">Imperial</Label>
                            <Switch
                                id="measurement-switch"
                                checked={measurementSystem === 'metric'}
                                onCheckedChange={(checked) => onMeasurementSystemChange(checked ? 'metric' : 'imperial')}
                            />
                            <Label htmlFor="measurement-switch" className="text-sm text-muted-foreground">Metric</Label>
                        </div>
                    </div>
                </div>
            </div>
             <div className="mt-auto pt-6 space-y-4">
                <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase">Data & Privacy</h3>
                <div className="grid gap-4 px-3">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="justify-start gap-2">
                          <Trash2 className="w-4 h-4" />
                          Clear AI Chat History
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete all of your AI chat history. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={onClearChatHistory}>
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </div>
    </ScrollArea>
  );
}
