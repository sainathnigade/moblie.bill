import { useState } from "react";
import { TrendingUp, BarChart3, PieChart } from "lucide-react";

export function SalesCharts({ bills = [] }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  // Helper: Get sales of last 7 days
  const last7Days = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - idx);
    return d.toDateString();
  }).reverse();

  const dailyStats = last7Days.map(dateStr => {
    const dayBills = bills.filter(b => new Date(b.date).toDateString() === dateStr);
    const revenue = dayBills.reduce((acc, b) => acc + b.total, 0);
    const profit = dayBills.reduce((acc, b) => acc + (b.profit || b.total * 0.15), 0);
    return {
      date: new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      revenue,
      profit
    };
  });

  const maxVal = Math.max(...dailyStats.map(d => Math.max(d.revenue, d.profit, 5000)));

  // SVG Coordinates mapping
  const width = 600;
  const height = 240;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const pointsRevenue = dailyStats.map((d, i) => {
    const x = paddingLeft + (i / (dailyStats.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (d.revenue / maxVal) * chartHeight;
    return { x, y };
  });

  const pointsProfit = dailyStats.map((d, i) => {
    const x = paddingLeft + (i / (dailyStats.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (d.profit / maxVal) * chartHeight;
    return { x, y };
  });

  // Convert points array to SVG Path
  const makePath = (points) => {
    if (points.length === 0) return "";
    return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
  };

  const makeAreaPath = (points) => {
    if (points.length === 0) return "";
    const first = points[0];
    const last = points[points.length - 1];
    return `${makePath(points)} L ${last.x} ${paddingTop + chartHeight} L ${first.x} ${paddingTop + chartHeight} Z`;
  };

  // Brand Shares Calculations
  const brandRevenues = {};
  bills.forEach(b => {
    b.products.forEach(p => {
      const bnd = p.brand || "Other";
      brandRevenues[bnd] = (brandRevenues[bnd] || 0) + p.total;
    });
  });

  const brandList = Object.keys(brandRevenues).map(name => ({
    name,
    value: brandRevenues[name]
  })).sort((a,b) => b.value - a.value).slice(0, 5);

  const totalBrandVal = brandList.reduce((acc, b) => acc + b.value, 0) || 1;

  // Donut chart stroke computations
  let accumulatedAngle = 0;
  const donutBrands = brandList.map((brand, idx) => {
    const pct = (brand.value / totalBrandVal) * 100;
    const strokeDash = `${pct} ${100 - pct}`;
    const strokeOffset = 100 - accumulatedAngle + 25; // starting at top center (12 o'clock)
    accumulatedAngle += pct;

    const colors = ["#6c63ff", "#ff6584", "#39e575", "#f7971e", "#4facfe"];
    return {
      ...brand,
      percent: pct,
      strokeDash,
      strokeOffset,
      color: colors[idx % colors.length]
    };
  });

  // Product Leaderboard rankings
  const prodStats = {};
  bills.forEach(b => {
    b.products.forEach(p => {
      if (!prodStats[p.name]) prodStats[p.name] = { name: p.name, qty: 0, sales: 0 };
      prodStats[p.name].qty += p.qty;
      prodStats[p.name].sales += p.total;
    });
  });

  const topProducts = Object.values(prodStats)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  const maxProductVal = Math.max(...topProducts.map(p => p.sales), 1);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* LINE CHART CARD */}
      <div className="xl:col-span-2 bg-white dark:bg-darkSurface border border-gray-100 dark:border-darkBorder rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-head text-base font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Daily Revenue vs Profit Trends
          </h3>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-primary">
              <span className="w-2.5 h-2.5 bg-primary rounded-full" /> Revenue
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-accent">
              <span className="w-2.5 h-2.5 bg-accent rounded-full" /> Profit
            </span>
          </div>
        </div>

        {/* Dynamic SVG Area Graph */}
        <div className="relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6c63ff" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#6c63ff" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff6584" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ff6584" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid Y Guidelines */}
            {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
              const y = paddingTop + chartHeight * p;
              const val = Math.round(maxVal * (1 - p));
              return (
                <g key={idx}>
                  <line 
                    x1={paddingLeft} 
                    y1={y} 
                    x2={width - paddingRight} 
                    y2={y} 
                    className="stroke-gray-100 dark:stroke-darkBorder stroke-[1]" 
                  />
                  <text 
                    x={paddingLeft - 8} 
                    y={y + 3.5} 
                    textAnchor="end" 
                    className="fill-gray-400 dark:fill-text3 text-[9px] font-bold"
                  >
                    ₹{val >= 1000 ? (val / 1000).toFixed(0) + "k" : val}
                  </text>
                </g>
              );
            })}

            {/* Area shapes */}
            {pointsRevenue.length > 0 && (
              <path d={makeAreaPath(pointsRevenue)} fill="url(#revGrad)" />
            )}
            {pointsProfit.length > 0 && (
              <path d={makeAreaPath(pointsProfit)} fill="url(#profitGrad)" />
            )}

            {/* Line borders */}
            {pointsRevenue.length > 0 && (
              <path d={makePath(pointsRevenue)} fill="none" className="stroke-primary stroke-[2.5]" />
            )}
            {pointsProfit.length > 0 && (
              <path d={makePath(pointsProfit)} fill="none" className="stroke-accent stroke-[2.5]" />
            )}

            {/* Interactive Node circles with tooltips trigger */}
            {pointsRevenue.map((pt, idx) => (
              <g 
                key={idx}
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
              >
                <circle 
                  cx={pt.x} 
                  cy={pt.y} 
                  r={hoverIndex === idx ? 6 : 4} 
                  className="fill-primary stroke-white dark:stroke-darkSurface stroke-[2.5] transition-all" 
                />
                <circle 
                  cx={pointsProfit[idx].x} 
                  cy={pointsProfit[idx].y} 
                  r={hoverIndex === idx ? 6 : 4} 
                  className="fill-accent stroke-white dark:stroke-darkSurface stroke-[2.5] transition-all" 
                />
                <text 
                  x={pt.x} 
                  y={height - 12} 
                  textAnchor="middle" 
                  className="fill-gray-400 dark:fill-text3 text-[9px] font-bold"
                >
                  {dailyStats[idx].date}
                </text>
              </g>
            ))}
          </svg>

          {/* Interactive Absolute overlay Tooltip */}
          {hoverIndex !== null && (
            <div 
              className="absolute bg-white dark:bg-darkSurface2 border border-gray-100 dark:border-darkBorder p-3 rounded-lg shadow-xl text-xs z-20 pointer-events-none transition-all duration-100 flex flex-col gap-1"
              style={{
                left: `${(hoverIndex / (dailyStats.length - 1)) * 80 + 10}%`,
                top: "10%"
              }}
            >
              <div className="font-bold text-gray-500 dark:text-text2">Date: {dailyStats[hoverIndex].date}</div>
              <div className="font-semibold text-primary">Rev: ₹{dailyStats[hoverIndex].revenue.toLocaleString()}</div>
              <div className="font-semibold text-accent">Net: ₹{dailyStats[hoverIndex].profit.toLocaleString()}</div>
            </div>
          )}
        </div>
      </div>

      {/* BRAND DONUT CHART */}
      <div className="bg-white dark:bg-darkSurface border border-gray-100 dark:border-darkBorder rounded-2xl p-6 shadow-sm flex flex-col">
        <h3 className="font-head text-base font-bold flex items-center gap-2 mb-6">
          <PieChart className="w-5 h-5 text-accent" /> Brand Sales Market Share
        </h3>

        {brandList.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-gray-400 dark:text-text3 py-10">No brand data available.</div>
        ) : (
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-6">
            {/* SVG Donut circle */}
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" className="stroke-gray-100 dark:stroke-darkBorder stroke-[3]" />
                {donutBrands.map((b, i) => (
                  <circle 
                    key={i}
                    cx="18" 
                    cy="18" 
                    r="15.915" 
                    fill="none" 
                    stroke={b.color}
                    strokeWidth="3.2" 
                    strokeDasharray={b.strokeDash}
                    strokeDashoffset={b.strokeOffset}
                    className="transition-all duration-300"
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-gray-400 dark:text-text3 font-bold uppercase">Total Sold</span>
                <span className="text-sm font-extrabold text-primary font-head">₹{totalBrandVal >= 100000 ? (totalBrandVal / 1000).toFixed(0) + "k" : totalBrandVal}</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="flex flex-col gap-2 flex-1 w-full sm:w-auto">
              {donutBrands.map((b, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }} />
                    <span className="truncate max-w-[80px]">{b.name}</span>
                  </span>
                  <span className="font-semibold text-gray-500 dark:text-text2">{b.percent.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* TOP SELLING PRODUCTS LEADERBOARD */}
      <div className="xl:col-span-3 bg-white dark:bg-darkSurface border border-gray-100 dark:border-darkBorder rounded-2xl p-6 shadow-sm">
        <h3 className="font-head text-base font-bold flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-success" /> Device Leaderboard By Revenue
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topProducts.length === 0 ? (
            <div className="col-span-full py-10 text-center text-xs text-gray-400 dark:text-text3">
              Generate sales invoices to trigger product rankings.
            </div>
          ) : (
            topProducts.map((p, idx) => {
              const pct = (p.sales / maxProductVal) * 100;
              return (
                <div key={idx} className="bg-gray-50 dark:bg-darkSurface2 border border-gray-100 dark:border-darkBorder p-4 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded">Rank #{idx+1}</span>
                      <span className="text-xs text-gray-400 dark:text-text3 font-semibold">{p.qty} units sold</span>
                    </div>
                    <h4 className="font-head font-bold text-sm text-gray-900 dark:text-gray-100 truncate mb-1">{p.name}</h4>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-semibold mb-2">
                      <span className="text-gray-400 dark:text-text3">Gross revenue:</span>
                      <span className="text-success">₹{p.sales.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 dark:bg-darkBorder rounded-full overflow-hidden">
                      <div className="h-full bg-success rounded-full progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
