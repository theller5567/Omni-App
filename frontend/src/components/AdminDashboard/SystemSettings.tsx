import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Switch,
  FormControl,
  FormControlLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  IconButton,
  Divider,
  CircularProgress,
  Tooltip,
  Alert,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputLabel,
  Checkbox,
  ListItemText,
  Tab,
  Tabs
} from '@mui/material';
import { FaPlus, FaTrash, FaEdit, FaSave, FaEnvelope, FaClock } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { 
  useNotificationSettings,
  useUpdateNotificationSettings,
  useAddNotificationRule,
  useUpdateNotificationRule,
  useDeleteNotificationRule,
  useEligibleRecipients,
  useSendTestNotification
} from '../../hooks/query-hooks';
import './systemSettings.scss';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`system-settings-tabpanel-${index}`}
      aria-labelledby={`system-settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  // Get current user role from Redux
  const userRole = useSelector((state: RootState) => state.user.currentUser?.role);
  const isAuthorized = userRole === 'superAdmin';
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  if (!isAuthorized) {
    return (
      <Paper elevation={2} className="dashboard-card">
        <Alert severity="warning">
          <Typography variant="h6">Access Restricted</Typography>
          <Typography>You need superAdmin privileges to view System Settings.</Typography>
        </Alert>
      </Paper>
    );
  }
  
  return (
    <Paper elevation={2} className="system-settings-container">
      <Typography variant="h6" gutterBottom>System Settings</Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="system settings tabs"
        >
          <Tab label="Email Notifications" id="system-settings-tab-0" />
          <Tab label="General Settings" id="system-settings-tab-1" disabled />
        </Tabs>
      </Box>
      
      <TabPanel value={activeTab} index={0}>
        <NotificationSettings />
      </TabPanel>
      
      <TabPanel value={activeTab} index={1}>
        <Typography>General System Settings (Coming soon)</Typography>
      </TabPanel>
    </Paper>
  );
};

const NotificationSettings: React.FC = () => {
  // Query hooks for data fetching
  const { data: settings, isLoading, isError, error } = useNotificationSettings();
  const { 
    data: eligibleRecipients = [], 
    isLoading: isLoadingRecipients,
    isError: isRecipientsError,
    error: recipientsError,
    refetch: refetchRecipients
  } = useEligibleRecipients();
  const { mutateAsync: updateSettings } = useUpdateNotificationSettings();
  const { mutateAsync: addRule } = useAddNotificationRule();
  const { mutateAsync: updateRule } = useUpdateNotificationRule();
  const { mutateAsync: deleteRule } = useDeleteNotificationRule();
  const { mutateAsync: sendTestNotification, isPending: isSendingTest } = useSendTestNotification();
  
  // Local state for form
  const [isEnabled, setIsEnabled] = useState(false);
  const [frequency, setFrequency] = useState('immediate');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    enabled: true,
    actionTypes: ['ALL'],
    resourceTypes: ['ALL'],
    triggerRoles: ['ALL'],
    priority: 'normal',
    includeDetails: true
  });
  
  // Initialize form state from fetched data
  React.useEffect(() => {
    if (settings) {
      setIsEnabled(settings.enabled);
      setFrequency(settings.frequency);
      setRecipients(settings.recipients.map((r: any) => r._id));
      setScheduledTime(settings.scheduledTime);
    }
  }, [settings]);
  
  // Handle form submission
  const handleSaveSettings = async () => {
    const updatedSettings = {
      enabled: isEnabled,
      frequency,
      recipients,
      scheduledTime
    };
    
    await updateSettings(updatedSettings);
  };
  
  // Handle rule dialog
  const openAddRuleDialog = () => {
    setRuleForm({
      name: '',
      enabled: true,
      actionTypes: ['ALL'],
      resourceTypes: ['ALL'],
      triggerRoles: ['ALL'],
      priority: 'normal',
      includeDetails: true
    });
    setEditingRuleId(null);
    setShowRuleDialog(true);
  };
  
  const openEditRuleDialog = (rule: any) => {
    setRuleForm({
      name: rule.name,
      enabled: rule.enabled,
      actionTypes: rule.actionTypes,
      resourceTypes: rule.resourceTypes,
      triggerRoles: rule.triggerRoles,
      priority: rule.priority || 'normal',
      includeDetails: rule.includeDetails !== undefined ? rule.includeDetails : true
    });
    setEditingRuleId(rule._id);
    setShowRuleDialog(true);
  };
  
  const closeRuleDialog = () => {
    setShowRuleDialog(false);
  };
  
  const handleSaveRule = async () => {
    if (editingRuleId) {
      await updateRule({ ruleId: editingRuleId, updates: ruleForm });
    } else {
      await addRule(ruleForm);
    }
    closeRuleDialog();
  };
  
  const handleDeleteRule = async (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      await deleteRule(ruleId);
    }
  };
  
  const handleTestNotification = async () => {
    await sendTestNotification(recipients);
  };
  
  if (isLoading || isLoadingRecipients) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (isError) {
    return (
      <Alert severity="error">
        <Typography variant="h6">Error loading notification settings</Typography>
        <Typography>{error instanceof Error ? error.message : 'An unknown error occurred'}</Typography>
      </Alert>
    );
  }
  
  const actionTypeOptions = ['ALL', 'UPLOAD', 'DELETE', 'EDIT', 'CREATE', 'VIEW'];
  const resourceTypeOptions = ['ALL', 'media', 'mediaType', 'user', 'system', 'tag', 'tagCategory'];
  const roleOptions = ['ALL', 'user', 'admin', 'superAdmin'];
  const priorityOptions = ['low', 'normal', 'high'];
  
  return (
    <div className="notification-settings">
      {/* Global notification settings */}
      <div className="notification-settings-header">
        <div className="notification-settings-title">
          <Typography variant="h6">Email Notification Settings</Typography>
          <Typography variant="body2" color="textSecondary">
            Configure when and how email notifications are sent for system activities.
          </Typography>
        </div>
        <div className="notification-settings-actions">
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<FaSave />}
            onClick={handleSaveSettings}
          >
            Save Settings
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<FaEnvelope />}
            onClick={handleTestNotification}
            disabled={isSendingTest || !isEnabled || recipients.length === 0}
          >
            {isSendingTest ? 'Sending...' : 'Send Test Email'}
          </Button>
        </div>
      </div>
      
      <Divider sx={{ my: 2 }} />
      
      <div className="notification-settings-grid">
        {/* Enable/disable notifications */}
        <div className="notification-settings-section">
          <FormControlLabel
            control={
              <Switch
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                color="primary"
              />
            }
            label="Enable Email Notifications"
          />
          <Typography variant="body2" color="textSecondary">
            When enabled, activity notifications will be sent according to your settings.
          </Typography>
        </div>
        
        {/* Notification frequency */}
        <div className="notification-settings-section">
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="frequency-label">Notification Frequency</InputLabel>
            <Select
              labelId="frequency-label"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              disabled={!isEnabled}
              label="Notification Frequency"
            >
              <MenuItem value="immediate">Immediate (send as events occur)</MenuItem>
              <MenuItem value="hourly">Hourly Digest</MenuItem>
              <MenuItem value="daily">Daily Digest</MenuItem>
              <MenuItem value="weekly">Weekly Digest</MenuItem>
            </Select>
          </FormControl>
          
          {frequency !== 'immediate' && (
            <div className="scheduled-time">
              <Typography variant="body2" sx={{ mb: 1 }}>Scheduled Time (24h format):</Typography>
              <TextField
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                sx={{ width: '120px' }}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 300, // 5 min
                }}
                disabled={!isEnabled}
              />
            </div>
          )}
        </div>
        
        {/* Recipients */}
        <div className="notification-settings-section recipients-section">
          <FormControl fullWidth>
            <InputLabel id="recipients-label">Recipients</InputLabel>
            <Select
              labelId="recipients-label"
              multiple
              value={recipients}
              onChange={(e) => setRecipients(e.target.value as string[])}
              disabled={!isEnabled}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const recipient = eligibleRecipients?.find((r) => r._id === value);
                    return (
                      <Chip 
                        key={value} 
                        label={recipient ? (recipient.username || recipient.email) : value} 
                        size="small" 
                      />
                    );
                  })}
                </Box>
              )}
            >
              {isLoadingRecipients && (
                <MenuItem disabled>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2">Loading recipients...</Typography>
                  </Box>
                </MenuItem>
              )}
              
              {isRecipientsError && (
                <MenuItem disabled>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                    <Typography variant="body2">
                      Error loading recipients: {recipientsError instanceof Error ? recipientsError.message : 'Unknown error'}
                    </Typography>
                  </Box>
                </MenuItem>
              )}
              
              {!isLoadingRecipients && !isRecipientsError && eligibleRecipients.length === 0 && (
                <MenuItem disabled>
                  <Typography variant="body2">No admin users found. Please ensure there are admin users in the system.</Typography>
                </MenuItem>
              )}
              
              {eligibleRecipients?.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  <Checkbox checked={recipients.indexOf(user._id) > -1} />
                  <ListItemText 
                    primary={user.username || user.email} 
                    secondary={`${user.firstName || ''} ${user.lastName || ''} (${user.role})`} 
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              Select which administrators will receive notification emails.
            </Typography>
            
            <Button 
              size="small" 
              variant="outlined" 
              onClick={() => refetchRecipients()}
              disabled={isLoadingRecipients}
              startIcon={isLoadingRecipients ? <CircularProgress size={16} /> : null}
            >
              Refresh Recipients
            </Button>
          </Box>
        </div>
      </div>
      
      <Divider sx={{ my: 3 }} />
      
      {/* Notification rules */}
      <div className="notification-rules-section">
        <div className="notification-rules-header">
          <Typography variant="h6">Notification Rules</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FaPlus />}
            onClick={openAddRuleDialog}
            disabled={!isEnabled}
          >
            Add Rule
          </Button>
        </div>
        
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Define rules to determine which activities should trigger notifications.
        </Typography>
        
        {settings?.rules?.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>
            No notification rules defined. Add a rule to start receiving notifications.
          </Alert>
        ) : (
          <div className="rules-container">
            {settings?.rules?.map((rule: any) => (
              <Paper key={rule._id} className="rule-card" variant="outlined">
                <div className="rule-header">
                  <div className="rule-name">
                    <Typography variant="subtitle1">
                      {rule.name}
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={rule.enabled}
                          onChange={async (e) => {
                            await updateRule({
                              ruleId: rule._id,
                              updates: { ...rule, enabled: e.target.checked }
                            });
                          }}
                        />
                      }
                      label={rule.enabled ? "Enabled" : "Disabled"}
                    />
                  </div>
                  <div className="rule-actions">
                    <Tooltip title="Edit Rule">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => openEditRuleDialog(rule)}
                      >
                        <FaEdit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Rule">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteRule(rule._id)}
                      >
                        <FaTrash />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
                
                <Divider sx={{ my: 1 }} />
                
                <div className="rule-content">
                  <div className="rule-section">
                    <Typography variant="body2" color="textSecondary">Action Types:</Typography>
                    <div className="rule-chips">
                      {rule.actionTypes.map((action: string) => (
                        <Chip 
                          key={action} 
                          label={action} 
                          size="small" 
                          color={action === 'ALL' ? 'primary' : 'default'} 
                          variant="outlined"
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="rule-section">
                    <Typography variant="body2" color="textSecondary">Resource Types:</Typography>
                    <div className="rule-chips">
                      {rule.resourceTypes.map((resource: string) => (
                        <Chip 
                          key={resource} 
                          label={resource} 
                          size="small" 
                          color={resource === 'ALL' ? 'primary' : 'default'} 
                          variant="outlined"
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="rule-section">
                    <Typography variant="body2" color="textSecondary">Triggered By:</Typography>
                    <div className="rule-chips">
                      {rule.triggerRoles.map((role: string) => (
                        <Chip 
                          key={role} 
                          label={role} 
                          size="small" 
                          color={role === 'ALL' ? 'primary' : 'default'} 
                          variant="outlined"
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="rule-section">
                    <Typography variant="body2" color="textSecondary">Priority:</Typography>
                    <Chip 
                      label={rule.priority || 'normal'} 
                      size="small" 
                      color={
                        rule.priority === 'high' ? 'error' : 
                        rule.priority === 'low' ? 'default' : 'primary'
                      } 
                      variant="outlined"
                    />
                  </div>
                </div>
              </Paper>
            ))}
          </div>
        )}
      </div>
      
      {/* Rule dialog */}
      <Dialog 
        open={showRuleDialog} 
        onClose={closeRuleDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editingRuleId ? 'Edit Notification Rule' : 'Add Notification Rule'}
        </DialogTitle>
        <DialogContent>
          <div className="rule-form">
            <div className="rule-form-grid">
              <TextField
                label="Rule Name"
                value={ruleForm.name}
                onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                fullWidth
                required
                sx={{ gridArea: 'name' }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={ruleForm.enabled}
                    onChange={(e) => setRuleForm({ ...ruleForm, enabled: e.target.checked })}
                  />
                }
                label="Enabled"
                sx={{ gridArea: 'enabled' }}
              />
              
              <FormControl fullWidth sx={{ gridArea: 'actions' }}>
                <InputLabel>Action Types</InputLabel>
                <Select
                  multiple
                  value={ruleForm.actionTypes}
                  onChange={(e) => setRuleForm({ ...ruleForm, actionTypes: e.target.value as string[] })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {actionTypeOptions.map((action) => (
                    <MenuItem key={action} value={action}>
                      <Checkbox checked={ruleForm.actionTypes.indexOf(action) > -1} />
                      <ListItemText primary={action} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ gridArea: 'resources' }}>
                <InputLabel>Resource Types</InputLabel>
                <Select
                  multiple
                  value={ruleForm.resourceTypes}
                  onChange={(e) => setRuleForm({ ...ruleForm, resourceTypes: e.target.value as string[] })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {resourceTypeOptions.map((resource) => (
                    <MenuItem key={resource} value={resource}>
                      <Checkbox checked={ruleForm.resourceTypes.indexOf(resource) > -1} />
                      <ListItemText primary={resource} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ gridArea: 'roles' }}>
                <InputLabel>Trigger Roles</InputLabel>
                <Select
                  multiple
                  value={ruleForm.triggerRoles}
                  onChange={(e) => setRuleForm({ ...ruleForm, triggerRoles: e.target.value as string[] })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {roleOptions.map((role) => (
                    <MenuItem key={role} value={role}>
                      <Checkbox checked={ruleForm.triggerRoles.indexOf(role) > -1} />
                      <ListItemText primary={role} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ gridArea: 'priority' }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={ruleForm.priority}
                  onChange={(e) => setRuleForm({ ...ruleForm, priority: e.target.value })}
                >
                  {priorityOptions.map((priority) => (
                    <MenuItem key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={ruleForm.includeDetails}
                    onChange={(e) => setRuleForm({ ...ruleForm, includeDetails: e.target.checked })}
                  />
                }
                label="Include Details in Notification"
                sx={{ gridArea: 'details' }}
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRuleDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveRule} 
            variant="contained" 
            color="primary"
            disabled={!ruleForm.name}
          >
            {editingRuleId ? 'Update Rule' : 'Add Rule'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SystemSettings; 