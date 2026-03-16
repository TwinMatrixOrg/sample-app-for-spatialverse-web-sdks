/**
 * Alert Detail Modal Component
 * 
 * Displays detailed information about a selected alert in a modal dialog.
 * Shows alert image/video, camera info, location, timestamp, and alert details.
 * 
 * Usage:
 * ```tsx
 * <AlertDetailModal
 *   isOpen={isModalOpen}
 *   alert={selectedAlert}
 *   onClose={() => setIsModalOpen(false)}
 *   variant="dark"
 * />
 * ```
 */

import React, { useState, useEffect } from 'react';
// Import Modal and Button from UI SDK
import { Modal, Button, useAppTheme } from '@twinmatrix/ui-sdk';
import { AilyticsAlert, mapTriggerToSeverity } from '../../types/alerts';
import { formatRelativeTime } from '../../utils/formatTime';
import { Icon } from '@iconify/react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

interface AlertDetailModalProps {
  isOpen: boolean;
  alert: AilyticsAlert | null;
  onClose: () => void;
}

// Map trigger types to user-friendly labels and icons
const TRIGGER_CONFIG: Record<
  string,
  { label: string; icon: string; description: string }
> = {
  worker_near_heavy_machine: {
    label: 'Worker Near Heavy Machinery',
    icon: 'mdi:alert-octagon',
    description: 'Safety violation detected',
  },
  ppe_detection: {
    label: 'PPE Violation',
    icon: 'mdi:hard-hat',
    description: 'Missing safety equipment',
  },
  no_access_area: {
    label: 'No Access Area',
    icon: 'mdi:block-helper',
    description: 'Unauthorized entry',
  },
  slip_trip_fall: {
    label: 'Slip/Trip/Fall Risk',
    icon: 'mdi:alert-circle',
    description: 'Safety hazard detected',
  },
  crowding: {
    label: 'Crowding Alert',
    icon: 'mdi:account-group',
    description: 'High density detected',
  },
};

