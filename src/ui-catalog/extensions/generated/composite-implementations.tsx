/* AUTO-GENERATED; DO NOT EDIT. Modify src/ui-catalog/extensions/composites/generated-manifest.json then run npm run composites:generate. */
import type { z } from 'zod';
import type { extensionDefinitions } from '../catalog';
import { createComposite } from '../composites/create-composite';
import template0 from '../composites/templates/block-dashboard-01.json';
import template1 from '../composites/templates/block-login-01.json';
import template2 from '../composites/templates/block-login-02.json';
import template3 from '../composites/templates/block-login-03.json';
import template4 from '../composites/templates/block-login-04.json';
import template5 from '../composites/templates/block-login-05.json';
import template6 from '../composites/templates/block-sidebar-01.json';
import template7 from '../composites/templates/block-sidebar-02.json';
import template8 from '../composites/templates/block-sidebar-03.json';
import template9 from '../composites/templates/block-sidebar-04.json';
import template10 from '../composites/templates/block-sidebar-05.json';
import template11 from '../composites/templates/block-sidebar-06.json';
import template12 from '../composites/templates/block-sidebar-07.json';
import template13 from '../composites/templates/block-sidebar-08.json';
import template14 from '../composites/templates/block-sidebar-09.json';
import template15 from '../composites/templates/block-sidebar-10.json';
import template16 from '../composites/templates/block-sidebar-11.json';
import template17 from '../composites/templates/block-sidebar-12.json';
import template18 from '../composites/templates/block-sidebar-13.json';
import template19 from '../composites/templates/block-sidebar-14.json';
import template20 from '../composites/templates/block-sidebar-15.json';
import template21 from '../composites/templates/block-sidebar-16.json';
import template22 from '../composites/templates/block-signup-01.json';
import template23 from '../composites/templates/block-signup-02.json';
import template24 from '../composites/templates/block-signup-03.json';
import template25 from '../composites/templates/block-signup-04.json';
import template26 from '../composites/templates/block-signup-05.json';
import template27 from '../composites/templates/site-cards-create-account.json';
import template28 from '../composites/templates/site-cards-forms.json';
import template29 from '../composites/templates/site-cards-report-issue.json';
import template30 from '../composites/templates/site-cards-share.json';
import template31 from '../composites/templates/site-cards-stats.json';
import template32 from '../composites/templates/site-color-palette.json';
import template33 from '../composites/templates/site-command-menu.json';
import template34 from '../composites/templates/site-directory-list.json';
import template35 from '../composites/templates/site-nav-user.json';
import template36 from '../composites/templates/site-theme-customizer.json';

