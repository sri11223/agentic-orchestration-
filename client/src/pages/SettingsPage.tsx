import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Save, Bell, Shield, Palette, Globe } from 'lucide-react';

const SettingsPage = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    displayName: '',
    email: '',
    timezone: 'UTC',
    theme: 'system',
    notifyOnComplete: true,
    notifyOnFailure: true,
    notifyOnSchedule: false,
    emailNotifications: true,
    autoSaveInterval: 30,
    maxRetries: 3,
    executionTimeout: 300,
    enableDebugMode: false,
  });

  const handleChange = (key: string, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem('platform_settings', JSON.stringify(settings));
      toast({ title: 'Settings saved', description: 'Your preferences have been updated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your platform preferences.</p>
          </div>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" /> Profile</CardTitle>
            <CardDescription>Update your personal information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input id="displayName" value={settings.displayName} onChange={e => handleChange('displayName', e.target.value)} placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={settings.email} onChange={e => handleChange('email', e.target.value)} placeholder="you@example.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={settings.timezone} onValueChange={v => handleChange('timezone', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Berlin">Berlin</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  <SelectItem value="Asia/Kolkata">India</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" /> Appearance</CardTitle>
            <CardDescription>Customize how the platform looks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={settings.theme} onValueChange={v => handleChange('theme', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" /> Notifications</CardTitle>
            <CardDescription>Choose what notifications you receive.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-muted-foreground">Receive email notifications</div>
              </div>
              <Switch checked={settings.emailNotifications} onCheckedChange={v => handleChange('emailNotifications', v)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">On Execution Complete</div>
                <div className="text-sm text-muted-foreground">Notify when a workflow finishes</div>
              </div>
              <Switch checked={settings.notifyOnComplete} onCheckedChange={v => handleChange('notifyOnComplete', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">On Execution Failure</div>
                <div className="text-sm text-muted-foreground">Notify when a workflow fails</div>
              </div>
              <Switch checked={settings.notifyOnFailure} onCheckedChange={v => handleChange('notifyOnFailure', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Schedule Reminders</div>
                <div className="text-sm text-muted-foreground">Remind about upcoming scheduled workflows</div>
              </div>
              <Switch checked={settings.notifyOnSchedule} onCheckedChange={v => handleChange('notifyOnSchedule', v)} />
            </div>
          </CardContent>
        </Card>

        {/* Execution Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" /> Execution</CardTitle>
            <CardDescription>Configure workflow execution behavior.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="autoSave">Auto-Save Interval (seconds)</Label>
                <Input id="autoSave" type="number" min={5} max={120} value={settings.autoSaveInterval} onChange={e => handleChange('autoSaveInterval', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retries">Max Retries on Failure</Label>
                <Input id="retries" type="number" min={0} max={10} value={settings.maxRetries} onChange={e => handleChange('maxRetries', Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeout">Execution Timeout (seconds)</Label>
              <Input id="timeout" type="number" min={30} max={3600} value={settings.executionTimeout} onChange={e => handleChange('executionTimeout', Number(e.target.value))} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Debug Mode</div>
                <div className="text-sm text-muted-foreground">Enable verbose logging for troubleshooting</div>
              </div>
              <Switch checked={settings.enableDebugMode} onCheckedChange={v => handleChange('enableDebugMode', v)} />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
