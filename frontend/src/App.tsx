import React, { useState } from 'react';
import {
  AppShell,
  Sidebar,
  Header,
  Main,
  Content,
  SidebarTrigger,
  Card,
  Button,
  Input,
  Badge,
  Alert,
  PageHeader,
  useTheme,
} from './design-system';
import {
  Home,
  MapPin,
  Layers,
  Settings,
  Plus,
  Search,
  Sun,
  Moon,
  TrendingUp,
  Activity,
  Trash2,
  Edit,
  Utensils,
  Truck,
} from 'lucide-react';

function App() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for Platform Categories
  const [categories, setCategories] = useState([
    {
      id: 1,
      name: 'Burgers & Fast Food',
      slug: 'burgers-fast-food',
      status: 'ACTIVE',
      count: 42,
      image: '🍔',
    },
    {
      id: 2,
      name: 'Pizza & Italian',
      slug: 'pizza-italian',
      status: 'ACTIVE',
      count: 28,
      image: '🍕',
    },
    {
      id: 3,
      name: 'Asian & Noodles',
      slug: 'asian-noodles',
      status: 'ACTIVE',
      count: 35,
      image: '🥢',
    },
    {
      id: 4,
      name: 'Desserts & Ice Cream',
      slug: 'desserts-ice-cream',
      status: 'ACTIVE',
      count: 19,
      image: '🍦',
    },
    {
      id: 5,
      name: 'Beverages & Coffee',
      slug: 'beverages-coffee',
      status: 'ACTIVE',
      count: 54,
      image: '☕',
    },
    {
      id: 6,
      name: 'Healthy & Salads',
      slug: 'healthy-salads',
      status: 'INACTIVE',
      count: 12,
      image: '🥗',
    },
  ]);

  // Mock data for Delivery Zones
  const [zones, setZones] = useState([
    { id: 1, name: 'Downtown Core', slug: 'downtown-core', status: 'ACTIVE', area: 'Central' },
    { id: 2, name: 'North Heights', slug: 'north-heights', status: 'ACTIVE', area: 'North Sector' },
    { id: 3, name: 'West End', slug: 'west-end', status: 'ACTIVE', area: 'West Sector' },
    {
      id: 4,
      name: 'Riverfront Marina',
      slug: 'riverfront-marina',
      status: 'INACTIVE',
      area: 'East Sector',
    },
  ]);

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredZones = zones.filter(
    (z) =>
      z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell sidebarWidth={240} defaultCollapsed={false}>
      {/* ── Sidebar ── */}
      <Sidebar className="bg-[var(--color-card)] border-r border-[var(--color-border)] p-4 flex flex-col justify-between">
        <div>
          {/* Brand/Logo */}
          <div className="flex items-center gap-2 mb-8 px-2 py-1">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-lg">
              F
            </div>
            <span className="font-bold text-lg text-[var(--color-foreground)]">FoodExpress</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setSearchQuery('');
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]'
              }`}
            >
              <Home size={18} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('categories');
                setSearchQuery('');
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'categories'
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]'
              }`}
            >
              <Layers size={18} />
              <span>Platform Categories</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('zones');
                setSearchQuery('');
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'zones'
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]'
              }`}
            >
              <MapPin size={18} />
              <span>Delivery Zones</span>
            </button>
          </nav>
        </div>

        {/* Theme Settings & Footer */}
        <div className="border-t border-[var(--color-border)] pt-4 mt-auto">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase px-2">
              Theme Manager
            </span>
            <div className="flex items-center gap-1.5 justify-around px-2 py-1 bg-[var(--color-muted)] rounded-lg">
              <button
                onClick={() => setTheme('light')}
                title="Light Theme"
                className={`w-6 h-6 rounded-full bg-white border border-gray-300 transition-transform ${theme === 'light' ? 'scale-125 ring-2 ring-[var(--color-primary)]' : ''}`}
              />
              <button
                onClick={() => setTheme('dark')}
                title="Dark Theme"
                className={`w-6 h-6 rounded-full bg-gray-950 border border-gray-800 transition-transform ${theme === 'dark' ? 'scale-125 ring-2 ring-[var(--color-primary)]' : ''}`}
              />
              <button
                onClick={() => setTheme('brand')}
                title="Brand Orange"
                className={`w-6 h-6 rounded-full bg-orange-500 transition-transform ${theme === 'brand' ? 'scale-125 ring-2 ring-[var(--color-primary)]' : ''}`}
              />
              <button
                onClick={() => setTheme('forest')}
                title="Forest Green"
                className={`w-6 h-6 rounded-full bg-emerald-600 transition-transform ${theme === 'forest' ? 'scale-125 ring-2 ring-[var(--color-primary)]' : ''}`}
              />
            </div>
            <div className="text-[11px] text-[var(--color-muted-foreground)] text-center mt-2">
              FoodExpress Admin Panel v1.0
            </div>
          </div>
        </div>
      </Sidebar>

      {/* ── Main content area ── */}
      <Main className="bg-[var(--color-muted)] min-h-screen">
        <Header className="bg-[var(--color-card)] border-b border-[var(--color-border)] flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="relative w-64 max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-muted-foreground)]" />
              <Input
                type="text"
                placeholder="Search slugs or names..."
                className="pl-9 h-9 w-full bg-[var(--color-muted)] border-[var(--color-border)] text-sm rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="text-xs px-2 py-1 font-semibold uppercase flex items-center gap-1 border-[var(--color-border)]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              API Connect: Active
            </Badge>
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-bold shadow-sm">
              SA
            </div>
          </div>
        </Header>

        <Content className="p-6 max-w-6xl mx-auto flex flex-col gap-6">
          {/* Welcome alert */}
          <Alert className="bg-[var(--color-card)] border-l-4 border-l-[var(--color-primary)] rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[var(--color-primary)]" />
              <span className="font-medium text-sm text-[var(--color-foreground)]">
                Auto-seeding verified. Connected to PostgreSQL target database successfully.
              </span>
            </div>
          </Alert>

          {/* ── Active Tab View ── */}
          {activeTab === 'dashboard' && (
            <>
              {/* Metrics cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-sm flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">
                    Platform Categories
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-3xl font-extrabold text-[var(--color-foreground)]">
                      {categories.length}
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-orange-100 text-orange-800 text-[10px] font-bold"
                    >
                      5 Active
                    </Badge>
                  </div>
                </Card>

                <Card className="p-5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-sm flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">
                    Delivery Zones
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-3xl font-extrabold text-[var(--color-foreground)]">
                      {zones.length}
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-emerald-100 text-emerald-800 text-[10px] font-bold"
                    >
                      3 Active
                    </Badge>
                  </div>
                </Card>

                <Card className="p-5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-sm flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">
                    Linked Restaurants
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-3xl font-extrabold text-[var(--color-foreground)]">
                      24
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 text-[10px] font-bold"
                    >
                      Live
                    </Badge>
                  </div>
                </Card>

                <Card className="p-5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-sm flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">
                    Riders Fleet
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-3xl font-extrabold text-[var(--color-foreground)]">
                      15
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-purple-100 text-purple-800 text-[10px] font-bold"
                    >
                      9 Active
                    </Badge>
                  </div>
                </Card>
              </div>

              {/* Summary Lists Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Platform Categories Preview */}
                <Card className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-sm p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                    <div className="flex items-center gap-2">
                      <Utensils className="text-[var(--color-primary)]" size={20} />
                      <h2 className="text-base font-bold text-[var(--color-foreground)]">
                        Recent Platform Categories
                      </h2>
                    </div>
                    <Button
                      onClick={() => setActiveTab('categories')}
                      variant="link"
                      className="text-xs p-0 text-[var(--color-primary)] hover:underline"
                    >
                      View All
                    </Button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {categories.slice(0, 3).map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-muted)] hover:scale-[1.01] transition-transform"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{c.image}</span>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-[var(--color-foreground)]">
                              {c.name}
                            </span>
                            <span className="text-xs text-[var(--color-muted-foreground)]">
                              /{c.slug}
                            </span>
                          </div>
                        </div>
                        <Badge
                          className={
                            c.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800 text-[10px]'
                              : 'bg-gray-100 text-gray-800 text-[10px]'
                          }
                        >
                          {c.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Delivery Zones Preview */}
                <Card className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-sm p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="text-[var(--color-primary)]" size={20} />
                      <h2 className="text-base font-bold text-[var(--color-foreground)]">
                        Active Delivery Zones
                      </h2>
                    </div>
                    <Button
                      onClick={() => setActiveTab('zones')}
                      variant="link"
                      className="text-xs p-0 text-[var(--color-primary)] hover:underline"
                    >
                      View All
                    </Button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {zones.slice(0, 3).map((z) => (
                      <div
                        key={z.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-muted)] hover:scale-[1.01] transition-transform"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[var(--color-foreground)]">
                            {z.name}
                          </span>
                          <span className="text-xs text-[var(--color-muted-foreground)]">
                            /{z.slug}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[var(--color-muted-foreground)]">
                            {z.area}
                          </span>
                          <Badge
                            className={
                              z.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800 text-[10px]'
                                : 'bg-gray-100 text-gray-800 text-[10px]'
                            }
                          >
                            {z.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          )}

          {activeTab === 'categories' && (
            <Card className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-sm p-6 flex flex-col gap-4">
              <PageHeader
                title="Platform Categories"
                description="Manage global food categories shown to users in their customer feed."
                actions={
                  <Button
                    variant="primary"
                    size="sm"
                    className="rounded-lg flex items-center gap-1"
                  >
                    <Plus size={16} /> Add Category
                  </Button>
                }
              />

              <div className="overflow-x-auto w-full border border-[var(--color-border)] rounded-lg bg-[var(--color-card)]">
                <table className="min-w-full divide-y divide-[var(--color-border)]">
                  <thead className="bg-[var(--color-muted)]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">
                        Icon
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">
                        Category Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">
                        Unique Slug
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">
                        Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {filteredCategories.map((c) => (
                      <tr key={c.id} className="hover:bg-[var(--color-muted)]/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-2xl">{c.image}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[var(--color-foreground)]">
                          {c.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-[var(--color-muted-foreground)]">
                          /{c.slug}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-foreground)]">
                          {c.count} items
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            className={
                              c.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800 text-[10px]'
                                : 'bg-gray-100 text-gray-800 text-[10px]'
                            }
                          >
                            {c.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="inline-flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-gray-500 hover:text-[var(--color-primary)]"
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-gray-500 hover:text-red-500"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredCategories.length === 0 && (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-6 py-10 text-center text-sm text-[var(--color-muted-foreground)]"
                        >
                          No category matching search filters found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === 'zones' && (
            <Card className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-sm p-6 flex flex-col gap-4">
              <PageHeader
                title="Delivery Zones"
                description="Define sectors and regions within which active riders dispatch food orders."
                actions={
                  <Button
                    variant="primary"
                    size="sm"
                    className="rounded-lg flex items-center gap-1"
                  >
                    <Plus size={16} /> Add Delivery Zone
                  </Button>
                }
              />

              <div className="overflow-x-auto w-full border border-[var(--color-border)] rounded-lg bg-[var(--color-card)]">
                <table className="min-w-full divide-y divide-[var(--color-border)]">
                  <thead className="bg-[var(--color-muted)]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">
                        Zone Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">
                        Unique Slug
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">
                        Geographic Sector
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {filteredZones.map((z) => (
                      <tr key={z.id} className="hover:bg-[var(--color-muted)]/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[var(--color-foreground)]">
                          {z.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-[var(--color-muted-foreground)]">
                          /{z.slug}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-foreground)]">
                          {z.area}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            className={
                              z.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800 text-[10px]'
                                : 'bg-gray-100 text-gray-800 text-[10px]'
                            }
                          >
                            {z.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="inline-flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-gray-500 hover:text-[var(--color-primary)]"
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-gray-500 hover:text-red-500"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredZones.length === 0 && (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-6 py-10 text-center text-sm text-[var(--color-muted-foreground)]"
                        >
                          No delivery zone matching search filters found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </Content>
      </Main>
    </AppShell>
  );
}

export default App;
