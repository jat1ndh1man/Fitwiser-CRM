'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

import {
  Shield,
  Users,
  Settings,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Eye,
  Plus,
  Trash2,
  Crown,
  User,
  Briefcase,
  Star,
  BarChart3,
  FileEdit,
  Loader2,
  AlertCircle,
  Heart,
  MessageCircle,
  TrendingUp,
  Headphones,
  Trophy
} from 'lucide-react';

// Types
interface Role {
  id: string;
  name: string;
  key?: string;
  icon?: any;
  color?: string;
  description?: string;
}

interface Permission {
  id: string;
  role_id: string;
  route_path: string;
  route_name: string;
  can_access: boolean;
}

interface PermissionWithRole extends Permission {
  name: string;
}

// Updated static role definitions for UI with all required roles
const staticRoleDefs = [
  {
    key: 'superadmin',
    name: 'Super Admin',
    icon: Crown,
    color: 'text-indigo-600',
    description: 'Full access to all system features'
  },
  {
    key: 'admin',
    name: 'Admin',
    icon: Shield,
    color: 'text-purple-600',
    description: 'Administrative access to the system'
  },
  {
    key: 'sales_manager',
    name: 'Sales Manager',
    icon: Briefcase,
    color: 'text-blue-600',
    description: 'Access to all sales team member\'s data'
  },
  {
    key: 'wellness_manager',
    name: 'Wellness Manager',
    icon: Heart,
    color: 'text-pink-600',
    description: 'Access to all wellness team member\'s data'
  },
  {
    key: 'relationship_manager',
    name: 'Relationship Manager',
    icon: Users,
    color: 'text-teal-600',
    description: 'Access to all relationship team member\'s data'
  },
  {
    key: 'counselor',
    name: 'Counselor',
    icon: MessageCircle,
    color: 'text-orange-600',
    description: 'Minimum and specific data access for counseling'
  },
  {
    key: 'bde',
    name: 'BDE',
    icon: TrendingUp,
    color: 'text-cyan-600',
    description: 'Minimum and specific data access for business development'
  },
  {
    key: 'customer_support',
    name: 'Customer Support',
    icon: Headphones,
    color: 'text-yellow-600',
    description: 'Minimum and specific data access for customer support'
  },
  {
    key: 'coach',
    name: 'Coach',
    icon: Trophy,
    color: 'text-green-600',
    description: 'Minimum and specific data access for coaching'
  }
];

// Route definitions based on the original code
const routes = [
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/analytics', name: 'Analytics' },
  { path: '/reports', name: 'Reports' },
  { path: '/clients', name: 'Clients' },
  { path: '/leads', name: 'Leads' },
  { path: '/lead-information', name: 'Leads Information' },
  { path: '/lead-assignment', name: 'Lead Assignment' },
  { path: '/executives', name: 'Executive Information' },
  { path: '/ttyd', name: 'Talk to your data' },
  { path: '/useraccess', name: 'User Access' },
  { path: '/settings', name: 'Settings' }
];

