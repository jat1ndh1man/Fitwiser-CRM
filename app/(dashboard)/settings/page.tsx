'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, RefreshCw, Download, AlertTriangle } from 'lucide-react';
import { useLeadSync, useFetchForms } from '@/hooks/useLeadSync';
import { SyncResult, FacebookForm } from '@/types/facebook';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface PageWithForms {
  pageId: string;
  pageName: string;
  forms: FacebookForm[];
}

interface LeadSyncManagerProps {
  userId: string;
}

const LeadSyncManager: React.FC<LeadSyncManagerProps> = ({ userId }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  
  // Use the custom hooks
  const { 
    syncLeads, 
    loading: syncLoading, 
    error: syncError, 
    lastResult,
    clearError: clearSyncError 
  } = useLeadSync();
  
  const { 
    fetchForms, 
    loading: formsLoading, 
    error: formsError, 
    forms 
  } = useFetchForms();

  // Fetch available forms on component mount
  useEffect(() => {
    if (userId) {
      fetchForms(userId).catch(console.error);
    }
  }, [userId, fetchForms]);

  // Update sync status based on loading and error states
  useEffect(() => {
    if (syncLoading) {
      setSyncStatus('syncing');
    } else if (syncError) {
      setSyncStatus('error');
    } else if (lastResult) {
      setSyncStatus('success');
    } else {
      setSyncStatus('idle');
    }
  }, [syncLoading, syncError, lastResult]);

  const performSync = async (): Promise<void> => {
    try {
      clearSyncError();
      const result = await syncLeads(userId);
      setLastSync(new Date());
      console.log('Sync completed:', result);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const refreshForms = async (): Promise<void> => {
    try {
      await fetchForms(userId);
    } catch (error) {
      console.error('Failed to refresh forms:', error);
    }
  };

  const getStatusIcon = (): JSX.Element => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: SyncStatus): JSX.Element => {
    const variants: Record<SyncStatus, string> = {
      'syncing': 'bg-blue-100 text-blue-800',
      'success': 'bg-green-100 text-green-800',
      'error': 'bg-red-100 text-red-800',
      'idle': 'bg-gray-100 text-gray-800'
    };

    const labels: Record<SyncStatus, string> = {
      'syncing': 'Syncing...',
      'success': 'Success',
      'error': 'Error',
      'idle': 'Idle'
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getStatusText = (status: SyncStatus): string => {
    switch (status) {
      case 'idle':
        return 'Ready to sync';
      case 'syncing':
        return 'Syncing leads...';
      case 'success':
        return 'Last sync successful';
      case 'error':
        return 'Last sync failed';
      default:
        return 'Unknown status';
    }
  };

  const currentError = syncError || formsError;

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {currentError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Error:</span>
              <span>{currentError}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Control Panel */}
      <Card className='shadow-xl'> 
        <CardHeader>
          <CardTitle className="flex items-center gap-2  text-emerald-700">
            <Download className="h-5 w-5" />
            Facebook Lead Sync
          </CardTitle>
          <CardDescription>
            Sync leads from your Facebook forms to your CRM
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm text-gray-600">
                {getStatusText(syncStatus)}
              </span>
              {getStatusBadge(syncStatus)}
            </div>
            <Button 
              onClick={performSync} 
              disabled={syncLoading || syncStatus === 'syncing'}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              <RefreshCw className={`h-4 w-4 hover:animate-spin ${syncLoading ? 'animate-spin' : ''}`} />
              {syncLoading ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>

          {lastSync && (
            <div className="text-sm text-gray-500">
              Last sync: {lastSync.toLocaleString()}
            </div>
          )}

          {lastResult && lastResult.summary && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Sync Results:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Forms processed:</span>
                  <span className="ml-2 font-semibold">{lastResult.summary.totalFormsProcessed}</span>
                </div>
                <div>
                  <span className="text-gray-600">Leads inserted:</span>
                  <span className="ml-2 font-semibold text-green-600">{lastResult.summary.leadsInserted}</span>
                </div>
                <div>
                  <span className="text-gray-600">Leads processed:</span>
                  <span className="ml-2 font-semibold">{lastResult.summary.totalLeadsProcessed}</span>
                </div>
                <div>
                  <span className="text-gray-600">Leads skipped:</span>
                  <span className="ml-2 font-semibold text-orange-600">{lastResult.summary.leadsSkipped}</span>
                </div>
              </div>

              {lastResult.skippedLeads && lastResult.skippedLeads.length > 0 && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
                  <h5 className="font-semibold text-sm text-orange-800 mb-2">
                    Skipped Leads ({lastResult.skippedLeads.length}):
                  </h5>
                  <div className="space-y-1 text-xs">
                    {lastResult.skippedLeads.slice(0, 3).map((skipped, index) => (
                      <div key={index} className="text-orange-700">
                        • {skipped.reason} {skipped.email ? `(${skipped.email})` : ''}
                      </div>
                    ))}
                    {lastResult.skippedLeads.length > 3 && (
                      <div className="text-orange-600 italic">
                        ... and {lastResult.skippedLeads.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Forms */}
      <Card className='shadow-xl'>
        <CardHeader>
          <div className="flex items-center justify-between text-emerald-700">
            <div>
              <CardTitle>Available Facebook Forms</CardTitle>
              <CardDescription>
                Forms connected to your Facebook pages
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshForms}
              disabled={formsLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-3 w-3 ${formsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {formsLoading && forms.length === 0 ? (
            <div className="flex items-center gap-2 text-gray-500">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading forms...
            </div>
          ) : forms.length === 0 ? (
            <div className="text-gray-500">
              No forms found. Make sure your Facebook account is properly connected.
            </div>
          ) : (
            <div className="space-y-3">
              {forms.map((page: PageWithForms, pageIndex) => (
                <div key={`${page.pageId}-${pageIndex}`} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    📘 {page.pageName}
                    <Badge variant="outline" className="text-xs">
                      {page.forms?.length || 0} forms
                    </Badge>
                  </h4>
                  {page.forms && page.forms.length > 0 ? (
                    <div className="space-y-2">
                      {page.forms.map((form, formIndex) => (
                        <div 
                          key={`${form.id}-${formIndex}`} 
                          className="flex items-center justify-between bg-gray-50 p-2 rounded"
                        >
                          <span className="text-sm">{form.name}</span>
                          <Badge variant="outline" className="text-xs">
                            ID: {form.id}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No forms found for this page</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Automation Settings */}
      <Card className='shadow-xl'>
        <CardHeader>
          <CardTitle className='text-emerald-700'>Automation Settings</CardTitle>
          <CardDescription>
            Configure automatic lead syncing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm">Auto-sync Schedule</h4>
                <p className="text-sm text-gray-600">Automatically sync leads every hour</p>
              </div>
              <Badge className="bg-green-100 text-green-800">
                Active
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm">Real-time Webhooks</h4>
                <p className="text-sm text-gray-600">Receive leads instantly when submitted</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                Configured
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadSyncManager;