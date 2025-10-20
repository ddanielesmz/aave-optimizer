import ButtonWallet from "@/components/ButtonWallet";
import AaveHealthWidget from "@/components/dashboard/AaveHealthWidget";
import CurrentLTVWidget from "@/components/dashboard/CurrentLTVWidget";
import StablecoinSupplyOptimizer from "@/components/dashboard/StablecoinSupplyOptimizer";
import StablecoinBorrowOptimizer from "@/components/dashboard/StablecoinBorrowOptimizer";
import FinancialSummaryWidget from "@/components/dashboard/FinancialSummaryWidget";
import NetWorthTrendCard from "@/components/dashboard/NetWorthTrendCard";

export const dynamic = "force-dynamic";

// Dashboard con layout 1×4: 1 widget lungo in alto + 3 widget quadrati sotto
export default function Dashboard() {
  return (
    <main className="min-h-screen p-6 pb-24 bg-base-200">
      <div className="max-w-7xl mx-auto">
        {/* Header con wallet */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-base-content tracking-tight">Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <ButtonWallet />
          </div>
        </div>

        {/* Financial Summary (full width) */}
        <div className="grid grid-cols-1 gap-6">
          <div>
            <FinancialSummaryWidget />
          </div>
        </div>

        {/* Central widgets: Current LTV, Health Factor, Net Worth Trend */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CurrentLTVWidget />
          <AaveHealthWidget />
          <NetWorthTrendCard />
        </div>

        {/* Stablecoin optimizers row */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <StablecoinSupplyOptimizer />
          <StablecoinBorrowOptimizer />
        </div>
      </div>
    </main>
  );
}
