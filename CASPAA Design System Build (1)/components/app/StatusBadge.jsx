import React from 'react';
import { Badge } from './Badge';

/* The status map, verbatim from statusBadge() in public/js/ui.js. */
export const STATUS_MAP = {
  paid: ['success', 'Paid'],
  partial: ['warn', 'Partial'],
  outstanding: ['danger', 'Outstanding'],
  pending: ['warn', 'Pending'],
  approved: ['success', 'Approved'],
  rejected: ['danger', 'Rejected'],
  active: ['success', 'Active'],
  trial: ['info', 'Trial'],
  suspended: ['danger', 'Suspended'],
  successful: ['success', 'Successful'],
  failed: ['danger', 'Failed'],
  present: ['success', 'Present'],
  absent: ['danger', 'Absent'],
  late: ['warn', 'Late'],
  reviewing: ['info', 'Reviewing'],
  accepted: ['success', 'Accepted'],
  transferred: ['neutral', 'Transferred'],
  withdrawn: ['neutral', 'Withdrawn'],
  alumni: ['info', 'Alumni'],
  visit_scheduled: ['info', 'Visit Scheduled'],
  visit_confirmed: ['success', 'Visit Confirmed'],
};

export function StatusBadge({ status }) {
  const [tone, label] = STATUS_MAP[status] || ['neutral', status];
  return <Badge tone={tone}>{label}</Badge>;
}