// Simple hook to track presigned URL expiry
const usePresignedExpiry = (src?: string | null, expiresInMs: number = 5 * 60 * 1000) => {
  const [isExpired, setIsExpired] = useState(false);
  const timeoutRef = React.useRef<number | null>(null);

  useEffect(() => {
    setIsExpired(false);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    if (!src) {
      return;
    }

    timeoutRef.current = window.setTimeout(() => {
      setIsExpired(true);
    }, expiresInMs);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [src, expiresInMs]);

  const markExpired = () => {
    setIsExpired(true);
  };

  return { isExpired, markExpired };
};

export const AlertDetailModal: React.FC<AlertDetailModalProps> = ({
  isOpen,
  alert,
  onClose,
}) => {
  const theme = useAppTheme();
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const { isExpired: isFrameExpired, markExpired: markFrameExpired } =
    usePresignedExpiry(alert?.frame);

  useEffect(() => {
    setImageError(false);
    setVideoError(false);
  }, [alert?.frame, alert?.video]);

  if (!alert) return null;

  const severity = mapTriggerToSeverity(alert.trigger);
  const triggerConfig = TRIGGER_CONFIG[alert.trigger] || {
    label: alert.trigger.replace(/_/g, ' '),
    icon: 'mdi:alert',
    description: 'Alert detected',
  };

  // Severity color scheme
  const severityConfig = {
    Severe: {
      primary: '#DC2626',
      background: '#FEE2E2',
      border: '#DC2626',
      iconBg: '#DC2626',
      text: '#991B1B',
      badge: '#991B1B',
    },
    Medium: {
      primary: '#F59E0B',
      background: '#FEF3C7',
      border: '#F59E0B',
      iconBg: '#F59E0B',
      text: '#92400E',
      badge: '#92400E',
    },
    Info: {
      primary: '#3B82F6',
      background: '#DBEAFE',
      border: '#3B82F6',
      iconBg: '#3B82F6',
      text: '#1E40AF',
      badge: '#1E40AF',
    },
    Normal: {
      primary: '#22C55E',
      background: '#D1FAE5',
      border: '#22C55E',
      iconBg: '#22C55E',
      text: '#166534',
      badge: '#166534',
    },
  };

  const config = severityConfig[severity] || severityConfig.Info;
  const isCritical = severity === 'Severe';

  const formattedTime = formatRelativeTime(alert.timestamp, alert.timezone);
  const alertDate = dayjs(alert.timestamp).tz(alert.timezone || 'UTC');
  const fullDate = alertDate.format('MMMM D, YYYY [at] hh:mm:ss A');
  const dateOnly = alertDate.format('MMMM D, YYYY');
  const timeOnly = alertDate.format('hh:mm:ss A');

  const handleImageError = () => {
    setImageError(true);
    markFrameExpired();
  };

  const handleVideoError = () => {
    setVideoError(true);
  };

  const shouldShowFrame = Boolean(
    alert.frame && !imageError && !isFrameExpired
  );
  const shouldShowVideo = Boolean(alert.video && !videoError);
  const shouldShowMediaSection = shouldShowFrame || shouldShowVideo;

  return (
    <Modal.Root isOpen={isOpen} onClose={onClose} size='large'>
      {/* Custom Header */}
      <div
        style={{
          backgroundColor: isCritical ? config.primary : theme.surface.panel,
          borderBottom: `3px solid ${config.border}`,
          padding: '20px 24px',
          position: 'relative',
        }}
      >
        {isCritical && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${config.primary} 0%, ${config.primary}CC 50%, ${config.primary} 100%)`,
            }}
          />
        )}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}
          >
            {/* Icon Container */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                backgroundColor: config.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 4px 12px ${config.primary}40`,
              }}
            >
              <Icon
                icon={triggerConfig.icon}
                width={28}
                height={28}
                style={{ color: '#FFFFFF' }}
              />
            </div>

            {/* Title Section */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: isCritical ? '#FFFFFF' : theme.text.primary,
                  marginBottom: 4,
                  lineHeight: 1.2,
                }}
              >
                {triggerConfig.label}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: isCritical
                    ? 'rgba(255,255,255,0.9)'
                    : theme.text.muted,
                  fontWeight: 500,
                }}
              >
                {triggerConfig.description}
              </div>
            </div>
          </div>

          {/* Severity Badge and Close */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                backgroundColor: isCritical ? '#FFFFFF' : config.badge,
                color: isCritical ? config.badge : '#FFFFFF',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: `0 2px 8px ${config.primary}30`,
              }}
            >
              <Icon
                icon={
                  severity === 'Severe'
                    ? 'mdi:alert-octagon'
                    : severity === 'Medium'
                    ? 'mdi:alert'
                    : 'mdi:information'
                }
                width={16}
                height={16}
              />
              {severity}
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: isCritical ? '#FFFFFF' : theme.text.primary,
                cursor: 'pointer',
                fontSize: 24,
                padding: 4,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                opacity: 0.8,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.backgroundColor = isCritical
                  ? 'rgba(255,255,255,0.2)'
                  : theme.surface.control;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.8';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label='Close modal'
            >
              ×
            </button>
          </div>
        </div>
      </div>

      <Modal.Body>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Alert Image/Video Section */}
          {shouldShowMediaSection && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <Icon
                  icon={alert.frame ? 'mdi:image' : 'mdi:video'}
                  width={18}
                  height={18}
                  style={{ color: config.primary }}
                />
                <h3
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 700,
                    color: theme.text.primary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {alert.frame ? 'Alert Frame' : 'Alert Video'}
                </h3>
              </div>
              <div
                style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: `2px solid ${config.border}40`,
                  backgroundColor: theme.surface.control,
                  boxShadow: `0 4px 16px ${config.primary}20`,
                }}
              >
                {shouldShowFrame && (
                  <img
                    src={alert.frame}
                    alt={`Alert from ${alert.camera_info.name}`}
                    onError={handleImageError}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      maxHeight: '600px',
                      objectFit: 'contain',
                    }}
                  />
                )}
                {shouldShowVideo && (
                  <video
                    src={alert.video}
                    controls
                    onError={handleVideoError}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      maxHeight: '600px',
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Alert Information Cards */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}
            >
              <Icon
                icon='mdi:information'
                width={18}
                height={18}
                style={{ color: config.primary }}
              />
              <h3
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 700,
                  color: theme.text.primary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Alert Information
              </h3>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 16,
              }}
            >
              {/* Camera Info Card */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: theme.surface.control,
                  border: `1px solid ${theme.border.subtle}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <Icon
                    icon='mdi:cctv'
                    width={20}
                    height={20}
                    style={{ color: config.primary }}
                  />
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: theme.text.muted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Camera
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: theme.text.primary,
                    marginBottom: 4,
                  }}
                >
                  {alert.camera_info.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: theme.text.muted,
                    fontFamily: 'monospace',
                  }}
                >
                  {alert.camera_info.id}
                </div>
              </div>

              {/* Location Info Card */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: theme.surface.control,
                  border: `1px solid ${theme.border.subtle}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <Icon
                    icon='mdi:map-marker'
                    width={20}
                    height={20}
                    style={{ color: config.primary }}
                  />
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: theme.text.muted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Location
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: theme.text.primary,
                    marginBottom: 4,
                  }}
                >
                  {alert.site_info.name}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: theme.text.muted,
                  }}
                >
                  {alert.group_info.name}
                </div>
              </div>

              {/* Time Info Card */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: theme.surface.control,
                  border: `1px solid ${theme.border.subtle}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <Icon
                    icon='mdi:clock-outline'
                    width={20}
                    height={20}
                    style={{ color: config.primary }}
                  />
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: theme.text.muted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Time
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: theme.text.primary,
                    marginBottom: 4,
                  }}
                >
                  {timeOnly}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: theme.text.muted,
                    marginBottom: 4,
                  }}
                >
                  {dateOnly}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: theme.text.muted,
                    fontStyle: 'italic',
                  }}
                >
                  {formattedTime} • {alert.timezone}
                </div>
              </div>

              {/* Alert Details Card */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: `${config.primary}10`,
                  border: `2px solid ${config.border}40`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <Icon
                    icon='mdi:alert-circle'
                    width={20}
                    height={20}
                    style={{ color: config.primary }}
                  />
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: config.text,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Alert Details
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: theme.text.muted,
                    marginBottom: 8,
                  }}
                >
                  <strong style={{ color: theme.text.primary }}>
                    Trigger:
                  </strong>{' '}
                  {alert.trigger.replace(/_/g, ' ')}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: theme.text.muted,
                    marginBottom: 8,
                  }}
                >
                  <strong style={{ color: theme.text.primary }}>
                    Alert ID:
                  </strong>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 11,
                      marginTop: 4,
                      wordBreak: 'break-all',
                    }}
                  >
                    {alert.id}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant='outline'
          onClick={onClose}
          style={{
            minWidth: 120,
          }}
        >
          Close
        </Button>
      </Modal.Footer>
    </Modal.Root>
  );
};
