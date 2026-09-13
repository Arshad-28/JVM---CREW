export type LeaveReason = 'SICK' | 'PERSONAL' | 'GOING_HOME' | 'FAMILY' | 'EMERGENCY' | 'OTHER';

export interface GeneratedEmail {
  subject: string;
  body: string;
  templateId: string;
  templateName: string;
  templateIndex: number;
}

export interface LeaveEmailRecord {
  id: string;
  userId: number;
  userName: string;
  userEmail: string;
  recipient: string;
  reason: LeaveReason;
  reasonDisplay: string;
  startDate: string;
  endDate: string;
  returnDate: string;
  subject: string;
  body: string;
  templateId: string;
  sentAt: string;
  status: 'SENT';
}

export interface TemplateParams {
  userName: string;
  dateRangeForSubject: string;
  dateClause: string;
  approvalClause: string;
  returnDateStr: string;
  customReasonText?: string;
}

type TemplateFn = (params: TemplateParams) => { subject: string; body: string; templateName: string };

const SICK_TEMPLATES: TemplateFn[] = [
  // Template 01
  ({ userName, dateRangeForSubject, dateClause, approvalClause, returnDateStr }) => ({
    templateName: 'Template 01 — Standard Formal Sick Leave',
    subject: `Sick Leave Request – ${dateRangeForSubject}`,
    body: `Dear Support Team,

I am writing to formally request sick leave from the class ${dateClause}, as I am unwell and require time to rest and recover.

${approvalClause}

I will make sure to catch up on any topics, assignments, or coursework covered during my absence.

I expect to resume attending the sessions from ${returnDateStr}.

Please let me know if any additional information or medical documentation is required.

Thank you for your consideration.

Regards,
${userName}`,
  }),
  // Template 02
  ({ userName, dateRangeForSubject, dateClause, returnDateStr }) => ({
    templateName: 'Template 02 — Health Application Format',
    subject: `Leave Request – Health / Sick Leave – ${dateRangeForSubject}`,
    body: `Dear Support Team,

Kindly accept this email as my formal application for sick leave ${dateClause}. Due to sudden illness, I am unable to participate in the scheduled class.

I request you to kindly grant me leave for this period. I will ensure that I stay updated with all course material and review the class notes upon my return.

I plan to rejoin the sessions starting from ${returnDateStr}.

Please let me know if you require a medical certificate or further details.

Sincerely,
${userName}`,
  }),
  // Template 03
  ({ userName, dateRangeForSubject, dateClause, approvalClause, returnDateStr }) => ({
    templateName: 'Template 03 — Peer Collaboration Focus',
    subject: `Application for Sick Leave – ${dateRangeForSubject}`,
    body: `Dear Support Team,

I am writing to inform you that I am currently feeling unwell and will not be able to attend the scheduled class ${dateClause}.

${approvalClause}

To ensure my learning remains uninterrupted, I will coordinate with my cohort peers to review the topics taught and complete any pending assignments promptly.

I anticipate resuming my regular attendance from ${returnDateStr}.

Thank you for your time and understanding.

Best regards,
${userName}`,
  }),
  // Template 04
  ({ userName, dateRangeForSubject, dateClause, returnDateStr }) => ({
    templateName: 'Template 04 — Session Recording Review Format',
    subject: `Request for Leave (Sick Leave) – ${dateRangeForSubject}`,
    body: `Dear Support Team,

I would like to request sick leave for the class scheduled ${dateClause} due to health reasons requiring rest.

I kindly ask for your approval of my leave. I will dedicate time to go through all session recordings and complete the required coursework promptly.

I expect to be back and resume session participation on ${returnDateStr}.

Please let me know if any additional steps are needed on my end.

Yours sincerely,
${userName}`,
  }),
];

const PERSONAL_TEMPLATES: TemplateFn[] = [
  // Template 01
  ({ userName, dateRangeForSubject, dateClause, returnDateStr }) => ({
    templateName: 'Template 01 — Standard Corporate Personal Request',
    subject: `Leave Request – Personal Reason – ${dateRangeForSubject}`,
    body: `Dear Support Team,

I am writing to formally request leave from the scheduled class ${dateClause}, due to a personal commitment that requires my attention.

I would appreciate your approval for the requested leave. I will ensure that I remain up to date with the topics covered during my absence and complete any pending coursework or assignments accordingly.

I expect to resume attending the sessions from ${returnDateStr}.

Please let me know if any additional information is required.

Thank you for your consideration.

Regards,
${userName}`,
  }),
  // Template 02
  ({ userName, dateRangeForSubject, dateClause, returnDateStr }) => ({
    templateName: 'Template 02 — Personal Commitment Variation',
    subject: `Request for Leave – Personal Commitment – ${dateRangeForSubject}`,
    body: `Dear Support Team,

I would like to request leave from the class scheduled ${dateClause}, as I need to attend to an important personal matter.

I will make the necessary effort to catch up on any lessons, assignments, or coursework covered during my absence.

I plan to resume the sessions from ${returnDateStr}, and continue with the regular schedule thereafter.

Kindly consider and approve my leave request. Please let me know if any further details are required.

Thank you for your time and understanding.

Sincerely,
${userName}`,
  }),
  // Template 03
  ({ userName, dateRangeForSubject, dateClause, approvalClause, returnDateStr }) => ({
    templateName: 'Template 03 — Unavoidable Engagement Format',
    subject: `Personal Leave Application – ${dateRangeForSubject}`,
    body: `Dear Support Team,

Kindly consider this email as a request for personal leave ${dateClause} owing to unavoidable personal engagements.

${approvalClause}

I will take full responsibility for reviewing the recorded lectures and completing all assignments due for this module.

I look forward to resuming my active participation from ${returnDateStr}.

Thank you for your support.

Best regards,
${userName}`,
  }),
  // Template 04
  ({ userName, dateRangeForSubject, dateClause, returnDateStr }) => ({
    templateName: 'Template 04 — Prior Commitment Focus',
    subject: `Absence Request – Personal Matter – ${dateRangeForSubject}`,
    body: `Dear Support Team,

I am writing to request a brief absence from the class ${dateClause} due to prior personal commitments.

I kindly request your approval for this leave. I will connect with cohort members to ensure all coursework and learnings are caught up without delay.

My expected return date is ${returnDateStr}.

Please let me know if you need any clarification.

Warm regards,
${userName}`,
  }),
];

const GOING_HOME_TEMPLATES: TemplateFn[] = [
  // Template 01
  ({ userName, dateRangeForSubject, dateClause, approvalClause, returnDateStr }) => ({
    templateName: 'Template 01 — Standard Travel to Home Request',
    subject: `Leave Request – Travel to Home – ${dateRangeForSubject}`,
    body: `Dear Support Team,

I am writing to request leave from the class ${dateClause}, as I need to travel home due to personal commitments.

${approvalClause}

I will ensure that I stay updated with the topics covered during my absence and complete any pending coursework or assignments as required.

I expect to resume attending the sessions from ${returnDateStr}.

Please let me know if any additional information or documentation is required regarding my leave request.

Thank you.

Regards,
${userName}`,
  }),
  // Template 02
  ({ userName, dateRangeForSubject, dateClause, returnDateStr }) => ({
    templateName: 'Template 02 — Hometown Travel Format',
    subject: `Request for Leave – Home Visit / Travel – ${dateRangeForSubject}`,
    body: `Dear Support Team,

I would like to apply for leave ${dateClause} as I will be traveling to my hometown for family matters.

I request you to approve my leave for these dates. During my travel, I will make every effort to review class updates and complete my learning tasks on schedule.

I plan to resume session attendance from ${returnDateStr}.

Thank you for your consideration.

Sincerely,
${userName}`,
  }),
  // Template 03
  ({ userName, dateRangeForSubject, dateClause, approvalClause, returnDateStr }) => ({
    templateName: 'Template 03 — Planned Travel Format',
    subject: `Leave Application – Hometown Travel – ${dateRangeForSubject}`,
    body: `Dear Support Team,

Kindly accept this request for leave ${dateClause} owing to planned travel to my home.

${approvalClause}

I will ensure my coursework remains fully up to date by catching up on sessions and completing assigned tasks.

I will rejoin the regular schedule on ${returnDateStr}.

Best regards,
${userName}`,
  }),
  // Template 04
  ({ userName, dateRangeForSubject, dateClause, returnDateStr }) => ({
    templateName: 'Template 04 — Session Catchup Focus',
    subject: `Travel Leave Request – ${dateRangeForSubject}`,
    body: `Dear Support Team,

I am writing to inform you that I will be traveling home and will be unable to attend class ${dateClause}.

I kindly ask for your approval. I have arranged to review all session material and will submit coursework on time.

I expect to resume classes from ${returnDateStr}.

Please let me know if any further details are required.

Warm regards,
${userName}`,
  }),
];

