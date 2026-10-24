/* AUTO-GENERATED; DO NOT EDIT. Modify src/ui-catalog/extensions/composites/generated-manifest.json then run npm run composites:generate. */
import type { z } from 'zod';
import type { extensionDefinitions } from '../catalog';
import { createComposite } from '../composites/create-composite';
import template0 from '../composites/templates/account-access.json';
import template1 from '../composites/templates/activate-agent-dialog.json';
import template2 from '../composites/templates/analytics-card.json';
import template3 from '../composites/templates/anomaly-alert.json';
import template4 from '../composites/templates/bar-chart-card.json';
import template5 from '../composites/templates/book-appointment.json';
import template6 from '../composites/templates/card-overview.json';
import template7 from '../composites/templates/claimable-balance.json';
import template8 from '../composites/templates/codespaces-card.json';
import template9 from '../composites/templates/contribution-history.json';
import template10 from '../composites/templates/contributions-activity.json';
import template11 from '../composites/templates/contributors.json';
import template12 from '../composites/templates/cover-art.json';
import template13 from '../composites/templates/block-dashboard-01.json';
import template14 from '../composites/templates/dividend-income.json';
import template15 from '../composites/templates/empty-connect-bank.json';
import template16 from '../composites/templates/empty-distribute-track.json';
import template17 from '../composites/templates/empty-explore-catalog.json';
import template18 from '../composites/templates/environment-variables.json';
import template19 from '../composites/templates/faq.json';
import template20 from '../composites/templates/feedback-form.json';
import template21 from '../composites/templates/file-upload.json';
import template22 from '../composites/templates/front-door.json';
import template23 from '../composites/templates/github-profile.json';
import template24 from '../composites/templates/index-investing.json';
import template25 from '../composites/templates/invite-team.json';
import template26 from '../composites/templates/invoice.json';
import template27 from '../composites/templates/kitchen-island.json';
import template28 from '../composites/templates/block-login-01.json';
import template29 from '../composites/templates/block-login-02.json';
import template30 from '../composites/templates/block-login-03.json';
import template31 from '../composites/templates/block-login-04.json';
import template32 from '../composites/templates/block-login-05.json';
import template33 from '../composites/templates/new-milestone.json';
import template34 from '../composites/templates/no-team-members.json';
import template35 from '../composites/templates/not-found.json';
import template36 from '../composites/templates/notification-settings.json';
import template37 from '../composites/templates/observability-card.json';
import template38 from '../composites/templates/payments.json';
import template39 from '../composites/templates/payout-threshold.json';
import template40 from '../composites/templates/pie-chart-card.json';
import template41 from '../composites/templates/power-usage.json';
import template42 from '../composites/templates/preferences.json';
import template43 from '../composites/templates/receiving-method.json';
import template44 from '../composites/templates/recent-transactions.json';
import template45 from '../composites/templates/release-catalog.json';
import template46 from '../composites/templates/report-bug.json';
import template47 from '../composites/templates/roller-shades.json';
import template48 from '../composites/templates/savings-progress.json';
import template49 from '../composites/templates/savings-targets.json';
import template50 from '../composites/templates/shipping-address.json';
import template51 from '../composites/templates/block-sidebar-01.json';
import template52 from '../composites/templates/block-sidebar-02.json';
import template53 from '../composites/templates/block-sidebar-03.json';
import template54 from '../composites/templates/block-sidebar-04.json';
import template55 from '../composites/templates/block-sidebar-05.json';
import template56 from '../composites/templates/block-sidebar-06.json';
import template57 from '../composites/templates/block-sidebar-07.json';
import template58 from '../composites/templates/block-sidebar-08.json';
import template59 from '../composites/templates/block-sidebar-09.json';
import template60 from '../composites/templates/block-sidebar-10.json';
import template61 from '../composites/templates/block-sidebar-11.json';
import template62 from '../composites/templates/block-sidebar-12.json';
import template63 from '../composites/templates/block-sidebar-13.json';
import template64 from '../composites/templates/block-sidebar-14.json';
import template65 from '../composites/templates/block-sidebar-15.json';
import template66 from '../composites/templates/block-sidebar-16.json';
import template67 from '../composites/templates/block-signup-01.json';
import template68 from '../composites/templates/block-signup-02.json';
import template69 from '../composites/templates/block-signup-03.json';
import template70 from '../composites/templates/block-signup-04.json';
import template71 from '../composites/templates/block-signup-05.json';
import template72 from '../composites/templates/site-cards-create-account.json';
import template73 from '../composites/templates/site-cards-forms.json';
import template74 from '../composites/templates/site-cards-report-issue.json';
import template75 from '../composites/templates/site-cards-share.json';
import template76 from '../composites/templates/site-cards-stats.json';
import template77 from '../composites/templates/site-color-palette.json';
import template78 from '../composites/templates/site-command-menu.json';
import template79 from '../composites/templates/site-directory-list.json';
import template80 from '../composites/templates/site-nav-user.json';
import template81 from '../composites/templates/site-theme-customizer.json';
import template82 from '../composites/templates/sleep-report.json';
import template83 from '../composites/templates/social-links.json';
import template84 from '../composites/templates/stock-performance.json';
import template85 from '../composites/templates/syncing-state.json';
import template86 from '../composites/templates/transfer-funds.json';
import template87 from '../composites/templates/upcoming-payments.json';
import template88 from '../composites/templates/usage-card.json';
import template89 from '../composites/templates/visitors.json';
import template90 from '../composites/templates/weekly-fitness-summary.json';

