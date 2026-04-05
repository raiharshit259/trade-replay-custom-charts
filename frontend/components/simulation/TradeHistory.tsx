import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';

export default function TradeHistory() {
  const { trades, formatCurrency } = useApp();

  return (
    <div className="glass-strong rounded-2xl p-5 card-lift gradient-border section-hover-reveal overflow-hidden">
      <h3 className="text-base font-semibold text-muted-foreground mb-4 tracking-[0.1em]">TRADE HISTORY</h3>
      {trades.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No trades yet</p>
      ) : (
        <div className="max-h-48 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left py-1.5 font-medium">Time</th>
                <th className="text-left py-1.5 font-medium">Type</th>
                <th className="text-left py-1.5 font-medium">Stock</th>
                <th className="text-right py-1.5 font-medium">Price</th>
                <th className="text-right py-1.5 font-medium">Qty</th>
                <th className="text-right py-1.5 font-medium">Total</th>
                <th className="text-right py-1.5 font-medium">P&L</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {trades.slice(0, 20).map(t => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                  >
                    <td className="py-1.5 text-foreground">{t.date}</td>
                    <td className={`py-1.5 font-semibold ${t.type === 'BUY' ? 'text-profit' : 'text-loss'}`}>
                      {t.type}
                    </td>
                    <td className="py-1.5 font-mono text-foreground">{t.symbol}</td>
                    <td className="py-1.5 text-right font-mono text-foreground">{formatCurrency(t.price)}</td>
                    <td className="py-1.5 text-right font-mono text-foreground">{t.quantity}</td>
                    <td className="py-1.5 text-right font-mono text-foreground">{formatCurrency(t.total)}</td>
                    <td className={`py-1.5 text-right font-mono ${(t.realizedPnl ?? 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {(t.realizedPnl ?? 0) >= 0 ? '+' : ''}{formatCurrency(t.realizedPnl ?? 0)}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