const FAMILY_TEMPLATES: TemplateFn[] = [
  // Template 01
  ({ userName, dateRangeForSubject, dateClause, approvalClause, returnDateStr }) => ({
    templateName: 'Template 01 — Standard Family Matter Request',
    subject: `Leave Request – Family Reason – ${dateRangeForSubject}`,
    body: `Dear Support Team,

I am writing to request leave from the class ${dateClause}, due to an important family matter that requires my presence.

${approvalClause}

I will ensure that I stay updated with the topics covered during my absence and complete any pending coursework or assignments as required.

I expect to resume attending the sessions from ${returnDateStr}.

Please let me know if any additional information is required.

Regards,
${userName}`,
  }),
  // Template 02
  ({ userName, dateRangeForSubject, dateClause, returnDateStr }) => ({
    templateName: 'Template 02 — Family Obligation Format',
    subject: `Request for Leave – Family Commitment – ${dateRangeForSubject}`,
    body: `Dear Support Team,

I would like to formally request leave ${dateClause} to attend to a family obligation.

Kindly approve my leave request for the specified duration. I will ensure all coursework and exercises for this session are reviewed and completed promptly.

I will return and resume regular attendance starting ${returnDateStr}.

Sincerely,
${userName}`,
  }),
  // Template 03
  ({ userName, dateRangeForSubject, dateClause, approvalClause, returnDateStr }) => ({
    templateName: 'Template 03 — Family Engagement Focus',
    subject: `Family Leave Request – ${dateRangeForSubject}`,
    body: `Dear Support Team,

I am writing to apply for leave ${dateClause} on account of family commitments that necessitate my presence.

${approvalClause}

I will take necessary steps to catch up on all learning materials and assignments covered in my absence.

I anticipate returning to sessions on ${returnDateStr}.

Best regards,
${userName}`,
  }),
  // Template 04
  ({ userName, dateRangeForSubject, dateClause, returnDateStr }) => ({
    templateName: 'Template 04 — Family Event Format',
    subject: `Absence Request – Family Event / Engagement – ${dateRangeForSubject}`,
    body: `Dear Support Team,

Kindly grant me leave from the scheduled session ${dateClause} due to an essential family event.

I appreciate your approval and will maintain progress by reviewing all class notes and homework.

I plan to resume attendance from ${returnDateStr}.

Yours sincerely,
${userName}`,
  }),
];