/** Exact contracts inferred from approved Zod schemas. UI implementations are shared. */
export const compositeImplementations = {
  AccountAccess: createComposite<z.infer<typeof extensionDefinitions.AccountAccess.props>>(template0, 'AccountAccess'),
  ActivateAgentDialog: createComposite<z.infer<typeof extensionDefinitions.ActivateAgentDialog.props>>(template1, 'ActivateAgentDialog'),
  AnalyticsCard: createComposite<z.infer<typeof extensionDefinitions.AnalyticsCard.props>>(template2, 'AnalyticsCard'),
  AnomalyAlert: createComposite<z.infer<typeof extensionDefinitions.AnomalyAlert.props>>(template3, 'AnomalyAlert'),
  BarChartCard: createComposite<z.infer<typeof extensionDefinitions.BarChartCard.props>>(template4, 'BarChartCard'),
  BookAppointment: createComposite<z.infer<typeof extensionDefinitions.BookAppointment.props>>(template5, 'BookAppointment'),
  CardOverview: createComposite<z.infer<typeof extensionDefinitions.CardOverview.props>>(template6, 'CardOverview'),
  ClaimableBalance: createComposite<z.infer<typeof extensionDefinitions.ClaimableBalance.props>>(template7, 'ClaimableBalance'),
  CodespacesCard: createComposite<z.infer<typeof extensionDefinitions.CodespacesCard.props>>(template8, 'CodespacesCard'),
  ContributionHistory: createComposite<z.infer<typeof extensionDefinitions.ContributionHistory.props>>(template9, 'ContributionHistory'),
  ContributionsActivity: createComposite<z.infer<typeof extensionDefinitions.ContributionsActivity.props>>(template10, 'ContributionsActivity'),
  Contributors: createComposite<z.infer<typeof extensionDefinitions.Contributors.props>>(template11, 'Contributors'),
  CoverArt: createComposite<z.infer<typeof extensionDefinitions.CoverArt.props>>(template12, 'CoverArt'),
  Dashboard01: createComposite<z.infer<typeof extensionDefinitions.Dashboard01.props>>(template13, 'Dashboard01', 'dashboard-01'),
  DividendIncome: createComposite<z.infer<typeof extensionDefinitions.DividendIncome.props>>(template14, 'DividendIncome'),
  EmptyConnectBank: createComposite<z.infer<typeof extensionDefinitions.EmptyConnectBank.props>>(template15, 'EmptyConnectBank'),
  EmptyDistributeTrack: createComposite<z.infer<typeof extensionDefinitions.EmptyDistributeTrack.props>>(template16, 'EmptyDistributeTrack'),
  EmptyExploreCatalog: createComposite<z.infer<typeof extensionDefinitions.EmptyExploreCatalog.props>>(template17, 'EmptyExploreCatalog'),
  EnvironmentVariables: createComposite<z.infer<typeof extensionDefinitions.EnvironmentVariables.props>>(template18, 'EnvironmentVariables'),
  Faq: createComposite<z.infer<typeof extensionDefinitions.Faq.props>>(template19, 'Faq'),
  FeedbackForm: createComposite<z.infer<typeof extensionDefinitions.FeedbackForm.props>>(template20, 'FeedbackForm'),
  FileUpload: createComposite<z.infer<typeof extensionDefinitions.FileUpload.props>>(template21, 'FileUpload'),
  FrontDoor: createComposite<z.infer<typeof extensionDefinitions.FrontDoor.props>>(template22, 'FrontDoor'),
  GithubProfile: createComposite<z.infer<typeof extensionDefinitions.GithubProfile.props>>(template23, 'GithubProfile'),
  IndexInvesting: createComposite<z.infer<typeof extensionDefinitions.IndexInvesting.props>>(template24, 'IndexInvesting'),
  InviteTeam: createComposite<z.infer<typeof extensionDefinitions.InviteTeam.props>>(template25, 'InviteTeam'),
  Invoice: createComposite<z.infer<typeof extensionDefinitions.Invoice.props>>(template26, 'Invoice'),
  KitchenIsland: createComposite<z.infer<typeof extensionDefinitions.KitchenIsland.props>>(template27, 'KitchenIsland'),
  Login01: createComposite<z.infer<typeof extensionDefinitions.Login01.props>>(template28, 'Login01', 'login-01'),
  Login02: createComposite<z.infer<typeof extensionDefinitions.Login02.props>>(template29, 'Login02', 'login-02'),
  Login03: createComposite<z.infer<typeof extensionDefinitions.Login03.props>>(template30, 'Login03', 'login-03'),
  Login04: createComposite<z.infer<typeof extensionDefinitions.Login04.props>>(template31, 'Login04', 'login-04'),
  Login05: createComposite<z.infer<typeof extensionDefinitions.Login05.props>>(template32, 'Login05', 'login-05'),
  NewMilestone: createComposite<z.infer<typeof extensionDefinitions.NewMilestone.props>>(template33, 'NewMilestone'),
  NoTeamMembers: createComposite<z.infer<typeof extensionDefinitions.NoTeamMembers.props>>(template34, 'NoTeamMembers'),
  NotFound: createComposite<z.infer<typeof extensionDefinitions.NotFound.props>>(template35, 'NotFound'),
  NotificationSettings: createComposite<z.infer<typeof extensionDefinitions.NotificationSettings.props>>(template36, 'NotificationSettings'),
  ObservabilityCard: createComposite<z.infer<typeof extensionDefinitions.ObservabilityCard.props>>(template37, 'ObservabilityCard'),
  Payments: createComposite<z.infer<typeof extensionDefinitions.Payments.props>>(template38, 'Payments'),
  PayoutThreshold: createComposite<z.infer<typeof extensionDefinitions.PayoutThreshold.props>>(template39, 'PayoutThreshold'),
  PieChartCard: createComposite<z.infer<typeof extensionDefinitions.PieChartCard.props>>(template40, 'PieChartCard'),
  PowerUsage: createComposite<z.infer<typeof extensionDefinitions.PowerUsage.props>>(template41, 'PowerUsage'),
  Preferences: createComposite<z.infer<typeof extensionDefinitions.Preferences.props>>(template42, 'Preferences'),
  ReceivingMethod: createComposite<z.infer<typeof extensionDefinitions.ReceivingMethod.props>>(template43, 'ReceivingMethod'),
  RecentTransactions: createComposite<z.infer<typeof extensionDefinitions.RecentTransactions.props>>(template44, 'RecentTransactions'),
  ReleaseCatalog: createComposite<z.infer<typeof extensionDefinitions.ReleaseCatalog.props>>(template45, 'ReleaseCatalog'),
  ReportBug: createComposite<z.infer<typeof extensionDefinitions.ReportBug.props>>(template46, 'ReportBug'),
  RollerShades: createComposite<z.infer<typeof extensionDefinitions.RollerShades.props>>(template47, 'RollerShades'),
  SavingsProgress: createComposite<z.infer<typeof extensionDefinitions.SavingsProgress.props>>(template48, 'SavingsProgress'),
  SavingsTargets: createComposite<z.infer<typeof extensionDefinitions.SavingsTargets.props>>(template49, 'SavingsTargets'),
  ShippingAddress: createComposite<z.infer<typeof extensionDefinitions.ShippingAddress.props>>(template50, 'ShippingAddress'),
  Sidebar01: createComposite<z.infer<typeof extensionDefinitions.Sidebar01.props>>(template51, 'Sidebar01', 'sidebar-01'),
  Sidebar02: createComposite<z.infer<typeof extensionDefinitions.Sidebar02.props>>(template52, 'Sidebar02', 'sidebar-02'),
  Sidebar03: createComposite<z.infer<typeof extensionDefinitions.Sidebar03.props>>(template53, 'Sidebar03', 'sidebar-03'),
  Sidebar04: createComposite<z.infer<typeof extensionDefinitions.Sidebar04.props>>(template54, 'Sidebar04', 'sidebar-04'),
  Sidebar05: createComposite<z.infer<typeof extensionDefinitions.Sidebar05.props>>(template55, 'Sidebar05', 'sidebar-05'),
  Sidebar06: createComposite<z.infer<typeof extensionDefinitions.Sidebar06.props>>(template56, 'Sidebar06', 'sidebar-06'),
  Sidebar07: createComposite<z.infer<typeof extensionDefinitions.Sidebar07.props>>(template57, 'Sidebar07', 'sidebar-07'),
  Sidebar08: createComposite<z.infer<typeof extensionDefinitions.Sidebar08.props>>(template58, 'Sidebar08', 'sidebar-08'),
  Sidebar09: createComposite<z.infer<typeof extensionDefinitions.Sidebar09.props>>(template59, 'Sidebar09', 'sidebar-09'),
  Sidebar10: createComposite<z.infer<typeof extensionDefinitions.Sidebar10.props>>(template60, 'Sidebar10', 'sidebar-10'),
  Sidebar11: createComposite<z.infer<typeof extensionDefinitions.Sidebar11.props>>(template61, 'Sidebar11', 'sidebar-11'),
  Sidebar12: createComposite<z.infer<typeof extensionDefinitions.Sidebar12.props>>(template62, 'Sidebar12', 'sidebar-12'),
  Sidebar13: createComposite<z.infer<typeof extensionDefinitions.Sidebar13.props>>(template63, 'Sidebar13', 'sidebar-13'),
  Sidebar14: createComposite<z.infer<typeof extensionDefinitions.Sidebar14.props>>(template64, 'Sidebar14', 'sidebar-14'),
  Sidebar15: createComposite<z.infer<typeof extensionDefinitions.Sidebar15.props>>(template65, 'Sidebar15', 'sidebar-15'),
  Sidebar16: createComposite<z.infer<typeof extensionDefinitions.Sidebar16.props>>(template66, 'Sidebar16', 'sidebar-16'),
  Signup01: createComposite<z.infer<typeof extensionDefinitions.Signup01.props>>(template67, 'Signup01', 'signup-01'),
  Signup02: createComposite<z.infer<typeof extensionDefinitions.Signup02.props>>(template68, 'Signup02', 'signup-02'),
  Signup03: createComposite<z.infer<typeof extensionDefinitions.Signup03.props>>(template69, 'Signup03', 'signup-03'),
  Signup04: createComposite<z.infer<typeof extensionDefinitions.Signup04.props>>(template70, 'Signup04', 'signup-04'),
  Signup05: createComposite<z.infer<typeof extensionDefinitions.Signup05.props>>(template71, 'Signup05', 'signup-05'),
  SiteCardsCreateAccount: createComposite<z.infer<typeof extensionDefinitions.SiteCardsCreateAccount.props>>(template72, 'SiteCardsCreateAccount'),
  SiteCardsForms: createComposite<z.infer<typeof extensionDefinitions.SiteCardsForms.props>>(template73, 'SiteCardsForms'),
  SiteCardsReportIssue: createComposite<z.infer<typeof extensionDefinitions.SiteCardsReportIssue.props>>(template74, 'SiteCardsReportIssue'),
  SiteCardsShare: createComposite<z.infer<typeof extensionDefinitions.SiteCardsShare.props>>(template75, 'SiteCardsShare'),
  SiteCardsStats: createComposite<z.infer<typeof extensionDefinitions.SiteCardsStats.props>>(template76, 'SiteCardsStats'),
  SiteColorPalette: createComposite<z.infer<typeof extensionDefinitions.SiteColorPalette.props>>(template77, 'SiteColorPalette'),
  SiteCommandMenu: createComposite<z.infer<typeof extensionDefinitions.SiteCommandMenu.props>>(template78, 'SiteCommandMenu'),
  SiteDirectoryList: createComposite<z.infer<typeof extensionDefinitions.SiteDirectoryList.props>>(template79, 'SiteDirectoryList'),
  SiteNavUser: createComposite<z.infer<typeof extensionDefinitions.SiteNavUser.props>>(template80, 'SiteNavUser'),
  SiteThemeCustomizer: createComposite<z.infer<typeof extensionDefinitions.SiteThemeCustomizer.props>>(template81, 'SiteThemeCustomizer'),
  SleepReport: createComposite<z.infer<typeof extensionDefinitions.SleepReport.props>>(template82, 'SleepReport'),
  SocialLinks: createComposite<z.infer<typeof extensionDefinitions.SocialLinks.props>>(template83, 'SocialLinks'),
  StockPerformance: createComposite<z.infer<typeof extensionDefinitions.StockPerformance.props>>(template84, 'StockPerformance'),
  SyncingState: createComposite<z.infer<typeof extensionDefinitions.SyncingState.props>>(template85, 'SyncingState'),
  TransferFunds: createComposite<z.infer<typeof extensionDefinitions.TransferFunds.props>>(template86, 'TransferFunds'),
  UpcomingPayments: createComposite<z.infer<typeof extensionDefinitions.UpcomingPayments.props>>(template87, 'UpcomingPayments'),
  UsageCard: createComposite<z.infer<typeof extensionDefinitions.UsageCard.props>>(template88, 'UsageCard'),
  Visitors: createComposite<z.infer<typeof extensionDefinitions.Visitors.props>>(template89, 'Visitors'),
  WeeklyFitnessSummary: createComposite<z.infer<typeof extensionDefinitions.WeeklyFitnessSummary.props>>(template90, 'WeeklyFitnessSummary'),
};
