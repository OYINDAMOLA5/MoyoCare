import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Plus, X, CalendarIcon, List, Smile, Frown, Meh, Heart, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, isSameDay } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface JournalEntry {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  created_at: string;
}

const moods = [
  { value: 'happy', icon: Smile, label: 'Happy', color: 'text-secondary' },
  { value: 'sad', icon: Frown, label: 'Sad', color: 'text-blue-500' },
  { value: 'neutral', icon: Meh, label: 'Neutral', color: 'text-muted-foreground' },
  { value: 'loved', icon: Heart, label: 'Loved', color: 'text-accent' },
  { value: 'excited', icon: Sparkles, label: 'Excited', color: 'text-primary' },
];

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWriting, setIsWriting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  
  // New entry form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading entries',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast({
        title: 'Please write something',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('journal_entries').insert({
        user_id: user.id,
        title: title.trim() || null,
        content: content.trim(),
        mood: mood || null,
      });

      if (error) throw error;

      toast({ title: 'Entry saved!' });
      setTitle('');
      setContent('');
      setMood('');
      setIsWriting(false);
      loadEntries();
    } catch (error: any) {
      toast({
        title: 'Error saving entry',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Entry deleted' });
      setSelectedEntry(null);
      loadEntries();
    } catch (error: any) {
      toast({
        title: 'Error deleting entry',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const entriesOnDate = (date: Date) => {
    return entries.filter(e => isSameDay(new Date(e.created_at), date));
  };

  const getMoodIcon = (moodValue: string | null) => {
    const moodObj = moods.find(m => m.value === moodValue);
    if (!moodObj) return null;
    const Icon = moodObj.icon;
    return <Icon className={`w-4 h-4 ${moodObj.color}`} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-primary">Loading journal...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Journal</h1>
              <p className="text-sm text-muted-foreground">Your private reflections</p>
            </div>
            <Button onClick={() => setIsWriting(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Entry
            </Button>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Calendar
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-4">
        {viewMode === 'calendar' ? (
          <div className="space-y-4">
            <Card className="p-4 flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{
                  hasEntry: entries.map(e => new Date(e.created_at)),
                }}
                modifiersStyles={{
                  hasEntry: { fontWeight: 'bold', textDecoration: 'underline' },
                }}
              />
            </Card>
            
            {selectedDate && (
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">
                  {format(selectedDate, 'MMMM d, yyyy')}
                </h3>
                {entriesOnDate(selectedDate).length === 0 ? (
                  <p className="text-muted-foreground text-sm">No entries for this day</p>
                ) : (
                  entriesOnDate(selectedDate).map(entry => (
                    <Card
                      key={entry.id}
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {entry.title || 'Untitled'}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {entry.content}
                          </p>
                        </div>
                        {getMoodIcon(entry.mood)}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {entries.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-4">No journal entries yet</p>
                <Button onClick={() => setIsWriting(true)}>
                  Write your first entry
                </Button>
              </Card>
            ) : (
              entries.map(entry => (
                <Card
                  key={entry.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {entry.title || 'Untitled'}
                        </h3>
                        {getMoodIcon(entry.mood)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {entry.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(entry.created_at), 'MMM d, yyyy • h:mm a')}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </main>

      {/* New Entry Dialog */}
      <Dialog open={isWriting} onOpenChange={setIsWriting}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Journal Entry</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            
            <Textarea
              placeholder="Write your thoughts, sis..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px]"
            />

            {/* Mood selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">How are you feeling?</label>
              <div className="flex gap-2 flex-wrap">
                {moods.map((m) => {
                  const Icon = m.icon;
                  return (
                    <Button
                      key={m.value}
                      type="button"
                      variant={mood === m.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMood(mood === m.value ? '' : m.value)}
                    >
                      <Icon className="w-4 h-4 mr-1" />
                      {m.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsWriting(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
              >
                {saving ? 'Saving...' : 'Save Entry'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Entry Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedEntry && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedEntry.title || 'Untitled'}
                  {getMoodIcon(selectedEntry.mood)}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedEntry.created_at), 'MMMM d, yyyy • h:mm a')}
                </p>
                <p className="whitespace-pre-wrap text-foreground">
                  {selectedEntry.content}
                </p>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(selectedEntry.id)}
                >
                  Delete Entry
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