const EMERGENCY_TEMPLATES: TemplateFn[] = [
  // Template 01
  ({ userName, dateRangeForSubject, dateClause, approvalClause, returnDateStr }) => ({
    templateName: 'Template 01 — Standard Emergency Request',
    subject: `Leave Request – Emergency – ${dateRangeForSubject}`,
    body: `Dear Support Team,

I am writing to formally request emergency leave from the class ${dateClause}, due to an unexpected emergency that requires my immediate attention.

${approvalClause}

I will ensure that I catch up on any topics, assignments, or coursework covered during my absence.

I expect to resume attending the sessions from ${returnDateStr}.

Please let me know if any additional information or documentation is required.

Regards,
${userName}`,
  }),
  // Template 02
  ({ userName, dateRangeForSubject, dateClause, returnDateStr }) => ({
    templateName: 'Template 02 — Urgent Unforeseen Format',
    subject: `Urgent Leave Request – Unforeseen Emergency – ${dateRangeForSubject}`,
    body: `Dear Support Team,

Due to an urgent and unavoidable emergency, I am unable to attend the session scheduled ${dateClause}.

I kindly request your urgent approval for this leave. I will make all necessary arrangements to complete missing coursework as soon as possible.

I plan to resume regular attendance from ${returnDateStr}.

Sincerely,
${userName}`,
  }),
  // Template 03
  ({ userName, dateRangeForSubject, dateClause, approvalClause, returnDateStr }) => ({
    templateName: 'Template 03 — Priority Syllabus Catchup',
    subject: `Emergency Absence Request – ${dateRangeForSubject}`,
    body: `Dear Support Team,

I am writing to inform you of an emergency situation requiring my absence from class ${dateClause}.

${approvalClause}

I will prioritize catching up on the syllabus and completing any pending exercises immediately upon my return.

My expected return date is ${returnDateStr}.

Best regards,
${userName}`,
  }),
  // Template 04
  ({ userName, dateRangeForSubject, dateClause, returnDateStr }) => ({
    templateName: 'Template 04 — Pressing Emergency Format',
    subject: `Application for Emergency Leave – ${dateRangeForSubject}`,
    body: `Dear Support Team,

Kindly accept this request for urgent leave ${dateClause} caused by a pressing emergency.

I request your understanding and approval. I will keep up with coursework through session resources.

I expect to resume classes on ${returnDateStr}.

Thank you for your time.

Regards,
${userName}`,
  }),
];

const OTHER_TEMPLATES: TemplateFn[] = [
  // Template 01
  ({ userName, dateRangeForSubject, dateClause, approvalClause, returnDateStr, customReasonText }) => {
    const customTopic = customReasonText && customReasonText.trim() ? customReasonText.trim() : 'Personal Reason';
    const reasonClause = customReasonText && customReasonText.trim() ? `due to ${customReasonText.trim()}` : 'due to a personal commitment that requires my attention';
    return {
      templateName: 'Template 01 — Standard General / Custom Reason Request',
      subject: `Leave Request – ${customTopic} – ${dateRangeForSubject}`,
      body: `Dear Support Team,

I am writing to formally request leave from the class ${dateClause}, ${reasonClause}.

${approvalClause}

I will ensure that I stay updated with the topics covered during my absence and complete any pending coursework or assignments as required.

I expect to resume attending the sessions from ${returnDateStr}.

Please let me know if any additional information or documentation is required regarding my leave request.

Regards,
${userName}`,
    };
  },
  // Template 02
  ({ userName, dateRangeForSubject, dateClause, returnDateStr, customReasonText }) => {
    const customTopic = customReasonText && customReasonText.trim() ? customReasonText.trim() : 'Personal Commitment';
    const reasonClause = customReasonText && customReasonText.trim() ? `due to ${customReasonText.trim()}` : 'as I need to attend to an important personal matter';
    return {
      templateName: 'Template 02 — General Commitment Format',
      subject: `Request for Leave – ${customTopic} – ${dateRangeForSubject}`,
      body: `Dear Support Team,

I would like to submit a request for leave ${dateClause}, ${reasonClause}.

Kindly consider and approve my request. I will ensure all coursework and topics covered during this period are fully caught up.

I plan to resume sessions from ${returnDateStr}.

Please let me know if any further details are required.

Sincerely,
${userName}`,
    };
  },
  // Template 03
  ({ userName, dateRangeForSubject, dateClause, approvalClause, returnDateStr, customReasonText }) => {
    const customTopic = customReasonText && customReasonText.trim() ? customReasonText.trim() : 'Leave Request';
    const reasonClause = customReasonText && customReasonText.trim() ? `owing to ${customReasonText.trim()}` : 'owing to unavoidable commitments';
    return {
      templateName: 'Template 03 — Formal Application Format',
      subject: `Leave Application – ${customTopic} – ${dateRangeForSubject}`,
      body: `Dear Support Team,

Kindly accept this application for leave ${dateClause}, ${reasonClause}.

${approvalClause}

I will review lecture recordings and complete all assigned tasks on time to maintain continuous learning.

I expect to return to regular attendance on ${returnDateStr}.

Best regards,
${userName}`,
    };
  },
  // Template 04
  ({ userName, dateRangeForSubject, dateClause, returnDateStr, customReasonText }) => {
    const customTopic = customReasonText && customReasonText.trim() ? customReasonText.trim() : 'Absence Request';
    const reasonClause = customReasonText && customReasonText.trim() ? `as I have ${customReasonText.trim()}` : 'as I have prior commitments';
    return {
      templateName: 'Template 04 — Scheduled Absence Format',
      subject: `Absence Notification – ${customTopic} – ${dateRangeForSubject}`,
      body: `Dear Support Team,

I am writing to inform you that I will need leave ${dateClause}, ${reasonClause}.

I request your approval and will dedicate time to complete all class topics and assignments.

My return date is scheduled for ${returnDateStr}.

Yours sincerely,
${userName}`,
    };
  },
];

