import { Link } from "react-router-dom";
import { Shield, TrendingUp, Users, Lock, Activity } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { VideoBackground } from "@/components/layout/VideoBackground";

export default function Stats() {
  const globalStats = [
    {
      label: "Total Value Locked",
      value: "$314,543",
      change: "+12.5%",
      icon: Lock,
    },
    {
      label: "Total Deposits",
      value: "764",
      change: "+8.3%",
      icon: TrendingUp,
    },
    {
      label: "Unique Users",
      value: "512",
      change: "+15.2%",
      icon: Users,
    },
    {
      label: "Privacy Score",
      value: "99.9%",
      change: "Excellent",
      icon: Shield,
    },
  ];

  const solPools = [
    { tier: "0.1 SOL", deposits: 156, anonymitySet: 89 },
    { tier: "1 SOL", deposits: 287, anonymitySet: 142 },
    { tier: "5 SOL", deposits: 198, anonymitySet: 97 },
    { tier: "10 SOL", deposits: 123, anonymitySet: 61 },
  ];

  const recentActivity = [
    { type: "Deposit", amount: "1.5 SOL", time: "2 min ago" },
    { type: "Withdraw", amount: "0.8 SOL", time: "5 min ago" },
    { type: "Deposit", amount: "3.2 SOL", time: "8 min ago" },
    { type: "Withdraw", amount: "0.5 SOL", time: "12 min ago" },
    { type: "Deposit", amount: "2.1 SOL", time: "15 min ago" },
    { type: "Withdraw", amount: "4.7 SOL", time: "18 min ago" },
  ];

  return (
    <div className="relative w-full">
      <Header />
      
      <VideoBackground overlayOpacity={0.85}>
        <div className="relative z-10 pt-24 pb-16 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="w-16 h-16 rounded-full bg-[#FFCC00]/20 flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-[#FFCC00]" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Protocol Statistics
              </h1>
              <p className="text-xl text-white/60 max-w-2xl mx-auto">
                Real-time metrics for the RIFT privacy protocol
              </p>
            </div>

            {/* Global Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {globalStats.map((stat, i) => (
                <div
                  key={i}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#FFCC00]/20 flex items-center justify-center">
                      <stat.icon className="h-5 w-5 text-[#FFCC00]" />
                    </div>
                  </div>
                  <p className="text-white/60 text-sm mb-1">{stat.label}</p>
                  <p className="text-white text-2xl font-bold">{stat.value}</p>
                  <p className="text-[#FFCC00] text-sm mt-1">{stat.change}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Pool Stats */}
              <div className="lg:col-span-2">
                <h2 className="text-xl font-bold text-white mb-4">
                  SOL Pool Statistics
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-white/60 text-sm font-medium p-4">
                          Pool Tier
                        </th>
                        <th className="text-right text-white/60 text-sm font-medium p-4">
                          Total Deposits
                        </th>
                        <th className="text-right text-white/60 text-sm font-medium p-4">
                          Anonymity Set
                        </th>
                        <th className="text-right text-white/60 text-sm font-medium p-4">
                          Privacy Score
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {solPools.map((pool) => (
                        <tr
                          key={pool.tier}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">◎</span>
                              <div>
                                <p className="text-white font-semibold">
                                  {pool.tier}
                                </p>
                                <p className="text-white/60 text-sm">
                                  Solana
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="text-right p-4">
                            <p className="text-white font-medium">
                              {pool.deposits.toLocaleString()}
                            </p>
                            <p className="text-white/60 text-sm">deposits</p>
                          </td>
                          <td className="text-right p-4">
                            <p className="text-[#FFCC00] font-semibold">
                              {pool.anonymitySet.toLocaleString()}
                            </p>
                            <p className="text-white/60 text-sm">active</p>
                          </td>
                          <td className="text-right p-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFCC00]/20 rounded-full">
                              <div className="w-2 h-2 rounded-full bg-[#FFCC00]" />
                              <span className="text-[#FFCC00] text-sm font-medium">
                                Excellent
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#FFCC00]" />
                  Recent Activity
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="space-y-3">
                    {recentActivity.map((activity, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              activity.type === "Deposit"
                                ? "bg-green-500/20"
                                : "bg-blue-500/20"
                            }`}
                          >
                            <span className="text-sm">◎</span>
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">
                              {activity.type}
                            </p>
                            <p className="text-white/60 text-xs">
                              {activity.amount}
                            </p>
                          </div>
                        </div>
                        <p className="text-white/40 text-xs">{activity.time}</p>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-4 py-2 text-[#FFCC00] text-sm font-medium hover:underline">
                    View All Activity →
                  </button>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-12 text-center">
              <div className="bg-[#FFCC00]/10 border border-[#FFCC00]/30 rounded-2xl p-8 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-white mb-3">
                  Ready to Go Private?
                </h2>
                <p className="text-white/60 mb-6 max-w-lg mx-auto">
                  Join hundreds of users protecting their financial privacy with
                  zero-knowledge technology on Solana.
                </p>
                <Link
                  to="/mix"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#FFCC00] text-black font-semibold hover:bg-[#FFCC00]/90 transition-all shadow-[0_0_30px_0_rgba(255,204,0,0.4)]"
                >
                  <Shield className="h-5 w-5" />
                  Launch Privacy Mixer
                </Link>
              </div>
            </div>
          </div>
        </div>
      </VideoBackground>

      <Footer />
    </div>
  );
}