/** Exact contracts inferred from approved Zod schemas. UI implementations are shared. */
export const compositeImplementations = {
  Dashboard01: createComposite<z.infer<typeof extensionDefinitions.Dashboard01.props>>(template0, 'Dashboard01', 'dashboard-01'),
  Login01: createComposite<z.infer<typeof extensionDefinitions.Login01.props>>(template1, 'Login01', 'login-01'),
  Login02: createComposite<z.infer<typeof extensionDefinitions.Login02.props>>(template2, 'Login02', 'login-02'),
  Login03: createComposite<z.infer<typeof extensionDefinitions.Login03.props>>(template3, 'Login03', 'login-03'),
  Login04: createComposite<z.infer<typeof extensionDefinitions.Login04.props>>(template4, 'Login04', 'login-04'),
  Login05: createComposite<z.infer<typeof extensionDefinitions.Login05.props>>(template5, 'Login05', 'login-05'),
  Sidebar01: createComposite<z.infer<typeof extensionDefinitions.Sidebar01.props>>(template6, 'Sidebar01', 'sidebar-01'),
  Sidebar02: createComposite<z.infer<typeof extensionDefinitions.Sidebar02.props>>(template7, 'Sidebar02', 'sidebar-02'),
  Sidebar03: createComposite<z.infer<typeof extensionDefinitions.Sidebar03.props>>(template8, 'Sidebar03', 'sidebar-03'),
  Sidebar04: createComposite<z.infer<typeof extensionDefinitions.Sidebar04.props>>(template9, 'Sidebar04', 'sidebar-04'),
  Sidebar05: createComposite<z.infer<typeof extensionDefinitions.Sidebar05.props>>(template10, 'Sidebar05', 'sidebar-05'),
  Sidebar06: createComposite<z.infer<typeof extensionDefinitions.Sidebar06.props>>(template11, 'Sidebar06', 'sidebar-06'),
  Sidebar07: createComposite<z.infer<typeof extensionDefinitions.Sidebar07.props>>(template12, 'Sidebar07', 'sidebar-07'),
  Sidebar08: createComposite<z.infer<typeof extensionDefinitions.Sidebar08.props>>(template13, 'Sidebar08', 'sidebar-08'),
  Sidebar09: createComposite<z.infer<typeof extensionDefinitions.Sidebar09.props>>(template14, 'Sidebar09', 'sidebar-09'),
  Sidebar10: createComposite<z.infer<typeof extensionDefinitions.Sidebar10.props>>(template15, 'Sidebar10', 'sidebar-10'),
  Sidebar11: createComposite<z.infer<typeof extensionDefinitions.Sidebar11.props>>(template16, 'Sidebar11', 'sidebar-11'),
  Sidebar12: createComposite<z.infer<typeof extensionDefinitions.Sidebar12.props>>(template17, 'Sidebar12', 'sidebar-12'),
  Sidebar13: createComposite<z.infer<typeof extensionDefinitions.Sidebar13.props>>(template18, 'Sidebar13', 'sidebar-13'),
  Sidebar14: createComposite<z.infer<typeof extensionDefinitions.Sidebar14.props>>(template19, 'Sidebar14', 'sidebar-14'),
  Sidebar15: createComposite<z.infer<typeof extensionDefinitions.Sidebar15.props>>(template20, 'Sidebar15', 'sidebar-15'),
  Sidebar16: createComposite<z.infer<typeof extensionDefinitions.Sidebar16.props>>(template21, 'Sidebar16', 'sidebar-16'),
  Signup01: createComposite<z.infer<typeof extensionDefinitions.Signup01.props>>(template22, 'Signup01', 'signup-01'),
  Signup02: createComposite<z.infer<typeof extensionDefinitions.Signup02.props>>(template23, 'Signup02', 'signup-02'),
  Signup03: createComposite<z.infer<typeof extensionDefinitions.Signup03.props>>(template24, 'Signup03', 'signup-03'),
  Signup04: createComposite<z.infer<typeof extensionDefinitions.Signup04.props>>(template25, 'Signup04', 'signup-04'),
  Signup05: createComposite<z.infer<typeof extensionDefinitions.Signup05.props>>(template26, 'Signup05', 'signup-05'),
  SiteCardsCreateAccount: createComposite<z.infer<typeof extensionDefinitions.SiteCardsCreateAccount.props>>(template27, 'SiteCardsCreateAccount'),
  SiteCardsForms: createComposite<z.infer<typeof extensionDefinitions.SiteCardsForms.props>>(template28, 'SiteCardsForms'),
  SiteCardsReportIssue: createComposite<z.infer<typeof extensionDefinitions.SiteCardsReportIssue.props>>(template29, 'SiteCardsReportIssue'),
  SiteCardsShare: createComposite<z.infer<typeof extensionDefinitions.SiteCardsShare.props>>(template30, 'SiteCardsShare'),
  SiteCardsStats: createComposite<z.infer<typeof extensionDefinitions.SiteCardsStats.props>>(template31, 'SiteCardsStats'),
  SiteColorPalette: createComposite<z.infer<typeof extensionDefinitions.SiteColorPalette.props>>(template32, 'SiteColorPalette'),
  SiteCommandMenu: createComposite<z.infer<typeof extensionDefinitions.SiteCommandMenu.props>>(template33, 'SiteCommandMenu'),
  SiteDirectoryList: createComposite<z.infer<typeof extensionDefinitions.SiteDirectoryList.props>>(template34, 'SiteDirectoryList'),
  SiteNavUser: createComposite<z.infer<typeof extensionDefinitions.SiteNavUser.props>>(template35, 'SiteNavUser'),
  SiteThemeCustomizer: createComposite<z.infer<typeof extensionDefinitions.SiteThemeCustomizer.props>>(template36, 'SiteThemeCustomizer'),
};