export function getTemplatesForReason(reason: LeaveReason): TemplateFn[] {
  switch (reason) {
    case 'SICK':
      return SICK_TEMPLATES;
    case 'PERSONAL':
      return PERSONAL_TEMPLATES;
    case 'GOING_HOME':
      return GOING_HOME_TEMPLATES;
    case 'FAMILY':
      return FAMILY_TEMPLATES;
    case 'EMERGENCY':
      return EMERGENCY_TEMPLATES;
    case 'OTHER':
    default:
      return OTHER_TEMPLATES;
  }
}

const STORAGE_KEY_PREFIX = 'jvm_leave_history_user_';

export function getUserLeaveHistory(userId: number): LeaveEmailRecord[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (!raw) return [];
    return JSON.parse(raw) as LeaveEmailRecord[];
  } catch {
    return [];
  }
}

export function saveUserLeaveRecord(userId: number, record: Omit<LeaveEmailRecord, 'id' | 'sentAt' | 'status'>): LeaveEmailRecord {
  const existing = getUserLeaveHistory(userId);
  const newRecord: LeaveEmailRecord = {
    ...record,
    id: `leave_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    sentAt: new Date().toISOString(),
    status: 'SENT',
  };
  const updated = [newRecord, ...existing];
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save leave record to localStorage:', err);
  }
  return newRecord;
}

export function selectNextUnusedTemplate(
  userId: number,
  reason: LeaveReason,
  params: TemplateParams,
  overrideIndex?: number
): GeneratedEmail {
  const pool = getTemplatesForReason(reason);
  const total = pool.length;

  if (overrideIndex !== undefined && overrideIndex >= 0 && overrideIndex < total) {
    const fn = pool[overrideIndex];
    const generated = fn(params);
    return {
      ...generated,
      templateId: `Template ${String(overrideIndex + 1).padStart(2, '0')}`,
      templateIndex: overrideIndex,
    };
  }

  const history = getUserLeaveHistory(userId);
  const usedIndicesForReason = history
    .filter((h) => h.reason === reason)
    .map((h) => {
      if (h.templateId && h.templateId.startsWith('Template ')) {
        const numStr = h.templateId.replace('Template ', '');
        return parseInt(numStr, 10) - 1;
      }
      return -1;
    })
    .filter((idx) => idx >= 0 && idx < total);

  let targetIndex = -1;

  // Find first unused template index for this reason
  for (let i = 0; i < total; i++) {
    if (!usedIndicesForReason.includes(i)) {
      targetIndex = i;
      break;
    }
  }

  // If all templates in pool have been used by this user for this reason, start a new rotation!
  if (targetIndex === -1) {
    const lastUsed = usedIndicesForReason.length > 0 ? usedIndicesForReason[0] : 0;
    targetIndex = (lastUsed + 1) % total;
  }

  const selectedFn = pool[targetIndex];
  const generated = selectedFn(params);

  return {
    ...generated,
    templateId: `Template ${String(targetIndex + 1).padStart(2, '0')}`,
    templateIndex: targetIndex,
  };
}
