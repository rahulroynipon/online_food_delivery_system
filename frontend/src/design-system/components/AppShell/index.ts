import {
  AppShell as AppShellRoot,
  Sidebar,
  SidebarTrigger,
  Header,
  Main,
  Content,
  useAppShell,
} from './AppShell';

export * from './appShell.types';

export const AppShell = AppShellRoot as typeof AppShellRoot & {
  Sidebar: typeof Sidebar;
  SidebarTrigger: typeof SidebarTrigger;
  Header: typeof Header;
  Main: typeof Main;
  Content: typeof Content;
};

AppShell.Sidebar = Sidebar;
AppShell.SidebarTrigger = SidebarTrigger;
AppShell.Header = Header;
AppShell.Main = Main;
AppShell.Content = Content;

export { Sidebar, SidebarTrigger, Header, Main, Content, useAppShell };
export default AppShell;