export default function UserAccessControl() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<PermissionWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [roleUsers, setRoleUsers] = useState<{[key: string]: number}>({});
  const initialLoad = useRef(true);

  // Fetch data from Supabase
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch roles from user_roles table
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('name');

      if (rolesError) throw rolesError;

      // Map database role names to our expected format
      const roleNameMap: Record<string, string> = {
        'Superadmin': 'Super Admin',
        'Admin': 'Admin',
        'Sales Manager': 'Sales Manager',
        'Wellness Manager': 'Wellness Manager',
        'Relationship Manager': 'Relationship Manager',
        'Counselor': 'Counselor',
        'BDE': 'BDE',
        'Customer Support': 'Customer Support',
        'Coach': 'Coach'
      };

      // Filter and map roles from database to our expected format
      const processedRoles: Role[] = [];
      
      for (const dbRole of rolesData) {
        const mappedName = roleNameMap[dbRole.name];
        if (mappedName) {
          // Convert to key format (lowercase, underscores)
          const roleKey = mappedName.toLowerCase().replace(/\s+/g, '_');
          const roleDef = staticRoleDefs.find(def => def.key === roleKey) || {
            icon: Users,
            color: 'text-gray-600',
            description: 'Role with specific permissions'
          };

          processedRoles.push({
            ...dbRole,
            name: mappedName, // Use mapped name for display
            key: roleKey,
            icon: roleDef.icon,
            color: roleDef.color,
            description: roleDef.description
          });
        }
      }

      setRoles(processedRoles);

      // Count users per role
      const userCounts: {[key: string]: number} = {};
      for (const role of processedRoles) {
        const { count, error } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('role_id', role.id);

        if (!error) {
          userCounts[role.id] = count || 0;
        }
      }
      setRoleUsers(userCounts);

      // Fetch existing permissions from permissions_crm table
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions_crm')
        .select(`
          *,
          user_roles!role_id(name)
        `);

      if (permissionsError) throw permissionsError;

      // Process permissions data
      const processedPermissions: PermissionWithRole[] = [];
      
      // First, get all existing permissions
      for (const perm of permissionsData) {
        const roleName = perm.user_roles?.name;
        if (roleName && roleNameMap[roleName]) {
          processedPermissions.push({
            id: perm.id,
            role_id: perm.role_id,
            route_path: perm.route_path,
            route_name: perm.route_name,
            can_access: perm.can_access,
            name: roleNameMap[roleName] // Use mapped name
          });
        }
      }

      setPermissions(processedPermissions);

      // Check if we need to create default permissions for any roles
      const rolesNeedingPermissions = processedRoles.filter(role => {
        // Check if this role has any permissions in the current list
        return !processedPermissions.some(perm => perm.role_id === role.id);
      });

      if (rolesNeedingPermissions.length > 0) {
        await createDefaultPermissions(rolesNeedingPermissions);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setNotification({ type: 'error', message: 'Failed to load data from database' });
    } finally {
      setLoading(false);
    }
  };

  // Create default permissions for all roles and routes
  const createDefaultPermissions = async (rolesList: Role[]) => {
    try {
      const defaultPermissions = [];
      
      for (const role of rolesList) {
        for (const route of routes) {
          // Default access rules
          let defaultAccess = false;
          const roleKey = role.key || '';
          
          if (roleKey === 'superadmin') {
            // Super Admin gets all access
            defaultAccess = true;
          } else if (roleKey === 'admin') {
            // Admin gets most access except useraccess
            defaultAccess = route.path !== '/useraccess';
          } else if (['sales_manager', 'wellness_manager', 'relationship_manager'].includes(roleKey)) {
            // Managers get access to their respective sections
            const managerRoutes = [
              '/dashboard',
              '/analytics',
              '/reports',
              '/clients',
              '/leads',
              '/lead-information',
              '/lead-assignment',
              '/executives'
            ];
            defaultAccess = managerRoutes.includes(route.path);
          } else if (['counselor', 'bde', 'customer_support', 'coach'].includes(roleKey)) {
            // Minimum access for counselors, BDEs, customer support, coaches
            const minimumAccessRoutes = [
              '/dashboard',
              '/clients',
              '/leads',
              '/lead-information'
            ];
            defaultAccess = minimumAccessRoutes.includes(route.path);
          }

          defaultPermissions.push({
            role_id: role.id,
            route_path: route.path,
            route_name: route.name,
            can_access: defaultAccess
          });
        }
      }

      const { error } = await supabase
        .from('permissions_crm')
        .insert(defaultPermissions);

      if (error) throw error;

      // Re-fetch data after creating defaults
      await fetchData();
    } catch (error) {
      console.error('Error creating default permissions:', error);
      setNotification({ type: 'error', message: 'Failed to create default permissions' });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (initialLoad.current && roles.length) {
      setSelectedRole(roles[0].id);
      initialLoad.current = false;
    }
  }, [roles]);

  const handlePermissionChange = (permissionId: string, value: boolean) => {
    setPermissions(prev => prev.map(perm => 
      perm.id === permissionId 
        ? { ...perm, can_access: value }
        : perm
    ));
  };

  const savePermissions = async () => {
    setSaving(true);
    setNotification(null);
    try {
      // Get permissions for the selected role
      const rolePermissions = permissions.filter(p => p.role_id === selectedRole);
      
      // Update permissions in the database
      const updates = rolePermissions.map(perm => ({
        id: perm.id,
        role_id: perm.role_id,
        route_path: perm.route_path,
        route_name: perm.route_name,
        can_access: perm.can_access
      }));

      const { error } = await supabase
        .from('permissions_crm')
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;

      setNotification({ type: 'success', message: 'Permissions saved successfully!' });
    } catch (error) {
      console.error('Error saving permissions:', error);
      setNotification({ type: 'error', message: 'Failed to save permissions. Please try again.' });
    } finally {
      setSaving(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const filteredPermissions = permissions.filter(perm => {
    const matchesRole = perm.role_id === selectedRole;
    const matchesSearch = perm.route_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         perm.route_path.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const selectedRoleData = roles.find(role => role.id === selectedRole);
  const isSuperAdmin = selectedRoleData?.key === 'superadmin';

  const getRoleStats = (roleId: string) => {
    const rolePermissions = permissions.filter(p => p.role_id === roleId);
    const allowedCount = rolePermissions.filter(p => p.can_access).length;
    const totalCount = rolePermissions.length;
    return { allowed: allowedCount, total: totalCount };
  };

  const PermissionToggle = ({ 
    checked, 
    onChange, 
    disabled = false 
  }: { 
    checked: boolean; 
    onChange: (value: boolean) => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${checked 
          ? 'bg-emerald-600' 
          : 'bg-gray-200'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );

  const bgFor = (roleKey: string) => {
    const bgMap: Record<string, string> = {
      'superadmin': 'bg-indigo-100',
      'admin': 'bg-purple-100',
      'sales_manager': 'bg-blue-100',
      'wellness_manager': 'bg-pink-100',
      'relationship_manager': 'bg-teal-100',
      'counselor': 'bg-orange-100',
      'bde': 'bg-cyan-100',
      'customer_support': 'bg-yellow-100',
      'coach': 'bg-green-100'
    };
    return bgMap[roleKey || ''] || 'bg-gray-100';
  };

  if (loading || !selectedRole) {
    return (
      <div className="min-h-screen flex mt-20 justify-center ">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-emerald-600">Loading user access controls...</p>
        </div>
      </div>
    );
  }

  const RoleIcon = selectedRoleData?.icon || Users;

  return (
    <div className="min-h-screen">
      <div className="max-w-8xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
  
        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg flex items-center shadow-md ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {notification.type === 'success'
              ? <CheckCircle className="h-5 w-5 mr-3 text-green-500"/>
              : <AlertCircle className="h-5 w-5 mr-3 text-red-500"/>}
            <span className="font-medium">{notification.message}</span>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-xl overflow-hidden flex flex-col md:flex-row border-2 border-gray-100 shadow-xl">
          {/* Left Sidebar - Role Tabs */}
          <div className="md:w-1/3 border-r border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Users className="h-5 w-5 text-emerald-600" />
                <span>User Roles</span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">Select a role to manage permissions</p>
            </div>

            {/* Role Navigation */}
            <nav className="p-4 space-y-2">
              {roles.map((role) => {
                const stats = getRoleStats(role.id);
                const percentage = stats.total > 0 ? Math.round((stats.allowed / stats.total) * 100) : 0;
                const isActive = selectedRole === role.id;
                const RoleIcon = role.icon || Users;
                
                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`
                      w-full text-left p-4 rounded-xl border transition-all duration-200
                      ${isActive
                        ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          isActive ? bgFor(role.key || '') : 'bg-gray-50'
                        }`}>
                          <RoleIcon className={`h-4 w-4 ${role.color}`} />
                        </div>
                        <span className={`
                          font-medium
                          ${isActive ? 'text-emerald-900' : 'text-gray-900'}
                        `}>
                          {role.name}
                        </span>
                      </div>
                      {isActive && (
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className={isActive ? 'text-emerald-700' : 'text-gray-600'}>
                          Routes Accessible
                        </span>
                        <span className={`font-medium ${isActive ? 'text-emerald-900' : 'text-gray-900'}`}>
                          {stats.allowed}/{stats.total}
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            role.key === 'superadmin' ? 'bg-indigo-500' :
                            role.key === 'admin' ? 'bg-purple-500' :
                            role.key === 'sales_manager' ? 'bg-blue-500' :
                            role.key === 'wellness_manager' ? 'bg-pink-500' :
                            role.key === 'relationship_manager' ? 'bg-teal-500' :
                            role.key === 'counselor' ? 'bg-orange-500' :
                            role.key === 'bde' ? 'bg-cyan-500' :
                            role.key === 'customer_support' ? 'bg-yellow-500' :
                            role.key === 'coach' ? 'bg-green-500' :
                            'bg-gray-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-xs">
                        <span className={isActive ? 'text-emerald-600' : 'text-gray-500'}>
                          {roleUsers[role.id] || 0} user{(roleUsers[role.id] || 0) !== 1 ? 's' : ''}
                        </span>
                        <span className={isActive ? 'text-emerald-600' : 'text-gray-500'}>
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Content Area */}
          <main className="flex-1 p-6 bg-gradient-to-r from-white to-emerald-50">
            {/* Active Role Header */}
            <div className="flex items-center mb-8 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${bgFor(selectedRoleData?.key || '')}`}>
                <RoleIcon className={`h-7 w-7 ${selectedRoleData?.color}`} />
              </div>
              <div className="ml-4 flex-1">
                <h2 className="text-2xl font-bold text-gray-800">{selectedRoleData?.name}</h2>
                <p className="text-sm text-gray-500">{selectedRoleData?.description}</p>
                <span className="text-sm text-gray-500">
                  ({getRoleStats(selectedRole).allowed} of {getRoleStats(selectedRole).total} routes accessible)
                </span>
              </div>
              {isSuperAdmin && (
                <div className="flex items-center space-x-2 text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">Full Access</span>
                </div>
              )}
            </div>

            {/* Search */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by route name or path..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Permissions Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Route Information
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Access Control
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPermissions.map((permission) => (
                      <tr key={permission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Settings className="h-4 w-4 text-gray-500" />
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {permission.route_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {permission.route_path}
                              </p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <PermissionToggle
                            checked={permission.can_access}
                            onChange={(value) => handlePermissionChange(permission.id, value)}
                            disabled={isSuperAdmin}
                          />
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {isSuperAdmin ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              <Shield className="h-3 w-3 mr-1" />
                              Always Allowed
                            </span>
                          ) : (
                            <span className={`
                              inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${permission.can_access 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                              }
                            `}>
                              {permission.can_access ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Allowed
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Denied
                                </>
                              )}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredPermissions.length === 0 && (
                <div className="text-center py-12">
                  <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No routes found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm 
                      ? `No routes match "${searchTerm}" for ${selectedRoleData?.name}`
                      : `No routes configured for ${selectedRoleData?.name}`
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              {isSuperAdmin && (
                <p className="text-amber-600 flex items-center text-sm font-medium">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Super Admin has all permissions by default
                </p>
              )}
              <div className="flex-1"></div>
              <button
                onClick={savePermissions}
                disabled={saving || isSuperAdmin}
                className={`
                  flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors shadow-sm
                  ${saving || isSuperAdmin
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }
                `}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}