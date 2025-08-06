import React, { useState, useEffect } from 'react';
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
  Tabs,
  OutlinedInput,
} from '@mui/material';
import { FaPlus, FaTrash, FaEdit, FaSave, FaEnvelope } from 'react-icons/fa';
import { 
  useNotificationSettings,
  useUpdateNotificationSettings,
  useAddNotificationRule,
  useUpdateNotificationRule,
  useDeleteNotificationRule,
  useEligibleRecipients,
  useSendTestNotification,
  useUserProfile,
  User,
  NotificationRule,
  NotificationSettingsData
} from '../../hooks/query-hooks';
import './systemSettings.scss';
import { SelectChangeEvent } from '@mui/material/Select';
// import AddIcon from '@mui/icons-material/Add';
// import EditIcon from '@mui/icons-material/Edit';
// import DeleteIcon from '@mui/icons-material/Delete';

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

interface NotificationSettingsProps {
  userProfile: User | null | undefined; // Use the actual User type if available
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ userProfile }) => {
  const { data: settingsData, isLoading, isError, error } = useNotificationSettings(userProfile);
  const updateSettingsMutation = useUpdateNotificationSettings(userProfile);
  const addRuleMutation = useAddNotificationRule(userProfile);
  const updateRuleMutation = useUpdateNotificationRule(userProfile);
  const deleteRuleMutation = useDeleteNotificationRule(userProfile);
  const { data: eligibleRecipients = [], isLoading: isLoadingRecipients } = useEligibleRecipients(userProfile);
  const sendTestNotificationMutation = useSendTestNotification(userProfile);

  // State for form fields
  const [formState, setFormState] = useState<Omit<NotificationSettingsData, 'rules' | 'recipients'> & { recipients: Array<{ _id: string; username?: string; email?: string }> }> ({
    enabled: false,
    frequency: 'daily',
    scheduledTime: '09:00',
    recipients: [], // Initialize recipients as an empty array of objects
  });

  // States for rule dialog
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [currentRule, setCurrentRule] = useState<NotificationRule | null>(null);
  const [ruleForm, setRuleForm] = useState<Partial<NotificationRule>>({});

  useEffect(() => {
    if (settingsData) {
      setFormState({
        enabled: settingsData.enabled || false,
        frequency: settingsData.frequency || 'daily',
        scheduledTime: settingsData.scheduledTime || '09:00',
        recipients: Array.isArray(settingsData.recipients) ? settingsData.recipients : [], // Store full objects
      });
    }
  }, [settingsData]);

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setFormState(prev => ({ ...prev, [name]: checked }));
  };

  const handleRecipientsChange = (event: SelectChangeEvent<string[]>) => {
    const selectedIds = event.target.value as string[];
    const newSelectedRecipients = eligibleRecipients.filter(r => selectedIds.includes(r._id));
    setFormState(prev => ({ ...prev, recipients: newSelectedRecipients }));
  };

  const handleSaveSettings = async () => {
    if (!settingsData) return;

    const payload: Partial<NotificationSettingsData> = {
        enabled: formState.enabled,
        frequency: formState.frequency as NotificationSettingsData['frequency'],
        scheduledTime: formState.scheduledTime,
        // Send recipients as an array of objects with _id
        recipients: formState.recipients.map((r: { _id: string; username?: string; email?: string }) => ({ _id: r._id, username: r.username, email: r.email })),
    };

    if (process.env.NODE_ENV === 'development') {
        console.log("Saving notification settings with payload:", JSON.stringify(payload, null, 2));
    }

    updateSettingsMutation.mutate(payload);
  };

  const openAddRuleDialog = () => {
    setRuleForm({
      name: '',
      enabled: true,
      actionTypes: ['ALL'],
      resourceTypes: ['ALL'],
      triggerRoles: ['ALL'],
      priority: 'normal' as NotificationRule['priority'],
      includeDetails: true
    });
    setCurrentRule(null);
    setRuleDialogOpen(true);
  };

  const openEditRuleDialog = (rule: NotificationRule) => {
    setRuleForm({
      name: rule.name,
      enabled: rule.enabled,
      actionTypes: rule.actionTypes,
      resourceTypes: rule.resourceTypes,
      triggerRoles: rule.triggerRoles,
      priority: rule.priority || ('normal' as NotificationRule['priority']),
      includeDetails: rule.includeDetails !== undefined ? rule.includeDetails : true
    });
    setCurrentRule(rule);
    setRuleDialogOpen(true);
  };

  const closeRuleDialog = () => {
    setRuleDialogOpen(false);
  };

  const handleSaveRule = async () => {
    if (!ruleForm.name) {
      alert('Rule name is required.'); // Basic validation
      return;
    }
    if (currentRule && currentRule._id) {
      updateRuleMutation.mutate({ ruleId: currentRule._id, updates: ruleForm });
    } else {
      const newRuleData: Omit<NotificationRule, '_id'> = {
        name: ruleForm.name || 'Unnamed Rule',
        enabled: ruleForm.enabled !== undefined ? ruleForm.enabled : true,
        actionTypes: ruleForm.actionTypes || ['ALL'],
        resourceTypes: ruleForm.resourceTypes || ['ALL'],
        triggerRoles: ruleForm.triggerRoles || ['ALL'],
        priority: ruleForm.priority || ('normal' as NotificationRule['priority']),
        includeDetails: ruleForm.includeDetails !== undefined ? ruleForm.includeDetails : true,
      };
      addRuleMutation.mutate(newRuleData);
    }
    closeRuleDialog();
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      await deleteRuleMutation.mutate(ruleId);
    }
  };

  const handleTestNotification = async () => {
    await sendTestNotificationMutation.mutate(formState.recipients.map((r: { _id: string }) => r._id));
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

  const rulesExist = settingsData && Array.isArray(settingsData.rules) && settingsData.rules.length > 0;

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
            disabled={sendTestNotificationMutation.isPending || !formState.enabled || formState.recipients.length === 0}
          >
            {sendTestNotificationMutation.isPending ? 'Sending...' : 'Send Test Email'}
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
                checked={formState.enabled}
                onChange={handleSwitchChange}
                name="enabled"
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
              value={formState.frequency}
              onChange={handleFormChange}
              name="frequency"
              disabled={!formState.enabled}
              label="Notification Frequency"
            >
              <MenuItem value="immediate">Immediate (send as events occur)</MenuItem>
              <MenuItem value="hourly">Hourly Digest</MenuItem>
              <MenuItem value="daily">Daily Digest</MenuItem>
              <MenuItem value="weekly">Weekly Digest</MenuItem>
            </Select>
          </FormControl>
          
          {formState.frequency !== 'immediate' && (
            <div className="scheduled-time">
              <Typography variant="body2" sx={{ mb: 1 }}>Scheduled Time (24h format):</Typography>
              <TextField
                type="time"
                value={formState.scheduledTime}
                onChange={handleFormChange}
                name="scheduledTime"
                sx={{ width: '120px' }}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 300, // 5 min
                }}
                disabled={!formState.enabled}
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
              value={formState.recipients.map(r => r._id)}
              onChange={handleRecipientsChange}
              disabled={!formState.enabled}
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
              
              {!isLoadingRecipients && eligibleRecipients.length === 0 && (
                <MenuItem disabled>
                  <Typography variant="body2">No admin users found. Please ensure there are admin users in the system.</Typography>
                </MenuItem>
              )}
              
              {eligibleRecipients?.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  <Checkbox checked={formState.recipients.some(r => r._id === user._id)} />
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
            disabled={!formState.enabled}
          >
            Add Rule
          </Button>
        </div>
        
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Define rules to determine which activities should trigger notifications.
        </Typography>
        
        {!rulesExist && !isLoadingRecipients ? (
          <Alert severity="info" sx={{ my: 2 }}>
            No notification rules defined. Add a rule to start receiving notifications.
          </Alert>
        ) : (
          <div className="rules-container">
            {settingsData?.rules?.map((rule: NotificationRule) => (
              <Paper key={rule._id!} className="rule-card" variant="outlined">
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
                            await updateRuleMutation.mutate({
                              ruleId: rule._id!,
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
                        onClick={() => handleDeleteRule(rule._id!)}
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
        open={ruleDialogOpen} 
        onClose={closeRuleDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>{currentRule ? 'Edit' : 'Add'} Notification Rule</DialogTitle>
        <DialogContent dividers>
          {/* Simplified Grid structure for direct form field layout */}
          <Box component="form" sx={{ pt: 1 }}>
            <TextField
              label="Rule Name"
              name="name"
              value={ruleForm.name || ''}
              onChange={handleFormChange}
              fullWidth
              required
              size="small"
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={<Switch name="enabled" checked={ruleForm.enabled || false} onChange={handleSwitchChange} />}
              label="Enabled"
              sx={{ mb: 1, display: 'block' }}
            />
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Action Types</InputLabel>
              <Select 
                multiple 
                name="actionTypes" 
                value={ruleForm.actionTypes || []} 
                onChange={(event: SelectChangeEvent<string[]>) => {
                  setRuleForm(prev => ({ ...prev, actionTypes: event.target.value as string[] }));
                }}
                input={<OutlinedInput label="Action Types" />} 
                renderValue={(selected) => selected.join(', ')}
              >
                {actionTypeOptions.map(opt => <MenuItem key={opt} value={opt}><Checkbox checked={(ruleForm.actionTypes || []).indexOf(opt) > -1} />{opt}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Resource Types</InputLabel>
              <Select 
                multiple 
                name="resourceTypes" 
                value={ruleForm.resourceTypes || []} 
                onChange={(event: SelectChangeEvent<string[]>) => {
                  setRuleForm(prev => ({ ...prev, resourceTypes: event.target.value as string[] }));
                }}
                input={<OutlinedInput label="Resource Types" />} 
                renderValue={(selected) => selected.join(', ')}
              >
                {resourceTypeOptions.map(opt => <MenuItem key={opt} value={opt}><Checkbox checked={(ruleForm.resourceTypes || []).indexOf(opt) > -1} />{opt}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Triggering Roles</InputLabel>
              <Select 
                multiple 
                name="triggerRoles" 
                value={ruleForm.triggerRoles || []} 
                onChange={(event: SelectChangeEvent<string[]>) => {
                  setRuleForm(prev => ({ ...prev, triggerRoles: event.target.value as string[] }));
                }}
                input={<OutlinedInput label="Triggering Roles" />} 
                renderValue={(selected) => selected.join(', ')}
              >
                {roleOptions.map(opt => <MenuItem key={opt} value={opt}><Checkbox checked={(ruleForm.triggerRoles || []).indexOf(opt) > -1} />{opt}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Priority</InputLabel>
              <Select name="priority" value={ruleForm.priority || 'normal'} onChange={handleFormChange} label="Priority">
                {priorityOptions.map(opt => <MenuItem key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Switch name="includeDetails" checked={ruleForm.includeDetails || false} onChange={handleSwitchChange} />}
              label="Include Details in Notification"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{p: '16px 24px'}}>
          <Button onClick={closeRuleDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveRule} 
            variant="contained" 
            color="primary"
            disabled={!ruleForm.name}
          >
            {currentRule ? 'Update Rule' : 'Add Rule'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  // Get current user profile using TanStack Query
  const { data: userProfile, isLoading: isLoadingUserProfile } = useUserProfile();
  const isAuthorized = userProfile?.role === 'superAdmin';
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  if (isLoadingUserProfile) {
    return (
      <Paper elevation={2} className="dashboard-card" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3, minHeight: 200 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading user profile...</Typography>
      </Paper>
    );
  }
  
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
        <NotificationSettings userProfile={userProfile} />
      </TabPanel>
      
      <TabPanel value={activeTab} index={1}>
        <Typography>General System Settings (Coming soon)</Typography>
      </TabPanel>
    </Paper>
  );
};

export default SystemSettings; 