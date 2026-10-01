/*
 * Text for the Local Role-Based Dashboard Prototype (management mode).
 * English only for now. Looked up with SA.i18n.tFor('en', key, params, SA.MGMT_STRINGS), the
 * same lookup and interpolation as the worker app, but kept apart from SA.STRINGS so the
 * worker app's Hindi tables (and their completeness test) are not affected.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  SA.MGMT_STRINGS = {
    en: {
      'm.portal': 'SurakshaAR Management Portal',
      'm.portal.sub': 'Local Role-Based Dashboard Prototype',
      'm.selectRole': 'Select role',
      'm.protoNote': 'Prototype: choosing a role is not a login and nothing is secured. All figures come from training data stored on this device; nothing is sent anywhere.',
      'm.seedNote': '{seeded} seeded demo workers + {local} worker(s) trained on this device.',
      'm.timeNote': 'Demo time: today + {days} days (set on the supervisor dashboard).',
      'm.backToApp': '← Worker app',
      'm.logout': 'Logout',
      'm.switchRole': 'Switch role',
      'm.signedInAs': 'Role: {role}',

      'm.role.trainer': 'Trainer',
      'm.role.trainer.sub': 'Training progress, scores and module assignment',
      'm.role.officer': 'Mine Safety Officer',
      'm.role.officer.sub': 'Compliance, risk, certificates and refreshers',
      'm.role.contractor': 'Contractor',
      'm.role.contractor.sub': 'Workforce training and certificate status',

      'm.tab.dashboard': 'Dashboard',
      'm.tab.workers': 'Workers',
      'm.tab.training': 'Training',
      'm.tab.certificates': 'Certificates',
      'm.tab.risk': 'Risk / Compliance',

      'm.card.totalWorkers': 'Total workers',
      'm.card.completed': 'Training completed',
      'm.card.avgScore': 'Average score',
      'm.card.refresherDue': 'Refresher due',
      'm.card.trained': 'Trained',
      'm.card.highRisk': 'High-risk workers',
      'm.card.certsValid': 'Certificates valid',
      'm.card.certsAttention': 'Certificates needing attention',
      'm.card.pending': 'Training pending',
      'm.card.completion': 'Completion',

      'm.progress.title': 'Training progress',
      'm.progress.overall': 'Overall (both modules)',
      'm.progress.of': '{n} of {total}',

      'm.workers.title': 'Workers',
      'm.col.fire': 'Fire',
      'm.col.gas': 'Gas',
      'm.col.latest': 'Latest score',
      'm.col.status': 'Training',
      'm.col.risk': 'Risk',
      'm.col.refresher': 'Refresher',
      'm.col.cert': 'Certificate',
      'm.col.completion': 'Modules passed',
      'm.noRecord': '—',
      'm.thisDevice': 'this device',
      'm.seeded': 'seeded demo',

      'm.status.completed': 'COMPLETED',
      'm.status.inProgress': 'IN PROGRESS',
      'm.status.pending': 'PENDING',
      'm.status.refresher': 'REFRESHER DUE',
      'm.risk.green': 'GREEN · Low risk',
      'm.risk.amber': 'AMBER · Attention',
      'm.risk.red': 'RED · High risk',
      'm.risk.none': 'Not assessed',
      'm.refresher.due': 'Due',
      'm.refresher.current': 'Current',
      'm.cert.valid': 'VALID',
      'm.cert.attention': 'ATTENTION',
      'm.cert.none': 'None on this device',

      'm.assign.title': 'Assign module',
      'm.assign.note': 'Prototype: assignments are saved on this device only.',
      'm.assign.worker': 'Worker',
      'm.assign.module': 'Module',
      'm.assign.due': 'Due date',
      'm.assign.submit': 'Assign module',
      'm.assign.added': 'Module assigned.',
      'm.assign.invalid': 'Choose a worker, a module and a valid due date.',
      'm.assign.list': 'Assigned modules',
      'm.assign.none': 'No modules assigned yet.',
      'm.assign.dueOn': 'Due {date}',
      'm.assign.overdue': 'OVERDUE',
      'm.assign.remove': 'Remove',

      'm.officer.compliance': 'Compliance summary',
      'm.officer.riskDist': 'Risk distribution',
      'm.officer.riskNote': 'Same retention-risk formula as the supervisor dashboard.',
      'm.officer.trends': 'Safety summary',
      'm.officer.trainingChart': 'Training status',
      'm.officer.scoreChart': 'Latest score distribution',
      'm.officer.refresherChart': 'Refresher due',
      'm.officer.simulator': 'Open retention simulator (+7 days / Reset)',

      'm.certs.title': 'Certificate / passport status',
      'm.certs.valid': 'Valid',
      'm.certs.attention': 'Expired / attention needed',
      'm.certs.recent': 'Recently issued (30 days)',
      'm.certs.none': 'No certificates have been issued on this device yet.',
      'm.certs.seedNote': 'Seeded demo workers have no certificate records on this device.',
      'm.certs.issued': 'Issued {date} · valid until {expiry}',
      'm.certs.reason.expired': 'expired',
      'm.certs.reason.refresher': 'refresher due',
      'm.certs.reason.invalid': 'does not verify',

      'm.nearMiss.title': 'Near-Miss Reports — Prototype',
      'm.nearMiss.none': 'No near-miss reports recorded.',
      'm.nearMiss.note': 'Near-miss reporting (including photos) is not part of this prototype.',

      'm.contractor.workforce': 'Workforce summary',
      'm.contractor.defs': 'Trained = passed at least one module. Training pending = no module passed yet.',
      'm.contractor.completion': 'Training completion',
      'm.contractor.completionNote': '{n} of {total} workers have passed both modules.'
    }
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
