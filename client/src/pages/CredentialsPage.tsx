import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Key, Trash2, Eye, EyeOff, Shield, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Credential {
  id: string;
  name: string;
  type: string;
  createdAt: Date;
  lastUsed: Date | null;
  status: 'active' | 'expired' | 'revoked';
}

const CREDENTIAL_TYPES = [
  { value: 'api-key', label: 'API Key' },
  { value: 'oauth2', label: 'OAuth2 Token' },
  { value: 'basic-auth', label: 'Basic Auth' },
  { value: 'bearer-token', label: 'Bearer Token' },
  { value: 'webhook-secret', label: 'Webhook Secret' },
];

const CredentialsPage = () => {
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<Credential[]>([
    { id: '1', name: 'Gemini API Key', type: 'api-key', createdAt: new Date(Date.now() - 86400000 * 30), lastUsed: new Date(Date.now() - 3600000), status: 'active' },
    { id: '2', name: 'Groq API Token', type: 'bearer-token', createdAt: new Date(Date.now() - 86400000 * 15), lastUsed: new Date(Date.now() - 7200000), status: 'active' },
    { id: '3', name: 'HuggingFace Access', type: 'api-key', createdAt: new Date(Date.now() - 86400000 * 7), lastUsed: null, status: 'active' },
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});

  const handleCreate = () => {
    if (!newName || !newType || !newValue) {
      toast({ title: 'Missing fields', description: 'Please fill in all fields.', variant: 'destructive' });
      return;
    }
    const cred: Credential = {
      id: `cred-${Date.now()}`,
      name: newName,
      type: newType,
      createdAt: new Date(),
      lastUsed: null,
      status: 'active',
    };
    setCredentials(prev => [cred, ...prev]);
    setNewName('');
    setNewType('');
    setNewValue('');
    setDialogOpen(false);
    toast({ title: 'Credential created', description: `${newName} has been securely stored.` });
  };

  const handleDelete = (id: string) => {
    setCredentials(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Credential deleted', description: 'The credential has been permanently removed.' });
  };

  const toggleShow = (id: string) => {
    setShowValues(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'expired': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'revoked': return 'bg-red-500/10 text-red-600 border-red-200';
      default: return '';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Credentials</h1>
            <p className="text-muted-foreground mt-1">Manage API keys, tokens, and secrets for your integrations.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Add Credential</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Credential</DialogTitle>
                <DialogDescription>Store a new API key or token securely. Values are encrypted at rest.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input placeholder="e.g., OpenAI API Key" value={newName} onChange={e => setNewName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {CREDENTIAL_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input type="password" placeholder="Enter secret value" value={newValue} onChange={e => setNewValue(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Save Credential</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {credentials.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No credentials yet</h3>
                <p className="text-muted-foreground mt-1">Add API keys and tokens to use in your workflows.</p>
              </CardContent>
            </Card>
          ) : (
            credentials.map(cred => (
              <Card key={cred.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Key className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{cred.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{cred.type}</Badge>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Created {cred.createdAt.toLocaleDateString()}
                        </span>
                        {cred.lastUsed && (
                          <span>Last used {cred.lastUsed.toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(cred.status)}>{cred.status}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => toggleShow(cred.id)}>
                      {showValues[cred.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(cred.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CredentialsPage;
