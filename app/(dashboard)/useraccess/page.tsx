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
  AlertCircle
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

// Static role definitions for UI
const staticRoleDefs = [
  {
    key: 'superadmin',
    name: 'Superadmin',
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
    key: 'executive',
    name: 'Executive',
    icon: Star,
    color: 'text-amber-600',
    description: 'Executive level access'
  },
  {
    key: 'manager',
    name: 'Manager',
    icon: Briefcase,
    color: 'text-blue-600',
    description: 'Management level access'
  },
  {
    key: 'client',
    name: 'Client',
    icon: User,
    color: 'text-green-600',
    description: 'Client level access'
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

    // Filter the roles to only include Superadmin, Admin, and Executive
    const filteredRoles = rolesData.filter(role => 
      ['superadmin', 'admin', 'executive'].includes(role.name.toLowerCase())
    );

    // Process roles and add UI metadata
    const processedRoles: Role[] = filteredRoles.map(role => {
      const roleKey = role.name.toLowerCase();
      const roleDef = staticRoleDefs.find(def => def.key === roleKey) || staticRoleDefs[0]; // Default to superadmin

      return {
        ...role,
        key: roleKey,
        icon: roleDef.icon,
        color: roleDef.color,
        description: roleDef.description
      };
    });

    setRoles(processedRoles);  // Set the filtered roles here

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
    const processedPermissions: PermissionWithRole[] = permissionsData.map(perm => ({
      id: perm.id,
      role_id: perm.role_id,
      route_path: perm.route_path,
      route_name: perm.route_name,
      can_access: perm.can_access,
      name: perm.user_roles?.name || 'Unknown'
    }));

    setPermissions(processedPermissions);

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
          // Give superadmin full access by default, others get limited access
          const defaultAccess = role.key === 'superadmin' ? true : 
                               role.key === 'admin' ? route.path !== '/useraccess' :
                               role.key === 'executive' ? ['/dashboard', '/leads', '/lead-information', '/clients'].includes(route.path) :
                               false;

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
  const isSuperadmin = selectedRoleData?.key === 'superadmin';

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
    if (roleKey === 'superadmin') return 'bg-indigo-100';
    if (roleKey === 'admin') return 'bg-purple-100';
    if (roleKey === 'executive') return 'bg-amber-100';
    if (roleKey === 'manager') return 'bg-blue-100';
    return 'bg-green-100';
  };

  if (loading || !selectedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-gray-600">Loading user access controls...</p>
        </div>
      </div>
    );
  }

  const RoleIcon = selectedRoleData?.icon || Users;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">User Access Control</h1>
          <p className="mt-2 text-sm text-gray-500">Manage user permissions and route access</p>
        </header>

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
                            role.key === 'executive' ? 'bg-amber-500' :
                            role.key === 'manager' ? 'bg-blue-500' : 'bg-green-500'
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
              {isSuperadmin && (
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
                            disabled={isSuperadmin}
                          />
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {isSuperadmin ? (
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
              {isSuperadmin && (
                <p className="text-amber-600 flex items-center text-sm font-medium">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Superadmin has all permissions by default
                </p>
              )}
              <div className="flex-1"></div>
              <button
                onClick={savePermissions}
                disabled={saving || isSuperadmin}
                className={`
                  flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors shadow-sm
                  ${saving || isSuperadmin
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