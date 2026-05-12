import React from 'react';
import { useAppTheme } from '@twinmatrix/ui-sdk';
import { Icon } from '@iconify/react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { AgilAlert } from '../../types/alerts';

dayjs.extend(utc);

interface AgilAlertsCardProps {
  alerts: AgilAlert[];
  isConnected: boolean;
  onAlertClick: (alert: AgilAlert) => void;
}

const SEVERITY_META: Record<string, { label: string; icon: string; color: string }> = {
  critical: { label: 'Critical', icon: 'mdi:alert-octagon', color: '#DC2626' },
  high:     { label: 'High',     icon: 'mdi:alert',         color: '#EA580C' },
  medium:   { label: 'Medium',   icon: 'mdi:information',   color: '#3B82F6' },
};

export const AgilAlertsCard: React.FC<AgilAlertsCardProps> = ({ alerts, isConnected, onAlertClick }) => {
  const theme = useAppTheme();

  return (
    <div
      style={{
        borderRadius: 12,
        backgroundColor: theme.surface.panel,
        border: `1px solid ${theme.border.subtle}`,
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: `1px solid ${theme.border.subtle}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon icon='mdi:bell-alert' width={18} height={18} style={{ color: theme.text.primary }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: theme.text.primary }}>
            Agil Alerts
          </span>
          {alerts.length > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
                backgroundColor: '#DC2626',
                borderRadius: 10,
                padding: '1px 7px',
              }}
            >
              {alerts.length}
            </span>
          )}
        </div>

        {/* Connection indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: isConnected ? '#22C55E' : '#9CA3AF',
            }}
          />
          <span style={{ fontSize: 11, color: theme.text.muted }}>
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Alert list */}
      {alerts.length === 0 ? (
        <div
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: theme.text.muted,
            fontSize: 13,
          }}
        >
          No alerts yet
        </div>
      ) : (
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {alerts.map((alert, idx) => {
            const meta = SEVERITY_META[alert.severity] ?? SEVERITY_META.medium;
            return (
              <button
                key={alert.id}
                onClick={() => onAlertClick(alert)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: idx < alerts.length - 1 ? `1px solid ${theme.border.subtle}` : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = theme.surface.control; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >
                {/* Severity icon */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: `${meta.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  <Icon icon={meta.icon} width={16} height={16} style={{ color: meta.color }} />
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: theme.text.primary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {alert.title}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: theme.text.muted,
                      marginTop: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {alert.body}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                        color: meta.color,
                      }}
                    >
                      {meta.label}
                    </span>
                    <span style={{ fontSize: 10, color: theme.text.muted }}>
                      {dayjs(alert.timestamp).utc().format('HH:mm:ss')}
                    </span>
                  </div>
                </div>

                <Icon icon='mdi:chevron-right' width={16} height={16} style={{ color: theme.text.muted, flexShrink: 0, marginTop: 6 }} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
