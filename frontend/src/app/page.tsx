import Layout from '@/components/shared/Layout';
import Link from 'next/link';

export default function Home() {
  return (
    <Layout title="Dashboard">
      <div className="container-custom py-8">
        {/* Welcome Section */}
        <div className="property-card mb-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🏢</div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome to Property Management System
            </h1>
            <p className="text-muted-foreground text-lg">
              AI-powered property and inventory management with QR code generation
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link 
            href="/properties" 
            className="property-card hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            <div className="text-center">
              <div className="text-3xl mb-2">🏢</div>
              <h3 className="font-semibold text-foreground mb-1">Properties</h3>
              <p className="text-sm text-muted-foreground">Manage your properties</p>
            </div>
          </Link>

          <Link 
            href="/items" 
            className="property-card hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            <div className="text-center">
              <div className="text-3xl mb-2">📦</div>
              <h3 className="font-semibold text-foreground mb-1">Items</h3>
              <p className="text-sm text-muted-foreground">Track inventory items</p>
            </div>
          </Link>

          <Link 
            href="/qr-codes" 
            className="property-card hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            <div className="text-center">
              <div className="text-3xl mb-2">📱</div>
              <h3 className="font-semibold text-foreground mb-1">QR Codes</h3>
              <p className="text-sm text-muted-foreground">Generate QR codes</p>
            </div>
          </Link>

          <Link 
            href="/api-test" 
            className="property-card hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            <div className="text-center">
              <div className="text-3xl mb-2">🔗</div>
              <h3 className="font-semibold text-foreground mb-1">API Test</h3>
              <p className="text-sm text-muted-foreground">Test API connection</p>
            </div>
          </Link>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="property-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Frontend</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✅ Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Backend API</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  🔄 Testing
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Database</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  🏗️ Setup
                </span>
              </div>
            </div>
          </div>

          <div className="property-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Getting Started</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <p className="text-sm font-medium text-foreground">Test API Connection</p>
                  <p className="text-xs text-muted-foreground">Verify backend connectivity</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Create Properties</p>
                  <p className="text-xs text-muted-foreground">Add your first property</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Add Items</p>
                  <p className="text-xs text-muted-foreground">Track inventory items</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
