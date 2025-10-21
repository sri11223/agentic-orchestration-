import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useWorkflowCreation } from '@/hooks/useWorkflowCreation';
import { 
  ChevronLeft, 
  ChevronRight, 
  LayoutGrid, 
  User, 
  FolderOpen, 
  Workflow, 
  Shield, 
  FileText, 
  Database, 
  Settings, 
  LogOut,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardSidebarProps {
  className?: string;
}

export const DashboardSidebar = ({ className }: DashboardSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { createWorkflow, creating } = useWorkflowCreation();
  
  // Get user info from localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { username: 'User', email: 'user@example.com' };
  
  const handleLogout = () => {
    // Clear auth tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Navigate to login
    navigate('/login');
  };
  
  const menuItems = [
    { icon: LayoutGrid, label: 'Overview', path: '/dashboard' },
    { icon: User, label: 'Personal', path: '/personal' },
    { icon: FolderOpen, label: 'Projects', path: '/projects' },
    { icon: Workflow, label: 'Workflows', path: '/workflows' },
    { icon: Shield, label: 'Credentials', path: '/credentials' },
    { icon: FileText, label: 'Executions', path: '/executions' },
    { icon: Database, label: 'Data tables', path: '/data-tables' },
  ];
  
  const bottomItems = [
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];
  
  return (
    <div className={cn(
      "flex flex-col h-full bg-card border-r border-border transition-all duration-300 shadow-sm",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">WB</span>
            </div>
            <span className="font-semibold text-foreground">Workflow Builder</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* Create Workflow Button */}
      <div className="p-4">
        <Button 
          onClick={createWorkflow}
          disabled={creating}
          className="w-full justify-start"
          size={isCollapsed ? "sm" : "default"}
        >
          <Plus className="h-4 w-4" />
          {!isCollapsed && (
            <span className="ml-2">
              {creating ? 'Creating...' : 'Create Workflow'}
            </span>
          )}
        </Button>
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 px-2 py-2 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Button
              key={item.path}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start h-10",
                isCollapsed && "justify-center"
              )}
              onClick={() => navigate(item.path)}
            >
              <item.icon className="h-4 w-4" />
              {!isCollapsed && <span className="ml-3">{item.label}</span>}
            </Button>
          );
        })}
      </nav>
      
      {/* Bottom Section */}
      <div className="border-t border-border">
        {/* Bottom Menu Items */}
        <div className="px-2 py-2 space-y-1">
          {bottomItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              className={cn(
                "w-full justify-start h-10",
                isCollapsed && "justify-center"
              )}
              onClick={() => navigate(item.path)}
            >
              <item.icon className="h-4 w-4" />
              {!isCollapsed && <span className="ml-3">{item.label}</span>}
            </Button>
          ))}
        </div>
        
        {/* User Profile Section */}
        <div className="p-4 border-t border-border">
          {isCollapsed ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-10 p-0"
              onClick={handleLogout}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user.username?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.username?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.username || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email || 'user@example.com'}
                  </p>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start h-8 text-xs"
                onClick={handleLogout}
              >
                <LogOut className="h-3 w-3 mr-2" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};