import React from 'react';
import { Modal, Button, useAppTheme } from '@twinmatrix/ui-sdk';
import { Icon } from '@iconify/react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { AgilAlert } from '../../types/alerts';
import { useAgilAlertsStore } from '../../stores/useAgilAlertsStore';
import { useMetaAtlas } from '@twinmatrix/spatialverse-sdk-web/react';

dayjs.extend(utc);

interface AgilAlertModalProps {
  alert: AgilAlert | null;
  isOpen: boolean;
  onClose: () => void;
}

const SEVERITY_META: Record<string, { label: string; icon: string; primary: string; text: string }> = {
  critical: { label: 'Critical', icon: 'mdi:alert-octagon', primary: '#DC2626', text: '#991B1B' },
  high:     { label: 'High',     icon: 'mdi:alert',         primary: '#EA580C', text: '#9A3412' },
  medium:   { label: 'Medium',   icon: 'mdi:information',   primary: '#3B82F6', text: '#1E40AF' },
};

export const AgilAlertModal: React.FC<AgilAlertModalProps> = ({ alert, isOpen, onClose }) => {
  const theme = useAppTheme();

  if (!alert) return null;

  const meta = SEVERITY_META[alert.severity] ?? SEVERITY_META.medium;
  const isCritical = alert.severity === 'critical' || alert.severity === 'high';

  return (
    <Modal.Root isOpen={isOpen} onClose={onClose} size='large'>
      {/* Header */}
      <div
        style={{
          backgroundColor: isCritical ? meta.primary : theme.surface.panel,
          borderBottom: `3px solid ${meta.primary}`,
          padding: '20px 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* Icon + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                backgroundColor: isCritical ? 'rgba(255,255,255,0.2)' : meta.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon icon={meta.icon} width={26} height={26} style={{ color: '#fff' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: isCritical ? '#fff' : theme.text.primary,
                  lineHeight: 1.2,
                }}
              >
                {alert.title}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: isCritical ? 'rgba(255,255,255,0.75)' : meta.text,
                }}
              >
                {meta.label}
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label='Close'
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isCritical ? '#fff' : theme.text.primary,
              fontSize: 22,
              lineHeight: 1,
              padding: 4,
              borderRadius: 6,
              opacity: 0.8,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.8'; }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Body */}
      <Modal.Body>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Body text */}
          <div
            style={{
              padding: 16,
              borderRadius: 10,
              backgroundColor: theme.surface.control,
              border: `1px solid ${theme.border.subtle}`,
              fontSize: 14,
              color: theme.text.primary,
              lineHeight: 1.6,
            }}
          >
            {alert.body}
          </div>

          {/* Detail grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Location */}
            <div
              style={{
                padding: 14,
                borderRadius: 10,
                backgroundColor: theme.surface.control,
                border: `1px solid ${theme.border.subtle}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Icon icon='mdi:map-marker' width={16} height={16} style={{ color: meta.primary }} />
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: theme.text.muted }}>
                  Location
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: theme.text.primary, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {alert.localRef}
              </div>
            </div>

            {/* Time */}
            <div
              style={{
                padding: 14,
                borderRadius: 10,
                backgroundColor: theme.surface.control,
                border: `1px solid ${theme.border.subtle}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Icon icon='mdi:clock-outline' width={16} height={16} style={{ color: meta.primary }} />
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: theme.text.muted }}>
                  Time (UTC)
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: theme.text.primary }}>
                {dayjs(alert.timestamp).utc().format('HH:mm:ss')}
              </div>
              <div style={{ fontSize: 12, color: theme.text.muted, marginTop: 2 }}>
                {dayjs(alert.timestamp).utc().format('MMM D, YYYY')}
              </div>
            </div>
          </div>

          {/* Alert ID */}
          <div
            style={{
              padding: 14,
              borderRadius: 10,
              backgroundColor: theme.surface.control,
              border: `1px solid ${theme.border.subtle}`,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: theme.text.muted, marginBottom: 4 }}>
              Alert ID
            </div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: theme.text.primary, wordBreak: 'break-all' }}>
              {alert.id}
            </div>
          </div>
        </div>
      </Modal.Body>

      {/* Footer */}
      <Modal.Footer>
        <Button variant='outline' onClick={onClose}>
          Ok
        </Button>
      </Modal.Footer>
    </Modal.Root>
  );
};
